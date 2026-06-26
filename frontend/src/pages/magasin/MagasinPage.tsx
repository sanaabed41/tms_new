import React, { useEffect, useState, useCallback } from 'react';
import {
  DndContext, DragOverlay, DragStartEvent, DragEndEvent,
  useDroppable, useDraggable, pointerWithin, PointerSensor,
  useSensor, useSensors,
} from '@dnd-kit/core';
import {
  Typography, DatePicker, Spin, Empty, Tag, Badge, Button, Modal,
  Divider, message, Table, Radio,
} from 'antd';
import {
  TruckOutlined, ClockCircleOutlined, CheckCircleOutlined,
  PauseCircleOutlined, PlayCircleOutlined, HistoryOutlined,
  FileTextOutlined, PrinterOutlined, ArrowRightOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { loadingPlansAPI } from '../../api';
import { LoadingPlan, LoadingStatus, EntryStatus, QuaisLibresResponse, QuaiStatus } from '../../types';
import { getDestinationColor } from '../planning/BLCard';

const { Title, Text } = Typography;

// Couleurs par filière
const STATION_COLORS: Record<string, string> = {
  AMT:  '#722ed1',
  MCSR: '#1890ff',
  PW:   '#e83e8c',
};
const stationColor = (code: string) => STATION_COLORS[code] ?? '#8c8c8c';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatSeconds(total: number): string {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getElapsed(plan: LoadingPlan): number {
  let secs = plan.loadingElapsedSeconds || 0;
  if (plan.loadingStatus === LoadingStatus.IN_PROGRESS && plan.loadingStartedAt) {
    secs += Math.floor((Date.now() - new Date(plan.loadingStartedAt).getTime()) / 1000);
  }
  return Math.max(0, secs);
}

// ── BL row compact ────────────────────────────────────────────────────────────

const BLRow: React.FC<{ bl: any }> = ({ bl }) => {
  const destColor = getDestinationColor(bl.destination);
  const filColor  = bl.filiere?.code ? stationColor(bl.filiere.code) : '#8c8c8c';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      padding: '3px 0', borderBottom: '1px solid #f5f5f5',
    }}>
      {bl.ordreChargement != null ? (
        <span style={{
          fontSize: 9, fontWeight: 800, color: 'white',
          background: '#1890ff', borderRadius: '50%',
          width: 15, height: 15, display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {bl.ordreChargement}
        </span>
      ) : (
        <div style={{ width: 3, height: 14, borderRadius: 2, background: destColor, flexShrink: 0 }} />
      )}
      <Text style={{ fontSize: 10.5, fontWeight: 600, fontFamily: 'monospace', flexShrink: 0, color: '#1a1a1a' }}>
        {bl.numeroBl}
      </Text>
      <Tag style={{
        margin: 0, fontSize: 9, padding: '0 4px', lineHeight: '15px',
        color: destColor, borderColor: destColor + '55', background: destColor + '12', flexShrink: 0,
      }}>
        {bl.destination || '—'}
      </Tag>
      {bl.filiere?.code && (
        <Tag style={{
          margin: 0, fontSize: 9, padding: '0 4px', lineHeight: '15px',
          color: filColor, borderColor: filColor + '55', background: filColor + '15',
          fontWeight: 700, flexShrink: 0,
        }}>
          {bl.filiere.code}
        </Tag>
      )}
      <Text type="secondary" style={{
        fontSize: 10, flex: 1, minWidth: 0,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {bl.clientNom}
      </Text>
      <Text style={{ fontSize: 10, fontWeight: 600, color: '#1890ff', flexShrink: 0 }}>
        {Number(bl.tonnageTotal).toFixed(1)}T
      </Text>
    </div>
  );
};

// ── Station sequence badges ───────────────────────────────────────────────────

const SequenceBadges: React.FC<{ plan: LoadingPlan; small?: boolean }> = ({ plan, small }) => {
  const seq    = plan.stationsSequence || [];
  const curIdx = plan.currentStationIdx ?? 0;
  if (seq.length === 0) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
      {seq.map((code, i) => (
        <React.Fragment key={code}>
          <Tag style={{
            margin: 0, fontSize: small ? 9 : 10, padding: '0 5px',
            lineHeight: small ? '15px' : '18px', fontWeight: 700,
            color: i < curIdx ? '#bfbfbf' : stationColor(code),
            borderColor: (i < curIdx ? '#bfbfbf' : stationColor(code)) + '55',
            background: (i < curIdx ? '#bfbfbf' : stationColor(code)) + '15',
            textDecoration: i < curIdx ? 'line-through' : 'none',
          }}>
            {i === curIdx && plan.entryStatus !== EntryStatus.IDLE ? '▶ ' : ''}{code}
          </Tag>
          {i < seq.length - 1 && (
            <ArrowRightOutlined style={{ fontSize: 8, color: '#d9d9d9' }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// ── TruckPlanCard — file d'appel (gauche) ────────────────────────────────────

const TruckPlanCard: React.FC<{ plan: LoadingPlan; overlay?: boolean }> = ({ plan, overlay }) => {
  const isIdle = plan.entryStatus === EntryStatus.IDLE && plan.loadingStatus === LoadingStatus.WAITING;
  const isDone = plan.loadingStatus === LoadingStatus.DONE || plan.entryStatus === EntryStatus.EXITED;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: plan.id, disabled: !isIdle,
  });

  const accent = isDone ? '#8c8c8c'
    : plan.currentStation ? stationColor(plan.currentStation)
    : '#595959';

  return (
    <div
      ref={setNodeRef}
      {...(isIdle ? { ...listeners, ...attributes } : {})}
      style={{
        background: !isIdle && !isDone ? `${accent}06` : isDone ? '#fafafa' : 'white',
        borderRadius: 8,
        border: isDragging && !overlay ? '1px solid transparent'
          : isDone ? '1px solid #f0f0f0'
          : !isIdle ? `1px solid ${accent}44`
          : '1px solid #e8e8e8',
        padding: '10px 12px',
        marginBottom: 8,
        cursor: isIdle ? (overlay ? 'grabbing' : 'grab') : 'default',
        opacity: isDragging && !overlay ? 0.15 : isDone ? 0.55 : 1,
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        boxShadow: overlay ? '0 8px 24px rgba(0,0,0,0.2)'
          : isDone ? 'none' : isIdle ? '0 1px 4px rgba(0,0,0,0.06)' : `0 2px 8px ${accent}18`,
        userSelect: 'none',
      } as React.CSSProperties}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <TruckOutlined style={{ fontSize: 13, color: isDone ? '#bfbfbf' : isIdle ? '#1890ff' : accent }} />
          <Text strong style={{ fontSize: 13, fontFamily: 'monospace', color: isDone ? '#8c8c8c' : undefined }}>
            {plan.truck?.matricule}
          </Text>
          {plan.truck?.type && (
            <Tag style={{ margin: 0, fontSize: 9, padding: '0 4px', lineHeight: '15px' }}>
              {plan.truck.type}
            </Tag>
          )}
        </div>
        {plan.heureArrivee && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <ClockCircleOutlined style={{ fontSize: 10, color: isDone ? '#d9d9d9' : '#fa8c16' }} />
            <Text style={{ fontSize: 11, fontWeight: 600, color: isDone ? '#d9d9d9' : '#fa8c16' }}>
              {plan.heureArrivee}
            </Text>
          </div>
        )}
      </div>

      {plan.truck?.deliveryCompany?.nom && (
        <Text type="secondary" style={{ fontSize: 10, display: 'block', marginBottom: 4 }}>
          {plan.truck.deliveryCompany.nom}
        </Text>
      )}

      {/* Séquence de stations */}
      {plan.stationsSequence && plan.stationsSequence.length > 0 && (
        <div style={{ marginBottom: 5 }}>
          <SequenceBadges plan={plan} small />
        </div>
      )}

      {/* BL list */}
      {(plan.bonsLivraison || []).length > 0 && (
        <div style={{ marginBottom: 5 }}>
          {(plan.bonsLivraison || []).map((bl) => <BLRow key={bl.id} bl={bl} />)}
        </div>
      )}

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
        <Tag color={isDone ? 'default' : 'blue'} style={{ fontSize: 9, margin: 0 }}>
          {(plan.bonsLivraison || []).length} BL
        </Tag>
        <Tag color={isDone ? 'default' : 'geekblue'} style={{ fontSize: 9, margin: 0 }}>
          {Number(plan.tonnageCharge).toFixed(1)} T
        </Tag>
        {isDone && plan.loadingElapsedSeconds > 0 && (
          <Tag style={{ fontSize: 9, margin: 0, color: '#8c8c8c' }}>
            <HistoryOutlined style={{ marginRight: 2 }} />
            {formatSeconds(plan.loadingElapsedSeconds)}
          </Tag>
        )}
      </div>
    </div>
  );
};

// ── CallDropZone ──────────────────────────────────────────────────────────────

const CallDropZone: React.FC = () => {
  const { setNodeRef, isOver } = useDroppable({ id: 'call-zone' });
  return (
    <div ref={setNodeRef} style={{
      borderRadius: 8,
      border: `2px dashed ${isOver ? '#1890ff' : '#d9d9d9'}`,
      background: isOver ? 'rgba(24,144,255,0.05)' : '#fafafa',
      padding: '10px 16px',
      marginBottom: 16,
      textAlign: 'center',
      transition: 'all 0.15s',
    }}>
      <Text style={{ fontSize: 13, color: isOver ? '#1890ff' : '#bfbfbf' }}>
        {isOver ? '↓ Déposer pour appeler le camion' : 'Glisser un camion ici pour l\'appeler'}
      </Text>
    </div>
  );
};

// ── StationCard — camion actif dans une station ───────────────────────────────

const StationCard: React.FC<{
  plan: LoadingPlan;
  tick: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onNextStation: () => void;
}> = ({ plan, tick: _tick, onStart, onPause, onResume, onNextStation }) => {
  const seq     = plan.stationsSequence || [];
  const curIdx  = plan.currentStationIdx ?? 0;
  const isLast  = curIdx >= seq.length - 1;
  const nextCode = !isLast ? seq[curIdx + 1] : null;

  const isEntered = plan.entryStatus === EntryStatus.ENTERED && plan.loadingStatus === LoadingStatus.WAITING;
  const isActive  = plan.loadingStatus === LoadingStatus.IN_PROGRESS;
  const isPaused  = plan.loadingStatus === LoadingStatus.PAUSED;

  const accent   = plan.currentStation ? stationColor(plan.currentStation) : '#52c41a';
  const timerBg  = isPaused ? '#fff7e6' : '#f6ffed';
  const timerClr = isPaused ? '#fa8c16' : accent;

  return (
    <div style={{
      background: 'white', borderRadius: 8,
      border: `2px solid ${accent}`, padding: '10px 12px',
      boxShadow: `0 3px 10px ${accent}18`, marginBottom: 10,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <TruckOutlined style={{ color: accent, fontSize: 13 }} />
          <Text strong style={{ fontSize: 12, fontFamily: 'monospace' }}>{plan.truck?.matricule}</Text>
          {plan.heureArrivee && (
            <Text type="secondary" style={{ fontSize: 10 }}>RDV {plan.heureArrivee}</Text>
          )}
        </div>
        <SequenceBadges plan={plan} small />
      </div>

      {/* Status message */}
      {isEntered && (
        <div style={{
          textAlign: 'center', padding: '5px', background: '#e6f4ff',
          borderRadius: 6, marginBottom: 8, color: '#1890ff', fontSize: 11,
        }}>
          ✅ Appuyez sur <strong>Démarrer</strong>
        </div>
      )}

      {/* Timer */}
      {(isActive || isPaused) && (
        <div style={{
          textAlign: 'center', padding: '6px 0', background: timerBg,
          borderRadius: 6, marginBottom: 8,
        }}>
          <Text type="secondary" style={{ fontSize: 10, display: 'block' }}>
            {isPaused ? 'En pause' : 'Durée totale'}
          </Text>
          <Text strong style={{ fontSize: 22, fontFamily: 'monospace', color: timerClr, letterSpacing: 2 }}>
            {formatSeconds(getElapsed(plan))}
          </Text>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {isEntered && (
          <Button size="small" type="primary" icon={<PlayCircleOutlined />}
            style={{ background: '#52c41a', borderColor: '#52c41a', fontSize: 11 }}
            onClick={onStart}>
            Démarrer
          </Button>
        )}
        {isActive && (
          <Button size="small" icon={<PauseCircleOutlined />} style={{ fontSize: 11 }} onClick={onPause}>
            Pause
          </Button>
        )}
        {isPaused && (
          <Button size="small" type="primary" icon={<PlayCircleOutlined />} style={{ fontSize: 11 }} onClick={onResume}>
            Reprendre
          </Button>
        )}
        {(isActive || isPaused) && (
          <Button
            size="small" type="primary" icon={nextCode ? <ArrowRightOutlined /> : <CheckCircleOutlined />}
            style={{
              fontSize: 11,
              background: nextCode ? stationColor(nextCode) : '#52c41a',
              borderColor: nextCode ? stationColor(nextCode) : '#52c41a',
            }}
            onClick={onNextStation}
          >
            {nextCode ? `→ ${nextCode}` : 'Terminé'}
          </Button>
        )}
      </div>

      {/* Métriques */}
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 8 }}>
        <Tag color="blue" style={{ fontSize: 9, margin: 0 }}>
          {(plan.bonsLivraison || []).length} BL
        </Tag>
        <Tag color="geekblue" style={{ fontSize: 9, margin: 0 }}>
          {Number(plan.tonnageCharge).toFixed(1)} T
        </Tag>
      </div>
    </div>
  );
};

// ── StationColumn ─────────────────────────────────────────────────────────────

const StationColumn: React.FC<{
  stationCode: string;
  plans: LoadingPlan[];
  tick: number;
  onStart: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onNextStation: (plan: LoadingPlan) => void;
}> = ({ stationCode, plans, tick, onStart, onPause, onResume, onNextStation }) => {
  const color = stationColor(stationCode);

  // Actifs : camion autorisé (ENTERED) dont la station courante est celle-ci
  const active = plans.filter(
    (p) => p.currentStation === stationCode && p.entryStatus === EntryStatus.ENTERED,
  );

  // Appelés mais en attente sécu : currentStation = cette station, entryStatus = CALLED
  const called = plans.filter(
    (p) => p.currentStation === stationCode && p.entryStatus === EntryStatus.CALLED,
  );

  // File d'attente : camions dont cette station vient APRÈS leur station courante
  const queued = plans.filter((p) => {
    const seq = p.stationsSequence || [];
    const cur = p.currentStationIdx ?? 0;
    return (
      seq.slice(cur + 1).includes(stationCode) &&
      (p.entryStatus === EntryStatus.ENTERED || p.entryStatus === EntryStatus.CALLED)
    );
  });

  const totalPending = called.length + queued.length;

  return (
    <div style={{
      background: '#fafafa', borderRadius: 10,
      border: `2px solid ${color}33`,
      padding: '12px 12px 8px',
      minHeight: 200,
    }}>
      {/* En-tête station */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: active.length > 0 ? color : '#d9d9d9',
        }} />
        <Text strong style={{ fontSize: 13, color }}>Station {stationCode}</Text>
        {totalPending > 0 && (
          <Badge count={totalPending} style={{ backgroundColor: color }} />
        )}
      </div>

      {/* Camion en cours */}
      {active.map((plan) => (
        <StationCard
          key={plan.id}
          plan={plan}
          tick={tick}
          onStart={() => onStart(plan.id)}
          onPause={() => onPause(plan.id)}
          onResume={() => onResume(plan.id)}
          onNextStation={() => onNextStation(plan)}
        />
      ))}

      {active.length === 0 && called.length === 0 && queued.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#d9d9d9', fontSize: 12 }}>
          Libre
        </div>
      )}

      {/* En attente autorisation sécu */}
      {called.map((plan) => (
        <div key={plan.id} style={{
          background: '#fff7e6', borderRadius: 6, border: '1px solid #fa8c1655',
          padding: '8px 10px', marginBottom: 6, fontSize: 11, color: '#fa8c16',
        }}>
          <TruckOutlined style={{ marginRight: 5 }} />
          <Text strong style={{ fontFamily: 'monospace', fontSize: 11 }}>{plan.truck?.matricule}</Text>
          <Text style={{ fontSize: 10, color: '#fa8c16', marginLeft: 6 }}>— autorisation sécu</Text>
        </div>
      ))}

      {/* File d'attente */}
      {queued.length > 0 && (
        <>
          <Divider style={{ margin: '8px 0 6px' }}>
            <Text type="secondary" style={{ fontSize: 10 }}>
              File d'attente ({queued.length})
            </Text>
          </Divider>
          {queued.map((plan, i) => {
            const seq = plan.stationsSequence || [];
            const posInSeq = seq.indexOf(stationCode);
            return (
              <div key={plan.id} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 8px', borderRadius: 6,
                background: 'white', border: '1px solid #f0f0f0',
                marginBottom: 4,
              }}>
                <Text style={{
                  fontSize: 10, fontWeight: 700, color: '#bfbfbf',
                  width: 14, textAlign: 'center',
                }}>
                  {i + 1}
                </Text>
                <TruckOutlined style={{ fontSize: 11, color: '#8c8c8c' }} />
                <Text style={{ fontSize: 11, fontFamily: 'monospace', flex: 1 }}>
                  {plan.truck?.matricule}
                </Text>
                <Text type="secondary" style={{ fontSize: 9 }}>
                  pos.{posInSeq + 1}/{seq.length}
                </Text>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

// ── DayReportModal ────────────────────────────────────────────────────────────

const DayReportModal: React.FC<{ open: boolean; date: string; onClose: () => void }> = ({ open, date, onClose }) => {
  const [plans, setPlans]   = useState<LoadingPlan[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    loadingPlansAPI.getDayReport(date)
      .then((r) => setPlans(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, date]);

  const columns = [
    { title: 'Camion', key: 'truck', render: (_: any, r: LoadingPlan) => (
      <div>
        <Text strong style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.truck?.matricule}</Text>
        <br /><Text type="secondary" style={{ fontSize: 10 }}>{r.truck?.deliveryCompany?.nom}</Text>
      </div>
    )},
    { title: 'Séquence', key: 'seq', render: (_: any, r: LoadingPlan) => (
      <SequenceBadges plan={r} small />
    )},
    { title: 'RDV', dataIndex: 'heureArrivee', key: 'rdv', width: 60, render: (v: string) => v || '—' },
    { title: 'BLs', key: 'bls', width: 50, render: (_: any, r: LoadingPlan) => (r.bonsLivraison || []).length },
    { title: 'Tonnage', key: 'tonnage', width: 80,
      render: (_: any, r: LoadingPlan) => `${Number(r.tonnageCharge).toFixed(1)} T` },
    { title: 'Durée totale', key: 'duree', width: 100,
      render: (_: any, r: LoadingPlan) => r.loadingElapsedSeconds > 0 ? formatSeconds(r.loadingElapsedSeconds) : '—' },
    { title: 'Statut', key: 'statut', width: 80,
      render: (_: any, r: LoadingPlan) => {
        const cfg: Record<string, { label: string; color: string }> = {
          EXITED: { label: 'Sorti', color: '#52c41a' },
          ENTERED: { label: 'En cours', color: '#1890ff' },
          CALLED:  { label: 'Appelé',   color: '#fa8c16' },
        };
        const c = cfg[r.entryStatus] ?? { label: r.entryStatus, color: '#8c8c8c' };
        return <Tag color={c.color} style={{ fontSize: 10 }}>{c.label}</Tag>;
      }},
  ];

  const totals = plans.reduce((a, p) => ({
    trucks: a.trucks + 1,
    bls: a.bls + (p.bonsLivraison || []).length,
    tonnage: a.tonnage + Number(p.tonnageCharge),
    duration: a.duration + (p.loadingElapsedSeconds || 0),
  }), { trucks: 0, bls: 0, tonnage: 0, duration: 0 });

  return (
    <Modal open={open} onCancel={onClose} width={820}
      title={<span><FileTextOutlined style={{ color: '#1890ff', marginRight: 8 }} />
        Rapport — {dayjs(date).format('DD/MM/YYYY')}</span>}
      footer={[
        <Button key="c" onClick={onClose}>Fermer</Button>,
        <Button key="p" type="primary" icon={<PrinterOutlined />} onClick={() => window.print()}>Imprimer</Button>,
      ]}
    >
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
        : plans.length === 0 ? <Empty description="Aucun camion traité" />
        : (
          <>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              {[
                { label: 'Camions', value: totals.trucks,                      color: '#1890ff' },
                { label: 'BLs',     value: totals.bls,                          color: '#722ed1' },
                { label: 'Tonnage', value: `${totals.tonnage.toFixed(1)} T`,    color: '#fa8c16' },
                { label: 'Durée',   value: formatSeconds(totals.duration),       color: '#52c41a' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{
                  flex: 1, textAlign: 'center', padding: '10px 8px',
                  background: color + '10', borderRadius: 8, border: `1px solid ${color}30`,
                }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
                  <div style={{ fontSize: 11, color: '#8c8c8c' }}>{label}</div>
                </div>
              ))}
            </div>
            <Table dataSource={plans} columns={columns} rowKey="id" size="small"
              pagination={false} scroll={{ y: 380 }} />
          </>
        )}
    </Modal>
  );
};

// ── QuaiGrid helper ───────────────────────────────────────────────────────────

const QuaiGrid: React.FC<{ quais: QuaiStatus[]; selectedQuai: string | null }> = ({ quais }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
    {quais.map((q) => (
      <Radio.Button
        key={q.nom}
        value={q.nom}
        disabled={q.occupe}
        style={{
          textAlign: 'center', padding: '6px 4px',
          height: 'auto', lineHeight: 1.4, borderRadius: 6,
          opacity: q.occupe ? 0.5 : 1,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 600 }}>{q.nom}</div>
        {q.occupe ? (
          <div style={{ fontSize: 9, color: '#ff4d4f', fontFamily: 'monospace' }}>
            {q.matricule ?? 'Occupé'}
          </div>
        ) : (
          <div style={{ fontSize: 9, color: '#52c41a' }}>Libre</div>
        )}
      </Radio.Button>
    ))}
  </div>
);

// ── Page principale ───────────────────────────────────────────────────────────

const MagasinPage: React.FC = () => {
  const [plans, setPlans]           = useState<LoadingPlan[]>([]);
  const [loading, setLoading]       = useState(true);
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [activePlan, setActivePlan] = useState<LoadingPlan | null>(null);
  const [tick, setTick]             = useState(0);
  const [reportOpen, setReportOpen] = useState(false);

  // Sélection de quai au moment de l'appel
  const [pendingCallPlan, setPendingCallPlan] = useState<LoadingPlan | null>(null);
  const [quaisData, setQuaisData]             = useState<QuaisLibresResponse>({ societes: [], generiques: [] });
  const [selectedQuai, setSelectedQuai]       = useState<string | null>(null);
  const [callingQuai, setCallingQuai]         = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const fetchPlans = useCallback(() => {
    loadingPlansAPI.getMagasin(selectedDate)
      .then((res) => setPlans(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedDate]);

  useEffect(() => { setLoading(true); fetchPlans(); }, [fetchPlans]);
  useEffect(() => {
    const id = setInterval(fetchPlans, 5000);
    return () => clearInterval(id);
  }, [fetchPlans]);

  const handleDragStart = (e: DragStartEvent) =>
    setActivePlan(plans.find((p) => p.id === e.active.id) || null);

  const handleDragEnd = async (e: DragEndEvent) => {
    setActivePlan(null);
    if (e.over?.id !== 'call-zone') return;
    const plan = plans.find((p) => p.id === e.active.id);
    if (!plan || plan.entryStatus !== EntryStatus.IDLE || plan.loadingStatus !== LoadingStatus.WAITING) return;

    // Charger les quais disponibles puis ouvrir le modal
    try {
      const res = await loadingPlansAPI.getQuaisLibres(selectedDate);
      setQuaisData(res.data);
      setSelectedQuai(null);
      setPendingCallPlan(plan);
    } catch { message.error('Impossible de charger les quais'); }
  };

  const handleConfirmQuai = async () => {
    if (!pendingCallPlan || !selectedQuai) return;
    setCallingQuai(true);
    try {
      await loadingPlansAPI.entryAction(pendingCallPlan.id, 'CALL', selectedQuai);
      fetchPlans();
      message.info(`${pendingCallPlan.truck?.matricule} appelé → ${selectedQuai}`);
      setPendingCallPlan(null);
    } catch { message.error('Erreur lors de l\'appel'); }
    finally { setCallingQuai(false); }
  };

  const handleStart = async (planId: string) => {
    try { await loadingPlansAPI.loadingAction(planId, 'START'); fetchPlans(); message.success('Chargement démarré'); }
    catch { message.error('Erreur'); }
  };

  const handlePause = async (planId: string) => {
    try { await loadingPlansAPI.loadingAction(planId, 'PAUSE'); fetchPlans(); message.info('Mis en pause'); }
    catch { message.error('Erreur'); }
  };

  const handleNextStation = (plan: LoadingPlan) => {
    const seq    = plan.stationsSequence || [];
    const curIdx = plan.currentStationIdx ?? 0;
    const isLast = curIdx >= seq.length - 1;
    const next   = !isLast ? seq[curIdx + 1] : null;

    Modal.confirm({
      title: isLast ? 'Confirmer la fin de chargement' : `Passer à la station ${next}`,
      icon: <CheckCircleOutlined style={{ color: next ? stationColor(next) : '#52c41a' }} />,
      content: isLast
        ? `Le chargement du camion ${plan.truck?.matricule} est-il terminé ?`
        : `Le chargement à la station ${plan.currentStation} est terminé. Envoyer le camion à la station ${next} ?`,
      okText: isLast ? 'Oui, terminé' : `→ Station ${next}`,
      cancelText: 'Annuler',
      okButtonProps: { style: { background: next ? stationColor(next) : '#52c41a', borderColor: next ? stationColor(next) : '#52c41a' } },
      onOk: async () => {
        try {
          await loadingPlansAPI.nextStation(plan.id);
          fetchPlans();
          message.success(isLast ? 'Chargement terminé' : `Camion envoyé → Station ${next}`);
        } catch { message.error('Erreur'); }
      },
    });
  };

  // ── Dérivations ─────────────────────────────────────────────────────────────
  const leftPlans = plans.filter(
    (p) => p.entryStatus === EntryStatus.IDLE && p.loadingStatus === LoadingStatus.WAITING,
  );
  const donePlans = plans.filter(
    (p) => p.loadingStatus === LoadingStatus.DONE || p.entryStatus === EntryStatus.EXITED,
  );

  // Stations à afficher (union de toutes les stationsSequence des plans actifs)
  const stations = Array.from(new Set(
    plans
      .filter((p) => p.entryStatus !== EntryStatus.IDLE && p.entryStatus !== EntryStatus.EXITED)
      .flatMap((p) => p.stationsSequence || []),
  ));
  // Fallback si aucune station détectée mais des plans existent
  const displayStations = stations.length > 0 ? stations : ['AMT', 'MCSR', 'PW'];

  const activeCount = plans.filter((p) => p.loadingStatus === LoadingStatus.IN_PROGRESS).length;
  const pausedCount = plans.filter((p) => p.loadingStatus === LoadingStatus.PAUSED).length;
  const calledCount = plans.filter((p) => p.entryStatus === EntryStatus.CALLED).length;

  return (
    <DndContext sensors={sensors} collisionDetection={pointerWithin}
      onDragStart={handleDragStart} onDragEnd={handleDragEnd}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Gestion du Quai</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {activeCount > 0 && <span style={{ color: '#52c41a', fontWeight: 600 }}>{activeCount} en cours · </span>}
            {pausedCount > 0 && <span style={{ color: '#fa8c16', fontWeight: 600 }}>{pausedCount} en pause · </span>}
            {calledCount > 0 && <span style={{ color: '#fa8c16', fontWeight: 600 }}>{calledCount} appelé{calledCount > 1 ? 's' : ''} · </span>}
            <span style={{ color: '#1890ff', fontWeight: 600 }}>{leftPlans.length} en attente</span>
            {donePlans.length > 0 && <span style={{ color: '#8c8c8c' }}> · {donePlans.length} terminé{donePlans.length > 1 ? 's' : ''}</span>}
          </Text>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button icon={<FileTextOutlined />} onClick={() => setReportOpen(true)}>Rapport du jour</Button>
          <DatePicker value={dayjs(selectedDate)}
            onChange={(d) => d && setSelectedDate(d.format('YYYY-MM-DD'))} format="DD/MM/YYYY" />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spin size="large" /></div>
      ) : plans.length === 0 ? (
        <Empty description="Aucun plan de chargement validé pour cette journée" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, alignItems: 'start' }}>

          {/* ── Gauche : file d'appel ── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Badge count={leftPlans.length} color="#1890ff" showZero />
              <Text strong style={{ fontSize: 14 }}>File d'appel</Text>
              <Text type="secondary" style={{ fontSize: 11 }}>glisser ↓</Text>
            </div>
            <div style={{ height: 'calc(100vh - 196px)', overflowY: 'auto', paddingRight: 4 }}>
              {leftPlans.length === 0 && donePlans.length === 0 ? (
                <Empty description="Tous les camions sont en station" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <>
                  {leftPlans.map((p) => <TruckPlanCard key={p.id} plan={p} />)}
                  {donePlans.length > 0 && (
                    <>
                      <Divider style={{ margin: '10px 0' }}>
                        <Text type="secondary" style={{ fontSize: 11 }}>Terminés ({donePlans.length})</Text>
                      </Divider>
                      {donePlans.map((p) => <TruckPlanCard key={p.id} plan={p} />)}
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── Droite : zone d'appel + colonnes stations ── */}
          <div>
            <CallDropZone />

            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${displayStations.length}, 1fr)`,
              gap: 12,
            }}>
              {displayStations.map((code) => (
                <StationColumn
                  key={code}
                  stationCode={code}
                  plans={plans}
                  tick={tick}
                  onStart={handleStart}
                  onPause={handlePause}
                  onResume={handleStart}
                  onNextStation={handleNextStation}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <DragOverlay dropAnimation={null}>
        {activePlan && <TruckPlanCard plan={activePlan} overlay />}
      </DragOverlay>

      <DayReportModal open={reportOpen} date={selectedDate} onClose={() => setReportOpen(false)} />

      {/* ── Modal sélection de quai ── */}
      <Modal
        open={!!pendingCallPlan}
        title={
          <span>
            <TruckOutlined style={{ color: '#1890ff', marginRight: 8 }} />
            Affecter un quai — {pendingCallPlan?.truck?.matricule}
          </span>
        }
        onCancel={() => setPendingCallPlan(null)}
        onOk={handleConfirmQuai}
        okText="Appeler le camion"
        cancelText="Annuler"
        okButtonProps={{ disabled: !selectedQuai, loading: callingQuai }}
        width={540}
      >
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
          Sélectionnez un quai libre. Les quais occupés sont grisés.
        </Text>

        <Radio.Group value={selectedQuai} onChange={(e) => setSelectedQuai(e.target.value)} style={{ width: '100%' }}>
          {/* Quais dédiés groupés par société > filière */}
          {quaisData.societes.map((soc) => (
            <div key={soc.id} style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 6, color: soc.couleur || '#1890ff' }}>
                {soc.nom}
              </div>
              {soc.filieres.map((fil) => (
                <div key={fil.id ?? '__none__'} style={{ marginBottom: 8, paddingLeft: 8 }}>
                  {fil.nom && (
                    <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 4 }}>
                      {fil.code} — {fil.nom}
                    </div>
                  )}
                  <QuaiGrid quais={fil.quais} selectedQuai={selectedQuai} />
                </div>
              ))}
            </div>
          ))}

          {/* Quais génériques */}
          {quaisData.generiques.length > 0 && (
            <div>
              {quaisData.societes.length > 0 && (
                <Divider style={{ margin: '8px 0 10px' }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>Quais génériques</Text>
                </Divider>
              )}
              <QuaiGrid quais={quaisData.generiques} selectedQuai={selectedQuai} />
            </div>
          )}
        </Radio.Group>
      </Modal>
    </DndContext>
  );
};

export default MagasinPage;
