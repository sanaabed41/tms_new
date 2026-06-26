import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Input, Select, Space, Spin, Tag, Tooltip, Typography, message } from 'antd';
import {
  ApartmentOutlined, CheckCircleOutlined, ClockCircleOutlined,
  InboxOutlined, PauseCircleOutlined, PlayCircleOutlined,
  ReloadOutlined, RollbackOutlined, SearchOutlined, StopOutlined, TruckOutlined,
} from '@ant-design/icons';
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useDraggable, useDroppable, useSensor, useSensors,
} from '@dnd-kit/core';
import dayjs from 'dayjs';

import { expediteurPortalAPI, loadingPlansAPI } from '../../api';
import { EntryStatus, Filiere, LoadingPlan, LoadingStatus, Quai } from '../../types';

const { Text } = Typography;

const MULTI_TRUCK_KEY = 'logiflow_multi_truck';

// ── Status types & config ──────────────────────────────────────────────────────

type TruckStatusKey = 'disponible' | 'appele' | 'en_cours' | 'pause' | 'termine';
type QuaiStatusKey  = 'libre' | 'occupe' | 'en_cours' | 'bloque';

function getTruckStatus(plan: LoadingPlan): TruckStatusKey {
  if (plan.loadingStatus === LoadingStatus.DONE || plan.entryStatus === EntryStatus.EXITED) return 'termine';
  if (plan.loadingStatus === LoadingStatus.IN_PROGRESS) return 'en_cours';
  if (plan.loadingStatus === LoadingStatus.PAUSED)      return 'pause';
  if (plan.entryStatus   === EntryStatus.ENTERED)       return 'appele';
  return 'disponible';
}

const TRUCK_CFG: Record<TruckStatusKey, { color: string; label: string; bg: string; border: string }> = {
  disponible: { color: '#52c41a', label: 'Disponible',    bg: '#f6ffed', border: '#b7eb8f' },
  appele:     { color: '#722ed1', label: 'Appelé',        bg: '#f9f0ff', border: '#d3adf7' },
  en_cours:   { color: '#fa8c16', label: 'En chargement', bg: '#fff7e6', border: '#ffd591' },
  pause:      { color: '#faad14', label: 'En pause',      bg: '#fffbe6', border: '#ffe58f' },
  termine:    { color: '#8c8c8c', label: 'Terminé',       bg: '#fafafa', border: '#d9d9d9' },
};

function getQuaiOccupants(quai: Quai, plans: LoadingPlan[]): LoadingPlan[] {
  return plans.filter(
    (p) => p.quai === quai.nom
        && p.entryStatus !== EntryStatus.EXITED
        && p.loadingStatus !== LoadingStatus.DONE,
  );
}

function getQuaiStatus(quai: Quai, plans: LoadingPlan[]): QuaiStatusKey {
  if (!quai.isActive) return 'bloque';
  const occupants = getQuaiOccupants(quai, plans);
  if (occupants.length === 0) return 'libre';
  if (occupants.some((p) => p.loadingStatus === LoadingStatus.IN_PROGRESS)) return 'en_cours';
  return 'occupe';
}

const QUAI_CFG: Record<QuaiStatusKey, { color: string; label: string; bg: string; border: string }> = {
  libre:    { color: '#52c41a', label: 'Libre',    bg: '#f6ffed', border: '#b7eb8f' },
  occupe:   { color: '#722ed1', label: 'Appelé',   bg: '#f9f0ff', border: '#d3adf7' },
  en_cours: { color: '#fa8c16', label: 'En cours', bg: '#fff7e6', border: '#ffd591' },
  bloque:   { color: '#ff4d4f', label: 'Bloqué',   bg: '#fff2f0', border: '#ffa39e' },
};

const FILIERE_COLORS = [
  '#1890ff', '#52c41a', '#722ed1', '#fa8c16', '#eb2f96', '#13c2c2',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getPlanFilieres(plan: LoadingPlan): Filiere[] {
  const seen = new Set<string>();
  return (plan.bonsLivraison ?? [])
    .map((bl) => bl.filiere)
    .filter((f): f is Filiere => !!f && !seen.has(f.id) && !!seen.add(f.id));
}

function getPlanFiliereIds(plan: LoadingPlan): string[] {
  return getPlanFilieres(plan).map((f) => f.id);
}

function sumTonnage(plan: LoadingPlan): number {
  return (plan.bonsLivraison ?? []).reduce((s, bl) => s + Number(bl.tonnageTotal ?? 0), 0);
}

function sumPalettes(plan: LoadingPlan): number {
  return (plan.bonsLivraison ?? []).reduce((s, bl) => s + Number(bl.nombrePalettes ?? 0), 0);
}

function isTruckDraggable(plan: LoadingPlan): boolean {
  return (
    plan.loadingStatus === LoadingStatus.WAITING &&
    plan.entryStatus !== EntryStatus.ENTERED &&
    plan.entryStatus !== EntryStatus.EXITED
  );
}

function isQuaiTruckMovable(plan: LoadingPlan): boolean {
  return plan.entryStatus === EntryStatus.ENTERED && plan.loadingStatus === LoadingStatus.WAITING;
}

function isQuaiDroppable(plan: LoadingPlan, quai: Quai, plans: LoadingPlan[], multiTruck: boolean): boolean {
  if (!quai.isActive) return false;
  if (plan.quai === quai.nom && plan.entryStatus === EntryStatus.ENTERED) return false;
  const effectiveCap = multiTruck ? Infinity : 1;
  const occupants = getQuaiOccupants(quai, plans).filter((p) => p.id !== plan.id);
  if (occupants.length >= effectiveCap) return false;
  if (!quai.filiere) return true;
  return getPlanFiliereIds(plan).includes(quai.filiere.id);
}

function fmtElapsed(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}m${String(s).padStart(2, '0')}s`;
  return `${String(m).padStart(2, '0')}m${String(s).padStart(2, '0')}s`;
}

// ── ElapsedTimer ──────────────────────────────────────────────────────────────

const ElapsedTimer: React.FC<{ plan: LoadingPlan; large?: boolean }> = ({ plan, large }) => {
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

  const running = plan.loadingStatus === LoadingStatus.IN_PROGRESS;
  const paused  = plan.loadingStatus === LoadingStatus.PAUSED;
  if (!running && !paused) return null;

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: running ? '#fff7e6' : '#f5f5f5',
      border: `1px solid ${running ? '#ffd591' : '#e0e0e0'}`,
      borderRadius: 20, padding: large ? '6px 14px' : '3px 10px',
      fontSize: large ? 15 : 12, fontWeight: 700, fontFamily: 'monospace',
      color: running ? '#d46b08' : '#888',
    }}>
      <ClockCircleOutlined style={{ fontSize: large ? 13 : 11 }} />
      {fmtElapsed(elapsed)}
      {paused && (
        <span style={{
          fontSize: 9, fontFamily: 'sans-serif', fontWeight: 700,
          background: '#faad14', color: '#fff', borderRadius: 4, padding: '0 4px',
        }}>
          PAUSE
        </span>
      )}
    </div>
  );
};

// ── ActionButtons ──────────────────────────────────────────────────────────────

const ActionButtons: React.FC<{
  plan: LoadingPlan;
  onAction: (planId: string, action: 'START' | 'PAUSE' | 'DONE') => Promise<void>;
}> = ({ plan, onAction }) => {
  const [acting, setActing] = useState<string | null>(null);
  if (plan.entryStatus !== EntryStatus.ENTERED) return null;
  if (plan.loadingStatus === LoadingStatus.DONE) return null;

  const run = async (action: 'START' | 'PAUSE' | 'DONE') => {
    setActing(action);
    try { await onAction(plan.id, action); } finally { setActing(null); }
  };

  return (
    <div style={{
      display: 'flex', gap: 6, paddingTop: 8,
      borderTop: '1px solid #f0f0f0', marginTop: 6,
    }}>
      {plan.loadingStatus === LoadingStatus.WAITING && (
        <Button
          type="primary" size="small" icon={<PlayCircleOutlined />}
          loading={acting === 'START'} onClick={() => run('START')}
          style={{ flex: 1, background: '#52c41a', borderColor: '#52c41a', fontWeight: 600 }}
        >
          Démarrer
        </Button>
      )}
      {plan.loadingStatus === LoadingStatus.IN_PROGRESS && (<>
        <Button size="small" icon={<PauseCircleOutlined />}
          loading={acting === 'PAUSE'} onClick={() => run('PAUSE')}
          style={{ flex: 1, fontWeight: 600 }}>
          Pause
        </Button>
        <Button type="primary" danger size="small" icon={<CheckCircleOutlined />}
          loading={acting === 'DONE'} onClick={() => run('DONE')}
          style={{ flex: 1, fontWeight: 600 }}>
          Terminer
        </Button>
      </>)}
      {plan.loadingStatus === LoadingStatus.PAUSED && (<>
        <Button type="primary" size="small" icon={<PlayCircleOutlined />}
          loading={acting === 'START'} onClick={() => run('START')}
          style={{ flex: 1, background: '#52c41a', borderColor: '#52c41a', fontWeight: 600 }}>
          Reprendre
        </Button>
        <Button type="primary" danger size="small" icon={<CheckCircleOutlined />}
          loading={acting === 'DONE'} onClick={() => run('DONE')}
          style={{ flex: 1, fontWeight: 600 }}>
          Terminer
        </Button>
      </>)}
    </div>
  );
};

// ── TruckCardContent ──────────────────────────────────────────────────────────

interface TruckCardContentProps {
  plan: LoadingPlan;
  compact?: boolean;
  embedded?: boolean;
  onAction?: (planId: string, action: 'START' | 'PAUSE' | 'DONE') => Promise<void>;
  onRemove?: (planId: string) => Promise<void>;
}

const TruckCardContent: React.FC<TruckCardContentProps> = ({ plan, compact, embedded, onAction, onRemove }) => {
  const statusKey    = getTruckStatus(plan);
  const cfg          = TRUCK_CFG[statusKey];
  const filieres     = getPlanFilieres(plan);
  const tonnage      = sumTonnage(plan);
  const palettes     = sumPalettes(plan);
  const isDone       = statusKey === 'termine';
  const transporteur = (plan.truck as any)?.deliveryCompany?.nom;
  const canRemove    = plan.entryStatus === EntryStatus.ENTERED && plan.loadingStatus === LoadingStatus.WAITING;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: embedded ? 7 : 5 }}>

      {/* Matricule + statut */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 7,
            background: cfg.color + '18',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <TruckOutlined style={{ color: cfg.color, fontSize: 14 }} />
          </div>
          <div>
            <Text strong style={{ fontSize: embedded ? 14 : 13, color: isDone ? '#aaa' : '#111', display: 'block', lineHeight: 1.2 }}>
              {plan.truck?.matricule || '-'}
            </Text>
            {plan.truck?.type && (
              <Text style={{ fontSize: 10, color: '#999', lineHeight: 1.1, display: 'block' }}>
                {plan.truck.type}
              </Text>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontSize: 10, padding: '3px 9px', borderRadius: 12, flexShrink: 0,
            background: cfg.color + '18', border: `1px solid ${cfg.color}55`,
            color: cfg.color, fontWeight: 700,
          }}>
            {cfg.label}
          </span>
          {canRemove && onRemove && (
            <Tooltip title="Retirer du quai">
              <Button
                type="text" size="small" icon={<RollbackOutlined />}
                onClick={() => onRemove(plan.id)}
                style={{ color: '#999', padding: '0 4px', height: 22, fontSize: 12 }}
              />
            </Tooltip>
          )}
        </div>
      </div>

      {/* Transporteur */}
      {transporteur && (
        <Text style={{ fontSize: 11, color: '#666', paddingLeft: 37 }}>
          {transporteur}
        </Text>
      )}

      {/* Métriques */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {tonnage > 0 && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            background: '#f5f5f5', border: '1px solid #ebebeb', borderRadius: 6,
            padding: '2px 7px', fontSize: 11, color: '#555', fontWeight: 500,
          }}>
            {tonnage.toFixed(1)} T
          </span>
        )}
        {palettes > 0 && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            background: '#f5f5f5', border: '1px solid #ebebeb', borderRadius: 6,
            padding: '2px 7px', fontSize: 11, color: '#555', fontWeight: 500,
          }}>
            {palettes} pal.
          </span>
        )}
        {plan.heureArrivee && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            background: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: 6,
            padding: '2px 7px', fontSize: 11, color: '#1890ff', fontWeight: 500,
          }}>
            <ClockCircleOutlined style={{ fontSize: 10 }} /> {plan.heureArrivee}
          </span>
        )}
        {!compact && plan.reference && (
          <span style={{ fontSize: 10, color: '#ccc', alignSelf: 'center' }}>#{plan.reference}</span>
        )}
      </div>

      {/* Filières */}
      {filieres.length > 0 && (
        <Space size={4} style={{ flexWrap: 'wrap' }}>
          {filieres.map((f) => (
            <Tag key={f.id} color="geekblue" style={{ fontSize: 10, padding: '0 6px', margin: 0, borderRadius: 4 }}>
              {f.code}
            </Tag>
          ))}
        </Space>
      )}

      {/* Timer */}
      {(plan.loadingStatus === LoadingStatus.IN_PROGRESS || plan.loadingStatus === LoadingStatus.PAUSED) && (
        <ElapsedTimer plan={plan} large={embedded} />
      )}

      {/* Durée finale */}
      {isDone && plan.loadingElapsedSeconds > 0 && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          fontSize: 11, color: '#888',
          background: '#f9f9f9', borderRadius: 6, padding: '3px 9px',
          border: '1px solid #ebebeb',
        }}>
          <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 11 }} />
          Durée: {fmtElapsed(plan.loadingElapsedSeconds)}
        </div>
      )}

      {/* Boutons d'action */}
      {onAction && <ActionButtons plan={plan} onAction={onAction} />}
    </div>
  );
};

// ── DraggableTruckCard (liste gauche) ─────────────────────────────────────────

const DraggableTruckCard: React.FC<{
  plan: LoadingPlan;
  anyDragActive: boolean;
}> = ({ plan, anyDragActive }) => {
  const draggable = isTruckDraggable(plan);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: plan.id,
    disabled: !draggable,
  });
  const statusKey = getTruckStatus(plan);
  const cfg = TRUCK_CFG[statusKey];
  const dimmed = anyDragActive && !isDragging;

  return (
    <div
      ref={setNodeRef}
      {...(draggable ? { ...listeners, ...attributes } : {})}
      style={{
        background: '#fff',
        border: `1px solid ${isDragging ? cfg.color + '60' : '#eee'}`,
        borderLeft: `4px solid ${cfg.color}`,
        borderRadius: 10,
        padding: '11px 13px',
        marginBottom: 8,
        cursor: draggable ? (isDragging ? 'grabbing' : 'grab') : 'default',
        opacity: isDragging ? 0.12 : dimmed ? 0.55 : statusKey === 'termine' ? 0.5 : 1,
        boxShadow: isDragging ? 'none' : '0 1px 5px rgba(0,0,0,0.07)',
        transition: 'opacity 0.15s, box-shadow 0.15s',
        userSelect: 'none',
        outline: 'none',
      }}
    >
      <TruckCardContent plan={plan} />
      {draggable && !isDragging && !anyDragActive && (
        <div style={{
          marginTop: 7, paddingTop: 6, borderTop: '1px dashed #f0f0f0',
          textAlign: 'center', fontSize: 10, color: '#c8c8c8', letterSpacing: 0.3,
        }}>
           Glisser vers un quai libre
        </div>
      )}
    </div>
  );
};

// ── DraggableQuaiTruck (dans un quai, déplaçable vers autre quai) ─────────────

const DraggableQuaiTruck: React.FC<{
  plan: LoadingPlan;
  anyDragActive: boolean;
  onAction: (planId: string, action: 'START' | 'PAUSE' | 'DONE') => Promise<void>;
  onRemove: (planId: string) => Promise<void>;
}> = ({ plan, anyDragActive, onAction, onRemove }) => {
  const movable = isQuaiTruckMovable(plan);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: plan.id,
    disabled: !movable,
  });
  const truckCfg = TRUCK_CFG[getTruckStatus(plan)];
  const dimmed = anyDragActive && !isDragging;

  return (
    <div
      ref={setNodeRef}
      {...(movable ? { ...listeners, ...attributes } : {})}
      style={{
        background: '#fff',
        border: `1px solid ${truckCfg.color}28`,
        borderLeft: `4px solid ${truckCfg.color}`,
        borderRadius: 8, padding: '10px 12px',
        boxShadow: isDragging ? 'none' : '0 1px 4px rgba(0,0,0,0.05)',
        opacity: isDragging ? 0.12 : dimmed ? 0.55 : 1,
        cursor: movable ? (isDragging ? 'grabbing' : 'grab') : 'default',
        transition: 'opacity 0.15s',
        userSelect: 'none', outline: 'none',
      }}
    >
      <TruckCardContent plan={plan} embedded onAction={onAction} onRemove={onRemove} />
      {movable && !isDragging && !anyDragActive && (
        <div style={{
          marginTop: 6, paddingTop: 5, borderTop: '1px dashed #f0f0f0',
          textAlign: 'center', fontSize: 10, color: '#c8c8c8', letterSpacing: 0.3,
        }}>
          Glisser vers un autre quai
        </div>
      )}
    </div>
  );
};

// ── DroppableQuaiCard ─────────────────────────────────────────────────────────

const DroppableQuaiCard: React.FC<{
  quai: Quai;
  plans: LoadingPlan[];
  activePlan: LoadingPlan | null;
  multiTruck: boolean;
  onAction: (planId: string, action: 'START' | 'PAUSE' | 'DONE') => Promise<void>;
  onRemove: (planId: string) => Promise<void>;
  anyDragActive: boolean;
}> = ({ quai, plans, activePlan, multiTruck, onAction, onRemove, anyDragActive }) => {
  const effectiveCap  = multiTruck ? Infinity : 1;
  const occupants     = getQuaiOccupants(quai, plans);
  const hasRoom       = quai.isActive && occupants.length < effectiveCap;
  const qStatus       = getQuaiStatus(quai, plans);
  const qCfg          = QUAI_CFG[qStatus];
  const droppable     = activePlan ? isQuaiDroppable(activePlan, quai, plans, multiTruck) : false;
  const incompatible  = !!activePlan && hasRoom && !droppable && activePlan.quai !== quai.nom;
  const { setNodeRef, isOver } = useDroppable({ id: quai.id, disabled: !droppable });
  const dropping = isOver && droppable;

  return (
    <div
      ref={setNodeRef}
      style={{
        borderRadius: 12,
        border: `2px ${dropping ? 'dashed' : 'solid'} ${
          dropping ? '#1890ff' : incompatible ? '#ffbb9660' : qCfg.border
        }`,
        background: dropping ? '#e6f7ff' : qCfg.bg,
        overflow: 'hidden',
        boxShadow: dropping ? '0 0 0 4px #1890ff18' : '0 2px 8px rgba(0,0,0,0.06)',
        transition: 'all 0.15s',
      }}
    >
      {/* ── Header ── */}
      <div style={{
        padding: '8px 12px',
        background: dropping ? '#bae7ff' : qCfg.color + '12',
        borderBottom: `1px solid ${dropping ? '#69c0ff' : qCfg.border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <InboxOutlined style={{ color: dropping ? '#1890ff' : qCfg.color, fontSize: 13 }} />
          <Text strong style={{ fontSize: 13 }}>{quai.nom}</Text>
          <span style={{
            fontSize: 10, padding: '1px 6px', borderRadius: 8, fontWeight: 700,
            background: occupants.length >= effectiveCap ? qCfg.color + '25' : '#f0f0f0',
            color: occupants.length >= effectiveCap ? qCfg.color : '#888',
          }}>
            {occupants.length}{effectiveCap !== Infinity ? `/${effectiveCap}` : ''}
          </span>
        </div>
        {dropping ? (
          <span style={{ fontSize: 10, color: '#1890ff', fontWeight: 700 }}>DÉPOSER ICI</span>
        ) : (
          <span style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 8, fontWeight: 700,
            background: qCfg.color + '20', color: qCfg.color,
          }}>
            {qCfg.label}
          </span>
        )}
      </div>

      {/* ── Corps ── */}
      <div style={{
        padding: '10px 12px',
        display: 'flex', flexDirection: 'column', gap: 8,
        minHeight: occupants.length === 0 ? 88 : 'auto',
      }}>
        {occupants.map((ap) => (
          <DraggableQuaiTruck
            key={ap.id}
            plan={ap}
            anyDragActive={anyDragActive}
            onAction={onAction}
            onRemove={onRemove}
          />
        ))}

        {!quai.isActive && occupants.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#ff4d4f', padding: '14px 0' }}>
            <StopOutlined style={{ display: 'block', fontSize: 20, margin: '0 auto 5px' }} />
            <span style={{ fontSize: 12 }}>Quai indisponible</span>
          </div>
        ) : hasRoom ? (
          dropping ? (
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              border: '2px dashed #1890ff50', borderRadius: 8,
              padding: '14px 8px', color: '#1890ff', minHeight: 66,
            }}>
              <TruckOutlined style={{ fontSize: 22, marginBottom: 5 }} />
              <Text style={{ fontSize: 11, color: '#1890ff', fontWeight: 600 }}>Assigner le camion</Text>
            </div>
          ) : incompatible ? (
            <div style={{ textAlign: 'center', color: '#fa541c', padding: occupants.length > 0 ? '8px 0' : '14px 0' }}>
              <StopOutlined style={{ display: 'block', fontSize: 16, margin: '0 auto 4px', opacity: 0.5 }} />
              <span style={{ fontSize: 11 }}>Filière incompatible</span>
            </div>
          ) : occupants.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#d0d0d0', padding: '14px 0' }}>
              <InboxOutlined style={{ display: 'block', fontSize: 22, margin: '0 auto 5px' }} />
              <span style={{ fontSize: 12 }}>Glisser un camion ici</span>
            </div>
          ) : (
            <div style={{
              textAlign: 'center', color: '#52c41a80',
              border: '1px dashed #52c41a40', borderRadius: 8, padding: '6px 0',
            }}>
              <TruckOutlined style={{ fontSize: 12 }} />
              <span style={{ fontSize: 11, marginLeft: 5 }}>
                {effectiveCap - occupants.length} place{effectiveCap - occupants.length > 1 ? 's' : ''} libre{effectiveCap - occupants.length > 1 ? 's' : ''}
              </span>
            </div>
          )
        ) : null}
      </div>
    </div>
  );
};

// ── DragOverlayCard ───────────────────────────────────────────────────────────

const DragOverlayCard: React.FC<{ plan: LoadingPlan }> = ({ plan }) => {
  const cfg = TRUCK_CFG[getTruckStatus(plan)];
  return (
    <div style={{
      background: '#fff',
      borderLeft: `4px solid ${cfg.color}`,
      borderRadius: 10, padding: '11px 14px', width: 268,
      boxShadow: '0 14px 40px rgba(0,0,0,0.22)',
      cursor: 'grabbing', transform: 'rotate(1.5deg)',
    }}>
      <TruckCardContent plan={plan} compact />
    </div>
  );
};

// ── Filter pills ──────────────────────────────────────────────────────────────

const FILTER_PILLS = [
  { key: 'all',        label: 'Tous',          color: '#555',    bg: '#f0f0f0', border: '#d9d9d9' },
  { key: 'disponible', label: 'Disponible',    color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  { key: 'appele',     label: 'Appelé',        color: '#722ed1', bg: '#f9f0ff', border: '#d3adf7' },
  { key: 'en_cours',   label: 'En chargement', color: '#fa8c16', bg: '#fff7e6', border: '#ffd591' },
  { key: 'pause',      label: 'En pause',      color: '#faad14', bg: '#fffbe6', border: '#ffe58f' },
  { key: 'termine',    label: 'Terminé',       color: '#8c8c8c', bg: '#fafafa', border: '#d9d9d9' },
] as const;

// ── Main Page ─────────────────────────────────────────────────────────────────

const MagasinierQuaiPage: React.FC = () => {
  const [plans, setPlans]     = useState<LoadingPlan[]>([]);
  const [quais, setQuais]     = useState<Quai[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const [search, setSearch]           = useState('');
  const [truckFilter, setTruckFilter] = useState<TruckStatusKey | 'all'>('all');
  const [quaiSearch, setQuaiSearch]   = useState('');
  const [quaiFilter, setQuaiFilter]   = useState<QuaiStatusKey | 'all'>('all');
  const [activeId, setActiveId]       = useState<string | null>(null);
  const [busy, setBusy]               = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const multiTruck = localStorage.getItem(MULTI_TRUCK_KEY) === 'true';

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const today = dayjs().format('YYYY-MM-DD');

  const fetchData = useCallback(async () => {
    try {
      const [pr, qr] = await Promise.all([
        expediteurPortalAPI.getMyPlanning(today),
        expediteurPortalAPI.getMyQuais(),
      ]);
      setPlans(pr.data);
      setQuais(qr.data);
      setLastRefresh(new Date());
      setError(null);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchData]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragStart = useCallback((e: DragStartEvent) => setActiveId(e.active.id as string), []);

  const handleDragEnd = useCallback(async (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const quai = quais.find((q) => q.id === over.id);
    if (!quai) return;
    const plan = plans.find((p) => p.id === active.id);
    if (!plan) return;
    if (plan.quai === quai.nom && plan.entryStatus === EntryStatus.ENTERED) return;
    setBusy(true);
    try {
      await loadingPlansAPI.entryAction(active.id as string, 'ENTER', quai.nom);
      message.success(`Camion assigné au quai ${quai.nom}`);
      await fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? "Erreur lors de l'assignation");
    } finally {
      setBusy(false);
    }
  }, [quais, plans, fetchData]);

  const handleLoadingAction = useCallback(async (planId: string, action: 'START' | 'PAUSE' | 'DONE') => {
    await loadingPlansAPI.loadingAction(planId, action);
    message.success({ START: 'Chargement démarré', PAUSE: 'Mis en pause', DONE: 'Chargement terminé' }[action]);
    await fetchData();
  }, [fetchData]);

  const handleUnenter = useCallback(async (planId: string) => {
    setBusy(true);
    try {
      await loadingPlansAPI.entryAction(planId, 'UNENTER');
      message.success('Camion retiré du quai');
      await fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? 'Erreur lors du retrait');
    } finally {
      setBusy(false);
    }
  }, [fetchData]);

  const activePlan = activeId ? (plans.find((p) => p.id === activeId) ?? null) : null;

  const SORT_ORDER: Record<TruckStatusKey, number> = { en_cours: 0, pause: 1, appele: 2, disponible: 3, termine: 4 };

  const filteredPlans = useMemo(() => {
    const q = search.toLowerCase();
    return plans
      .filter((p) => {
        if (p.entryStatus === EntryStatus.ENTERED) return false;
        if (truckFilter !== 'all' && getTruckStatus(p) !== truckFilter) return false;
        if (!q) return true;
        return (
          p.truck?.matricule?.toLowerCase().includes(q) ||
          (p.truck as any)?.deliveryCompany?.nom?.toLowerCase().includes(q) ||
          p.reference?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => SORT_ORDER[getTruckStatus(a)] - SORT_ORDER[getTruckStatus(b)]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plans, search, truckFilter]);

  interface FiliereGroup {
    filiereId: string; filiereNom: string; filiereCode: string;
    quais: Quai[]; color: string;
  }

  const quaiGroups = useMemo<FiliereGroup[]>(() => {
    const map: Record<string, FiliereGroup> = {};
    let idx = 0;
    for (const q of quais) {
      const key = q.filiere?.id ?? '__none__';
      if (!map[key]) {
        map[key] = {
          filiereId:   q.filiere?.id   ?? '',
          filiereNom:  q.filiere?.nom  ?? 'Général',
          filiereCode: q.filiere?.code ?? '',
          quais: [],
          color: FILIERE_COLORS[idx++ % FILIERE_COLORS.length],
        };
      }
      const st = getQuaiStatus(q, plans);
      const ms = !quaiSearch || q.nom.toLowerCase().includes(quaiSearch.toLowerCase());
      const mf = quaiFilter === 'all' || st === quaiFilter;
      if (ms && mf) map[key].quais.push(q);
    }
    return Object.values(map).filter((g) => g.quais.length > 0);
  }, [quais, plans, quaiSearch, quaiFilter]);

  const stats = useMemo(() => {
    const s = (k: TruckStatusKey) => plans.filter((p) => getTruckStatus(p) === k).length;
    return {
      total:       plans.length,
      disponible:  s('disponible'),
      appele:      s('appele'),
      en_cours:    s('en_cours') + s('pause'),
      termine:     s('termine'),
      quaisLibres: quais.filter((q) => getQuaiStatus(q, plans) === 'libre').length,
      quaisTotal:  quais.length,
    };
  }, [plans, quais]);

  if (error) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#ff4d4f', marginBottom: 8 }}>Erreur de chargement</div>
      <div style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>{error}</div>
      <Button type="primary" onClick={fetchData}>Réessayer</Button>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 110px)', gap: 10 }}>

        {/* ── Header + Stats ── */}
        <div style={{
          flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10,
          background: '#fff', borderRadius: 12, padding: '10px 16px',
          border: '1px solid #e8e8e8', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 8 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: '#f6ffed', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <InboxOutlined style={{ fontSize: 19, color: '#52c41a' }} />
            </div>
            <div>
              <Text strong style={{ fontSize: 15, display: 'block', lineHeight: 1.2 }}>Gestion des Quais</Text>
              <Text style={{ fontSize: 11, color: '#999' }}>{dayjs().format('dddd D MMMM YYYY')}</Text>
            </div>
          </div>

          <div style={{ width: 1, height: 36, background: '#f0f0f0', flexShrink: 0 }} />

          {[
            { label: 'Total',       count: stats.total,      color: '#1890ff' },
            { label: 'Disponibles', count: stats.disponible, color: '#52c41a' },
            { label: 'Appelés',     count: stats.appele,     color: '#722ed1' },
            { label: 'En cours',    count: stats.en_cours,   color: '#fa8c16' },
            { label: 'Terminés',    count: stats.termine,    color: '#8c8c8c' },
          ].map(({ label, count, color }) => (
            <div key={label} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '4px 14px', borderRadius: 8,
              background: color + '0d', border: `1px solid ${color}25`,
              minWidth: 58,
            }}>
              <Text strong style={{ fontSize: 17, color, lineHeight: 1.1 }}>{count}</Text>
              <Text style={{ fontSize: 10, color: '#999', whiteSpace: 'nowrap' }}>{label}</Text>
            </div>
          ))}

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              padding: '5px 14px', borderRadius: 8,
              background: '#f6ffed', border: '1px solid #b7eb8f',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <InboxOutlined style={{ color: '#52c41a', fontSize: 13 }} />
              <Text style={{ fontSize: 12 }}>
                <Text strong style={{ color: '#52c41a', fontSize: 14 }}>{stats.quaisLibres}</Text>
                <Text style={{ color: '#888', fontSize: 11 }}> / {stats.quaisTotal} libres</Text>
              </Text>
            </div>
            {busy && <Spin size="small" />}
            <Tooltip title={`Mis à jour : ${dayjs(lastRefresh).format('HH:mm:ss')} (auto 30s)`}>
              <Button icon={<ReloadOutlined />} type="text" size="small"
                style={{ color: '#bbb' }} onClick={fetchData} />
            </Tooltip>
          </div>
        </div>

        {/* ── Deux colonnes ── */}
        <div style={{ display: 'flex', gap: 10, flex: 1, minHeight: 0 }}>

          {/* ╔═ Colonne gauche — Camions ════════════════════════════════════════ */}
          <div style={{
            width: 292, flexShrink: 0, display: 'flex', flexDirection: 'column',
            background: '#fff', borderRadius: 12, border: '1px solid #e8e8e8',
            overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}>
            <div style={{
              padding: '11px 14px', borderBottom: '1px solid #f0f0f0',
              background: 'linear-gradient(135deg, #f6ffed 0%, #fff 100%)',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <TruckOutlined style={{ color: '#52c41a', fontSize: 15 }} />
                  <Text strong style={{ fontSize: 13 }}>Camions du jour</Text>
                </div>
                <span style={{
                  fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 12,
                  background: '#52c41a', color: '#fff',
                }}>
                  {plans.length}
                </span>
              </div>

              <Input
                prefix={<SearchOutlined style={{ color: '#bbb' }} />}
                placeholder="Matricule, transporteur..."
                value={search} onChange={(e) => setSearch(e.target.value)}
                size="small" allowClear style={{ marginBottom: 8 }}
              />

              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {FILTER_PILLS.map(({ key, label, color, bg, border }) => {
                  const count = key === 'all'
                    ? plans.length
                    : plans.filter((p) => getTruckStatus(p) === key as TruckStatusKey).length;
                  const active = truckFilter === key;
                  return (
                    <button key={key}
                      onClick={() => setTruckFilter(key as TruckStatusKey | 'all')}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '3px 8px', borderRadius: 12, cursor: 'pointer', outline: 'none',
                        border: `1px solid ${active ? color : border}`,
                        background: active ? color : bg,
                        color: active ? '#fff' : color,
                        fontSize: 10, fontWeight: active ? 700 : 500,
                        transition: 'all 0.15s',
                      }}
                    >
                      {label}
                      <span style={{
                        background: active ? 'rgba(255,255,255,0.3)' : color + '22',
                        color: active ? '#fff' : color,
                        borderRadius: 8, padding: '0 4px', fontSize: 9, fontWeight: 700, lineHeight: '14px',
                      }}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', paddingTop: 60 }}><Spin /></div>
              ) : filteredPlans.length === 0 ? (
                <div style={{ textAlign: 'center', paddingTop: 60, color: '#ccc' }}>
                  <TruckOutlined style={{ fontSize: 38, display: 'block', margin: '0 auto 10px', color: '#e0e0e0' }} />
                  <div style={{ fontSize: 13, color: '#bbb' }}>Aucun camion prévu</div>
                  {truckFilter !== 'all' && (
                    <div style={{ fontSize: 11, color: '#ccc', marginTop: 4 }}>pour ce filtre</div>
                  )}
                </div>
              ) : (
                filteredPlans.map((plan) => (
                  <DraggableTruckCard key={plan.id} plan={plan} anyDragActive={!!activeId} />
                ))
              )}
            </div>
          </div>

          {/* ╔═ Colonne droite — Quais ══════════════════════════════════════════ */}
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            background: '#fff', borderRadius: 12, border: '1px solid #e8e8e8',
            overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}>
            <div style={{
              padding: '11px 16px', borderBottom: '1px solid #f0f0f0',
              background: 'linear-gradient(135deg, #f6ffed 0%, #fff 100%)',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1 }}>
                  <InboxOutlined style={{ color: '#52c41a', fontSize: 15 }} />
                  <Text strong style={{ fontSize: 13 }}>Quais de chargement</Text>
                  <span style={{
                    fontSize: 10, padding: '1px 8px', borderRadius: 10,
                    background: '#f0f0f0', color: '#777', fontWeight: 600,
                  }}>
                    {quais.length}
                  </span>
                </div>
                <Input
                  prefix={<SearchOutlined style={{ color: '#bbb' }} />}
                  placeholder="Rechercher un quai..."
                  value={quaiSearch} onChange={(e) => setQuaiSearch(e.target.value)}
                  size="small" allowClear style={{ width: 190 }}
                />
                <Select
                  size="small" value={quaiFilter} onChange={setQuaiFilter}
                  style={{ width: 165 }}
                  options={[
                    { label: 'Tous les statuts', value: 'all'      },
                    { label: 'Libre',            value: 'libre'    },
                    { label: 'Appelé',           value: 'occupe'   },
                    { label: 'En cours',         value: 'en_cours' },
                    { label: 'Bloqué',           value: 'bloque'   },
                  ]}
                />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>
              {quais.length === 0 ? (
                <div style={{ textAlign: 'center', paddingTop: 80, color: '#bbb' }}>
                  <InboxOutlined style={{ fontSize: 46, display: 'block', margin: '0 auto 14px', color: '#e0e0e0' }} />
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#bbb' }}>Aucun quai configuré</div>
                  <div style={{ fontSize: 12, marginTop: 6, color: '#d0d0d0' }}>
                    Contactez votre administrateur expéditeur.
                  </div>
                </div>
              ) : quaiGroups.length === 0 ? (
                <div style={{ textAlign: 'center', paddingTop: 80, color: '#bbb' }}>
                  <SearchOutlined style={{ fontSize: 38, display: 'block', margin: '0 auto 10px', color: '#e0e0e0' }} />
                  <div style={{ fontSize: 13 }}>Aucun quai ne correspond aux filtres</div>
                </div>
              ) : (
                quaiGroups.map((group) => {
                  const freeCount = group.quais.filter((q) => getQuaiStatus(q, plans) === 'libre').length;
                  return (
                    <div key={group.filiereId} style={{ marginBottom: 28 }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
                        padding: '8px 14px',
                        background: group.color + '0e',
                        border: `1px solid ${group.color}28`,
                        borderLeft: `4px solid ${group.color}`,
                        borderRadius: 8,
                      }}>
                        <ApartmentOutlined style={{ color: group.color, fontSize: 15 }} />
                        <Text strong style={{ fontSize: 14, color: '#111' }}>{group.filiereNom}</Text>
                        {group.filiereCode && (
                          <Tag style={{
                            fontSize: 10, margin: 0, padding: '0 7px', borderRadius: 5,
                            background: group.color + '15', border: `1px solid ${group.color}40`,
                            color: group.color,
                          }}>
                            {group.filiereCode}
                          </Tag>
                        )}
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
                          <Text style={{ fontSize: 11, color: '#52c41a', fontWeight: 600 }}>
                            {freeCount} libre{freeCount !== 1 ? 's' : ''}
                          </Text>
                          <Text style={{ fontSize: 11, color: '#aaa' }}>
                            / {group.quais.length} quai{group.quais.length !== 1 ? 's' : ''}
                          </Text>
                        </div>
                      </div>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(262px, 1fr))',
                        gap: 10,
                      }}>
                        {group.quais.map((quai) => (
                          <DroppableQuaiCard
                            key={quai.id}
                            quai={quai}
                            plans={plans}
                            activePlan={activePlan}
                            multiTruck={multiTruck}
                            onAction={handleLoadingAction}
                            onRemove={handleUnenter}
                            anyDragActive={!!activeId}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 120, easing: 'ease' }}>
        {activePlan ? <DragOverlayCard plan={activePlan} /> : null}
      </DragOverlay>
    </DndContext>
  );
};

export default MagasinierQuaiPage;
