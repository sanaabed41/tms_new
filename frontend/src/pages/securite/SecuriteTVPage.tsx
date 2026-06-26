import React, { useCallback, useEffect, useRef, useState, FC } from 'react';
import { Button } from 'antd';
import {
  CheckCircleOutlined, ClockCircleOutlined,
  PlayCircleOutlined, SafetyOutlined, TruckOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import { expediteurPortalAPI } from '../../api';
import { EntryStatus, LoadingPlan, LoadingStatus } from '../../types';

dayjs.locale('fr');

type TruckStatus = 'attente' | 'appele' | 'entre' | 'termine';

function getTruckStatus(plan: LoadingPlan): TruckStatus {
  if (plan.loadingStatus === LoadingStatus.DONE || plan.entryStatus === EntryStatus.EXITED) return 'termine';
  if (plan.entryStatus === EntryStatus.ENTERED) {
    if (plan.loadingStatus === LoadingStatus.IN_PROGRESS || plan.loadingStatus === LoadingStatus.PAUSED)
      return 'entre';
    return 'appele';
  }
  if (plan.entryStatus === EntryStatus.CALLED) return 'appele';
  return 'attente';
}

const STATUS_CFG: Record<TruckStatus, { color: string; label: string; bg: string; border: string }> = {
  attente:  { color: '#8c8c8c', label: 'En attente', bg: '#fafafa',  border: '#d9d9d9' },
  appele:   { color: '#722ed1', label: 'Appelé',     bg: '#f9f0ff',  border: '#d3adf7' },
  entre:    { color: '#389e0d', label: 'Entré',      bg: '#f6ffed',  border: '#b7eb8f' },
  termine:  { color: '#bfbfbf', label: 'Terminé',    bg: '#f5f5f5',  border: '#e8e8e8' },
};

// ── Live chrono counting up from a start timestamp ─────────────────────────

const LiveChrono: React.FC<{ since: string | undefined; color: string; label: string }> = ({ since, color, label }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!since) return;
    const t0 = new Date(since).getTime();
    const upd = () => setElapsed(Math.floor((Date.now() - t0) / 1000));
    upd();
    const iv = setInterval(upd, 1000);
    return () => clearInterval(iv);
  }, [since]);

  if (!since) return null;

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const fmt = h > 0
    ? `${h}h${String(m).padStart(2, '0')}m${String(s).padStart(2, '0')}s`
    : `${String(m).padStart(2, '0')}m${String(s).padStart(2, '0')}s`;

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: color + '15', border: `1px solid ${color}44`,
      borderRadius: 20, padding: '3px 12px',
      fontSize: 13, fontWeight: 700, fontFamily: 'monospace',
      color, marginTop: 4,
    }}>
      <ClockCircleOutlined style={{ fontSize: 11 }} />
      {label} {fmt}
    </div>
  );
};

// ── Loading elapsed (for trucks IN_PROGRESS) ───────────────────────────────

const LoadingChrono: React.FC<{ plan: LoadingPlan; color: string }> = ({ plan, color }) => {
  const [elapsed, setElapsed] = useState(Number(plan.loadingElapsedSeconds ?? 0));

  useEffect(() => {
    const base = Number(plan.loadingElapsedSeconds ?? 0);
    if (plan.loadingStatus === LoadingStatus.IN_PROGRESS && plan.loadingStartedAt) {
      const t0 = new Date(plan.loadingStartedAt).getTime();
      const upd = () => setElapsed(base + Math.floor((Date.now() - t0) / 1000));
      upd();
      const iv = setInterval(upd, 1000);
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
      background: paused ? '#fffbe6' : color + '15',
      border: `1px solid ${paused ? '#ffe58f' : color + '44'}`,
      borderRadius: 20, padding: '3px 12px',
      fontSize: 13, fontWeight: 700, fontFamily: 'monospace',
      color: paused ? '#d48806' : color, marginTop: 4,
    }}>
      <ClockCircleOutlined style={{ fontSize: 11 }} />
      Chargement {fmt}
      {paused && <span style={{ fontSize: 10, background: '#faad14', color: '#fff', borderRadius: 4, padding: '0 4px', marginLeft: 4 }}>PAUSE</span>}
    </div>
  );
};

// ── TV Card ────────────────────────────────────────────────────────────────

const TVCard: React.FC<{ plan: LoadingPlan }> = ({ plan }) => {
  const status = getTruckStatus(plan);
  const cfg = STATUS_CFG[status];
  const bls = plan.bonsLivraison ?? [];
  const tonnage = bls.reduce((s, bl) => s + Number((bl as any).tonnageTotal ?? 0), 0);
  const isLoading = plan.loadingStatus === LoadingStatus.IN_PROGRESS || plan.loadingStatus === LoadingStatus.PAUSED;

  return (
    <div style={{
      background: cfg.bg,
      border: `1.5px solid ${cfg.border}`,
      borderLeft: `5px solid ${cfg.color}`,
      borderRadius: 10,
      padding: '14px 18px',
      opacity: status === 'termine' ? 0.5 : 1,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TruckOutlined style={{ color: cfg.color, fontSize: 20 }} />
          <span style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', fontFamily: 'monospace' }}>
            {plan.truck?.matricule || '—'}
          </span>
        </div>
        <span style={{
          fontSize: 12, padding: '3px 12px', borderRadius: 20,
          background: cfg.color + '18', border: `1px solid ${cfg.color}44`,
          color: cfg.color, fontWeight: 700, letterSpacing: 0.5,
        }}>
          {cfg.label.toUpperCase()}
        </span>
      </div>

      <div style={{ color: '#8c8c8c', fontSize: 13, marginBottom: 5 }}>
        {(plan.truck as any)?.deliveryCompany?.nom || ''}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {plan.quai && (
          <span style={{
            fontSize: 16, fontWeight: 700, padding: '2px 12px', borderRadius: 6,
            background: cfg.color + '18', color: cfg.color, border: `1px solid ${cfg.color}44`,
          }}>
            {plan.quai}
          </span>
        )}
        {plan.heureArrivee && (
          <span style={{ fontSize: 13, color: '#8c8c8c', display: 'flex', alignItems: 'center', gap: 4 }}>
            <ClockCircleOutlined /> RDV {(() => {
              const d = dayjs(plan.heureArrivee, 'YYYY-MM-DD HH:mm');
              return d.isValid() ? d.format('DD/MM HH:mm') : plan.heureArrivee;
            })()}
          </span>
        )}
        {tonnage > 0 && (
          <span style={{ fontSize: 13, color: '#595959' }}>{tonnage.toFixed(1)} T</span>
        )}
        <span style={{ fontSize: 12, color: '#8c8c8c', marginLeft: 'auto' }}>
          {bls.length} BL{bls.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Chrono selon le statut */}
      {status === 'appele' && plan.entryStatus === EntryStatus.CALLED && (
        <LiveChrono since={plan.calledAt} color={cfg.color} label="Appelé depuis" />
      )}
      {status === 'appele' && plan.entryStatus === EntryStatus.ENTERED && (
        <LiveChrono since={plan.enteredAt} color={cfg.color} label="Entré depuis" />
      )}
      {status === 'entre' && isLoading && (
        <LoadingChrono plan={plan} color={cfg.color} />
      )}
    </div>
  );
};

// ── Auto-scroll column (airport style) ────────────────────────────────────

const AutoScrollColumn: FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let paused = false;
    const iv = setInterval(() => {
      if (!el || paused) return;
      if (el.scrollHeight <= el.clientHeight + 2) {
        el.scrollTop = 0;
        return;
      }
      el.scrollTop += 1;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
        paused = true;
        setTimeout(() => {
          if (el) el.scrollTop = 0;
          paused = false;
        }, 3000);
      }
    }, 50);
    return () => clearInterval(iv);
  }, []);

  return <div ref={ref} style={style}>{children}</div>;
};

// ── Main TV Page ───────────────────────────────────────────────────────────

const SecuriteTVPage: React.FC = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<LoadingPlan[]>([]);
  const [clock, setClock] = useState(dayjs().format('HH:mm:ss'));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const today = dayjs().format('YYYY-MM-DD');

  const fetchData = useCallback(async () => {
    try {
      const res = await expediteurPortalAPI.getMyPlanning(today);
      setPlans(res.data);
    } catch {
      // silent — TV mode must keep running
    }
  }, [today]);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 5000);
    clockRef.current = setInterval(() => setClock(dayjs().format('HH:mm:ss')), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (clockRef.current) clearInterval(clockRef.current);
    };
  }, [fetchData]);

  const appeles  = plans.filter((p) => getTruckStatus(p) === 'appele');
  const entres   = plans.filter((p) => getTruckStatus(p) === 'entre');
  const attente  = plans.filter((p) => getTruckStatus(p) === 'attente');
  const termines = plans.filter((p) => getTruckStatus(p) === 'termine');

  return (
    <div style={{
      minHeight: '100vh', background: '#f0f2f5',
      display: 'flex', flexDirection: 'column', padding: '14px 18px',
      fontFamily: 'system-ui, sans-serif',
    }}>
      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        marginBottom: 16, padding: '12px 18px',
        background: 'white', borderRadius: 12,
        border: '1px solid #e8e8e8',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        <SafetyOutlined style={{ fontSize: 28, color: '#fa8c16' }} />
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', letterSpacing: 0.5 }}>
            CONTRÔLE DES ENTRÉES
          </div>
          <div style={{ fontSize: 13, color: '#8c8c8c' }}>
            {dayjs().format('dddd D MMMM YYYY')}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 36, fontWeight: 800, fontFamily: 'monospace', color: '#fa8c16', lineHeight: 1 }}>
              {clock}
            </div>
            <div style={{ fontSize: 11, color: '#bfbfbf', marginTop: 2 }}>
              ● AUTO 5s
            </div>
          </div>
          <Button
            icon={<LogoutOutlined />}
            onClick={() => navigate('/securite')}
            style={{ borderColor: '#d9d9d9', color: '#595959' }}
          >
            Quitter
          </Button>
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        {[
          { label: 'Total', count: plans.length, color: '#595959', bg: '#fafafa' },
          { label: 'En attente', count: attente.length, color: '#8c8c8c', bg: '#fafafa' },
          { label: 'Appelés', count: appeles.length, color: '#722ed1', bg: '#f9f0ff' },
          { label: 'Entrés', count: entres.length, color: '#389e0d', bg: '#f6ffed' },
          { label: 'Terminés', count: termines.length, color: '#bfbfbf', bg: '#f5f5f5' },
        ].map(({ label, count, color, bg }) => (
          <div key={label} style={{
            flex: 1, textAlign: 'center', padding: '8px 6px',
            background: bg, borderRadius: 10,
            border: `1px solid ${color}33`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: 'monospace' }}>{count}</div>
            <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── 3 colonnes principales ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, flex: 1 }}>

        {/* En attente */}
        <div style={{
          background: 'white', borderRadius: 12,
          border: `2px solid ${attente.length > 0 ? '#d9d9d9' : '#e8e8e8'}`,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}>
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid #f0f0f0',
            background: attente.length > 0 ? '#fafafa' : 'white',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <ClockCircleOutlined style={{ color: '#8c8c8c', fontSize: 18 }} />
            <span style={{ fontSize: 18, fontWeight: 700, color: '#595959' }}>EN ATTENTE</span>
            <span style={{
              marginLeft: 6, fontSize: 16, fontWeight: 800, fontFamily: 'monospace',
              background: '#8c8c8c', color: '#fff', padding: '1px 10px', borderRadius: 6,
            }}>
              {attente.length}
            </span>
          </div>
          <AutoScrollColumn style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {attente.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: 50, color: '#bfbfbf' }}>
                <ClockCircleOutlined style={{ fontSize: 42, display: 'block', margin: '0 auto 10px' }} />
                <div style={{ fontSize: 14 }}>Aucun camion en attente</div>
              </div>
            ) : attente.map((p) => <TVCard key={p.id} plan={p} />)}
          </AutoScrollColumn>
        </div>

        {/* Appelés */}
        <div style={{
          background: 'white', borderRadius: 12,
          border: `2px solid ${appeles.length > 0 ? '#d3adf7' : '#e8e8e8'}`,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}>
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid #f0f0f0',
            background: appeles.length > 0 ? '#f9f0ff' : 'white',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <TruckOutlined style={{ color: '#722ed1', fontSize: 18 }} />
            <span style={{ fontSize: 18, fontWeight: 700, color: '#531dab' }}>APPELÉS</span>
            <span style={{
              marginLeft: 6, fontSize: 16, fontWeight: 800, fontFamily: 'monospace',
              background: '#722ed1', color: '#fff', padding: '1px 10px', borderRadius: 6,
            }}>
              {appeles.length}
            </span>
            <span style={{ fontSize: 11, color: '#8c8c8c', marginLeft: 4 }}>
              — en attente d'entrée
            </span>
          </div>
          <AutoScrollColumn style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {appeles.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: 50, color: '#bfbfbf' }}>
                <TruckOutlined style={{ fontSize: 42, display: 'block', margin: '0 auto 10px' }} />
                <div style={{ fontSize: 14 }}>Aucun camion appelé</div>
              </div>
            ) : appeles.map((p) => <TVCard key={p.id} plan={p} />)}
          </AutoScrollColumn>
        </div>

        {/* Entrés */}
        <div style={{
          background: 'white', borderRadius: 12,
          border: `2px solid ${entres.length > 0 ? '#b7eb8f' : '#e8e8e8'}`,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}>
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid #f0f0f0',
            background: entres.length > 0 ? '#f6ffed' : 'white',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <CheckCircleOutlined style={{ color: '#389e0d', fontSize: 18 }} />
            <span style={{ fontSize: 18, fontWeight: 700, color: '#237804' }}>ENTRÉS</span>
            <span style={{
              marginLeft: 6, fontSize: 16, fontWeight: 800, fontFamily: 'monospace',
              background: '#389e0d', color: '#fff', padding: '1px 10px', borderRadius: 6,
            }}>
              {entres.length}
            </span>
            <span style={{ fontSize: 11, color: '#8c8c8c', marginLeft: 4 }}>
              — chargement en cours
            </span>
          </div>
          <AutoScrollColumn style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {entres.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: 50, color: '#bfbfbf' }}>
                <PlayCircleOutlined style={{ fontSize: 42, display: 'block', margin: '0 auto 10px' }} />
                <div style={{ fontSize: 14 }}>Aucun camion en chargement</div>
              </div>
            ) : entres.map((p) => <TVCard key={p.id} plan={p} />)}
          </AutoScrollColumn>

          {/* Terminés mini-strip */}
          {termines.length > 0 && (
            <div style={{ borderTop: '1px solid #f0f0f0', padding: '8px 14px', background: '#fafafa' }}>
              <div style={{ fontSize: 11, color: '#bfbfbf', marginBottom: 5, fontWeight: 700 }}>
                TERMINÉS / SORTIS ({termines.length})
              </div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {termines.map((p) => (
                  <span key={p.id} style={{
                    fontSize: 12, padding: '2px 8px', borderRadius: 5,
                    background: '#f5f5f5', border: '1px solid #e8e8e8',
                    color: '#bfbfbf', fontFamily: 'monospace', fontWeight: 600,
                  }}>
                    {p.truck?.matricule || '—'}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecuriteTVPage;
