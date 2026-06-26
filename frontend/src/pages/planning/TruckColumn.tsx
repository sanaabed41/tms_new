import React, { useState, useEffect, useRef } from 'react';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { Progress, Tag, Button, Tooltip, Typography, DatePicker } from 'antd';
import {
  TruckOutlined, EyeOutlined, InboxOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { BonLivraison, LoadingPlan, Truck } from '../../types';
import { BLCardContent } from './BLCard';

// ── Sortable BL card (registers in the parent DndContext via useSortable) ─────
const SortableBLCard: React.FC<{ bl: BonLivraison; onRemove: () => void }> = ({ bl, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: bl.id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        marginBottom: 4,
      }}
      {...listeners}
      {...attributes}
    >
      <BLCardContent bl={bl} showRemove onRemove={onRemove} isDragging={isDragging} />
    </div>
  );
};

const { Text } = Typography;

interface Props {
  truck: Truck;
  plan?: LoadingPlan;
  onRemoveBl: (blId: string) => void;
  onView: () => void;
  onSetTime?: (time: string | null) => void;
}

const TruckColumn: React.FC<Props> = ({ truck, plan, onRemoveBl, onView, onSetTime }) => {
  const { setNodeRef, isOver } = useDroppable({ id: `truck-${truck.id}` });

  // Local optimistic order — synced from plan prop
  const rawBls = plan?.bonsLivraison || [];
  const sorted = [...rawBls].sort((a, b) => ((a as any).ordreChargement ?? 0) - ((b as any).ordreChargement ?? 0));
  const [bls, setBls] = useState<typeof sorted>(sorted);

  const prevPlanRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const key = (plan?.id ?? '') + sorted.map(b => b.id).join(',');
    if (prevPlanRef.current !== key) {
      prevPlanRef.current = key;
      setBls(sorted);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

  const tonnageCharge    = plan ? Number(plan.tonnageCharge)    : 0;
  const palettesChargees = plan ? Number(plan.palettesChargees) : 0;

  const tonnagePct  = Math.min(100, truck.capaciteTonnage > 0
    ? Math.round((tonnageCharge / truck.capaciteTonnage) * 100) : 0);
  const palettePct  = truck.capacitePalettes > 0
    ? Math.min(100, Math.round((palettesChargees / truck.capacitePalettes) * 100)) : 0;

  const tonnageColor = tonnagePct >= 100 ? '#ff4d4f' : tonnagePct >= 85 ? '#fa8c16' : '#52c41a';
  const isValidated  = plan?.isValidated;
  const hasLoad      = bls.length > 0;

  const cardBorder = isOver
    ? '2px solid #1890ff'
    : isValidated ? '1px solid #b7eb8f'
    : hasLoad     ? '1px solid #d0d7de'
    :                '1px dashed #d0d7de';
  const cardBg = isOver ? '#f0f8ff' : isValidated ? '#f6ffed' : 'white';

  // Parse heureArrivee (may be 'YYYY-MM-DD HH:mm' or legacy 'HH:mm')
  const rdvValue = (() => {
    if (!plan?.heureArrivee) return null;
    const full = dayjs(plan.heureArrivee, 'YYYY-MM-DD HH:mm');
    if (full.isValid()) return full;
    return null;
  })();

  return (
    <div ref={setNodeRef} style={{ height: '100%' }}>
      <div style={{
        borderRadius: 10, border: cardBorder, background: cardBg,
        boxShadow: isOver ? '0 0 0 3px rgba(24,144,255,0.12)' : '0 2px 8px rgba(0,0,0,0.06)',
        transition: 'all 0.15s', overflow: 'hidden', display: 'flex', flexDirection: 'column',
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: '8px 10px',
          background: isValidated ? '#f6ffed' : hasLoad ? '#f8fbff' : '#fafafa',
          borderBottom: '1px solid #f0f0f0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 7,
              background: isValidated ? '#f6ffed' : '#e6f4ff',
              border: `1px solid ${isValidated ? '#b7eb8f' : '#bae0ff'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <TruckOutlined style={{ fontSize: 15, color: isValidated ? '#52c41a' : '#1890ff' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Text strong style={{ fontSize: 13, lineHeight: 1.2 }}>{truck.matricule}</Text>
              </div>
              <Text type="secondary" style={{ fontSize: 10 }}>
                {truck.type || 'Standard'} · {truck.capaciteTonnage} T
                {truck.capacitePalettes > 0 ? ` · ${truck.capacitePalettes} pal` : ''}
              </Text>
            </div>
            <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
              {hasLoad && (
                <Tooltip title="Voir le détail">
                  <Button size="small" icon={<EyeOutlined />} onClick={onView} />
                </Tooltip>
              )}
            </div>
          </div>

          {/* Barres de capacité */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <Text style={{ fontSize: 10, color: '#8c8c8c' }}>Tonnage</Text>
              <Text style={{ fontSize: 10 }}>
                <b style={{ color: tonnageColor }}>{tonnageCharge}</b>
                <span style={{ color: '#bfbfbf' }}> / {truck.capaciteTonnage} T  </span>
                <b style={{ color: tonnageColor }}>{tonnagePct}%</b>
              </Text>
            </div>
            <Progress
              percent={tonnagePct} strokeColor={tonnageColor} size="small" showInfo={false}
              style={{ marginBottom: truck.capacitePalettes > 0 ? 4 : 0 }}
            />
            {truck.capacitePalettes > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <Text style={{ fontSize: 10, color: '#8c8c8c' }}>Palettes</Text>
                  <Text style={{ fontSize: 10 }}>
                    <b style={{ color: palettePct > 90 ? '#ff4d4f' : '#722ed1' }}>{palettesChargees}</b>
                    <span style={{ color: '#bfbfbf' }}> / {truck.capacitePalettes}</span>
                  </Text>
                </div>
                <Progress
                  percent={palettePct} strokeColor={palettePct > 90 ? '#ff4d4f' : '#722ed1'}
                  size="small" showInfo={false}
                />
              </>
            )}
          </div>

          {(hasLoad || plan) && (
            <div style={{ display: 'flex', gap: 4, marginTop: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <Tag style={{ fontSize: 9, margin: 0, padding: '0 5px' }}>
                {bls.length} BL{bls.length > 1 ? 's' : ''}
              </Tag>
              {onSetTime && (
                <Tooltip title={plan?.heureArrivee ? `RDV : ${plan.heureArrivee}` : 'Définir RDV (date + heure)'}>
                  <div onClick={(e) => e.stopPropagation()}>
                    <DatePicker
                      showTime={{ format: 'HH:mm' }}
                      value={rdvValue}
                      format="DD/MM/YY HH:mm"
                      size="small"
                      suffixIcon={<ClockCircleOutlined style={{ fontSize: 10, color: rdvValue ? '#fa8c16' : '#bfbfbf' }} />}
                      placeholder="RDV"
                      style={{ width: 130, fontSize: 10 }}
                      allowClear
                      onChange={(d) => onSetTime(d ? d.format('YYYY-MM-DD HH:mm') : null)}
                    />
                  </div>
                </Tooltip>
              )}
            </div>
          )}
        </div>

        {/* ── Drop zone ── */}
        <div style={{
          flex: 1, padding: '6px 8px', minHeight: 100,
          background: isOver ? 'rgba(24,144,255,0.03)' : 'transparent',
          transition: 'background 0.15s',
        }}>
          {bls.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              height: 72, color: isOver ? '#1890ff' : '#bfbfbf', fontSize: 11, gap: 4,
              border: `1.5px dashed ${isOver ? '#1890ff' : '#e0e0e0'}`,
              borderRadius: 6, transition: 'all 0.15s',
              background: isOver ? '#f0f8ff' : '#fafafa',
            }}>
              <InboxOutlined style={{ fontSize: 18, opacity: 0.6 }} />
              <span>Glisser un BL ici</span>
            </div>
          ) : (
            <SortableContext items={bls.map(b => b.id)} strategy={verticalListSortingStrategy}>
              {bls.map(bl => (
                <SortableBLCard key={bl.id} bl={bl} onRemove={() => onRemoveBl(bl.id)} />
              ))}
            </SortableContext>
          )}
        </div>
      </div>
    </div>
  );
};

export default TruckColumn;
