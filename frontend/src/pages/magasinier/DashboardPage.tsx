import React, { useEffect, useState, useCallback } from 'react';
import {
  Card, Row, Col, Typography, Tag, Table, Space, Badge,
} from 'antd';
import {
  TruckOutlined, FileTextOutlined, DashboardOutlined,
  ApartmentOutlined, ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { expediteurPortalAPI } from '../../api';
import { LoadingPlan, LoadingStatus, EntryStatus } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;

const ACCENT = '#52c41a';

interface DashboardStats {
  trucks: number;
  totalBls: number;
  tonnage: number;
  filiereStats: { nom: string; code: string; count: number; tonnage: number }[];
}

const getTruckStatusBadge = (plan: LoadingPlan) => {
  if (plan.loadingStatus === LoadingStatus.DONE || plan.entryStatus === EntryStatus.EXITED)
    return <Badge color="#d9d9d9" text={<span style={{ fontSize: 11 }}>Terminé</span>} />;
  if (plan.loadingStatus === LoadingStatus.IN_PROGRESS || plan.loadingStatus === LoadingStatus.PAUSED)
    return <Badge color="#fa8c16" text={<span style={{ fontSize: 11 }}>En cours</span>} />;
  if (plan.entryStatus === EntryStatus.CALLED)
    return <Badge color="#1890ff" text={<span style={{ fontSize: 11 }}>Appelé</span>} />;
  return <Badge color={ACCENT} text={<span style={{ fontSize: 11 }}>En attente</span>} />;
};

const MagasinierDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todayPlans, setTodayPlans] = useState<LoadingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const today = dayjs().format('YYYY-MM-DD');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, plansRes] = await Promise.all([
        expediteurPortalAPI.getMagasinierDashboard(),
        expediteurPortalAPI.getMyPlanning(today),
      ]);
      setStats(statsRes.data);
      setTodayPlans(plansRes.data);
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const truckColumns = [
    {
      title: 'Camion',
      key: 'truck',
      render: (_: any, plan: LoadingPlan) => (
        <Space size={4}>
          <TruckOutlined style={{ color: ACCENT }} />
          <Text strong style={{ fontSize: 13 }}>{plan.truck?.matricule || '-'}</Text>
          {plan.truck?.type && <Tag style={{ fontSize: 10 }}>{plan.truck.type}</Tag>}
        </Space>
      ),
    },
    {
      title: 'Transporteur',
      key: 'transport',
      render: (_: any, plan: LoadingPlan) => (
        <Text style={{ fontSize: 12 }}>{(plan.truck as any)?.deliveryCompany?.nom || '-'}</Text>
      ),
    },
    {
      title: 'BLs filière',
      key: 'bls',
      align: 'center' as const,
      render: (_: any, plan: LoadingPlan) => (
        <Tag color="green">{plan.bonsLivraison?.length ?? 0}</Tag>
      ),
    },
    {
      title: 'Tonnage',
      key: 'tonnage',
      render: (_: any, plan: LoadingPlan) => {
        const t = (plan.bonsLivraison ?? []).reduce((s, bl) => s + Number((bl as any).tonnageTotal ?? 0), 0);
        return <Text style={{ fontSize: 12 }}>{t.toFixed(2)} T</Text>;
      },
    },
    {
      title: 'Arrivée',
      key: 'heure',
      render: (_: any, plan: LoadingPlan) =>
        plan.heureArrivee
          ? <Tag color="blue" style={{ fontSize: 10 }}>{plan.heureArrivee}</Tag>
          : <Text type="secondary" style={{ fontSize: 11 }}>-</Text>,
    },
    {
      title: 'Statut',
      key: 'statut',
      render: (_: any, plan: LoadingPlan) => getTruckStatusBadge(plan),
    },
  ];

  const filiereColumns = [
    {
      title: 'Filière',
      key: 'filiere',
      render: (_: any, f: DashboardStats['filiereStats'][number]) => (
        <Space size={6}>
          <ApartmentOutlined style={{ color: ACCENT }} />
          <Text strong style={{ fontSize: 13 }}>{f.nom}</Text>
          <Tag color="green" style={{ fontSize: 10 }}>{f.code}</Tag>
        </Space>
      ),
    },
    {
      title: 'BLs à  charger',
      key: 'count',
      align: 'center' as const,
      render: (_: any, f: DashboardStats['filiereStats'][number]) => (
        <Tag color="green" style={{ fontSize: 13 }}>{f.count}</Tag>
      ),
    },
    {
      title: 'Tonnage',
      key: 'tonnage',
      render: (_: any, f: DashboardStats['filiereStats'][number]) => (
        <Text style={{ fontSize: 13 }}>{f.tonnage.toFixed(2)} T</Text>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <DashboardOutlined style={{ fontSize: 22, color: ACCENT }} />
        <Title level={3} style={{ margin: 0 }}>
          Dashboard- {user?.filieres?.[0]?.nom || 'Ma filière'}
        </Title>
        <Text type="secondary" style={{ fontSize: 13 }}>
          {dayjs().format('dddd DD MMMM YYYY')}
        </Text>
        <ReloadOutlined
          style={{ marginLeft: 'auto', fontSize: 16, cursor: 'pointer', color: '#888' }}
          onClick={fetchData}
        />
      </div>

      {/* Stats Cards */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={8}>
          <Card style={{ borderTop: `3px solid ${ACCENT}`, textAlign: 'center' }}>
            <TruckOutlined style={{ fontSize: 28, color: ACCENT, marginBottom: 8 }} />
            <div style={{ fontSize: 36, fontWeight: 700, color: ACCENT }}>{stats?.trucks ?? 0}</div>
            <Text type="secondary">Camions à  charger aujourd'hui</Text>
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ borderTop: '3px solid #1890ff', textAlign: 'center' }}>
            <FileTextOutlined style={{ fontSize: 28, color: '#1890ff', marginBottom: 8 }} />
            <div style={{ fontSize: 36, fontWeight: 700, color: '#1890ff' }}>{stats?.totalBls ?? 0}</div>
            <Text type="secondary">BLs à  charger</Text>
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ borderTop: '3px solid #faad14', textAlign: 'center' }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: "#faad14", marginBottom: 8, display: "block" }}>T</span>
            <div style={{ fontSize: 36, fontWeight: 700, color: '#faad14' }}>
              {(stats?.tonnage ?? 0).toFixed(1)}
              <span style={{ fontSize: 16, fontWeight: 400 }}> T</span>
            </div>
            <Text type="secondary">Tonnage total</Text>
          </Card>
        </Col>
      </Row>

      {/* BLs par filière */}
      {(stats?.filiereStats?.length ?? 0) > 0 && (
        <Card
          title={
            <Space>
              <ApartmentOutlined style={{ color: ACCENT }} />
              <span>BLs à  charger par filière</span>
            </Space>
          }
          style={{ marginBottom: 20 }}
        >
          <Table
            dataSource={stats!.filiereStats}
            columns={filiereColumns}
            rowKey="nom"
            pagination={false}
            size="small"
          />
        </Card>
      )}

      {/* Arrivées du jour */}
      <Card
        title={
          <Space>
            <TruckOutlined style={{ color: ACCENT }} />
            <span>Arrivées du jour</span>
            <Tag color="green">{todayPlans.length} camion{todayPlans.length !== 1 ? 's' : ''}</Tag>
          </Space>
        }
      >
        <Table
          dataSource={todayPlans}
          columns={truckColumns}
          rowKey="id"
          pagination={false}
          size="middle"
          locale={{ emptyText: 'Aucun camion prévu aujourd\'hui pour votre filière' }}
        />
      </Card>
    </div>
  );
};

export default MagasinierDashboardPage;

