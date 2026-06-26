import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Typography } from 'antd';
import { TeamOutlined, FileTextOutlined, ApartmentOutlined } from '@ant-design/icons';
import { expediteurPortalAPI } from '../../api';
import { BonLivraison, BlStatus, User } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
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

const FiliereAdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [bls, setBls] = useState<BonLivraison[]>([]);

  const today = dayjs().format('YYYY-MM-DD');
  const filiere = user?.filieres?.[0];

  useEffect(() => {
    Promise.all([
      expediteurPortalAPI.getMyUsers(),
      expediteurPortalAPI.getMyBls(today),
    ]).then(([uRes, blRes]) => {
      setUsers(uRes.data);
      setBls(blRes.data);
    });
  }, []);

  const magasiniers = users.filter((u) => u.role === 'MAGASINIER' as any);
  const securite = users.filter((u) => u.role === 'SECURITE' as any);

  const blColumns = [
    { title: 'N° BL', dataIndex: 'numeroBl', key: 'numeroBl', width: 130 },
    { title: 'Client', dataIndex: 'clientNom', key: 'clientNom' },
    { title: 'Destination', dataIndex: 'destination', key: 'destination' },
    {
      title: 'Statut',
      dataIndex: 'statut',
      key: 'statut',
      render: (s: BlStatus) => <Tag color={STATUS_COLORS[s]}>{STATUS_LABELS[s]}</Tag>,
    },
    {
      title: 'Date',
      dataIndex: 'datelivraison',
      key: 'datelivraison',
      render: (d: string) => d ? dayjs(d).format('DD/MM/YYYY') : '–',
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, color: '#eb2f96' }}>
          <ApartmentOutlined style={{ marginRight: 8 }} />
          {filiere?.nom || 'Ma Filière'}
        </Title>
        {filiere?.code && (
          <Tag color="magenta" style={{ marginTop: 4 }}>{filiere.code}</Tag>
        )}
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Magasiniers"
              value={magasiniers.length}
              prefix={<TeamOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Agents Sécurité"
              value={securite.length}
              prefix={<TeamOutlined style={{ color: '#fa8c16' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="BLs aujourd'hui"
              value={bls.length}
              prefix={<FileTextOutlined style={{ color: '#eb2f96' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Card title={<><FileTextOutlined style={{ marginRight: 8 }} />BLs du jour</>}>
        <Table
          dataSource={bls}
          columns={blColumns}
          rowKey="id"
          pagination={false}
          size="small"
          locale={{ emptyText: "Aucun BL pour aujourd'hui" }}
        />
      </Card>
    </div>
  );
};

export default FiliereAdminDashboardPage;
