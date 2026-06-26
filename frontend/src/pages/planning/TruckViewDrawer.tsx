import React from 'react';
import { Drawer, Table, Tag, Typography, Progress, Divider, Empty } from 'antd';
import { EnvironmentOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { LoadingPlan, BonLivraison, BlStatus } from '../../types';
import { getDestinationColor } from './BLCard';

const { Text, Title } = Typography;

const STATUS_COLORS: Record<BlStatus, string> = {
  [BlStatus.DRAFT]: 'default',
  [BlStatus.VALIDATED]: 'blue',
  [BlStatus.LOADED]: 'orange',
  [BlStatus.DELIVERED]: 'green',
};

interface Props {
  plan: LoadingPlan | null;
  onClose: () => void;
}

const TruckViewDrawer: React.FC<Props> = ({ plan, onClose }) => {
  if (!plan) return null;

  const truck = plan.truck;
  const bls = plan.bonsLivraison || [];
  const tonnagePct = Math.min(100, Math.round((Number(plan.tonnageCharge) / Number(truck.capaciteTonnage)) * 100));
  const palettePct = truck.capacitePalettes > 0
    ? Math.min(100, Math.round((Number(plan.palettesChargees) / truck.capacitePalettes) * 100))
    : 0;
  const tonnageColor = tonnagePct > 90 ? '#ff4d4f' : tonnagePct > 70 ? '#fa8c16' : '#52c41a';

  const columns = [
    {
      title: 'N° BL',
      dataIndex: 'numeroBl',
      key: 'numeroBl',
      width: 130,
      render: (v: string) => <Text strong style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</Text>,
    },
    {
      title: 'Client',
      dataIndex: 'clientNom',
      key: 'clientNom',
      render: (v: string, r: BonLivraison) => (
        <div>
          <Text style={{ fontSize: 12 }}>{v}</Text>
          {r.clientAdresse && <div style={{ fontSize: 11, color: '#8c8c8c' }}>{r.clientAdresse}</div>}
        </div>
      ),
    },
    {
      title: 'Trajet',
      key: 'trajet',
      width: 180,
      render: (_: any, r: BonLivraison) => {
        const destColor = getDestinationColor(r.destination);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
            <EnvironmentOutlined style={{ color: '#52c41a', fontSize: 11 }} />
            <Text style={{ fontSize: 11 }}>{r.origine || '—'}</Text>
            <ArrowRightOutlined style={{ color: '#bfbfbf', fontSize: 10 }} />
            <Text style={{ fontSize: 11, color: destColor, fontWeight: 600 }}>{r.destination || '—'}</Text>
          </div>
        );
      },
    },
    {
      title: 'Expéditeur',
      key: 'expediteur',
      width: 140,
      render: (_: any, r: BonLivraison) =>
        r.societeExpeditrice ? (
          <div>
            <Tag style={{
              background: (r.societeExpeditrice.couleur || '#1890ff') + '22',
              color: r.societeExpeditrice.couleur || '#1890ff',
              borderColor: (r.societeExpeditrice.couleur || '#1890ff') + '55',
              fontSize: 10,
            }}>
              {r.societeExpeditrice.nom}
            </Tag>
            {r.filiere && <div style={{ fontSize: 10, color: '#8c8c8c', marginTop: 2 }}>{r.filiere.nom}</div>}
          </div>
        ) : <Text type="secondary" style={{ fontSize: 11 }}>—</Text>,
    },
    {
      title: 'Tonnage',
      dataIndex: 'tonnageTotal',
      key: 'tonnage',
      width: 90,
      render: (v: number) => <Text style={{ fontSize: 12, color: '#1890ff' }}>{Number(v).toFixed(2)} T</Text>,
    },
    {
      title: 'Palettes',
      dataIndex: 'nombrePalettes',
      key: 'palettes',
      width: 80,
      render: (v: number) => v > 0
        ? <Tag color="purple" style={{ fontSize: 10 }}>{v}</Tag>
        : <Text type="secondary" style={{ fontSize: 11 }}>—</Text>,
    },
    {
      title: 'Statut',
      dataIndex: 'statut',
      key: 'statut',
      width: 90,
      render: (v: BlStatus) => <Tag color={STATUS_COLORS[v]} style={{ fontSize: 10 }}>{v}</Tag>,
    },
  ];

  const totalTonnage = bls.reduce((s, bl) => s + Number(bl.tonnageTotal), 0);
  const totalPalettes = bls.reduce((s, bl) => s + Number(bl.nombrePalettes), 0);

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Text strong style={{ fontSize: 15 }}>{truck.matricule}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{truck.deliveryCompany?.nom}</Text>
          {plan.isValidated && <Tag color="success">Validé</Tag>}
        </div>
      }
      open={!!plan}
      onClose={onClose}
      width={900}
    >
      {/* Capacités */}
      <div style={{
        background: '#fafafa', borderRadius: 8, padding: '12px 16px', marginBottom: 16,
        border: '1px solid #f0f0f0',
      }}>
        <Title level={5} style={{ margin: '0 0 10px' }}>Capacités</Title>
        <div style={{ display: 'grid', gridTemplateColumns: truck.capacitePalettes > 0 ? '1fr 1fr' : '1fr', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 12, color: '#666' }}>Tonnage chargé</Text>
              <Text style={{ fontSize: 12 }}>
                <b style={{ color: tonnageColor }}>{Number(plan.tonnageCharge).toFixed(2)}</b> / {truck.capaciteTonnage} T
              </Text>
            </div>
            <Progress percent={tonnagePct} strokeColor={tonnageColor} size="small" />
          </div>
          {truck.capacitePalettes > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 12, color: '#666' }}>Palettes chargées</Text>
                <Text style={{ fontSize: 12 }}>
                  <b style={{ color: palettePct > 90 ? '#ff4d4f' : '#722ed1' }}>{plan.palettesChargees}</b> / {truck.capacitePalettes}
                </Text>
              </div>
              <Progress percent={palettePct} strokeColor="#722ed1" size="small" />
            </div>
          )}
        </div>
      </div>

      <Divider style={{ margin: '0 0 12px' }}>
        <Title level={5} style={{ margin: 0 }}>
          {bls.length} Bon{bls.length > 1 ? 's' : ''} de Livraison · {totalTonnage.toFixed(2)} T
          {totalPalettes > 0 ? ` · ${totalPalettes} palettes` : ''}
        </Title>
      </Divider>

      {bls.length === 0 ? (
        <Empty description="Aucun BL chargé" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <Table
          dataSource={bls}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="small"
          bordered
          scroll={{ x: 800 }}
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={4}><Text strong>Total</Text></Table.Summary.Cell>
              <Table.Summary.Cell index={1}>
                <Text strong style={{ color: '#1890ff' }}>{totalTonnage.toFixed(2)} T</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2}>
                {totalPalettes > 0 ? <Text strong>{totalPalettes}</Text> : <Text type="secondary">—</Text>}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={3} />
            </Table.Summary.Row>
          )}
        />
      )}
    </Drawer>
  );
};

export default TruckViewDrawer;
