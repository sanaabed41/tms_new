import React, { useEffect, useState } from 'react';
import {
  Table, Button, Space, Drawer, Tag, Popconfirm, message,
  Typography, Switch, Empty, Descriptions, Tabs, Badge, Spin,
} from 'antd';
import {
  EyeOutlined, StopOutlined, ExclamationCircleOutlined, DeleteOutlined,
  UserOutlined, BankOutlined, CheckCircleOutlined, ApartmentOutlined, TruckOutlined,
} from '@ant-design/icons';
import { companiesAPI, usersAPI, deliveryCompaniesAPI } from '../../api';
import { Company, User, Role, CompanyType } from '../../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface AdminRow {
  key: string;
  companyId: string;
  companyNom: string;
  companyCouleur?: string;
  companyCode?: string;
  companyCreatedAt: string;
  user: User | null;
}

interface TransportRow {
  key: string;
  dcId: string;
  dcNom: string;
  dcAdresse?: string;
  dcTelephone?: string;
  dcCreatedAt: string;
  dcIsActive: boolean;
  user: User | null;
}

const CompaniesPage: React.FC = () => {
  const [logistiqueRows, setLogistiqueRows] = useState<AdminRow[]>([]);
  const [expediteurRows, setExpediteurRows] = useState<AdminRow[]>([]);
  const [filiereRows, setFiliereRows] = useState<AdminRow[]>([]);
  const [transportRows, setTransportRows] = useState<TransportRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerRow, setDrawerRow] = useState<AdminRow | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [companiesRes, dcRes, allUsersRes] = await Promise.all([
        companiesAPI.getAll(),
        deliveryCompaniesAPI.getAll(),
        usersAPI.getAll(),
      ]);
      const all: Company[] = companiesRes.data;
      const deliveryCompanies: any[] = dcRes.data;
      const allUsers: User[] = allUsersRes.data;

      const logistique = all.filter((c) => c.type === CompanyType.LOGISTIQUE);
      const expediteur = all.filter((c) => c.type === CompanyType.EXPEDITEUR);

      const usersByCompany: Record<string, User[]> = {};
      await Promise.all(
        [...logistique, ...expediteur].map(async (company) => {
          try {
            const res = await usersAPI.getAll(company.id);
            usersByCompany[company.id] = res.data;
          } catch {
            usersByCompany[company.id] = [];
          }
        }),
      );

      setLogistiqueRows(
        logistique.map((c) => ({
          key: c.id,
          companyId: c.id,
          companyNom: c.nom,
          companyCouleur: c.couleur,
          companyCode: c.code,
          companyCreatedAt: c.createdAt,
          user: usersByCompany[c.id]?.find((u) => u.role === Role.LOGISTIC_ADMIN) ?? null,
        })),
      );

      setExpediteurRows(
        expediteur.map((c) => ({
          key: c.id,
          companyId: c.id,
          companyNom: c.nom,
          companyCouleur: c.couleur,
          companyCode: c.code,
          companyCreatedAt: c.createdAt,
          user: usersByCompany[c.id]?.find((u) => u.role === Role.EXPEDITEUR_ADMIN) ?? null,
        })),
      );

      const filiereAdmins: AdminRow[] = [];
      expediteur.forEach((c) => {
        const admins = (usersByCompany[c.id] ?? []).filter((u) => u.role === Role.FILIERE_ADMIN);
        admins.forEach((u) => {
          filiereAdmins.push({
            key: u.id,
            companyId: c.id,
            companyNom: c.nom,
            companyCouleur: c.couleur,
            companyCode: c.code,
            companyCreatedAt: c.createdAt,
            user: u,
          });
        });
      });
      setFiliereRows(filiereAdmins);

      // Transport companies (DeliveryCompany entities)
      const transportAdmins = allUsers.filter((u) => u.role === Role.TRANSPORT_ADMIN);
      setTransportRows(
        deliveryCompanies.map((dc) => ({
          key: dc.id,
          dcId: dc.id,
          dcNom: dc.nom,
          dcAdresse: dc.adresse,
          dcTelephone: dc.telephone,
          dcCreatedAt: dc.createdAt,
          dcIsActive: dc.isActive,
          user: transportAdmins.find((u) => (u as any).deliveryCompany?.id === dc.id) ?? null,
        })),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const updateUserInRows = (userId: string, isActive: boolean) => {
    const patch = (rows: AdminRow[]) =>
      rows.map((r) =>
        r.user?.id === userId ? { ...r, user: { ...r.user!, isActive } } : r,
      );
    setLogistiqueRows(patch);
    setExpediteurRows(patch);
    setFiliereRows(patch);
    setDrawerRow((prev) =>
      prev?.user?.id === userId ? { ...prev, user: { ...prev.user!, isActive } } : prev,
    );
  };

  const handleToggle = async (user: User) => {
    try {
      await usersAPI.toggleActive(user.id);
      updateUserInRows(user.id, !user.isActive);
      message.success('Statut mis à  jour');
    } catch {
      message.error('Erreur lors de la mise à  jour');
    }
  };

  const handleDeactivate = async (user: User) => {
    try {
      if (user.isActive) await usersAPI.toggleActive(user.id);
      updateUserInRows(user.id, false);
      message.success('Compte désactivé');
    } catch {
      message.error('Erreur');
    }
  };

  const handleDeleteCompany = async (row: AdminRow) => {
    try {
      await companiesAPI.delete(row.companyId);
      message.success(`Société "${row.companyNom}" supprimée`);
      fetchData();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const openDrawer = (row: AdminRow) => {
    setDrawerRow(row);
    setDrawerOpen(true);
  };

  const buildColumns = (showCompanyColumn = true) => [
    ...(showCompanyColumn
      ? [{
          title: 'Société',
          key: 'company',
          render: (_: any, row: AdminRow) => (
            <Space>
              {row.companyCouleur && (
                <span style={{
                  display: 'inline-block', width: 10, height: 10,
                  borderRadius: 2, background: row.companyCouleur,
                }} />
              )}
              <div>
                <Text strong>{row.companyNom}</Text>
                {row.companyCode && (
                  <Text type="secondary" style={{ fontSize: 11, marginLeft: 6 }}>
                    ({row.companyCode})
                  </Text>
                )}
              </div>
            </Space>
          ),
        }]
      : []),
    {
      title: 'Administrateur',
      key: 'admin',
      render: (_: any, row: AdminRow) => {
        if (!row.user) return <Tag color="warning">Aucun admin assigné</Tag>;
        return (
          <div>
            <Text style={{ fontSize: 13 }}>{row.user.prenom} {row.user.nom}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 11 }}>{row.user.email}</Text>
          </div>
        );
      },
    },
    {
      title: 'Statut',
      key: 'status',
      render: (_: any, row: AdminRow) => {
        if (!row.user) return <Text type="secondary">-</Text>;
        return (
          <Switch
            checked={row.user.isActive}
            checkedChildren="Actif"
            unCheckedChildren="Inactif"
            onChange={() => handleToggle(row.user!)}
            size="small"
          />
        );
      },
    },
    {
      title: 'Créé le',
      key: 'createdAt',
      render: (_: any, row: AdminRow) =>
        dayjs(row.companyCreatedAt).format('DD/MM/YYYY'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, row: AdminRow) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => openDrawer(row)}>
            Consulter
          </Button>
          {row.user?.isActive && (
            <Popconfirm
              title={`Désactiver le compte de ${row.user.prenom} ${row.user.nom} ?`}
              description="L'accès sera révoqué. Le compte reste dans la base de données."
              icon={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
              onConfirm={() => handleDeactivate(row.user!)}
              okText="Désactiver"
              cancelText="Annuler"
              okButtonProps={{ danger: true }}
            >
              <Button size="small" danger icon={<StopOutlined />}>
                Désactiver
              </Button>
            </Popconfirm>
          )}
          {!row.user && (
            <Popconfirm
              title={`Supprimer la société "${row.companyNom}" ?`}
              description="Cette société n'a aucun admin. La suppression est définitive."
              icon={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
              onConfirm={() => handleDeleteCompany(row)}
              okText="Supprimer"
              cancelText="Annuler"
              okButtonProps={{ danger: true }}
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const activeCount = (rows: AdminRow[]) => rows.filter((r) => r.user?.isActive).length;

  const tabItems = [
    {
      key: 'logistique',
      label: (
        <Space>
          <BankOutlined />
          Resp. Logistique
          <Badge count={logistiqueRows.length} color="blue" />
        </Space>
      ),
      children: (
        <Table
          dataSource={logistiqueRows}
          columns={buildColumns()}
          rowKey="key"
          size="middle"
          pagination={{ pageSize: 15 }}
          locale={{ emptyText: 'Aucun responsable logistique' }}
          footer={() => (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {activeCount(logistiqueRows)} compte{activeCount(logistiqueRows) > 1 ? 's' : ''} actif{activeCount(logistiqueRows) > 1 ? 's' : ''} / {logistiqueRows.length} total
            </Text>
          )}
        />
      ),
    },
    {
      key: 'expediteur',
      label: (
        <Space>
          <ApartmentOutlined />
          Resp. Expéditeurs
          <Badge count={expediteurRows.length} color="purple" />
        </Space>
      ),
      children: (
        <Table
          dataSource={expediteurRows}
          columns={buildColumns()}
          rowKey="key"
          size="middle"
          pagination={{ pageSize: 15 }}
          locale={{ emptyText: 'Aucun responsable expéditeur' }}
          footer={() => (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {activeCount(expediteurRows)} compte{activeCount(expediteurRows) > 1 ? 's' : ''} actif{activeCount(expediteurRows) > 1 ? 's' : ''} / {expediteurRows.length} total
            </Text>
          )}
        />
      ),
    },
    {
      key: 'filiere',
      label: (
        <Space>
          <UserOutlined />
          Admins Filières
          <Badge count={filiereRows.length} color="magenta" />
        </Space>
      ),
      children: (
        <Table
          dataSource={filiereRows}
          columns={buildColumns()}
          rowKey="key"
          size="middle"
          pagination={{ pageSize: 15 }}
          locale={{ emptyText: 'Aucun admin filière' }}
          footer={() => (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {activeCount(filiereRows)} compte{activeCount(filiereRows) > 1 ? 's' : ''} actif{activeCount(filiereRows) > 1 ? 's' : ''} / {filiereRows.length} total
            </Text>
          )}
        />
      ),
    },
    {
      key: 'transport',
      label: (
        <Space>
          <TruckOutlined />
          Soc. Transport
          <Badge count={transportRows.length} color="cyan" />
        </Space>
      ),
      children: (
        <Table
          dataSource={transportRows}
          rowKey="key"
          size="middle"
          pagination={{ pageSize: 15 }}
          locale={{ emptyText: 'Aucune société de transport' }}
          columns={[
            {
              title: 'Société de transport',
              key: 'dc',
              render: (_: any, row: TransportRow) => (
                <div>
                  <Text strong>{row.dcNom}</Text>
                  {row.dcAdresse && <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>{row.dcAdresse}</Text>}
                  {row.dcTelephone && <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>{row.dcTelephone}</Text>}
                </div>
              ),
            },
            {
              title: 'Admin Transport',
              key: 'admin',
              render: (_: any, row: TransportRow) => {
                if (!row.user) return <Tag color="warning">Aucun admin assigné</Tag>;
                return (
                  <div>
                    <Text style={{ fontSize: 13 }}>{row.user.prenom} {row.user.nom}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 11 }}>{row.user.email}</Text>
                  </div>
                );
              },
            },
            {
              title: 'Statut',
              key: 'status',
              render: (_: any, row: TransportRow) => {
                if (!row.user) return <Text type="secondary">-</Text>;
                return (
                  <Switch
                    checked={row.user.isActive}
                    checkedChildren="Actif"
                    unCheckedChildren="Inactif"
                    onChange={() => handleToggle(row.user!)}
                    size="small"
                  />
                );
              },
            },
            {
              title: 'Ajouté le',
              key: 'createdAt',
              render: (_: any, row: TransportRow) => dayjs(row.dcCreatedAt).format('DD/MM/YYYY'),
            },
            {
              title: 'Actions',
              key: 'actions',
              render: (_: any, row: TransportRow) => (
                <Space>
                  {row.user?.isActive && (
                    <Popconfirm
                      title={`Désactiver ${row.user.prenom} ${row.user.nom} ?`}
                      description="L'accès sera révoqué."
                      icon={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
                      onConfirm={() => handleDeactivate(row.user!)}
                      okText="Désactiver"
                      cancelText="Annuler"
                      okButtonProps={{ danger: true }}
                    >
                      <Button size="small" danger icon={<StopOutlined />}>Désactiver</Button>
                    </Popconfirm>
                  )}
                  {row.user && !row.user.isActive && (
                    <Button
                      size="small"
                      icon={<CheckCircleOutlined />}
                      style={{ color: '#52c41a', borderColor: '#52c41a' }}
                      onClick={() => handleToggle(row.user!)}
                    >
                      Activer
                    </Button>
                  )}
                </Space>
              ),
            },
          ]}
          footer={() => (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {transportRows.filter((r) => r.user?.isActive).length} actif{transportRows.filter((r) => r.user?.isActive).length > 1 ? 's' : ''} / {transportRows.length} total
            </Text>
          )}
        />
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0 }}>Comptes Admins</Title>
        <Text type="secondary">
          Gestion des comptes administrateurs de la plateforme
        </Text>
      </div>

      <Tabs items={tabItems} defaultActiveKey="logistique" />

      <Drawer
        title={
          drawerRow && (
            <Space>
              <BankOutlined />
              <Text strong>{drawerRow.companyNom}</Text>
              {drawerRow.user ? (
                drawerRow.user.isActive
                  ? <Tag color="green" icon={<CheckCircleOutlined />}>Actif</Tag>
                  : <Tag color="red" icon={<StopOutlined />}>Inactif</Tag>
              ) : (
                <Tag color="warning">Sans admin</Tag>
              )}
            </Space>
          )
        }
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        style={{ width: 520 }}
      >
        {!drawerRow ? (
          <Spin />
        ) : (
          <>
            <Descriptions
              title={<><BankOutlined style={{ marginRight: 6 }} />Société</>}
              bordered
              column={1}
              size="small"
              style={{ marginBottom: 24 }}
            >
              <Descriptions.Item label="Nom">{drawerRow.companyNom}</Descriptions.Item>
              {drawerRow.companyCode && (
                <Descriptions.Item label="Code">{drawerRow.companyCode}</Descriptions.Item>
              )}
              <Descriptions.Item label="Créée le">
                {dayjs(drawerRow.companyCreatedAt).format('DD/MM/YYYY')}
              </Descriptions.Item>
            </Descriptions>

            {drawerRow.user ? (
              <Descriptions
                title={<><UserOutlined style={{ marginRight: 6 }} />Compte administrateur</>}
                bordered
                column={1}
                size="small"
              >
                <Descriptions.Item label="Prénom">{drawerRow.user.prenom}</Descriptions.Item>
                <Descriptions.Item label="Nom">{drawerRow.user.nom}</Descriptions.Item>
                <Descriptions.Item label="Email">{drawerRow.user.email}</Descriptions.Item>
                <Descriptions.Item label="Statut">
                  <Switch
                    checked={drawerRow.user.isActive}
                    checkedChildren="Actif"
                    unCheckedChildren="Inactif"
                    onChange={() => handleToggle(drawerRow.user!)}
                    size="small"
                  />
                </Descriptions.Item>
              </Descriptions>
            ) : (
              <Empty description="Aucun compte administrateur assigné à  cette société" />
            )}
          </>
        )}
      </Drawer>
    </div>
  );
};

export default CompaniesPage;

