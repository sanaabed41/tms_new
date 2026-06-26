import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Typography, Tag, Space, Input, Badge, Tooltip, Select,
} from 'antd';
import {
  TruckOutlined, SafetyOutlined, ReloadOutlined, SearchOutlined,
  ClockCircleOutlined, LoginOutlined, PhoneOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { expediteurPortalAPI } from '../../api';
import { LoadingPlan, LoadingStatus, EntryStatus } from '../../types';

const { Title, Text } = Typography;

const ACCENT = '#fa8c16';

// â”€â”€ Status helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type TruckStatus = 'attente' | 'appele' | 'entre' | 'termine';

const getTruckStatus = (plan: LoadingPlan): TruckStatus => {
  if (plan.loadingStatus === LoadingStatus.DONE || plan.entryStatus === EntryStatus.EXITED) return 'termine';
  if (plan.entryStatus === EntryStatus.ENTERED) return 'entre';
  if (plan.entryStatus === EntryStatus.CALLED) return 'appele';
  return 'attente';
};

const TRUCK_STATUS_CONFIG: Record<TruckStatus, { color: string; label: string }> = {
  attente:  { color: '#52c41a', label: 'En attente' },
  appele:   { color: ACCENT,   label: 'Appelé' },
  entre:    { color: '#1890ff', label: 'Entré' },
  termine:  { color: '#aaa',   label: 'Terminé' },
};

// â”€â”€ Left panel: Truck card (full list) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const TruckCard: React.FC<{ plan: LoadingPlan }> = ({ plan }) => {
  const status = getTruckStatus(plan);
  const cfg = TRUCK_STATUS_CONFIG[status];
  const myBls = plan.bonsLivraison ?? [];
  const tonnage = myBls.reduce((s, bl) => s + Number((bl as any).tonnageTotal ?? 0), 0);

  return (
    <div style={{
      background: status === 'termine' ? '#fafafa' : '#fff',
      borderRadius: 8,
      borderLeft: `4px solid ${cfg.color}`,
      padding: '10px 12px',
      marginBottom: 8,
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      opacity: status === 'termine' ? 0.6 : 1,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <Space size={6}>
          <TruckOutlined style={{ color: cfg.color, fontSize: 13 }} />
          <Text strong style={{ fontSize: 13 }}>{plan.truck?.matricule || '-'}</Text>
          {plan.truck?.type && <Tag style={{ fontSize: 10, padding: '0 4px' }}>{plan.truck.type}</Tag>}
        </Space>
        <span style={{
          fontSize: 10,
          padding: '1px 6px',
          borderRadius: 10,
          background: cfg.color + '18',
          border: `1px solid ${cfg.color}50`,
          color: cfg.color,
          fontWeight: 600,
        }}>
          {cfg.label}
        </span>
      </div>
      <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
        {(plan.truck as any)?.deliveryCompany?.nom || '-'}
      </Text>
      <Space size={8} wrap>
        <Text style={{ fontSize: 11 }}><strong>{tonnage.toFixed(1)}</strong> T</Text>
        <Tag color="orange" style={{ fontSize: 10, padding: '0 5px', margin: 0 }}>
          {myBls.length} BL{myBls.length !== 1 ? 's' : ''}
        </Tag>
        {plan.heureArrivee && (
          <Space size={3}>
            <ClockCircleOutlined style={{ fontSize: 10, color: '#888' }} />
            <Text style={{ fontSize: 10, color: '#888' }}>{plan.heureArrivee}</Text>
          </Space>
        )}
        {plan.quai && (
          <Tag color="blue" style={{ fontSize: 10, padding: '0 5px', margin: 0 }}>{plan.quai}</Tag>
        )}
      </Space>
    </div>
  );
};

// â”€â”€ Right panel: Status card (bigger, emphasises quai/state) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const StatusCard: React.FC<{ plan: LoadingPlan; section: 'appele' | 'entre' }> = ({ plan, section }) => {
  const myBls = plan.bonsLivraison ?? [];
  const tonnage = myBls.reduce((s, bl) => s + Number((bl as any).tonnageTotal ?? 0), 0);
  const color = section === 'appele' ? ACCENT : '#1890ff';
  const bg   = section === 'appele' ? '#fff7e6' : '#e6f7ff';
  const border = section === 'appele' ? '#ffd591' : '#91d5ff';

  return (
    <div style={{
      background: bg,
      border: `1.5px solid ${border}`,
      borderRadius: 10,
      padding: '12px 14px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <Space size={5}>
          <TruckOutlined style={{ color, fontSize: 13 }} />
          <Text strong style={{ fontSize: 13 }}>{plan.truck?.matricule || '-'}</Text>
          {plan.truck?.type && <Tag style={{ fontSize: 10, padding: '0 4px' }}>{plan.truck.type}</Tag>}
        </Space>
        {plan.quai && (
          <Tag color={section === 'appele' ? 'orange' : 'blue'} style={{ fontSize: 11 }}>
            {plan.quai}
          </Tag>
        )}
      </div>
      <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 6 }}>
        {(plan.truck as any)?.deliveryCompany?.nom || '-'}
      </Text>
      <Space size={8} wrap>
        <Text style={{ fontSize: 11 }}><strong>{tonnage.toFixed(1)}</strong> T</Text>
        <Tag color="orange" style={{ fontSize: 10, padding: '0 5px', margin: 0 }}>
          {myBls.length} BL{myBls.length !== 1 ? 's' : ''}
        </Tag>
        {plan.heureArrivee && (
          <Space size={3}>
            <ClockCircleOutlined style={{ fontSize: 10, color: '#888' }} />
            <Text style={{ fontSize: 10, color: '#888' }}>{plan.heureArrivee}</Text>
          </Space>
        )}
      </Space>
    </div>
  );
};

// â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type RightFilter = 'all' | 'appele' | 'entre';

const SecuriteSuiviPage: React.FC = () => {
  const [plans, setPlans] = useState<LoadingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [rightFilter, setRightFilter] = useState<RightFilter>('all');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const today = dayjs().format('YYYY-MM-DD');

  const fetchData = useCallback(async () => {
    try {
      const res = await expediteurPortalAPI.getMyPlanning(today);
      setPlans(res.data);
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchData]);

  // Left: all trucks, filtered by search
  const filteredPlans = plans.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.truck?.matricule?.toLowerCase().includes(q) ||
      (p.truck as any)?.deliveryCompany?.nom?.toLowerCase().includes(q)
    );
  });

  // Right: only called/entered trucks
  const calledPlans  = plans.filter((p) => p.entryStatus === EntryStatus.CALLED);
  const enteredPlans = plans.filter(
    (p) => p.entryStatus === EntryStatus.ENTERED && p.loadingStatus !== LoadingStatus.DONE,
  );

  const showCalled  = rightFilter === 'all' || rightFilter === 'appele';
  const showEntered = rightFilter === 'all' || rightFilter === 'entre';

  // Bottom stats
  const stats = {
    total: plans.length,
    attente: plans.filter((p) => getTruckStatus(p) === 'attente').length,
    appele: calledPlans.length,
    entre: enteredPlans.length,
    termine: plans.filter((p) => getTruckStatus(p) === 'termine').length,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <SafetyOutlined style={{ fontSize: 22, color: ACCENT }} />
        <Title level={3} style={{ margin: 0 }}>Suivi des Camions</Title>
        <Text type="secondary" style={{ fontSize: 12 }}>{dayjs().format('DD/MM/YYYY HH:mm')}</Text>
        <Tooltip title="Rafraà®chir">
          <ReloadOutlined
            style={{ marginLeft: 'auto', fontSize: 16, cursor: 'pointer', color: '#888' }}
            onClick={fetchData}
          />
        </Tooltip>
      </div>

      {/* Content panels */}
      <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>

        {/* â”€â”€ LEFT: All trucks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div style={{
          width: 360,
          flexShrink: 0,
          background: '#fff',
          borderRadius: 10,
          border: '1px solid #e8e8e8',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '12px 14px',
            borderBottom: '1px solid #f0f0f0',
            background: '#fffbe6',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Space size={6}>
                <TruckOutlined style={{ color: ACCENT }} />
                <Text strong>Camions du jour</Text>
              </Space>
              <Tag color="orange">{plans.length}</Tag>
            </div>
            <Input
              prefix={<SearchOutlined style={{ color: '#aaa' }} />}
              placeholder="Rechercher un camion..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              allowClear
            />
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
            {filteredPlans.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: 40, color: '#aaa' }}>
                <TruckOutlined style={{ fontSize: 32, marginBottom: 8 }} />
                <div style={{ fontSize: 13 }}>Aucun camion prévu aujourd'hui</div>
              </div>
            ) : (
              filteredPlans.map((plan) => <TruckCard key={plan.id} plan={plan} />)
            )}
          </div>
        </div>

        {/* â”€â”€ RIGHT: Called / Entered sections â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div style={{
          flex: 1,
          background: '#fff',
          borderRadius: 10,
          border: '1px solid #e8e8e8',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Panel header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #f0f0f0',
            background: '#fffbe6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <Space size={6}>
              <SafetyOutlined style={{ color: ACCENT }} />
              <Text strong>Suivi des entrées</Text>
            </Space>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Legend */}
              <Space size={10} style={{ fontSize: 11 }}>
                <Badge color={ACCENT} text="Appelé" />
                <Badge color="#1890ff" text="Entré" />
              </Space>
              {/* Filter */}
              <Select
                size="small"
                value={rightFilter}
                onChange={(v) => setRightFilter(v)}
                style={{ width: 160 }}
                options={[
                  { label: 'Tous les états', value: 'all' },
                  { label: 'â— Appelés seulement', value: 'appele' },
                  { label: 'â— Entrés seulement', value: 'entre' },
                ]}
              />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
            {calledPlans.length === 0 && enteredPlans.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: 60, color: '#aaa' }}>
                <SafetyOutlined style={{ fontSize: 40, marginBottom: 12 }} />
                <div style={{ fontSize: 14 }}>Aucun camion appelé ou entré pour le moment</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  Les camions apparaà®tront ici lorsqu'ils seront appelés à  entrer.
                </div>
              </div>
            ) : (
              <>
                {/* Appelés section */}
                {showCalled && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 10,
                      paddingBottom: 6,
                      borderBottom: `2px solid ${ACCENT}30`,
                    }}>
                      <PhoneOutlined style={{ color: ACCENT, fontSize: 14 }} />
                      <Text strong style={{ fontSize: 13, color: '#333' }}>Camions Appelés</Text>
                      <Tag color="orange" style={{ fontSize: 10 }}>{calledPlans.length}</Tag>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                       - En attente d'entrée
                      </Text>
                    </div>
                    {calledPlans.length === 0 ? (
                      <Text type="secondary" style={{ fontSize: 12 }}>Aucun camion appelé</Text>
                    ) : (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: 10,
                      }}>
                        {calledPlans.map((plan) => (
                          <StatusCard key={plan.id} plan={plan} section="appele" />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Entrés section */}
                {showEntered && (
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 10,
                      paddingBottom: 6,
                      borderBottom: '2px solid #1890ff30',
                    }}>
                      <LoginOutlined style={{ color: '#1890ff', fontSize: 14 }} />
                      <Text strong style={{ fontSize: 13, color: '#333' }}>Camions Entrés</Text>
                      <Tag color="blue" style={{ fontSize: 10 }}>{enteredPlans.length}</Tag>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                       - En chargement
                      </Text>
                    </div>
                    {enteredPlans.length === 0 ? (
                      <Text type="secondary" style={{ fontSize: 12 }}>Aucun camion entré</Text>
                    ) : (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: 10,
                      }}>
                        {enteredPlans.map((plan) => (
                          <StatusCard key={plan.id} plan={plan} section="entre" />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* â”€â”€ Bottom stats bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div style={{
        marginTop: 12,
        background: '#fff',
        borderRadius: 8,
        border: '1px solid #e8e8e8',
        padding: '8px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        flexShrink: 0,
      }}>
        <Space size={6}>
          <TruckOutlined style={{ color: '#555' }} />
          <Text style={{ fontSize: 12 }}>Total: <strong>{stats.total}</strong></Text>
        </Space>
        <Space size={6}>
          <Badge color="#52c41a" />
          <Text style={{ fontSize: 12 }}>En attente: <strong>{stats.attente}</strong></Text>
        </Space>
        <Space size={6}>
          <Badge color={ACCENT} />
          <Text style={{ fontSize: 12 }}>Appelés: <strong style={{ color: ACCENT }}>{stats.appele}</strong></Text>
        </Space>
        <Space size={6}>
          <Badge color="#1890ff" />
          <Text style={{ fontSize: 12 }}>Entrés: <strong style={{ color: '#1890ff' }}>{stats.entre}</strong></Text>
        </Space>
        <Space size={6}>
          <Badge color="#aaa" />
          <Text style={{ fontSize: 12 }}>Terminés: <strong>{stats.termine}</strong></Text>
        </Space>
        <div style={{ marginLeft: 'auto', fontSize: 11, color: '#888' }}>
          Mise à  jour auto toutes les 30s
        </div>
      </div>
    </div>
  );
};

export default SecuriteSuiviPage;

