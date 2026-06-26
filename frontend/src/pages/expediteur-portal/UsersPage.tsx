import React, { useEffect, useState } from 'react';
import {
  Table, Button, Space, Modal, Form, Input, Select, message,
  Popconfirm, Typography, Tag, Tabs, Badge, Tooltip,
} from 'antd';
import {
  SendOutlined, MailOutlined, ReloadOutlined, DeleteOutlined,
  ExclamationCircleOutlined, StopOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import { expediteurPortalAPI, invitationsAPI } from '../../api';
import { User, Role, Invitation, SocieteExpeditrice, Filiere } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const ROLE_COLORS: Record<string, string> = {
  [Role.FILIERE_ADMIN]: 'magenta',
};
const ROLE_LABELS: Record<string, string> = {
  [Role.FILIERE_ADMIN]: 'Admin Filière',
};

const INVITABLE_ROLES = [Role.FILIERE_ADMIN];

const PortalUsersPage: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [societe, setSociete] = useState<SocieteExpeditrice | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingInvitations, setLoadingInvitations] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [inviteForm] = Form.useForm();

  const fetchUsers = () => {
    setLoadingUsers(true);
    expediteurPortalAPI.getMyUsers()
      .then((res) => setUsers(res.data))
      .finally(() => setLoadingUsers(false));
  };

  const fetchInvitations = () => {
    setLoadingInvitations(true);
    invitationsAPI.getAll(user?.company?.id)
      .then((res) => setInvitations(res.data))
      .finally(() => setLoadingInvitations(false));
  };

  useEffect(() => {
    fetchUsers();
    fetchInvitations();
    expediteurPortalAPI.getMySociete()
      .then((res) => setSociete(res.data))
      .catch(() => {});
  }, []);

  const handleInviteSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      await invitationsAPI.create({
        email: values.email,
        role: values.role,
        nom: values.nom,
        prenom: values.prenom,
        filiereIds: values.filiereId ? [values.filiereId] : [],
        companyId: user?.company?.id,
      });
      message.success('Compte créé et identifiants envoyés par email');
      setInviteOpen(false);
      inviteForm.resetFields();
      fetchUsers();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Erreur lors de la création du compte');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (u: User) => {
    try {
      await expediteurPortalAPI.toggleUserActive(u.id);
      message.success(u.isActive ? 'Compte désactivé' : 'Compte activé');
      fetchUsers();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Erreur');
    }
  };

  const handleDelete = async (u: User) => {
    try {
      await expediteurPortalAPI.deleteUser(u.id);
      message.success(`Compte de ${u.prenom} ${u.nom} supprimé`);
      fetchUsers();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Erreur');
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
      fetchInvitations();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Erreur');
    }
  };

  const filiereOptions = (societe?.filieres ?? []).map((f: Filiere) => ({
    value: f.id,
    label: `${f.code} — ${f.nom}`,
  }));

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
      render: (r: string) => <Tag color={ROLE_COLORS[r] ?? 'default'}>{ROLE_LABELS[r] ?? r}</Tag>,
    },
    {
      title: 'Statut',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'red'}>{active ? 'Actif' : 'Inactif'}</Tag>
      ),
    },
    {
      title: 'Filière',
      key: 'filieres',
      render: (_: any, u: User) => {
        const f = u.filieres?.[0];
        return f
          ? <Tag color="magenta" style={{ fontSize: 11 }}>{f.code} — {f.nom}</Tag>
          : <Text type="secondary" style={{ fontSize: 11 }}>—</Text>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, u: User) => (
        <Space size={4}>
          <Tooltip title={u.isActive ? 'Désactiver' : 'Activer'}>
            <Popconfirm
              title={u.isActive
                ? `Désactiver le compte de ${u.prenom} ${u.nom} ?`
                : `Activer le compte de ${u.prenom} ${u.nom} ?`}
              onConfirm={() => handleToggleActive(u)}
              okText="Confirmer"
              cancelText="Annuler"
              okButtonProps={{ danger: u.isActive }}
            >
              <Button
                size="small"
                icon={u.isActive ? <StopOutlined /> : <CheckCircleOutlined />}
                style={{
                  color: u.isActive ? '#fa8c16' : '#52c41a',
                  borderColor: u.isActive ? '#fa8c16' : '#52c41a',
                }}
              />
            </Popconfirm>
          </Tooltip>
          <Tooltip title="Supprimer le compte">
            <Popconfirm
              title={`Supprimer le compte de ${u.prenom} ${u.nom} ?`}
              description="Cette action est irréversible."
              icon={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
              onConfirm={() => handleDelete(u)}
              okText="Supprimer"
              cancelText="Annuler"
              okButtonProps={{ danger: true }}
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const pendingInvitations = invitations.filter((i) => !i.isUsed);

  const invitationColumns = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => <><MailOutlined style={{ marginRight: 6 }} />{email}</>,
    },
    {
      title: 'Rôle',
      dataIndex: 'role',
      key: 'role',
      render: (r: string) => <Tag color={ROLE_COLORS[r] ?? 'default'}>{ROLE_LABELS[r] ?? r}</Tag>,
    },
    {
      title: 'Filière',
      key: 'filiereIds',
      render: (_: any, inv: Invitation) => {
        const id = inv.filiereIds?.[0];
        if (!id) return <Text type="secondary" style={{ fontSize: 11 }}>—</Text>;
        const f = filiereOptions.find((o) => o.value === id);
        return f ? <Tag color="magenta" style={{ fontSize: 10 }}>{f.label}</Tag> : null;
      },
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Admins Filières</Title>
        <Button
          type="primary"
          icon={<SendOutlined />}
          style={{ background: '#722ed1', borderColor: '#722ed1' }}
          onClick={() => { inviteForm.resetFields(); setInviteOpen(true); }}
        >
          Inviter un admin filière
        </Button>
      </div>

      <Tabs
        defaultActiveKey="users"
        items={[
          {
            key: 'users',
            label: `Admins actifs (${users.length})`,
            children: (
              <Table
                dataSource={users}
                columns={userColumns}
                rowKey="id"
                loading={loadingUsers}
                pagination={{ pageSize: 10 }}
                locale={{ emptyText: 'Aucun admin filière' }}
              />
            ),
          },
          {
            key: 'invitations',
            label: (
              <span>
                Invitations en attente
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
        title="Créer un compte Admin Filière"
        open={inviteOpen}
        onCancel={() => setInviteOpen(false)}
        onOk={() => inviteForm.submit()}
        confirmLoading={submitting}
        okText="Créer le compte"
        cancelText="Annuler"
        okButtonProps={{ style: { background: '#722ed1', borderColor: '#722ed1' } }}
      >
        <Form form={inviteForm} layout="vertical" onFinish={handleInviteSubmit}>
          <Form.Item name="prenom" label="Prénom" rules={[{ required: true, message: 'Prénom requis' }]}>
            <Input placeholder="Mohammed" />
          </Form.Item>
          <Form.Item name="nom" label="Nom" rules={[{ required: true, message: 'Nom requis' }]}>
            <Input placeholder="Ben Ali" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: 'email', message: 'Email valide requis' }]}
          >
            <Input prefix={<MailOutlined />} placeholder="admin.filiere@societe.tn" />
          </Form.Item>
          <Form.Item name="role" label="Rôle" initialValue={Role.FILIERE_ADMIN} hidden>
            <Input />
          </Form.Item>
          <Form.Item
            name="filiereId"
            label="Filière à administrer"
            rules={[{ required: true, message: 'Sélectionnez la filière' }]}
          >
            <Select placeholder="Sélectionner la filière" options={filiereOptions} />
          </Form.Item>
        </Form>
        <div style={{ color: '#888', fontSize: 12, marginTop: 8 }}>
          Le compte sera créé immédiatement. Un email contenant les identifiants de connexion sera envoyé à l'admin filière.
        </div>
      </Modal>
    </div>
  );
};

export default PortalUsersPage;
