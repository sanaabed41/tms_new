import React, { useEffect, useState, useRef } from 'react';
import {
  Typography, DatePicker, Card, Tag, Table, Empty, Spin,
  Row, Col, Statistic, Divider, Button, Tooltip,
} from 'antd';
import {
  TruckOutlined, EnvironmentOutlined, PrinterOutlined,
  CheckCircleOutlined, ClockCircleOutlined, FileTextOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import { useReactToPrint } from 'react-to-print';
import { transportPortalAPI } from '../../api';

dayjs.locale('fr');

const { Title, Text } = Typography;

interface BL {
  id: string;
  numeroBl: string;
  clientNom: string;
  origine: string;
  destination: string;
  tonnageTotal: number;
  nombrePalettes: number;
  typeChargement: string;
  statut: string;
  ordreChargement: number;
  filiere?: { nom: string };
  societeExpeditrice?: { nom: string };
}

interface Plan {
  id: string;
  isValidated: boolean;
  heureArrivee: string;
  statut: string;
  tonnageCharge: number;
  bonsLivraison: BL[];
  reference: string;
}

interface RapportEntry {
  truck: {
    id: string;
    matricule: string;
    capaciteTonnage: number;
    capacitePalettes: number;
    type: string;
  };
  plan: Plan | null;
}

const statusColor: Record<string, string> = {
  WAITING: 'default',
  IN_PROGRESS: 'processing',
  PAUSED: 'warning',
  DONE: 'success',
};

const statusLabel: Record<string, string> = {
  WAITING: 'En attente',
  IN_PROGRESS: 'En cours',
  PAUSED: 'En pause',
  DONE: 'Terminé',
};

const TransportRapportPage: React.FC = () => {
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [data, setData] = useState<RapportEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ contentRef: printRef });

  const load = async (d: string) => {
    setLoading(true);
    try {
      const res = await transportPortalAPI.getRapport(d);
      setData(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(date); }, [date]);

  const withPlan = data.filter((e) => e.plan !== null);
  const withoutPlan = data.filter((e) => e.plan === null);
  const totalBls = withPlan.reduce((s, e) => s + (e.plan?.bonsLivraison?.length ?? 0), 0);
  const totalTonnage = withPlan.reduce((s, e) => s + Number(e.plan?.tonnageCharge ?? 0), 0);

  const blColumns = [
    { title: '#', dataIndex: 'ordreChargement', key: 'ordre', width: 40,
      render: (v: number) => <Text type="secondary">{v}</Text> },
    { title: 'N° BL', dataIndex: 'numeroBl', key: 'bl',
      render: (v: string) => <Text strong style={{ fontFamily: 'monospace' }}>{v}</Text> },
    { title: 'Client', dataIndex: 'clientNom', key: 'client' },
    { title: 'Trajet', key: 'trajet',
      render: (_: any, bl: BL) => (
        <span>
          <Text type="secondary">{bl.origine || '—'}</Text>
          <span style={{ margin: '0 6px', color: '#1890ff' }}>→</span>
          <Text strong>{bl.destination || '—'}</Text>
        </span>
      ),
    },
    { title: 'Filière', key: 'filiere',
      render: (_: any, bl: BL) => bl.filiere?.nom
        ? <Tag color="blue">{bl.filiere.nom}</Tag>
        : <Text type="secondary">—</Text>,
    },
    { title: 'Type', dataIndex: 'typeChargement', key: 'type', width: 90,
      render: (v: string) => <Tag>{v}</Tag> },
    { title: 'Tonnage', dataIndex: 'tonnageTotal', key: 't', width: 80,
      render: (v: number) => <Text strong>{v} T</Text> },
    { title: 'Palettes', dataIndex: 'nombrePalettes', key: 'p', width: 70,
      render: (v: number) => v > 0 ? v : <Text type="secondary">—</Text> },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            <FileTextOutlined style={{ marginRight: 10, color: '#1890ff' }} />
            Rapport de chargement
          </Title>
          <Text type="secondary">Missions de votre flotte pour la date sélectionnée</Text>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <DatePicker
            value={dayjs(date)}
            onChange={(d) => d && setDate(d.format('YYYY-MM-DD'))}
            format="DD/MM/YYYY"
            allowClear={false}
          />
          <Tooltip title="Imprimer le rapport">
            <Button
              icon={<PrinterOutlined />}
              onClick={() => setTimeout(() => handlePrint(), 100)}
              disabled={withPlan.length === 0}
            >
              Imprimer
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Statistiques */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {[
          { title: 'Camions affectés', value: withPlan.length, suffix: `/ ${data.length}`, icon: <TruckOutlined />, color: '#1890ff' },
          { title: 'Bons de livraison', value: totalBls, suffix: 'BL', icon: <FileTextOutlined />, color: '#52c41a' },
          { title: 'Tonnage total', value: totalTonnage.toFixed(1), suffix: 'T', icon: <EnvironmentOutlined />, color: '#fa8c16' },
          { title: 'Camions sans mission', value: withoutPlan.length, suffix: '', icon: <ClockCircleOutlined />, color: '#d9d9d9' },
        ].map(({ title, value, suffix, icon, color }) => (
          <Col span={6} key={title}>
            <Card bordered style={{ borderTop: `3px solid ${color}` }}>
              <Statistic
                title={<span style={{ fontSize: 13 }}>{icon} {title}</span>}
                value={value}
                suffix={<span style={{ fontSize: 13, color: '#888' }}>{suffix}</span>}
                valueStyle={{ color, fontSize: 26, fontWeight: 700 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Spin spinning={loading}>
        {data.length === 0 && !loading && (
          <Empty description="Aucune donnée pour cette date" />
        )}

        {/* Camions avec plan */}
        {withPlan.map(({ truck, plan }) => {
          const pct = Math.round((Number(plan!.tonnageCharge) / truck.capaciteTonnage) * 100);
          return (
            <Card
              key={truck.id}
              style={{ marginBottom: 16, borderLeft: '4px solid #1890ff' }}
              styles={{ body: { padding: '16px 20px' } }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <TruckOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                  <div>
                    <Text strong style={{ fontSize: 16 }}>{truck.matricule}</Text>
                    <div>
                      <Tag color="cyan">{truck.type}</Tag>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Capacité : {truck.capaciteTonnage}T
                      </Text>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  {plan!.heureArrivee && (
                    <Text type="secondary">
                      <ClockCircleOutlined style={{ marginRight: 4 }} />
                      Arrivée : <Text strong>{plan!.heureArrivee}</Text>
                    </Text>
                  )}
                  <Tag icon={<CheckCircleOutlined />} color={statusColor[plan!.statut] ?? 'default'}>
                    {statusLabel[plan!.statut] ?? plan!.statut}
                  </Tag>
                  <div style={{ textAlign: 'right' }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>Charge</Text>
                    <div>
                      <Text strong style={{ color: pct > 90 ? '#ff4d4f' : pct > 70 ? '#fa8c16' : '#52c41a' }}>
                        {plan!.tonnageCharge}T ({pct}%)
                      </Text>
                    </div>
                  </div>
                </div>
              </div>
              <Table
                dataSource={plan!.bonsLivraison}
                columns={blColumns}
                rowKey="id"
                pagination={false}
                size="small"
                bordered
                locale={{ emptyText: 'Aucun bon de livraison' }}
              />
            </Card>
          );
        })}

        {/* Camions sans plan */}
        {withoutPlan.length > 0 && (
          <>
            <Divider>
              <Text type="secondary">Camions sans mission ce jour ({withoutPlan.length})</Text>
            </Divider>
            <Row gutter={12}>
              {withoutPlan.map(({ truck }) => (
                <Col span={6} key={truck.id}>
                  <Card size="small" style={{ borderLeft: '3px solid #d9d9d9', opacity: 0.7 }}>
                    <TruckOutlined style={{ color: '#bbb', marginRight: 8 }} />
                    <Text type="secondary">{truck.matricule}</Text>
                    <div><Tag style={{ marginTop: 4 }}>{truck.type}</Tag></div>
                  </Card>
                </Col>
              ))}
            </Row>
          </>
        )}
      </Spin>

      {/* Zone d'impression */}
      <div style={{ display: 'none' }}>
        <div ref={printRef} style={{ padding: 32, fontFamily: 'Arial, sans-serif' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid #000', paddingBottom: 12, marginBottom: 20 }}>
            <div>
              <h2 style={{ margin: 0 }}>RAPPORT DE CHARGEMENT — FLOTTE TRANSPORT</h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{dayjs(date).format('dddd DD MMMM YYYY')}</div>
              <div style={{ fontSize: 11, color: '#888' }}>Imprimé le {dayjs().format('DD/MM/YYYY à HH:mm')}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
            {[
              ['Camions affectés', `${withPlan.length} / ${data.length}`],
              ['Bons de livraison', totalBls],
              ['Tonnage total', `${totalTonnage.toFixed(1)} T`],
            ].map(([l, v]) => (
              <div key={String(l)} style={{ border: '1px solid #000', padding: '8px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: '#555' }}>{l}</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{v}</div>
              </div>
            ))}
          </div>
          {withPlan.map(({ truck, plan }) => (
            <div key={truck.id} style={{ marginBottom: 24, pageBreakInside: 'avoid' }}>
              <div style={{ background: '#222', color: 'white', padding: '6px 12px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700 }}>🚛 {truck.matricule} — {truck.type}</span>
                <span style={{ fontSize: 12 }}>Capacité : {truck.capaciteTonnage}T | Charge : {plan!.tonnageCharge}T | Arrivée : {plan!.heureArrivee || '—'}</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    {['#', 'N° BL', 'Client', 'Origine → Destination', 'Type', 'Tonnage'].map((h) => (
                      <th key={h} style={{ padding: '6px 8px', border: '1px solid #ddd', textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {plan!.bonsLivraison.map((bl) => (
                    <tr key={bl.id}>
                      <td style={{ padding: '5px 8px', border: '1px solid #eee' }}>{bl.ordreChargement}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #eee', fontFamily: 'monospace' }}>{bl.numeroBl}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #eee' }}>{bl.clientNom}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #eee' }}>{bl.origine} → {bl.destination}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #eee' }}>{bl.typeChargement}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #eee' }}>{bl.tonnageTotal} T</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TransportRapportPage;
