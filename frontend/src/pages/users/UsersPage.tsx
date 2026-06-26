import React, { useEffect, useState } from 'react';
import {
  Table, Button, Space, Modal, Form, Input, Select, message,
  Popconfirm, Typography, Tag, Tabs, Badge, Tooltip,
} from 'antd';
import {
  EditOutlined, DeleteOutlined, ApartmentOutlined,
  MailOutlined, ReloadOutlined, SendOutlined, ExclamationCircleOutlined,
  StopOutlined, CheckCircleOutlined, TruckOutlined, BankOutlined,
} from '@ant-design/icons';
import { usersAPI, invitationsAPI, expediteursAPI } from '../../api';
import { User, Role, Invitation, SocieteExpeditrice } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const roleColors: Record<string, string> = {
  [Role.SUPER_ADMIN]: 'red',
  [Role.LOGISTIC_ADMIN]: 'blue',
  [Role.EXPEDITEUR_ADMIN]: 'purple',
  [Role.FILIERE_ADMIN]: 'magenta',
  [Role.MAGASINIER]: 'green',
  [Role.SECURITE]: 'orange',
  [Role.TRANSPORT_ADMIN]: 'cyan',
};

const roleLabels: Record<string, string> = {
  [Role.SUPER_ADMIN]: 'Super Admin',
  [Role.LOGISTIC_ADMIN]: 'Resp. Logistique',
  [Role.EXPEDITEUR_ADMIN]: 'Admin Expéditeur',
  [Role.FILIERE_ADMIN]: 'Admin Filière',
  [Role.MAGASINIER]: 'Magasinier',
  [Role.SECURITE]: 'Agent Sécurité',
  [Role.TRANSPORT_ADMIN]: 'Admin Transport',
};

// ── Vue simplifiée pour LOGISTIC_ADMIN ──────────────────────────────────────

const TransportAdminsView: React.FC<{
  users: User[];
  invitations: Invitation[];
  loadingUsers: boolean;
  loadingInvitations: boolean;
  onRefreshUsers: () => void;
  onRefreshInvitations: () => void;
}> = ({ users, invitations, loadingUsers, loadingInvitations, onRefreshUsers, onRefreshInvitations }) => {
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [inviteForm] = Form.useForm();

  const transportAdmins = users.filter((u) => u.role === Role.TRANSPORT_ADMIN);
  const pendingInvitations = invitations.filter((i) => !i.isUsed);

  const handleInviteSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      await invitationsAPI.create({
        email: values.email,
        role: Role.TRANSPORT_ADMIN,
        nom: values.nom,
        prenom: values.prenom,
        deliveryCompanyNom: values.deliveryCompanyNom,
      });
      message.success('Compte créé et identifiants envoyés par email');
      setInviteModalOpen(false);
      inviteForm.resetFields();
      onRefreshUsers();
    } catch (err: any) {
      message.error(err.response?.data?.message || "Erreur lors de la création du compte");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async (id: string) => {
    try {
      await invitationsAPI.resend(id);
      message.success('Invitation renvoyée');
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Erreur');
    }
  };

  const handleDeleteInvitation = async (id: string) => {
    try {
      await invitationsAPI.delete(id);
      message.success('Invitation annulée');
      onRefreshInvitations();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Erreur');
    }
  };

  const userColumns = [
    {
      title: 'Nom complet',
      key: 'nom',
      render: (_: any, u: User) => (
        <Space size={6}>
          <TruckOutlined style={{ color: '#13c2c2' }} />
          <Text strong>{u.prenom} {u.nom}</Text>
        </Space>
      ),
    },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Société de transport',
      key: 'deliveryCompany',
      render: (_: any, u: User) =>
        u.deliveryCompany
          ? <Tag color="cyan">{u.deliveryCompany.nom}</Tag>
          : <Text type="secondary">—</Text>,
    },
    {
      title: 'Statut',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'orange'}>{active ? 'Actif' : 'Inactif'}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, u: User) => (
        <Space>
          <Popconfirm
            title={u.isActive ? `Désactiver ${u.prenom} ${u.nom} ?` : `Activer ${u.prenom} ${u.nom} ?`}
            description={u.isActive ? "L'utilisateur ne pourra plus se connecter." : "L'utilisateur pourra à nouveau se connecter."}
            icon={<ExclamationCircleOutlined style={{ color: u.isActive ? '#fa8c16' : '#52c41a' }} />}
            onConfirm={() => usersAPI.toggleActive(u.id).then(onRefreshUsers)}
            okText={u.isActive ? 'Désactiver' : 'Activer'}
            cancelText="Annuler"
            okButtonProps={{ danger: u.isActive }}
          >
            <Button
              size="small"
              icon={u.isActive ? <StopOutlined /> : <CheckCircleOutlined />}
              style={{ color: u.isActive ? '#fa8c16' : '#52c41a', borderColor: u.isActive ? '#fa8c16' : '#52c41a' }}
            />
          </Popconfirm>
          <Popconfirm
            title={`Supprimer ${u.prenom} ${u.nom} ?`}
            description="L'utilisateur perdra tout accès à l'application."
            icon={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
            onConfirm={() => usersAPI.delete(u.id).then(onRefreshUsers)}
            okText="Supprimer"
            cancelText="Annuler"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const invitationColumns = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => <><MailOutlined style={{ marginRight: 6 }} />{email}</>,
    },
    {
      title: 'Société de transport',
      key: 'deliveryCompanyNom',
      render: (_: any, inv: Invitation) =>
        inv.deliveryCompanyNom
          ? <Tag color="cyan"><BankOutlined style={{ marginRight: 4 }} />{inv.deliveryCompanyNom}</Tag>
          : <Text type="secondary">—</Text>,
    },
    {
      title: 'Expire le',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      render: (d: string) => {
        const expired = dayjs(d).isBefore(dayjs());
        return <Tag color={expired ? 'red' : 'default'}>{dayjs(d).format('DD/MM/YYYY HH:mm')}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, inv: Invitation) => (
        <Space>
          <Tooltip title="Renvoyer l'invitation">
            <Button size="small" icon={<ReloadOutlined />} onClick={() => handleResend(inv.id)}>
              Renvoyer
            </Button>
          </Tooltip>
          <Popconfirm
            title={`Annuler l'invitation pour ${inv.email} ?`}
            description="Le lien d'invitation sera invalidé."
            icon={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
            onConfirm={() => handleDeleteInvitation(inv.id)}
            okText="Annuler l'invitation"
            cancelText="Garder"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Admins Transport</Title>
          <Text type="secondary">Invitez les responsables de vos sociétés de transport partenaires</Text>
        </div>
        <Button
          type="primary"
          icon={<SendOutlined />}
          style={{ background: '#13c2c2', borderColor: '#13c2c2' }}
          onClick={() => { inviteForm.resetFields(); setInviteModalOpen(true); }}
        >
          Inviter un Admin Transport
        </Button>
      </div>

      <Tabs
        defaultActiveKey="users"
        items={[
          {
            key: 'users',
            label: (
              <span>
                <TruckOutlined /> Admins actifs
                {transportAdmins.length > 0 && (
                  <Badge count={transportAdmins.length} size="small" style={{ marginLeft: 6, backgroundColor: '#13c2c2' }} />
                )}
              </span>
            ),
            children: (
              <Table
                dataSource={transportAdmins}
                columns={userColumns}
                rowKey="id"
                loading={loadingUsers}
                pagination={{ pageSize: 10 }}
                locale={{ emptyText: 'Aucun admin transport pour le moment' }}
              />
            ),
          },
          {
            key: 'invitations',
            label: (
              <span>
                Invitations en attente{' '}
                {pendingInvitations.length > 0 && (
                  <Badge count={pendingInvitations.length} size="small" style={{ marginLeft: 4 }} />
                )}
              </span>
            ),
            children: (
              <Table
                dataSource={pendingInvitations}
                columns={invitationColumns}
                rowKey="id"
                loading={loadingInvitations}
                pagination={{ pageSize: 10 }}
                locale={{ emptyText: 'Aucune invitation en attente' }}
              />
            ),
          },
        ]}
      />

      <Modal
        title={
          <Space>
            <TruckOutlined style={{ color: '#13c2c2' }} />
            Créer un compte Admin Transport
          </Space>
        }
        open={inviteModalOpen}
        onCancel={() => setInviteModalOpen(false)}
        onOk={() => inviteForm.submit()}
        confirmLoading={submitting}
        okText="Créer le compte"
        cancelText="Annuler"
        okButtonProps={{ style: { background: '#13c2c2', borderColor: '#13c2c2' } }}
        width={460}
      >
        <Form form={inviteForm} layout="vertical" onFinish={handleInviteSubmit} style={{ marginTop: 12 }}>
          <Form.Item
            name="prenom"
            label="Prénom"
            rules={[{ required: true, message: 'Prénom requis' }]}
          >
            <Input placeholder="Mohammed" size="large" />
          </Form.Item>
          <Form.Item
            name="nom"
            label="Nom"
            rules={[{ required: true, message: 'Nom requis' }]}
          >
            <Input placeholder="Ben Ali" size="large" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Adresse email"
            rules={[{ required: true, type: 'email', message: 'Email valide requis' }]}
          >
            <Input prefix={<MailOutlined />} placeholder="admin@transport.tn" size="large" />
          </Form.Item>
          <Form.Item
            name="deliveryCompanyNom"
            label="Nom de la société de transport"
            rules={[{ required: true, message: 'Saisissez le nom de la société' }]}
          >
            <Input prefix={<BankOutlined />} placeholder="Ex: Transport Express SARL" size="large" />
          </Form.Item>
        </Form>
        <div style={{ marginTop: 4, color: '#888', fontSize: 12 }}>
          Le compte sera créé immédiatement. Un email contenant les identifiants de connexion sera envoyé à l'admin transport.
        </div>
      </Modal>
    </div>
  );
};

// ── Vue complète pour SUPER_ADMIN ────────────────────────────────────────────

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [societes, setSocietes] = useState<SocieteExpeditrice[]>([]);
  const [inviteRole, setInviteRole] = useState<Role | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingInvitations, setLoadingInvitations] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [filiereModalOpen, setFiliereModalOpen] = useState(false);
  const [filiereUser, setFiliereUser] = useState<User | null>(null);
  const [selectedFiliereIds, setSelectedFiliereIds] = useState<string[]>([]);
  const [savingFilieres, setSavingFilieres] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editForm] = Form.useForm();
  const [inviteForm] = Form.useForm();
  const { isRole } = useAuth();

  const isLogisticAdmin = isRole(Role.LOGISTIC_ADMIN);

  const fetchUsers = () => {
    setLoadingUsers(true);
    usersAPI.getAll().then((res) => setUsers(res.data)).finally(() => setLoadingUsers(false));
  };

  const fetchInvitations = () => {
    setLoadingInvitations(true);
    invitationsAPI.getAll().then((res) => setInvitations(res.data)).finally(() => setLoadingInvitations(false));
  };

  useEffect(() => {
    fetchUsers();
    fetchInvitations();
    if (!isLogisticAdmin) {
      expediteursAPI.getAll().then((res) => setSocietes(res.data)).catch(() => {});
    }
  }, []);

  // Delegate to simplified view for logistic admin
  if (isLogisticAdmin) {
    return (
      <TransportAdminsView
        users={users}
        invitations={invitations}
        loadingUsers={loadingUsers}
        loadingInvitations={loadingInvitations}
        onRefreshUsers={fetchUsers}
        onRefreshInvitations={fetchInvitations}
      />
    );
  }

  // ── SUPER_ADMIN full view ─────────────────────────────────────────────────

  const handleEditSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      await usersAPI.update(editing!.id, values);
      message.success('Utilisateur mis à jour');
      setEditModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInviteSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      await invitationsAPI.create(values);
      message.success('Compte créé et identifiants envoyés par email');
      setInviteModalOpen(false);
      inviteForm.resetFields();
      fetchUsers();
    } catch (err: any) {
      message.error(err.response?.data?.message || "Erreur lors de la création du compte");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async (id: string) => {
    try {
      await invitationsAPI.resend(id);
      message.success('Invitation renvoyée');
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Erreur');
    }
  };

  const handleDeleteInvitation = async (id: string) => {
    try {
      await invitationsAPI.delete(id);
      message.success('Invitation supprimée');
      fetchInvitations();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Erreur');
    }
  };

  const openFiliereModal = (user: User) => {
    setFiliereUser(user);
    setSelectedFiliereIds((user.filieres ?? []).map((f) => f.id));
    setFiliereModalOpen(true);
  };

  const handleSaveFilieres = async () => {
    if (!filiereUser) return;
    setSavingFilieres(true);
    try {
      await usersAPI.setFilieres(filiereUser.id, selectedFiliereIds);
      message.success('Filières mises à jour');
      setFiliereModalOpen(false);
      fetchUsers();
    } catch {
      message.error('Erreur lors de la mise à jour');
    } finally {
      setSavingFilieres(false);
    }
  };

  const availableRoles = Object.values(Role);
  const canAssignFilieres = (role: Role) => role === Role.MAGASINIER || role === Role.SECURITE;

  const userColumns = [
    {
      title: 'Nom complet',
      key: 'nom',
      render: (_: any, u: User) => `${u.prenom} ${u.nom}`,
    },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Rôle',
      dataIndex: 'role',
      key: 'role',
      render: (r: Role) => <Tag color={roleColors[r]}>{roleLabels[r] || r}</Tag>,
    },
    {
      title: 'Statut',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'orange'}>{active ? 'Actif' : 'Inactif'}</Tag>
      ),
    },
    {
      title: 'Société',
      key: 'company',
      render: (_: any, u: User) => u.company?.nom || '-',
    },
    {
      title: 'Filières affectées',
      key: 'filieres',
      render: (_: any, u: User) => {
        if (!canAssignFilieres(u.role)) return <Text type="secondary" style={{ fontSize: 11 }}>—</Text>;
        const filieres = u.filieres ?? [];
        if (filieres.length === 0) return <Text type="secondary" style={{ fontSize: 11 }}>Aucune</Text>;
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {filieres.map((f) => (
              <Tag key={f.id} style={{ margin: 0, fontSize: 10 }}>{f.code || f.nom}</Tag>
            ))}
          </div>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, user: User) => (
        <Space>
          {canAssignFilieres(user.role) && (
            <Tooltip title="Affecter des filières">
              <Button size="small" icon={<ApartmentOutlined />} onClick={() => openFiliereModal(user)} />
            </Tooltip>
          )}
          <Tooltip title="Modifier">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setEditing(user);
                editForm.setFieldsValue({ prenom: user.prenom, nom: user.nom, role: user.role });
                setEditModalOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title={user.isActive ? 'Désactiver le compte' : 'Activer le compte'}>
            <Popconfirm
              title={user.isActive ? `Désactiver ${user.prenom} ${user.nom} ?` : `Activer ${user.prenom} ${user.nom} ?`}
              description={user.isActive ? "L'utilisateur ne pourra plus se connecter." : "L'utilisateur pourra à nouveau se connecter."}
              icon={<ExclamationCircleOutlined style={{ color: user.isActive ? '#fa8c16' : '#52c41a' }} />}
              onConfirm={() => usersAPI.toggleActive(user.id).then(fetchUsers)}
              okText={user.isActive ? 'Désactiver' : 'Activer'}
              cancelText="Annuler"
              okButtonProps={{ danger: user.isActive }}
            >
              <Button
                size="small"
                icon={user.isActive ? <StopOutlined /> : <CheckCircleOutlined />}
                style={{ color: user.isActive ? '#fa8c16' : '#52c41a', borderColor: user.isActive ? '#fa8c16' : '#52c41a' }}
              />
            </Popconfirm>
          </Tooltip>
          <Popconfirm
            title={`Supprimer ${user.prenom} ${user.nom} ?`}
            description="L'utilisateur perdra tout accès à l'application."
            icon={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
            onConfirm={() => usersAPI.delete(user.id).then(fetchUsers)}
            okText="Supprimer"
            cancelText="Annuler"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const pendingInvitations = invitations.filter((i) => !i.isUsed);

  const invitationColumns = [
    { title: 'Email', dataIndex: 'email', key: 'email', render: (email: string) => <><MailOutlined style={{ marginRight: 6 }} />{email}</> },
    {
      title: 'Rôle',
      dataIndex: 'role',
      key: 'role',
      render: (r: string) => <Tag color={roleColors[r]}>{roleLabels[r] || r}</Tag>,
    },
    {
      title: 'Expire le',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      render: (d: string) => {
        const expired = dayjs(d).isBefore(dayjs());
        return <Tag color={expired ? 'red' : 'default'}>{dayjs(d).format('DD/MM/YYYY HH:mm')}</Tag>;
      },
    },
    {
      title: 'Envoyée le',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d: string) => dayjs(d).format('DD/MM/YYYY'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, inv: Invitation) => (
        <Space>
          <Tooltip title="Renvoyer l'invitation">
            <Button size="small" icon={<ReloadOutlined />} onClick={() => handleResend(inv.id)}>
              Renvoyer
            </Button>
          </Tooltip>
          <Popconfirm
            title={`Annuler l'invitation pour ${inv.email} ?`}
            description="Le lien d'invitation sera invalidé."
            icon={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
            onConfirm={() => handleDeleteInvitation(inv.id)}
            okText="Annuler l'invitation"
            cancelText="Garder"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const allFiliereOptions = societes.flatMap((s) =>
    (s.filieres ?? []).map((f) => ({
      value: f.id,
      label: `${f.code || f.nom} — ${s.nom}`,
      groupLabel: s.nom,
    })),
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Gestion des utilisateurs</Title>
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={() => { inviteForm.resetFields(); setInviteRole(null); setInviteModalOpen(true); }}
        >
          Inviter un utilisateur
        </Button>
      </div>

      <Tabs
        defaultActiveKey="users"
        items={[
          {
            key: 'users',
            label: 'Utilisateurs actifs',
            children: (
              <Table
                dataSource={users}
                columns={userColumns}
                rowKey="id"
                loading={loadingUsers}
                pagination={{ pageSize: 10 }}
              />
            ),
          },
          {
            key: 'invitations',
            label: (
              <span>
                Invitations en attente{' '}
                {pendingInvitations.length > 0 && (
                  <Badge count={pendingInvitations.length} size="small" style={{ marginLeft: 4 }} />
                )}
              </span>
            ),
            children: (
              <Table
                dataSource={pendingInvitations}
                columns={invitationColumns}
                rowKey="id"
                loading={loadingInvitations}
                pagination={{ pageSize: 10 }}
                locale={{ emptyText: 'Aucune invitation en attente' }}
              />
            ),
          },
        ]}
      />

      {/* Edit User Modal */}
      <Modal
        title="Modifier l'utilisateur"
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={() => editForm.submit()}
        confirmLoading={submitting}
        okText="Enregistrer"
        cancelText="Annuler"
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditSubmit}>
          <Form.Item name="prenom" label="Prénom" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="nom" label="Nom" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="role" label="Rôle" rules={[{ required: true }]}>
            <Select options={availableRoles.map((r) => ({ value: r, label: roleLabels[r] || r }))} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Invite Modal */}
      <Modal
        title="Créer un compte utilisateur"
        open={inviteModalOpen}
        onCancel={() => { setInviteModalOpen(false); setInviteRole(null); }}
        onOk={() => inviteForm.submit()}
        confirmLoading={submitting}
        okText="Créer le compte"
        cancelText="Annuler"
      >
        <Form
          form={inviteForm}
          layout="vertical"
          onFinish={handleInviteSubmit}
          onValuesChange={(changed) => {
            if (changed.role !== undefined) {
              setInviteRole(changed.role);
              inviteForm.setFieldValue('deliveryCompanyNom', undefined);
            }
          }}
        >
          <Form.Item
            name="prenom"
            label="Prénom"
            rules={[{ required: true, message: 'Prénom requis' }]}
          >
            <Input placeholder="Mohammed" />
          </Form.Item>
          <Form.Item
            name="nom"
            label="Nom"
            rules={[{ required: true, message: 'Nom requis' }]}
          >
            <Input placeholder="Ben Ali" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: 'email', message: 'Email valide requis' }]}
          >
            <Input prefix={<MailOutlined />} placeholder="exemple@societe.tn" />
          </Form.Item>
          <Form.Item name="role" label="Rôle" rules={[{ required: true, message: 'Choisissez un rôle' }]}>
            <Select
              placeholder="Sélectionner un rôle"
              options={availableRoles.map((r) => ({ value: r, label: roleLabels[r] || r }))}
            />
          </Form.Item>
          {inviteRole === Role.TRANSPORT_ADMIN && (
            <Form.Item
              name="deliveryCompanyNom"
              label="Nom de la société de transport"
              rules={[{ required: true, message: 'Saisissez le nom de la société' }]}
            >
              <Input prefix={<BankOutlined />} placeholder="Ex: Transport Express SARL" />
            </Form.Item>
          )}
        </Form>
        <div style={{ marginTop: 8, color: '#888', fontSize: 12 }}>
          Le compte sera créé immédiatement. Un email contenant les identifiants de connexion sera envoyé à l'utilisateur.
        </div>
      </Modal>

      {/* Filière assignment modal */}
      <Modal
        title={
          <span>
            <ApartmentOutlined style={{ color: '#1890ff', marginRight: 8 }} />
            Filières — {filiereUser?.prenom} {filiereUser?.nom}
          </span>
        }
        open={filiereModalOpen}
        onCancel={() => setFiliereModalOpen(false)}
        onOk={handleSaveFilieres}
        confirmLoading={savingFilieres}
        okText="Enregistrer"
        cancelText="Annuler"
        width={480}
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 12 }}>
          Sélectionnez les filières auxquelles cet utilisateur a accès.
          Laisser vide = accès à toutes les filières.
        </Text>
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          placeholder="Sélectionner des filières…"
          value={selectedFiliereIds}
          onChange={setSelectedFiliereIds}
          options={allFiliereOptions}
          optionFilterProp="label"
          allowClear
        />
        {selectedFiliereIds.length > 0 && (
          <div style={{ marginTop: 10 }}>
            {selectedFiliereIds.map((id) => {
              const opt = allFiliereOptions.find((o) => o.value === id);
              return opt ? <Tag key={id} closable onClose={() => setSelectedFiliereIds((prev) => prev.filter((x) => x !== id))} style={{ marginBottom: 4 }}>{opt.label}</Tag> : null;
            })}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UsersPage;
