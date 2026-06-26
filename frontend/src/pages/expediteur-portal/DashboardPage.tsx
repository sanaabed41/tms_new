import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Typography } from 'antd';
import {
  TeamOutlined, InboxOutlined, ApartmentOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { expediteurPortalAPI } from '../../api';
import { ExpediteursPortalDashboard, BonLivraison, BlStatus } from '../../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const STATUS_COLORS: Record<BlStatus, string> = {
  [BlStatus.DRAFT]: 'default',
  [BlStatus.VALIDATED]: 'blue',
  [BlStatus.LOADED]: 'orange',
  [BlStatus.DELIVERED]: 'green',
};
const STATUS_LABELS: Record<BlStatus, string> = {
  [BlStatus.DRAFT]: 'Brouillon',
  [BlStatus.VALIDATED]: 'Validé',
  [BlStatus.LOADED]: 'Chargé',
  [BlStatus.DELIVERED]: 'Livré',
};

const ExpediteursPortalDashboardPage: React.FC = () => {
  const [dashboard, setDashboard] = useState<ExpediteursPortalDashboard | null>(null);
  const [bls, setBls] = useState<BonLivraison[]>([]);

  useEffect(() => {
    const today = dayjs().format('YYYY-MM-DD');
    Promise.all([
      expediteurPortalAPI.getDashboard(),
      expediteurPortalAPI.getMyBls(today),
    ]).then(([dashRes, blRes]) => {
      setDashboard(dashRes.data);
      setBls(blRes.data);
    });
  }, []);

  const blColumns = [
    { title: 'N° BL', dataIndex: 'numeroBl', key: 'numeroBl', width: 120 },
    { title: 'Client', dataIndex: 'clientNom', key: 'clientNom' },
    {
      title: 'Statut',
      dataIndex: 'statut',
      key: 'statut',
      render: (s: BlStatus) => (
        <Tag color={STATUS_COLORS[s]}>{STATUS_LABELS[s] || s}</Tag>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          {dashboard?.societe.nom || 'Dashboard Expéditeur'}
        </Title>
        {dashboard?.societe.code && (
          <Text type="secondary">Code : {dashboard.societe.code}</Text>
        )}
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Filières"
              value={dashboard?.filieres ?? 0}
              prefix={<ApartmentOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Quais"
              value={dashboard?.quais ?? 0}
              prefix={<InboxOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Utilisateurs"
              value={dashboard?.users ?? 0}
              prefix={<TeamOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="BLs aujourd'hui"
              value={dashboard?.blsAujourdhui ?? 0}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <span>
            <CalendarOutlined style={{ marginRight: 8, color: '#722ed1' }} />
            BLs du jour — {dayjs().format('DD/MM/YYYY')}
          </span>
        }
      >
        <Table
          dataSource={bls}
          columns={blColumns}
          rowKey="id"
          size="small"
          pagination={false}
          locale={{ emptyText: "Aucun BL pour aujourd'hui" }}
        />
      </Card>
    </div>
  );
};

export default ExpediteursPortalDashboardPage;
