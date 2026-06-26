import React, { useEffect, useState } from 'react';
import {
  Row, Col, Card, Statistic, Tag, Typography, Spin, Table, Badge,
  Alert,
} from 'antd';
import {
  BankOutlined, TeamOutlined, FileTextOutlined, LoginOutlined,
  CheckCircleOutlined, StopOutlined, AuditOutlined, WarningOutlined,
} from '@ant-design/icons';
import { adminAPI } from '../../api';
import { AdminStats, AuditLog } from '../../types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/fr';

dayjs.extend(relativeTime);
dayjs.locale('fr');

const { Title, Text } = Typography;

const ACTION_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  LOGIN_SUCCESS:    { label: 'Connexion',          color: 'green',   icon: <LoginOutlined /> },
  LOGIN_FAILED:     { label: 'à‰chec connexion',    color: 'red',     icon: <WarningOutlined /> },
  USER_CREATED:     { label: 'Utilisateur créé',   color: 'blue',    icon: <TeamOutlined /> },
  USER_ACTIVATED:   { label: 'Compte activé',      color: 'cyan',    icon: <CheckCircleOutlined /> },
  USER_DEACTIVATED: { label: 'Compte désactivé',   color: 'orange',  icon: <StopOutlined /> },
  USER_DELETED:     { label: 'Utilisateur supprimé', color: 'volcano', icon: <TeamOutlined /> },
  COMPANY_CREATED:  { label: 'Société créée',      color: 'purple',  icon: <BankOutlined /> },
  COMPANY_DELETED:  { label: 'Société supprimée',  color: 'magenta', icon: <BankOutlined /> },
};

const ActionTag: React.FC<{ action: string }> = ({ action }) => {
  const cfg = ACTION_CONFIG[action] ?? { label: action, color: 'default', icon: null };
  return <Tag color={cfg.color} icon={cfg.icon} style={{ fontSize: 11 }}>{cfg.label}</Tag>;
};

const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminAPI.getStats()
      .then(res => setStats(res.data))
      .catch(() => setError('Impossible de charger les statistiques'))
      .finally(() => setLoading(false));
  }, []);

  if (error) return <Alert type="error" message={error} />;
  if (!stats) return null;

  const recentColumns = [
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      width: 180,
      render: (a: string) => <ActionTag action={a} />,
    },
    {
      title: 'Utilisateur',
      key: 'actor',
      render: (_: any, r: AuditLog) => (
        <div>
          <Text style={{ fontSize: 12 }}>{r.actorEmail || '-'}</Text>
          {r.actorRole && (
            <Tag style={{ fontSize: 9, marginLeft: 4 }} color={r.actorRole === 'SUPER_ADMIN' ? 'red' : 'blue'}>
              {r.actorRole === 'SUPER_ADMIN' ? 'Admin' : 'Logistique'}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Société',
      dataIndex: 'companyNom',
      key: 'company',
      render: (v: string) => v ? <Text style={{ fontSize: 12 }}>{v}</Text> : <Text type="secondary" style={{ fontSize: 11 }}>-</Text>,
    },
    {
      title: 'IP',
      dataIndex: 'ip',
      key: 'ip',
      render: (v: string) => <Text type="secondary" style={{ fontSize: 11 }}>{v || '-'}</Text>,
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'date',
      render: (d: string) => (
        <div>
          <Text style={{ fontSize: 11 }}>{dayjs(d).format('DD/MM HH:mm')}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 10 }}>{dayjs(d).fromNow()}</Text>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Dashboard Administration</Title>
        <Text type="secondary">Vue d'ensemble de la plateforme TMS</Text>
      </div>

      {/* â”€â”€ Stats cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>

        {/* Sociétés */}
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Statistic
              title={<span style={{ fontSize: 13 }}><BankOutlined style={{ marginRight: 6 }} />Sociétés clientes</span>}
              value={stats.companies.total}
              valueStyle={{ color: '#1890ff', fontSize: 32 }}
            />
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <Tag icon={<CheckCircleOutlined />} color="green">{stats.companies.active} actives</Tag>
              {stats.companies.inactive > 0 && (
                <Tag icon={<StopOutlined />} color="red">{stats.companies.inactive} inactives</Tag>
              )}
            </div>
          </Card>
        </Col>

        {/* Utilisateurs */}
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Statistic
              title={<span style={{ fontSize: 13 }}><TeamOutlined style={{ marginRight: 6 }} />Utilisateurs</span>}
              value={stats.users.total}
              valueStyle={{ color: '#722ed1', fontSize: 32 }}
            />
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <Tag icon={<CheckCircleOutlined />} color="green">{stats.users.active} actifs</Tag>
              {stats.users.inactive > 0 && (
                <Tag icon={<StopOutlined />} color="orange">{stats.users.inactive} inactifs</Tag>
              )}
            </div>
          </Card>
        </Col>

        {/* BLs */}
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Statistic
              title={<span style={{ fontSize: 13 }}><FileTextOutlined style={{ marginRight: 6 }} />Bons de livraison</span>}
              value={stats.bls.total}
              valueStyle={{ color: '#fa8c16', fontSize: 32 }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Total plateforme</Text>
            </div>
          </Card>
        </Col>

        {/* Connexions */}
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Statistic
              title={<span style={{ fontSize: 13 }}><LoginOutlined style={{ marginRight: 6 }} />Connexions</span>}
              value={stats.logins.today}
              suffix={<span style={{ fontSize: 14, color: '#8c8c8c' }}>aujourd'hui</span>}
              valueStyle={{ color: '#52c41a', fontSize: 32 }}
            />
            <div style={{ marginTop: 8 }}>
              <Tag color="blue">{stats.logins.week} cette semaine</Tag>
            </div>
          </Card>
        </Col>
      </Row>

      {/* â”€â”€ Derniers événements â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AuditOutlined style={{ color: '#1890ff' }} />
            <span>Derniers événements</span>
            <Badge count={stats.recentLogs.length} style={{ backgroundColor: '#1890ff' }} />
          </div>
        }
        bordered={false}
        style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
        extra={
          <a href="/admin/logs" style={{ fontSize: 12 }}>Voir tout l'historique â†’</a>
        }
      >
        <Table
          dataSource={stats.recentLogs}
          columns={recentColumns}
          rowKey="id"
          pagination={false}
          size="small"
          locale={{ emptyText: 'Aucune activité enregistrée' }}
        />
      </Card>
    </div>
  );
};

export default AdminDashboardPage;

