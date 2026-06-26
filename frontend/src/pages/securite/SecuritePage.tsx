import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Badge, Button, Input, Space, Tag, Tooltip, Typography } from 'antd';
import {
  CheckCircleOutlined, ClockCircleOutlined, InboxOutlined,
  PlayCircleOutlined, ReloadOutlined, SafetyOutlined,
  SearchOutlined, TruckOutlined, ExpandOutlined, FieldTimeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { expediteurPortalAPI } from '../../api';
import { EntryStatus, LoadingPlan, LoadingStatus } from '../../types';

// ── Chrono compact pour la liste de gauche ────────────────────────────────────

const MiniElapsed: React.FC<{ since: string; color: string }> = ({ since, color }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t0 = new Date(since).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - t0) / 1000));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [since]);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const fmt = h > 0
    ? `${h}h${String(m).padStart(2, '0')}m${String(s).padStart(2, '0')}s`
    : `${String(m).padStart(2, '0')}m${String(s).padStart(2, '0')}s`;
  const isLong = elapsed > 3600;

  return (
    <div style={{
      marginTop: 4, display: 'flex', alignItems: 'center', gap: 4,
      fontSize: 10, fontFamily: 'monospace', fontWeight: 700,
      color: isLong ? '#cf1322' : color,
    }}>
      <FieldTimeOutlined style={{ fontSize: 10 }} />
      {fmt}
      {isLong && <span style={{ fontSize: 9, color: '#ff4d4f' }}>!</span>}
    </div>
  );
};

// ── Chrono temps passé à l'intérieur ─────────────────────────────────────────

const ElapsedTimer: React.FC<{ since: string | undefined }> = ({ since }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!since) return;
    const t0 = new Date(since).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - t0) / 1000));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [since]);

  if (!since) return null;

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const fmt = h > 0
    ? `${h}h${String(m).padStart(2, '0')}m${String(s).padStart(2, '0')}s`
    : `${String(m).padStart(2, '0')}m${String(s).padStart(2, '0')}s`;

  const isLong = elapsed > 3600;

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: isLong ? '#fff1f0' : '#f6ffed',
      border: `1px solid ${isLong ? '#ffa39e' : '#b7eb8f'}`,
      borderRadius: 20, padding: '3px 10px',
      fontSize: 12, fontWeight: 700, fontFamily: 'monospace',
      color: isLong ? '#cf1322' : '#389e0d',
      marginTop: 5,
    }}>
      <FieldTimeOutlined style={{ fontSize: 11 }} />
      Présent depuis {fmt}
      {isLong && (
        <span style={{
          fontSize: 9, background: '#ff4d4f', color: '#fff',
          borderRadius: 4, padding: '0 4px', marginLeft: 3, fontFamily: 'sans-serif',
        }}>
          LONG
        </span>
      )}
    </div>
  );
};

// ── Chrono durée de chargement ────────────────────────────────────────────────

const LoadingTimer: React.FC<{ plan: LoadingPlan }> = ({ plan }) => {
  const [elapsed, setElapsed] = useState(Number(plan.loadingElapsedSeconds ?? 0));

  useEffect(() => {
    const base = Number(plan.loadingElapsedSeconds ?? 0);
    if (plan.loadingStatus === LoadingStatus.IN_PROGRESS && plan.loadingStartedAt) {
      const t0 = new Date(plan.loadingStartedAt).getTime();
      const tick = () => setElapsed(base + Math.floor((Date.now() - t0) / 1000));
      tick();
      const iv = setInterval(tick, 1000);
      return () => clearInterval(iv);
    }
    setElapsed(base);
  }, [plan.loadingStatus, plan.loadingStartedAt, plan.loadingElapsedSeconds]);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const fmt = h > 0
    ? `${h}h${String(m).padStart(2, '0')}m${String(s).padStart(2, '0')}s`
    : `${String(m).padStart(2, '0')}m${String(s).padStart(2, '0')}s`;

  const paused = plan.loadingStatus === LoadingStatus.PAUSED;

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: paused ? '#fffbe6' : '#e6f7ff',
      border: `1px solid ${paused ? '#ffe58f' : '#91d5ff'}`,
      borderRadius: 20, padding: '3px 10px',
      fontSize: 12, fontWeight: 700, fontFamily: 'monospace',
      color: paused ? '#d48806' : '#096dd9',
      marginTop: 3,
    }}>
      <ClockCircleOutlined style={{ fontSize: 11 }} />
      Chargement {fmt}
      {paused && (
        <span style={{
          fontSize: 9, background: '#faad14', color: '#fff',
          borderRadius: 4, padding: '0 4px', marginLeft: 3, fontFamily: 'sans-serif',
        }}>
          PAUSE
        </span>
      )}
    </div>
  );
};

const { Title, Text } = Typography;
const ACCENT = '#fa8c16';

// â”€â”€ Status mapping â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// appelée  = ENTERED + WAITING  (magasinier a glissé le camion, Démarrer pas encore cliqué)
// entre   = ENTERED + IN_PROGRESS ou PAUSED (Démarrer cliqué)
// attente = tout le reste (pas encore ENTERED)
// termine = DONE ou EXITED

type TruckStatus = 'attente' | 'appele' | 'entre' | 'termine';

function getTruckStatus(plan: LoadingPlan): TruckStatus {
  if (plan.loadingStatus === LoadingStatus.DONE || plan.entryStatus === EntryStatus.EXITED) return 'termine';
  if (plan.entryStatus === EntryStatus.ENTERED) {
    if (
      plan.loadingStatus === LoadingStatus.IN_PROGRESS ||
      plan.loadingStatus === LoadingStatus.PAUSED
    ) return 'entre';
    return 'appele';
  }
  if (plan.entryStatus === EntryStatus.CALLED) return 'appele';
  return 'attente';
}

const STATUS_CFG: Record<TruckStatus, { color: string; label: string; bg: string; border: string }> = {
  attente: { color: '#8c8c8c', label: 'En attente', bg: '#fafafa',  border: '#d9d9d9' },
  appele:  { color: '#722ed1', label: 'Appelée',     bg: '#f9f0ff',  border: '#d3adf7' },
  entre:   { color: '#52c41a', label: 'Entrée',      bg: '#f6ffed',  border: '#b7eb8f' },
  termine: { color: '#aaa',    label: 'Terminée',    bg: '#fafafa',  border: '#e8e8e8' },
};

// â”€â”€ Small truck card (left list panel) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const ListCard: React.FC<{ plan: LoadingPlan }> = ({ plan }) => {
  const status = getTruckStatus(plan);
  const cfg    = STATUS_CFG[status];
  const bls    = plan.bonsLivraison ?? [];
  const tonnage = bls.reduce((s, bl) => s + Number((bl as any).tonnageTotal ?? 0), 0);

  return (
    <div style={{
      background: '#fff',
      borderLeft: `4px solid ${cfg.color}`,
      borderRadius: 8,
      padding: '8px 10px',
      marginBottom: 6,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      opacity: status === 'termine' ? 0.55 : 1,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
        <Space size={5}>
          <TruckOutlined style={{ color: cfg.color, fontSize: 12 }} />
          <Text strong style={{ fontSize: 12 }}>{plan.truck?.matricule || '-'}</Text>
        </Space>
        <span style={{
          fontSize: 9, padding: '1px 5px', borderRadius: 8,
          background: cfg.color + '18', color: cfg.color,
          border: `1px solid ${cfg.color}44`, fontWeight: 700,
        }}>{cfg.label}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text type="secondary" style={{ fontSize: 10 }}>
          {(plan.truck as any)?.deliveryCompany?.nom || '-'}
        </Text>
        <Space size={4}>
          {plan.heureArrivee && (
            <Text style={{ fontSize: 10, color: '#888' }}>{plan.heureArrivee}</Text>
          )}
          {tonnage > 0 && (
            <Tag style={{ fontSize: 9, margin: 0, padding: '0 4px', lineHeight: '15px' }}>
              {tonnage.toFixed(1)} T
            </Tag>
          )}
          {plan.quai && (
            <Tag color="geekblue" style={{ fontSize: 9, margin: 0, padding: '0 4px', lineHeight: '15px' }}>
              {plan.quai}
            </Tag>
          )}
        </Space>
      </div>
      {/* Mini chrono compact dans la liste */}
      {status === 'entre' && plan.enteredAt && (
        <MiniElapsed since={plan.enteredAt} color={cfg.color} />
      )}
    </div>
  );
};

// â”€â”€ Big truck card (Appelées / Entrées panels) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const StatusCard: React.FC<{ plan: LoadingPlan }> = ({ plan }) => {
  const status = getTruckStatus(plan);
  const cfg    = STATUS_CFG[status];
  const bls    = plan.bonsLivraison ?? [];
  const tonnage = bls.reduce((s, bl) => s + Number((bl as any).tonnageTotal ?? 0), 0);
  const palettes = bls.reduce((s, bl) => s + Number(bl.nombrePalettes ?? 0), 0);

  return (
    <div style={{
      background: cfg.bg,
      border: `1.5px solid ${cfg.border}`,
      borderLeft: `4px solid ${cfg.color}`,
      borderRadius: 10,
      padding: '12px 14px',
    }}>
      {/* Row 1: matricule + quai */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <Space size={6}>
          <TruckOutlined style={{ color: cfg.color, fontSize: 14 }} />
          <Text strong style={{ fontSize: 14 }}>{plan.truck?.matricule || '-'}</Text>
          {plan.truck?.type && (
            <Tag style={{ margin: 0, fontSize: 9, padding: '0 4px', lineHeight: '15px' }}>
              {plan.truck.type}
            </Tag>
          )}
        </Space>
        {plan.quai && (
          <Tag style={{
            margin: 0, fontSize: 11, fontWeight: 700, padding: '2px 8px',
            background: cfg.color + '15', color: cfg.color, borderColor: cfg.border,
          }}>
            {plan.quai}
          </Tag>
        )}
      </div>

      {/* Row 2: transporteur */}
      <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 6 }}>
        {(plan.truck as any)?.deliveryCompany?.nom || '-'}
      </Text>

      {/* Row 3: details */}
      <Space size={6} wrap>
        {plan.heureArrivee && (
          <Space size={3}>
            <ClockCircleOutlined style={{ fontSize: 10, color: '#888' }} />
            <Text style={{ fontSize: 10, color: '#888' }}>RDV {plan.heureArrivee}</Text>
          </Space>
        )}
        {tonnage > 0 && (
          <Tag style={{ margin: 0, fontSize: 10, padding: '0 5px', background: '#f0f0f0', border: '1px solid #e0e0e0', color: '#555' }}>
            {tonnage.toFixed(1)} T
          </Tag>
        )}
        {palettes > 0 && (
          <Tag style={{ margin: 0, fontSize: 10, padding: '0 5px', background: '#f0f0f0', border: '1px solid #e0e0e0', color: '#555' }}>
            {palettes} pal.
          </Tag>
        )}
        <Tag color={status === 'entre' ? 'green' : 'purple'} style={{ margin: 0, fontSize: 10 }}>
          {bls.length} BL{bls.length !== 1 ? 's' : ''}
        </Tag>
      </Space>

      {/* Row 4: chronos pour camions entrés */}
      {status === 'entre' && (
        <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 0 }}>
          <ElapsedTimer since={plan.enteredAt} />
          <LoadingTimer plan={plan} />
        </div>
      )}
    </div>
  );
};

// â”€â”€ Section header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const SectionHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  count: number;
  color: string;
  subtitle?: string;
}> = ({ icon, title, count, color, subtitle }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8,
    marginBottom: 12, paddingBottom: 8,
    borderBottom: `2px solid ${color}28`,
  }}>
    <span style={{ color, fontSize: 16 }}>{icon}</span>
    <Text strong style={{ fontSize: 14, color: '#222' }}>{title}</Text>
    <span style={{
      background: color + '18', border: `1px solid ${color}55`,
      color, borderRadius: 12, padding: '0 8px', fontSize: 11, fontWeight: 700,
    }}>{count}</span>
    {subtitle && (
      <Text type="secondary" style={{ fontSize: 11 }}>{subtitle}</Text>
    )}
  </div>
);

// â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const SecuritePage: React.FC = () => {
  const [plans, setPlans] = useState<LoadingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigate = useNavigate();
  const today = dayjs().format('YYYY-MM-DD');

  const fetchData = useCallback(async () => {
    try {
      const res = await expediteurPortalAPI.getMyPlanning(today);
      setPlans(res.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchData]);

  const filtered = plans.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.truck?.matricule?.toLowerCase().includes(q) ||
      (p.truck as any)?.deliveryCompany?.nom?.toLowerCase().includes(q) ||
      p.quai?.toLowerCase().includes(q)
    );
  });

  const attente  = plans.filter((p) => getTruckStatus(p) === 'attente');
  const appeles  = plans.filter((p) => getTruckStatus(p) === 'appele');
  const entres   = plans.filter((p) => getTruckStatus(p) === 'entre');
  const termines = plans.filter((p) => getTruckStatus(p) === 'termine');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 16 }}>

      {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <SafetyOutlined style={{ fontSize: 22, color: ACCENT }} />
        <Title level={3} style={{ margin: 0 }}>Contrôle des Entrées</Title>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {dayjs().format('DD/MM/YYYY- HH:mm')}
        </Text>
        <span style={{
          fontSize: 10, padding: '2px 8px', borderRadius: 10,
          background: '#f6ffed', border: '1px solid #b7eb8f', color: '#52c41a',
          fontWeight: 600, marginLeft: 4,
        }}>
         Auto 5s
        </span>
        {appeles.length > 0 && (
          <span style={{
            fontSize: 11, padding: '3px 10px', borderRadius: 10,
            background: '#f9f0ff', border: '1px solid #d3adf7', color: '#722ed1',
            fontWeight: 700,
          }}>
            {appeles.length} camion{appeles.length > 1 ? 's' : ''} en attente de démarrage
          </span>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button
            icon={<ExpandOutlined />}
            onClick={() => navigate('/securite/tv')}
            size="small"
            title="Mode TV plein écran"
          >
            Mode TV
          </Button>
          <Tooltip title="Rafraîchir maintenant">
            <ReloadOutlined
              style={{ fontSize: 16, cursor: 'pointer', color: '#888' }}
              onClick={fetchData}
            />
          </Tooltip>
        </div>
      </div>

      {/* â”€â”€ Three-panel layout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div style={{ display: 'flex', gap: 14, flex: 1, minHeight: 0 }}>

        {/* â•â• LEFT- All trucks list â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <div style={{
          width: 270, flexShrink: 0, display: 'flex', flexDirection: 'column',
          background: '#fff', borderRadius: 12, border: '1px solid #e8e8e8', overflow: 'hidden',
        }}>
          <div style={{ padding: '12px 12px 10px', borderBottom: '1px solid #f0f0f0', background: '#fffbe6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Space size={6}>
                <TruckOutlined style={{ color: ACCENT }} />
                <Text strong>Camions du jour</Text>
              </Space>
              <Tag color="orange">{plans.length}</Tag>
            </div>
            <Input
              prefix={<SearchOutlined style={{ color: '#aaa' }} />}
              placeholder="Matricule, transporteur, quai..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small" allowClear
            />
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px' }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: 40, color: '#bbb' }}>
                <TruckOutlined style={{ fontSize: 32, display: 'block', margin: '0 auto 8px' }} />
                <div style={{ fontSize: 12 }}>Aucun camion</div>
              </div>
            ) : (
              filtered
                .sort((a, b) => {
                  const ORDER: Record<TruckStatus, number> = { appele: 0, entre: 1, attente: 2, termine: 3 };
                  return ORDER[getTruckStatus(a)] - ORDER[getTruckStatus(b)];
                })
                .map((p) => <ListCard key={p.id} plan={p} />)
            )}
          </div>
        </div>

        {/* â•â• MIDDLE- Appelées â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          background: '#fff', borderRadius: 12,
          border: `1px solid ${appeles.length > 0 ? '#d3adf7' : '#e8e8e8'}`,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid #f0f0f0',
            background: appeles.length > 0 ? '#f9f0ff' : '#fafafa',
          }}>
            <SectionHeader
              icon={<TruckOutlined />}
              title="Appelées"
              count={appeles.length}
              color="#722ed1"
              subtitle="- assignés à un quai, démarrage en attente"
            />
            {/* <Text type="secondary" style={{ fontSize: 11 }}>
              Ces camions ont été placés dans un quai par le magasinier mais le chargement n'a pas encore démarré.
            </Text> */}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
            {appeles.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: 60, color: '#bbb' }}>
                <InboxOutlined style={{ fontSize: 40, display: 'block', margin: '0 auto 12px' }} />
                <div style={{ fontSize: 13 }}>Aucun camion appelé pour le moment</div>
                <div style={{ fontSize: 11, marginTop: 4, color: '#d9d9d9' }}>
                  Apparaîtra ici lorsque le magasinier assignera un camion à un quai
                </div>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                gap: 10,
                alignContent: 'start',
              }}>
                {appeles.map((p) => <StatusCard key={p.id} plan={p} />)}
              </div>
            )}
          </div>
        </div>

        {/* â•â• RIGHT- Entrées â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          background: '#fff', borderRadius: 12,
          border: `1px solid ${entres.length > 0 ? '#b7eb8f' : '#e8e8e8'}`,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid #f0f0f0',
            background: entres.length > 0 ? '#f6ffed' : '#fafafa',
          }}>
            <SectionHeader
              icon={<CheckCircleOutlined />}
              title="Entrées"
              count={entres.length}
              color="#52c41a"
              subtitle="- chargement en cours"
            />
            {/* <Text type="secondary" style={{ fontSize: 11 }}>
              Ces camions sont à  l'intérieur et leur chargement a démarré.
            </Text> */}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
            {entres.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: 60, color: '#bbb' }}>
                <PlayCircleOutlined style={{ fontSize: 40, display: 'block', margin: '0 auto 12px' }} />
                <div style={{ fontSize: 13 }}>Aucun camion en chargement</div>
                <div style={{ fontSize: 11, marginTop: 4, color: '#d9d9d9' }}>
                  Apparaîtra ici lorsque le magasinier cliquera sur Démarrer
                </div>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                gap: 10,
                alignContent: 'start',
              }}>
                {entres.map((p) => <StatusCard key={p.id} plan={p} />)}
              </div>
            )}
          </div>

          {/* Sortis (terminées) sub-section */}
          {termines.length > 0 && (
            <div style={{
              borderTop: '1px solid #f0f0f0',
              padding: '10px 14px',
              background: '#fafafa',
              maxHeight: 160,
              overflowY: 'auto',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>
                  Terminées / Sorties
                </Text>
                <Tag style={{ fontSize: 10, margin: 0 }}>{termines.length}</Tag>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {termines.map((p) => (
                  <span key={p.id} style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 8,
                    background: '#f5f5f5', border: '1px solid #e0e0e0', color: '#aaa',
                    fontFamily: 'monospace', fontWeight: 600,
                  }}>
                    {p.truck?.matricule || '-'}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* â”€â”€ Stats bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div style={{
        marginTop: 12, background: '#fff', borderRadius: 8, border: '1px solid #e8e8e8',
        padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 24, flexShrink: 0,
      }}>
        <Space size={5}>
          <TruckOutlined style={{ color: '#666' }} />
          <Text style={{ fontSize: 12 }}>Total: <strong>{plans.length}</strong></Text>
        </Space>
        <Space size={5}>
          <Badge color="#8c8c8c" />
          <Text style={{ fontSize: 12 }}>En attente: <strong>{attente.length}</strong></Text>
        </Space>
        <Space size={5}>
          <Badge color="#722ed1" />
          <Text style={{ fontSize: 12 }}>
            Appelées: <strong style={{ color: '#722ed1' }}>{appeles.length}</strong>
          </Text>
        </Space>
        <Space size={5}>
          <Badge color="#52c41a" />
          <Text style={{ fontSize: 12 }}>
            Entrées: <strong style={{ color: '#52c41a' }}>{entres.length}</strong>
          </Text>
        </Space>
        <Space size={5}>
          <Badge color="#aaa" />
          <Text style={{ fontSize: 12 }}>Terminées: <strong>{termines.length}</strong></Text>
        </Space>
        <Text type="secondary" style={{ fontSize: 11, marginLeft: 'auto' }}>
          Actualisation auto à 5s
        </Text>
      </div>
    </div>
  );
};

export default SecuritePage;

