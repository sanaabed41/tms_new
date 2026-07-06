import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  DatePicker, Typography, Spin, Empty, Tag, Badge, Input, Tooltip, Alert, Space,
} from 'antd';
import {
  TruckOutlined, PhoneOutlined, EnvironmentOutlined,
  CheckCircleFilled, CloseCircleFilled, SearchOutlined, InfoCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { trucksAPI, truckAvailabilityAPI } from '../../api';
import { Truck, TruckAvailability } from '../../types';

const { Title, Text } = Typography;

const TYPE_COLORS: Record<string, string> = {
  Palette: '#722ed1',
  Citerne: '#1890ff',
  Frigo: '#13c2c2',
  Benne: '#fa8c16',
  Standard: '#8c8c8c',
};

const TransportPage: React.FC = () => {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [availabilities, setAvailabilities] = useState<TruckAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [search, setSearch] = useState('');

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

  const totalAvailable = trucks.filter((t) => availableIds.has(t.id)).length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Camions disponibles</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Disponibilités du{' '}
            <b>{dayjs(selectedDate).format('dddd DD MMMM YYYY')}</b>
            {' · '}
            <span style={{ color: '#52c41a', fontWeight: 600 }}>
              {totalAvailable} disponible{totalAvailable > 1 ? 's' : ''}
            </span>
            {' / '}{trucks.length} au total
          </Text>
        </div>
        <Space>
          <DatePicker
            value={dayjs(selectedDate)}
            onChange={(d) => { if (d) setSelectedDate(d.format('YYYY-MM-DD')); }}
            format="DD/MM/YYYY"
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
        style={{ maxWidth: 340, marginBottom: 16 }}
      />

      <Alert
        type="info"
        icon={<InfoCircleOutlined />}
        showIcon
        message="Les disponibilités sont déclarées par les sociétés de transport. Vous consultez les camions disponibles pour la date sélectionnée."
        style={{ marginBottom: 20 }}
      />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <Spin size="large" />
        </div>
      ) : companies.length === 0 ? (
        <Empty description="Aucune société de transport" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {companies.map(([key, group]) => {
            const availCount = group.trucks.filter((t) => availableIds.has(t.id)).length;
            return (
              <div key={key} style={{
                background: 'white',
                borderRadius: 10,
                border: '1px solid #f0f0f0',
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
                  background: '#fafafa',
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
                    const isAvailable = availableIds.has(truck.id);
                    const typeColor = TYPE_COLORS[truck.type || ''] || '#8c8c8c';
                    return (
                      <div
                        key={truck.id}
                        style={{
                          border: `1px solid ${isAvailable ? '#52c41a' : '#f0f0f0'}`,
                          borderRadius: 8,
                          padding: '10px 14px',
                          background: isAvailable ? '#f6ffed' : '#fafafa',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text strong style={{ fontSize: 13, fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                            {truck.matricule}
                          </Text>
                          <Tooltip title={isAvailable ? 'Disponible' : 'Non disponible'}>
                            {isAvailable
                              ? <CheckCircleFilled style={{ color: '#52c41a', fontSize: 16 }} />
                              : <CloseCircleFilled style={{ color: '#d9d9d9', fontSize: 16 }} />
                            }
                          </Tooltip>
                        </div>

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

                        <Text style={{ fontSize: 11, color: isAvailable ? '#52c41a' : '#bfbfbf', fontWeight: 500 }}>
                          {isAvailable ? '✓ Disponible ce jour' : 'Non planifié'}
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
