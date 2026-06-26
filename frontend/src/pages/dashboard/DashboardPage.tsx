import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Typography } from 'antd';
import { FileTextOutlined, TruckOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { blAPI, loadingPlansAPI } from '../../api';
import { BonLivraison, LoadingPlan, BlStatus } from '../../types';
import dayjs from 'dayjs';

const { Title } = Typography;

const statusColors: Record<BlStatus, string> = {
  [BlStatus.DRAFT]: 'default',
  [BlStatus.VALIDATED]: 'blue',
  [BlStatus.LOADED]: 'orange',
  [BlStatus.DELIVERED]: 'green',
};

const DashboardPage: React.FC = () => {
  const [bls, setBls] = useState<BonLivraison[]>([]);
  const [plans, setPlans] = useState<LoadingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([blAPI.getAll(), loadingPlansAPI.getAll()])
      .then(([blRes, planRes]) => {
        setBls(blRes.data);
        setPlans(planRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: bls.length,
    validated: bls.filter((b) => b.statut === BlStatus.VALIDATED).length,
    loaded: bls.filter((b) => b.statut === BlStatus.LOADED).length,
    plansToday: plans.filter((p) => dayjs(p.dateLivraison).isSame(dayjs(), 'day')).length,
  };

  const blColumns = [
    { title: 'N° BL', dataIndex: 'numeroBl', key: 'numeroBl' },
    { title: 'Client', dataIndex: 'clientNom', key: 'clientNom' },
    { title: 'Tonnage', dataIndex: 'tonnageTotal', key: 'tonnage', render: (v: number) => `${v} T` },
    {
      title: 'Statut', dataIndex: 'statut', key: 'statut',
      render: (s: BlStatus) => <Tag color={statusColors[s]}>{s}</Tag>,
    },
    { title: 'Date', dataIndex: 'datelivraison', key: 'date', render: (d: string) => d ? dayjs(d).format('DD/MM/YYYY') : '-' },
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>Tableau de Bord</Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Total BL" value={stats.total} prefix={<FileTextOutlined />} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="BL Validés" value={stats.validated} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="BL Chargés" value={stats.loaded} prefix={<TruckOutlined />} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Plans Aujourd'hui" value={stats.plansToday} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#722ed1' }} />
          </Card>
        </Col>
      </Row>
      <Card title="Derniers Bons de Livraison">
        <Table
          dataSource={bls.slice(0, 10)}
          columns={blColumns}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
};

export default DashboardPage;
