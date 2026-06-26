import React, { useEffect, useState, useCallback } from 'react';
import {
  Table, Input, Select, DatePicker, Button, Tag, Typography,
  Space, Card, Badge, Tooltip,
} from 'antd';
import {
  SearchOutlined, ReloadOutlined, LoginOutlined, TeamOutlined,
  BankOutlined, CheckCircleOutlined, StopOutlined, WarningOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import { adminAPI, companiesAPI } from '../../api';
import { AuditLog, Company } from '../../types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/fr';

dayjs.extend(relativeTime);
dayjs.locale('fr');

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const ACTION_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  LOGIN_SUCCESS:    { label: 'Connexion réussie',    color: 'green',   icon: <LoginOutlined /> },
  LOGIN_FAILED:     { label: 'Échec connexion',      color: 'red',     icon: <WarningOutlined /> },
  USER_CREATED:     { label: 'Utilisateur créé',     color: 'blue',    icon: <TeamOutlined /> },
  USER_ACTIVATED:   { label: 'Compte activé',        color: 'cyan',    icon: <CheckCircleOutlined /> },
  USER_DEACTIVATED: { label: 'Compte désactivé',     color: 'orange',  icon: <StopOutlined /> },
  USER_DELETED:     { label: 'Utilisateur supprimé', color: 'volcano', icon: <TeamOutlined /> },
  COMPANY_CREATED:  { label: 'Société créée',        color: 'purple',  icon: <BankOutlined /> },
  COMPANY_DELETED:  { label: 'Société supprimée',    color: 'magenta', icon: <BankOutlined /> },
};

const REASON_LABELS: Record<string, string> = {
  email_not_found: 'Email inconnu',
  account_inactive: 'Compte inactif',
  password_not_set: 'Mot de passe non défini',
  wrong_password: 'Mot de passe incorrect',
};

const AdminLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string | undefined>();
  const [companyFilter, setCompanyFilter] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getLogs({
        search: search || undefined,
        action: actionFilter,
        companyId: companyFilter,
        fromDate: dateRange?.[0],
        toDate: dateRange?.[1],
      });
      setLogs(res.data);
    } finally {
      setLoading(false);
    }
  }, [search, actionFilter, companyFilter, dateRange]);

  useEffect(() => {
    companiesAPI.getAll().then(res => setCompanies(res.data));
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const columns = [
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      width: 200,
      render: (a: string) => {
        const cfg = ACTION_CONFIG[a] ?? { label: a, color: 'default', icon: null };
        return <Tag color={cfg.color} icon={cfg.icon} style={{ fontSize: 11 }}>{cfg.label}</Tag>;
      },
    },
    {
      title: 'Acteur',
      key: 'actor',
      width: 220,
      render: (_: any, r: AuditLog) => (
        <div>
          <Text style={{ fontSize: 12, fontWeight: 500 }}>{r.actorEmail || <Text type="secondary">—</Text>}</Text>
          {r.actorRole && (
            <Tag
              style={{ fontSize: 9, marginLeft: 4 }}
              color={r.actorRole === 'SUPER_ADMIN' ? 'red' : 'blue'}
            >
              {r.actorRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Resp. Log.'}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Cible',
      key: 'target',
      width: 180,
      render: (_: any, r: AuditLog) => r.targetEmail
        ? <Text style={{ fontSize: 12 }}>{r.targetEmail}</Text>
        : <Text type="secondary" style={{ fontSize: 11 }}>—</Text>,
    },
    {
      title: 'Société',
      dataIndex: 'companyNom',
      key: 'company',
      width: 160,
      render: (v: string) => v
        ? <Text style={{ fontSize: 12 }}>{v}</Text>
        : <Text type="secondary" style={{ fontSize: 11 }}>—</Text>,
    },
    {
      title: 'Détails',
      key: 'metadata',
      width: 160,
      render: (_: any, r: AuditLog) => {
        if (r.action === 'LOGIN_FAILED' && r.metadata?.reason) {
          return <Tag color="red" style={{ fontSize: 10 }}>{REASON_LABELS[r.metadata.reason] ?? r.metadata.reason}</Tag>;
        }
        if (r.metadata?.role) {
          return <Tag color="blue" style={{ fontSize: 10 }}>Rôle : {r.metadata.role}</Tag>;
        }
        return null;
      },
    },
    {
      title: 'IP',
      dataIndex: 'ip',
      key: 'ip',
      width: 130,
      render: (v: string) => (
        <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>{v || '—'}</Text>
      ),
    },
    {
      title: 'Date & heure',
      dataIndex: 'createdAt',
      key: 'date',
      width: 150,
      render: (d: string) => (
        <Tooltip title={dayjs(d).format('DD/MM/YYYY HH:mm:ss')}>
          <div>
            <Text style={{ fontSize: 12 }}>{dayjs(d).format('DD/MM/YYYY HH:mm')}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 10 }}>{dayjs(d).fromNow()}</Text>
          </div>
        </Tooltip>
      ),
    },
  ];

  const loginFailed = logs.filter(l => l.action === 'LOGIN_FAILED').length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Historique des accès</Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {logs.length}événement{logs.length > 1 ? 's' : ''}
            {loginFailed > 0 && (
              <Tag color="red" style={{ marginLeft: 8, fontSize: 11 }}>
                <WarningOutlined /> {loginFailed}échec{loginFailed > 1 ? 's' : ''} de connexion
              </Tag>
            )}
          </Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={fetchLogs} loading={loading}>
          Actualiser
        </Button>
      </div>

      {/* Filtres */}
      <Card
        bordered={false}
        style={{ marginBottom: 16, borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
        styles={{ body: { padding: '12px 16px' } }}
      >
        <Space wrap>
          <Input
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            placeholder="Email, société…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            allowClear
            style={{ width: 220 }}
          />
          <Select
            placeholder="Type d'événement"
            allowClear
            style={{ width: 200 }}
            value={actionFilter}
            onChange={v => setActionFilter(v)}
            options={Object.entries(ACTION_CONFIG).map(([k, v]) => ({
              value: k,
              label: <span>{v.label}</span>,
            }))}
          />
          <Select
            placeholder="Société"
            allowClear
            style={{ width: 200 }}
            value={companyFilter}
            onChange={v => setCompanyFilter(v)}
            options={companies.map(c => ({ value: c.id, label: c.nom }))}
            showSearch
            filterOption={(input, opt) =>
              (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())
            }
          />
          <RangePicker
            format="DD/MM/YYYY"
            onChange={(_, strs) => setDateRange(strs[0] && strs[1] ? [strs[0], strs[1]] : null)}
            placeholder={['Début', 'Fin']}
          />
          <Button
            onClick={() => {
              setSearch('');
              setActionFilter(undefined);
              setCompanyFilter(undefined);
              setDateRange(null);
            }}
          >
            Réinitialiser
          </Button>
        </Space>
      </Card>

      <Card
        bordered={false}
        style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
        title={
          <Space>
            <AuditOutlined style={{ color: '#1890ff' }} />
            <span>Journal d'activité</span>
            <Badge count={logs.length} style={{ backgroundColor: '#1890ff' }} />
          </Space>
        }
      >
        <Table
          dataSource={logs}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 50, showSizeChanger: true, pageSizeOptions: ['20', '50', '100'] }}
          size="small"
          scroll={{ x: 1200 }}
          locale={{ emptyText: 'Aucunévénement trouvé' }}
          rowClassName={(r) => r.action === 'LOGIN_FAILED' ? 'row-warning' : ''}
        />
      </Card>
    </div>
  );
};

export default AdminLogsPage;
