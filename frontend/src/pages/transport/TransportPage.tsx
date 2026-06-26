import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  DatePicker, Typography, Spin, Empty, Tag, Badge, Input, Tooltip,
  Button, Space, message, Checkbox, Alert, Card, Divider,
} from 'antd';
import {
  TruckOutlined, PhoneOutlined, EnvironmentOutlined,
  CheckCircleFilled, CloseCircleFilled, SearchOutlined,
  EditOutlined, SaveOutlined, CloseOutlined, InfoCircleOutlined,
  CalendarOutlined, DownOutlined, UpOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { trucksAPI, truckAvailabilityAPI } from '../../api';
import { Truck, TruckAvailability, Role } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;

const TYPE_COLORS: Record<string, string> = {
  Palette: '#722ed1',
  Citerne: '#1890ff',
  Frigo: '#13c2c2',
  Benne: '#fa8c16',
  Standard: '#8c8c8c',
};

const TransportPage: React.FC = () => {
  const { isRole } = useAuth();
  // La disponibilité des camions est gérée côté ERP du transporteur — lecture seule pour le logisticien
  const canManage = isRole(Role.LOGISTIC_ADMIN, Role.SUPER_ADMIN);

  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [availabilities, setAvailabilities] = useState<TruckAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [search, setSearch] = useState('');

  const [editMode, setEditMode] = useState(false);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // Period programming
  const [showPeriod, setShowPeriod] = useState(false);
  const [periodRange, setPeriodRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [periodTruckIds, setPeriodTruckIds] = useState<Set<string>>(new Set());
  const [savingPeriod, setSavingPeriod] = useState(false);

  useEffect(() => {
    trucksAPI.getAll().then((res) => setTrucks(res.data.filter((t: Truck) => t.isActive)));
  }, []);

  const fetchAvailabilities = useCallback(() => {
    setLoading(true);
    truckAvailabilityAPI.getByDate(selectedDate)
      .then((res) => setAvailabilities(res.data))
      .finally(() => setLoading(false));
  }, [selectedDate]);

  useEffect(() => { fetchAvailabilities(); }, [fetchAvailabilities]);

  const availableIds = useMemo(
    () => new Set(availabilities.map((a) => a.truck.id)),
    [availabilities],
  );

  const enterEditMode = () => {
    setPendingIds(new Set(availableIds));
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setPendingIds(new Set());
  };

  const toggleTruck = (truckId: string) => {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (next.has(truckId)) next.delete(truckId);
      else next.add(truckId);
      return next;
    });
  };

  const toggleCompany = (companyTrucks: Truck[]) => {
    const allSelected = companyTrucks.every((t) => pendingIds.has(t.id));
    setPendingIds((prev) => {
      const next = new Set(prev);
      companyTrucks.forEach((t) => (allSelected ? next.delete(t.id) : next.add(t.id)));
      return next;
    });
  };

  const saveAvailabilities = async () => {
    setSaving(true);
    try {
      await truckAvailabilityAPI.bulkSet(Array.from(pendingIds), selectedDate);
      const n = pendingIds.size;
      message.success(`${n} camion${n !== 1 ? 's' : ''} marqué${n !== 1 ? 's' : ''} disponible${n !== 1 ? 's' : ''}`);
      setEditMode(false);
      fetchAvailabilities();
    } catch {
      message.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const togglePeriodTruck = (truckId: string) => {
    setPeriodTruckIds((prev) => {
      const next = new Set(prev);
      if (next.has(truckId)) next.delete(truckId); else next.add(truckId);
      return next;
    });
  };

  const togglePeriodCompany = (companyTrucks: Truck[]) => {
    const allSelected = companyTrucks.every((t) => periodTruckIds.has(t.id));
    setPeriodTruckIds((prev) => {
      const next = new Set(prev);
      companyTrucks.forEach((t) => (allSelected ? next.delete(t.id) : next.add(t.id)));
      return next;
    });
  };

  const savePeriod = async () => {
    if (!periodRange || periodTruckIds.size === 0) {
      message.warning('Sélectionnez une période et au moins un camion');
      return;
    }
    const days = periodRange[1].diff(periodRange[0], 'day') + 1;
    if (days > 90) {
      message.warning('La période ne peut pas dépasser 90 jours');
      return;
    }
    setSavingPeriod(true);
    try {
      const res = await truckAvailabilityAPI.bulkSetRange(
        Array.from(periodTruckIds),
        periodRange[0].format('YYYY-MM-DD'),
        periodRange[1].format('YYYY-MM-DD'),
      );
      message.success(`${res.data.set} disponibilité${res.data.set !== 1 ? 's' : ''} ajoutée${res.data.set !== 1 ? 's' : ''} sur la période`);
      setPeriodRange(null);
      setPeriodTruckIds(new Set());
      setShowPeriod(false);
      fetchAvailabilities();
    } catch {
      message.error('Erreur lors de la programmation de la période');
    } finally {
      setSavingPeriod(false);
    }
  };

  const displayIds = editMode ? pendingIds : availableIds;

  const pendingChanges = useMemo(() => {
    if (!editMode) return 0;
    let count = 0;
    pendingIds.forEach((id) => { if (!availableIds.has(id)) count++; });
    availableIds.forEach((id) => { if (!pendingIds.has(id)) count++; });
    return count;
  }, [editMode, pendingIds, availableIds]);

  const companies = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = trucks.filter((t) =>
      !q ||
      t.matricule.toLowerCase().includes(q) ||
      (t.type || '').toLowerCase().includes(q) ||
      (t.deliveryCompany?.nom || '').toLowerCase().includes(q),
    );
    const map: Record<string, { nom: string; adresse?: string; telephone?: string; trucks: Truck[] }> = {};
    filtered.forEach((t) => {
      const key = t.deliveryCompany?.id || '__unknown__';
      if (!map[key]) {
        map[key] = {
          nom: t.deliveryCompany?.nom || 'Société inconnue',
          adresse: t.deliveryCompany?.adresse,
          telephone: t.deliveryCompany?.telephone,
          trucks: [],
        };
      }
      map[key].trucks.push(t);
    });
    return Object.entries(map).sort(([, a], [, b]) => a.nom.localeCompare(b.nom));
  }, [trucks, search]);

  const totalAvailable = trucks.filter((t) => displayIds.has(t.id)).length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Camions disponibles</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {editMode ? (
              <>
                Modeédition ·{' '}
                <span style={{ color: '#fa8c16', fontWeight: 600 }}>
                  {pendingChanges} modification{pendingChanges !== 1 ? 's' : ''} en attente
                </span>
              </>
            ) : (
              <>
                Disponibilités du{' '}
                <b>{dayjs(selectedDate).format('dddd DD MMMM YYYY')}</b>
                {' · '}
                <span style={{ color: '#52c41a', fontWeight: 600 }}>
                  {totalAvailable} disponible{totalAvailable > 1 ? 's' : ''}
                </span>
                {' / '}{trucks.length} au total
              </>
            )}
          </Text>
        </div>
        <Space wrap>
          {canManage && !editMode && (
            <Button icon={<EditOutlined />} onClick={enterEditMode}>
              Gérer disponibilités
            </Button>
          )}
          {editMode && (
            <>
              <Button icon={<CloseOutlined />} onClick={cancelEdit} disabled={saving}>
                Annuler
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={saving}
                onClick={saveAvailabilities}
              >
                Sauvegarder{pendingChanges > 0 ? ` (${pendingChanges})` : ''}
              </Button>
            </>
          )}
          <DatePicker
            value={dayjs(selectedDate)}
            onChange={(d) => {
              if (d) {
                if (editMode) cancelEdit();
                setSelectedDate(d.format('YYYY-MM-DD'));
              }
            }}
            format="DD/MM/YYYY"
            disabled={saving}
          />
        </Space>
      </div>

      {/* Search */}
      <Input
        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
        placeholder="Rechercher société, matricule, type…"
        allowClear
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ maxWidth: 340, marginBottom: editMode ? 12 : 20 }}
      />

      {!canManage && (
        <Alert
          type="info"
          icon={<InfoCircleOutlined />}
          showIcon
          message="Les disponibilités sont importées depuis l'ERP du transporteur. Vous consultez les camions disponibles pour la date sélectionnée."
          style={{ marginBottom: 16 }}
        />
      )}

      {editMode && (
        <div style={{
          background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 8,
          padding: '8px 16px', marginBottom: 16, color: '#874d00', fontSize: 13,
        }}>
          Cliquez sur les camions pour les marquer disponibles ou non pour le{' '}
          <b>{dayjs(selectedDate).format('DD/MM/YYYY')}</b>.
          Les cases cochées seront sauvegardées en bloc.
        </div>
      )}

      {/* Period programming */}
      {canManage && !editMode && (
        <div style={{ marginBottom: 20 }}>
          <Button
            icon={showPeriod ? <UpOutlined /> : <DownOutlined />}
            onClick={() => setShowPeriod((v) => !v)}
            style={{ marginBottom: showPeriod ? 12 : 0 }}
          >
            <CalendarOutlined style={{ marginRight: 6 }} />
            Programmer une période
          </Button>

          {showPeriod && (
            <div style={{
              background: '#f0f5ff', border: '1px solid #adc6ff', borderRadius: 8,
              padding: '16px 20px',
            }}>
              <div style={{ marginBottom: 12, fontWeight: 600, color: '#1d39c4' }}>
                Ajouter des disponibilités sur une plage de dates
              </div>

              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <div>
                  <div style={{ fontSize: 12, color: '#595959', marginBottom: 4 }}>Période (max 90 jours)</div>
                  <DatePicker.RangePicker
                    value={periodRange}
                    onChange={(vals) => setPeriodRange(vals as [dayjs.Dayjs, dayjs.Dayjs] | null)}
                    format="DD/MM/YYYY"
                    disabledDate={(d) => d.isBefore(dayjs().subtract(1, 'day'))}
                    style={{ width: 320 }}
                  />
                </div>

                <Divider style={{ margin: '8px 0' }} />

                <div style={{ fontSize: 12, color: '#595959', marginBottom: 4 }}>
                  Camions à programmer ({periodTruckIds.size} sélectionné{periodTruckIds.size !== 1 ? 's' : ''})
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {companies.map(([key, group]) => {
                    const allSel = group.trucks.every((t) => periodTruckIds.has(t.id));
                    return (
                      <div key={key} style={{
                        background: 'white', borderRadius: 6,
                        border: '1px solid #d6e4ff', padding: '10px 14px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                          <Checkbox
                            checked={allSel}
                            indeterminate={!allSel && group.trucks.some((t) => periodTruckIds.has(t.id))}
                            onChange={() => togglePeriodCompany(group.trucks)}
                          />
                          <span style={{ fontWeight: 600 }}>{group.nom}</span>
                          <Tag color="blue" style={{ margin: 0 }}>{group.trucks.length} camion{group.trucks.length > 1 ? 's' : ''}</Tag>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {group.trucks.map((truck) => (
                            <Checkbox
                              key={truck.id}
                              checked={periodTruckIds.has(truck.id)}
                              onChange={() => togglePeriodTruck(truck.id)}
                            >
                              <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{truck.matricule}</span>
                              {truck.type && <Tag style={{ margin: '0 0 0 4px', fontSize: 10 }}>{truck.type}</Tag>}
                            </Checkbox>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                  <Button onClick={() => { setShowPeriod(false); setPeriodRange(null); setPeriodTruckIds(new Set()); }}>
                    Annuler
                  </Button>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={savingPeriod}
                    disabled={!periodRange || periodTruckIds.size === 0}
                    onClick={savePeriod}
                  >
                    Programmer la période
                  </Button>
                </div>
              </Space>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <Spin size="large" />
        </div>
      ) : companies.length === 0 ? (
        <Empty description="Aucune société de transport" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {companies.map(([key, group]) => {
            const availCount = group.trucks.filter((t) => displayIds.has(t.id)).length;
            const allSelected = editMode && group.trucks.every((t) => pendingIds.has(t.id));
            return (
              <div key={key} style={{
                background: 'white',
                borderRadius: 10,
                border: `1px solid ${editMode ? '#d6e4ff' : '#f0f0f0'}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                overflow: 'hidden',
              }}>
                {/* Company header */}
                <div style={{
                  padding: '12px 20px',
                  borderBottom: '1px solid #f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: editMode ? '#f0f5ff' : '#fafafa',
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 8,
                    background: '#e6f4ff', border: '1px solid #bae0ff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <TruckOutlined style={{ fontSize: 18, color: '#1890ff' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ fontSize: 15 }}>{group.nom}</Text>
                    <div style={{ display: 'flex', gap: 14, marginTop: 2 }}>
                      {group.adresse && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          <EnvironmentOutlined style={{ marginRight: 4 }} />{group.adresse}
                        </Text>
                      )}
                      {group.telephone && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          <PhoneOutlined style={{ marginRight: 4 }} />{group.telephone}
                        </Text>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {editMode && (
                      <Button
                        size="small"
                        onClick={() => toggleCompany(group.trucks)}
                      >
                        {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                      </Button>
                    )}
                    <Tag color="blue" style={{ margin: 0 }}>
                      {group.trucks.length} camion{group.trucks.length > 1 ? 's' : ''}
                    </Tag>
                    {availCount > 0 && (
                      <Badge
                        count={`${availCount} dispo`}
                        style={{ backgroundColor: '#52c41a', fontSize: 11 }}
                      />
                    )}
                  </div>
                </div>

                {/* Trucks grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: 12,
                  padding: '14px 20px',
                }}>
                  {group.trucks.map((truck) => {
                    const isAvailable = displayIds.has(truck.id);
                    const typeColor = TYPE_COLORS[truck.type || ''] || '#8c8c8c';
                    return (
                      <div
                        key={truck.id}
                        onClick={editMode ? () => toggleTruck(truck.id) : undefined}
                        style={{
                          border: `${editMode ? 2 : 1}px solid ${
                            isAvailable ? '#52c41a' : (editMode ? '#d9d9d9' : '#f0f0f0')
                          }`,
                          borderRadius: 8,
                          padding: '10px 14px',
                          background: isAvailable ? '#f6ffed' : (editMode ? '#fafafa' : '#fafafa'),
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                          cursor: editMode ? 'pointer' : 'default',
                          transition: 'border-color 0.15s, background 0.15s',
                          userSelect: 'none',
                        }}
                      >
                        {/* Identity row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text strong style={{ fontSize: 13, fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                            {truck.matricule}
                          </Text>
                          {editMode ? (
                            <Checkbox
                              checked={isAvailable}
                              onChange={() => toggleTruck(truck.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <Tooltip title={isAvailable ? 'Disponible' : 'Non disponible'}>
                              {isAvailable
                                ? <CheckCircleFilled style={{ color: '#52c41a', fontSize: 16 }} />
                                : <CloseCircleFilled style={{ color: '#d9d9d9', fontSize: 16 }} />
                              }
                            </Tooltip>
                          )}
                        </div>

                        {/* Type + capacities */}
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {truck.type && (
                            <Tag style={{
                              margin: 0, fontSize: 10, padding: '0 6px',
                              background: typeColor + '18', color: typeColor,
                              borderColor: typeColor + '50',
                            }}>
                              {truck.type}
                            </Tag>
                          )}
                          <Tag style={{ margin: 0, fontSize: 10, padding: '0 6px', color: '#1890ff', borderColor: '#bae0ff', background: '#e6f4ff' }}>
                            {truck.capaciteTonnage} T
                          </Tag>
                          {truck.capacitePalettes > 0 && (
                            <Tag style={{ margin: 0, fontSize: 10, padding: '0 6px', color: '#722ed1', borderColor: '#d3adf7', background: '#f9f0ff' }}>
                              {truck.capacitePalettes} pal
                            </Tag>
                          )}
                        </div>

                        {/* Status label */}
                        <Text style={{ fontSize: 11, color: isAvailable ? '#52c41a' : '#bfbfbf', fontWeight: 500 }}>
                          {isAvailable
                            ? '✓ Disponible ce jour'
                            : (editMode ? 'Cliquer pour activer' : 'Non planifié')
                          }
                        </Text>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TransportPage;
