import React from 'react';
import { Drawer, Tag, Table, Divider, Typography, Empty } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { BonLivraison, BlStatus, TypeChargement } from '../../types';
import { getDestinationColor } from '../planning/BLCard';

const { Text } = Typography;

const STATUS_CONFIG: Record<BlStatus, { color: string; label: string }> = {
  [BlStatus.DRAFT]:     { color: 'default', label: 'Brouillon' },
  [BlStatus.VALIDATED]: { color: 'blue',    label: 'Validé' },
  [BlStatus.LOADED]:    { color: 'orange',  label: 'En transit' },
  [BlStatus.DELIVERED]: { color: 'green',   label: 'Livré' },
};

const TYPE_CONFIG: Record<TypeChargement, { color: string; label: string; icon: string }> = {
  [TypeChargement.VRAC]:    { color: 'default',  label: 'Vrac',         icon: '📦' },
  [TypeChargement.PALETTE]: { color: 'purple',   label: 'Palette',      icon: '🪵' },
  [TypeChargement.FRIGO]:   { color: 'cyan',     label: 'Frigorifique', icon: '❄️' },
  [TypeChargement.CITERNE]: { color: 'geekblue', label: 'Citerne',      icon: '🛢️' },
};

interface Props {
  bl: BonLivraison | null;
  onClose: () => void;
}

const Row2: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    <Text type="secondary" style={{ fontSize: 11 }}>{label}</Text>
    <div style={{ fontSize: 13 }}>{children}</div>
  </div>
);

const BlDetailDrawer: React.FC<Props> = ({ bl, onClose }) => {
  if (!bl) return null;

  const statusCfg = STATUS_CONFIG[bl.statut];
  const typeCfg = TYPE_CONFIG[bl.typeChargement] || TYPE_CONFIG[TypeChargement.VRAC];
  const destColor = getDestinationColor(bl.destination);
  const expColor = bl.societeExpeditrice?.couleur || '#1890ff';

  const articleColumns = [
    { title: 'Code',       dataIndex: ['article', 'code'],    key: 'code',    width: 100 },
    { title: 'Désignation',dataIndex: ['article', 'libelle'], key: 'libelle' },
    { title: 'Unité',      dataIndex: ['article', 'unite'],   key: 'unite',   width: 65 },
    {
      title: 'Qté', dataIndex: 'quantite', key: 'quantite', width: 70,
      render: (v: number) => <Text strong>{v}</Text>,
    },
    {
      title: 'Poids (kg)', dataIndex: 'poidsTotal', key: 'poids', width: 105,
      render: (v: number) => `${Number(v).toFixed(2)} kg`,
    },
  ];

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Text strong style={{ fontSize: 15, fontFamily: 'monospace' }}>{bl.numeroBl}</Text>
          <Tag color={statusCfg.color === 'default' ? undefined : statusCfg.color}>{statusCfg.label}</Tag>
          <Tag color={typeCfg.color === 'default' ? undefined : typeCfg.color}>{typeCfg.icon} {typeCfg.label}</Tag>
          {bl.societeExpeditrice && (
            <Tag style={{
              background: expColor + '18', color: expColor, borderColor: expColor + '55', fontWeight: 600,
            }}>
              {bl.societeExpeditrice.nom}
              {bl.filiere ? <span style={{ fontWeight: 400, opacity: 0.8 }}> · {bl.filiere.nom}</span> : ''}
            </Tag>
          )}
        </div>
      }
      open={!!bl}
      onClose={onClose}
      width={640}
    >
      {/* ── Route compacte ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: '#fafafa', borderRadius: 8, padding: '10px 14px', marginBottom: 14,
        border: '1px solid #f0f0f0',
      }}>
        <div style={{ textAlign: 'center', minWidth: 90 }}>
          <Text type="secondary" style={{ fontSize: 10, display: 'block' }}>Origine</Text>
          <Text strong style={{ fontSize: 13 }}>{bl.origine || '—'}</Text>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ flex: 1, height: 2, background: `linear-gradient(to right, #52c41a, ${destColor})`, borderRadius: 2 }} />
          <ArrowRightOutlined style={{ color: '#999', fontSize: 14 }} />
        </div>
        <div style={{ textAlign: 'center', minWidth: 90 }}>
          <Text type="secondary" style={{ fontSize: 10, display: 'block' }}>Destination</Text>
          <Text strong style={{ fontSize: 13, color: destColor }}>{bl.destination || '—'}</Text>
        </div>
      </div>

      {/* ── Infos client + chargement ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px',
        background: '#fafafa', borderRadius: 8, padding: '12px 14px', marginBottom: 14,
        border: '1px solid #f0f0f0',
      }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <Text type="secondary" style={{ fontSize: 11 }}>Client</Text>
          <div>
            <Text strong style={{ fontSize: 13 }}>{bl.clientNom}</Text>
            {bl.clientAdresse && (
              <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>📍 {bl.clientAdresse}</Text>
            )}
          </div>
        </div>

        {bl.societeExpeditrice && (
          <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
            <span style={{
              width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
              background: expColor, display: 'inline-block',
            }} />
            <Text strong style={{ color: expColor, fontSize: 13 }}>{bl.societeExpeditrice.nom}</Text>
            {bl.filiere && (
              <>
                <Text type="secondary" style={{ fontSize: 12 }}>·</Text>
                <Tag style={{
                  margin: 0, fontSize: 11,
                  background: expColor + '15', color: expColor,
                  borderColor: expColor + '40',
                }}>
                  {bl.filiere.nom}
                  {bl.filiere.code ? <span style={{ opacity: 0.65 }}> ({bl.filiere.code})</span> : ''}
                </Tag>
              </>
            )}
          </div>
        )}

        <Row2 label="Tonnage">
          <Text strong style={{ color: '#1890ff', fontSize: 15 }}>{bl.tonnageTotal} T</Text>
        </Row2>

        <Row2 label="Palettes">
          {bl.nombrePalettes > 0
            ? <Tag color="purple" style={{ margin: 0 }}>{bl.nombrePalettes} palette{bl.nombrePalettes > 1 ? 's' : ''}</Tag>
            : <Text type="secondary">Sans palette</Text>}
        </Row2>

        <Row2 label="Date de livraison">
          {bl.datelivraison
            ? <Text>{dayjs(bl.datelivraison).format('DD/MM/YYYY')}</Text>
            : <Text type="secondary">—</Text>}
        </Row2>

        <Row2 label="Créé le">
          <Text>{dayjs(bl.createdAt).format('DD/MM/YYYY HH:mm')}</Text>
        </Row2>

        {bl.erpReference && (
          <Row2 label="Réf. ERP">
            <Text code style={{ fontSize: 12 }}>{bl.erpReference}</Text>
          </Row2>
        )}

        {bl.loadingPlan && (
          <Row2 label="Plan de charge">
            <Tag color="orange" style={{ margin: 0 }}>🚛 {bl.loadingPlan.reference} — {bl.loadingPlan.truck?.matricule}</Tag>
          </Row2>
        )}

        {bl.notes && (
          <div style={{ gridColumn: '1 / -1' }}>
            <Text type="secondary" style={{ fontSize: 11 }}>Notes</Text>
            <div><Text italic style={{ color: '#595959' }}>{bl.notes}</Text></div>
          </div>
        )}
      </div>

      {/* ── Articles ── */}
      <Divider style={{ margin: '0 0 10px' }}>
        <Text style={{ fontSize: 13, fontWeight: 600 }}>Articles ({bl.blArticles?.length || 0})</Text>
      </Divider>

      {bl.blArticles?.length > 0 ? (
        <Table
          dataSource={bl.blArticles}
          columns={articleColumns}
          rowKey="id"
          pagination={false}
          size="small"
          bordered
          summary={(rows) => {
            const totalPoids = rows.reduce((s, r) => s + Number(r.poidsTotal), 0);
            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={4}><Text strong>Total</Text></Table.Summary.Cell>
                <Table.Summary.Cell index={1}><Text strong>{totalPoids.toFixed(2)} kg</Text></Table.Summary.Cell>
              </Table.Summary.Row>
            );
          }}
        />
      ) : (
        <Empty description="Aucun article renseigné" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </Drawer>
  );
};

export default BlDetailDrawer;
