import React, { useState } from 'react';
import { Button, Card, Divider, Switch, Typography, message } from 'antd';
import { CheckOutlined, OrderedListOutlined, SettingOutlined, TruckOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

type BlOrderMode    = 'libre' | 'grouper_filiere';
type BlOrderEnforce = 'avertir' | 'confirmer' | 'bloquer';

function readLS<T>(key: string, fallback: T): T {
  try { return (localStorage.getItem(key) as T) || fallback; } catch { return fallback; }
}

const PlanningParametresPage: React.FC = () => {
  // Valeurs appliquées (ce qui est réellement actif)
  const [appliedMode,    setAppliedMode]    = useState<BlOrderMode>   (() => readLS('tms_bl_order_mode',    'libre'));
  const [appliedEnforce, setAppliedEnforce] = useState<BlOrderEnforce>(() => readLS('tms_bl_order_enforce', 'avertir'));
  const [appliedMultiDest, setAppliedMultiDest] = useState<boolean>(() => readLS('tms_multi_destination', 'true') === 'true');

  // Valeurs en cours d'édition (sélection provisoire)
  const [pendingMode,    setPendingMode]    = useState<BlOrderMode>   (appliedMode);
  const [pendingEnforce, setPendingEnforce] = useState<BlOrderEnforce>(appliedEnforce);
  const [pendingMultiDest, setPendingMultiDest] = useState<boolean>(appliedMultiDest);

  const isDirty =
    pendingMode !== appliedMode ||
    (pendingMode !== 'libre' && pendingEnforce !== appliedEnforce) ||
    pendingMultiDest !== appliedMultiDest;

  const handleApply = () => {
    try {
      localStorage.setItem('tms_bl_order_mode',    pendingMode);
      localStorage.setItem('tms_bl_order_enforce', pendingEnforce);
      localStorage.setItem('tms_multi_destination', String(pendingMultiDest));
    } catch { /* */ }
    setAppliedMode(pendingMode);
    setAppliedEnforce(pendingEnforce);
    setAppliedMultiDest(pendingMultiDest);
    message.success('Paramètres appliqués avec succès');
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: '#e6f7ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid #91d5ff',
        }}>
          <SettingOutlined style={{ fontSize: 20, color: '#1890ff' }} />
        </div>
        <div>
          <Title level={4} style={{ margin: 0 }}>Paramètres</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>Configuration du planning de chargement</Text>
        </div>
      </div>

      <Card
        style={{ borderRadius: 12, border: '1px solid #e8e8e8', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
        bodyStyle={{ padding: 0 }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', background: '#f0f7ff', borderRadius: '12px 12px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <OrderedListOutlined style={{ color: '#1890ff', fontSize: 16 }} />
            <Text strong style={{ fontSize: 14 }}>Ordre des BLs dans un camion</Text>
          </div>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontWeight: 600, fontSize: 12, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: 1 }}>
            Règle de groupement
          </div>

          {([
            { mode: 'libre',           label: 'Libre',                    desc: 'Aucune restriction — BLs de filières différentes peuvent être mélangés et entrelacés librement.' },
            { mode: 'grouper_filiere', label: 'Filières consécutives',    desc: 'Les BLs d\'une même filière doivent se suivre sans interruption. Aucune filière ne peut s\'intercaler entre deux BLs d\'une autre filière.' },
          ] as const).map(({ mode, label, desc }) => {
            const selected = pendingMode === mode;
            const active   = appliedMode === mode;
            return (
              <div
                key={mode}
                onClick={() => setPendingMode(mode)}
                style={{
                  border: `2px solid ${selected ? '#1890ff' : '#e8e8e8'}`,
                  borderRadius: 8, padding: '12px 16px', cursor: 'pointer',
                  background: selected ? '#e6f7ff' : 'white',
                  transition: 'all 0.15s',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, color: selected ? '#1890ff' : '#1a1a1a' }}>{label}</span>
                  {active && (
                    <span style={{
                      fontSize: 10, padding: '1px 7px', borderRadius: 10,
                      background: '#f6ffed', border: '1px solid #b7eb8f',
                      color: '#52c41a', fontWeight: 700,
                    }}>
                      Actif
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 3 }}>{desc}</div>
              </div>
            );
          })}

          {pendingMode !== 'libre' && (
            <>
              <Divider style={{ margin: '4px 0' }} />
              <div style={{ fontWeight: 600, fontSize: 12, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: 1 }}>
                Comportement en cas de mélange
              </div>
              {([
                { enforce: 'avertir',   label: 'Avertir seulement',                desc: 'Un message d\'alerte s\'affiche, mais le chargement se fait quand même.',  color: '#faad14' },
                { enforce: 'confirmer', label: 'Demander confirmation (Oui / Non)', desc: 'Une popup demande l\'autorisation avant de procéder au chargement.',      color: '#1890ff' },
                { enforce: 'bloquer',   label: 'Bloquer — refus automatique',      desc: 'Le chargement est refusé. Aucun mélange autorisé dans ce camion.',         color: '#ff4d4f' },
              ] as const).map(({ enforce, label, desc, color }) => {
                const selected = pendingEnforce === enforce;
                const active   = appliedEnforce === enforce && appliedMode !== 'libre';
                return (
                  <div
                    key={enforce}
                    onClick={() => setPendingEnforce(enforce)}
                    style={{
                      border: `2px solid ${selected ? color : '#e8e8e8'}`,
                      borderRadius: 8, padding: '12px 16px', cursor: 'pointer',
                      background: selected ? color + '12' : 'white',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, color: selected ? color : '#1a1a1a' }}>{label}</span>
                      {active && (
                        <span style={{
                          fontSize: 10, padding: '1px 7px', borderRadius: 10,
                          background: '#f6ffed', border: '1px solid #b7eb8f',
                          color: '#52c41a', fontWeight: 700,
                        }}>
                          Actif
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 3 }}>{desc}</div>
                  </div>
                );
              })}
            </>
          )}

          <Divider style={{ margin: '8px 0' }} />

          {/* Bouton Appliquer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
            {isDirty && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Modifications non appliquées
              </Text>
            )}
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={handleApply}
              disabled={!isDirty}
              style={{
                background: isDirty ? '#1890ff' : undefined,
                borderColor: isDirty ? '#1890ff' : undefined,
              }}
            >
              Appliquer les changements
            </Button>
          </div>
        </div>
      </Card>

      {/* ── Multi-destination ── */}
      <Card
        style={{ borderRadius: 12, border: '1px solid #e8e8e8', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginTop: 16 }}
        bodyStyle={{ padding: 0 }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', background: '#f6ffed', borderRadius: '12px 12px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TruckOutlined style={{ color: '#52c41a', fontSize: 16 }} />
            <Text strong style={{ fontSize: 14 }}>Multi-destination dans un même camion</Text>
          </div>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Text style={{ fontSize: 14 }}>Autoriser plusieurs destinations dans un même camion</Text>
              <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 3 }}>
                {pendingMultiDest
                  ? 'Un même camion peut livrer chez plusieurs clients dans des villes différentes.'
                  : 'Chaque camion est limité à une seule ville de destination par tournée.'}
              </div>
            </div>
            <Switch
              checked={pendingMultiDest}
              onChange={setPendingMultiDest}
              checkedChildren="Oui"
              unCheckedChildren="Non"
              style={{ backgroundColor: pendingMultiDest ? '#52c41a' : undefined }}
            />
          </div>
          <Divider style={{ margin: '16px 0 12px' }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
            {isDirty && (
              <Text type="secondary" style={{ fontSize: 12 }}>Modifications non appliquées</Text>
            )}
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={handleApply}
              disabled={!isDirty}
              style={{ background: isDirty ? '#1890ff' : undefined, borderColor: isDirty ? '#1890ff' : undefined }}
            >
              Appliquer les changements
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PlanningParametresPage;
