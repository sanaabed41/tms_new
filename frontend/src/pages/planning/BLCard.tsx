import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Tag, Typography, Button, Tooltip } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { BonLivraison, TypeChargement } from '../../types';

const { Text } = Typography;

const DESTINATION_COLORS: Record<string, string> = {
  Tunis: '#1890ff', Ariana: '#096dd9', Manouba: '#0050b3', 'Ben Arous': '#003a8c',
  Nabeul: '#52c41a', Sousse: '#389e0d', Monastir: '#237804', Mahdia: '#135200',
  Sfax: '#fa8c16', Gabès: '#d46b08', Médenine: '#ad4e00', Tataouine: '#873800',
  Kairouan: '#722ed1', Kasserine: '#531dab', 'Sidi Bouzid': '#391085',
  Bizerte: '#13c2c2', Béja: '#08979c', Jendouba: '#006d75',
  'Le Kef': '#eb2f96', Siliana: '#c41d7f', Zaghouan: '#9e1068',
  Gafsa: '#f5222d', Tozeur: '#cf1322', Kébili: '#a8071a',
};

export const getDestinationColor = (dest: string): string =>
  DESTINATION_COLORS[dest] || '#8c8c8c';

const TYPE_ICONS: Record<TypeChargement, string> = {
  [TypeChargement.VRAC]:    '📦',
  [TypeChargement.PALETTE]: '🪵',
  [TypeChargement.FRIGO]:   '❄️',
  [TypeChargement.CITERNE]: '🛢️',
};

// ── Pure display — no drag hooks ──────────────────────────────────────────────
interface ContentProps {
  bl: BonLivraison;
  isDragging?: boolean;
  showRemove?: boolean;
  onRemove?: () => void;
}

export const BLCardContent: React.FC<ContentProps> = ({ bl, isDragging, showRemove, onRemove }) => {
  const destColor = getDestinationColor(bl.destination);
  const expColor  = bl.societeExpeditrice?.couleur || '#8c8c8c';

  return (
    <div style={{
      borderRadius: 6,
      background: 'white',
      userSelect: 'none',
      border: `1px solid ${isDragging ? destColor : '#ebebeb'}`,
      borderLeft: `3px solid ${destColor}`,
      boxShadow: isDragging
        ? `0 8px 24px rgba(0,0,0,0.18), 0 0 0 2px ${destColor}30`
        : '0 1px 3px rgba(0,0,0,0.05)',
      transition: 'box-shadow 0.15s',
    }}>
      <div style={{ padding: '6px 8px 5px' }}>
        {/* Ligne 1 : N° BL · ordre · type · destination · tonnage · [x] */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
          {bl.ordreChargement != null && (
            <span style={{
              fontSize: 9, fontWeight: 800, color: 'white',
              background: '#1890ff', borderRadius: '50%',
              width: 16, height: 16, display: 'inline-flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {bl.ordreChargement}
            </span>
          )}
          <Text strong style={{ fontSize: 11.5, letterSpacing: '-0.2px', flexShrink: 0, color: '#1a1a1a' }}>
            {bl.numeroBl}
          </Text>
          <span style={{ fontSize: 12, flexShrink: 0 }} title={bl.typeChargement}>
            {TYPE_ICONS[bl.typeChargement] || '📦'}
          </span>
          <Tag
            color={destColor}
            style={{ fontSize: 10, margin: 0, padding: '0 5px', lineHeight: '16px', fontWeight: 700, flexShrink: 0 }}
          >
            {bl.destination || '—'}
          </Tag>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
            <span style={{
              fontSize: 10, fontWeight: 600, color: '#1890ff',
              background: '#e6f7ff', borderRadius: 4, padding: '0 5px', lineHeight: '18px',
            }}>
              {bl.tonnageTotal} T
            </span>
            {bl.nombrePalettes > 0 && (
              <span style={{
                fontSize: 10, fontWeight: 600, color: '#722ed1',
                background: '#f9f0ff', borderRadius: 4, padding: '0 5px', lineHeight: '18px',
              }}>
                {bl.nombrePalettes} p
              </span>
            )}
            {showRemove && onRemove && (
              <Tooltip title="Retirer du camion">
                <Button
                  size="small" type="text" danger icon={<CloseOutlined />}
                  onClick={(e) => { e.stopPropagation(); onRemove(); }}
                  style={{ padding: 0, width: 16, height: 16, minWidth: 0, fontSize: 10 }}
                />
              </Tooltip>
            )}
          </div>
        </div>

        {/* Ligne 2 : client + filière/expéditeur */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Text
            type="secondary"
            style={{ fontSize: 10, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {bl.clientNom}
          </Text>
          {bl.societeExpeditrice && (
            <Tag style={{
              fontSize: 9, margin: 0, padding: '0 5px', flexShrink: 0,
              background: expColor + '20', color: expColor, borderColor: expColor + '50',
              fontWeight: 600, lineHeight: '16px',
              maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {bl.societeExpeditrice.nom}
              {bl.filiere && <span style={{ fontWeight: 400, opacity: 0.75 }}> · {bl.filiere.nom}</span>}
            </Tag>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Draggable wrapper (zone des BLs disponibles) ───────────────────────────────
interface Props {
  bl: BonLivraison;
  isDragging?: boolean;
  showRemove?: boolean;
  onRemove?: () => void;
  disableDrag?: boolean; // conservé pour compatibilité API, ignoré ici
}

const BLCard: React.FC<Props> = ({ bl, isDragging, showRemove, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging: dragging } = useDraggable({ id: bl.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: dragging && !isDragging ? 0.25 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        marginBottom: 4,
        zIndex: isDragging ? 9999 : undefined,
      }}
      {...listeners}
      {...attributes}
    >
      <BLCardContent bl={bl} isDragging={isDragging} showRemove={showRemove} onRemove={onRemove} />
    </div>
  );
};

export default BLCard;
