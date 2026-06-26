import React, { useEffect, useState } from 'react';
import {
  Table, Button, Space, Modal, Form, Input, Select, message,
  Popconfirm, Typography, Tag, Tabs, Badge, Tooltip, Spin,
} from 'antd';
import {
  SendOutlined, MailOutlined, ReloadOutlined, DeleteOutlined,
  ExclamationCircleOutlined, StopOutlined, CheckCircleOutlined, UserOutlined,
} from '@ant-design/icons';
import { expediteurPortalAPI, invitationsAPI } from '../../api';
import { User, Role, Invitation, Filiere } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const ROLE_COLORS: Record<string, string> = {
  [Role.MAGASINIER]: 'green',
  [Role.SECURITE]: 'orange',
};
const ROLE_LABELS: Record<string, string> = {
  [Role.MAGASINIER]: 'Magasinier',
  [Role.SECURITE]: 'Agent Sécurité',
};

const FiliereAdminUsersPage: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingInvitations, setLoadingInvitations] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [inviteForm] = Form.useForm();

  const myFilieres: Filiere[] = user?.filieres ?? [];
  const myFiliereIds = myFilieres.map((f) => f.id);

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
  }, []);

  const handleInviteSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      await invitationsAPI.create({
        email: values.email,
        role: values.role,
        nom: values.nom,
        prenom: values.prenom,
        filiereIds: myFiliereIds,
        companyId: user?.company?.id,
      });
      message.success('Compte créé et identifiants envoyés par email');
      setInviteOpen(false);
      inviteForm.resetFields();
      fetchUsers();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Erreur');
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

  const userColumns = [
    {
      title: 'Nom complet',
      key: 'nom',
      render: (_: any, u: User) => (
        <Space size={6}>
          <UserOutlined style={{ color: '#eb2f96' }} />
          <Text strong>{u.prenom} {u.nom}</Text>
        </Space>
      ),
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
      width: 100,
      render: (_: any, u: User) => (
        <Space size={4}>
          <Tooltip title={u.isActive ? 'Désactiver' : 'Activer'}>
            <Popconfirm
              title={u.isActive ? `Désactiver ${u.prenom} ${u.nom} ?` : `Activer ${u.prenom} ${u.nom} ?`}
              onConfirm={() => handleToggleActive(u)}
              okText="Confirmer"
              cancelText="Annuler"
              okButtonProps={{ danger: u.isActive }}
            >
              <Button
                size="small"
                icon={u.isActive ? <StopOutlined /> : <CheckCircleOutlined />}
                style={{ color: u.isActive ? '#fa8c16' : '#52c41a', borderColor: u.isActive ? '#fa8c16' : '#52c41a' }}
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
          <Tooltip title="Renvoyer">
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

  if (loadingUsers && loadingInvitations) {
    return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><Spin /></div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Utilisateurs de ma filière</Title>
        <Button
          type="primary"
          icon={<SendOutlined />}
          style={{ background: '#eb2f96', borderColor: '#eb2f96' }}
          onClick={() => { inviteForm.resetFields(); setInviteOpen(true); }}
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
                locale={{ emptyText: 'Aucun utilisateur dans cette filière' }}
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
        title="Créer un compte utilisateur"
        open={inviteOpen}
        onCancel={() => setInviteOpen(false)}
        onOk={() => inviteForm.submit()}
        confirmLoading={submitting}
        okText="Créer le compte"
        cancelText="Annuler"
        okButtonProps={{ style: { background: '#eb2f96', borderColor: '#eb2f96' } }}
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
            <Input prefix={<MailOutlined />} placeholder="agent@societe.tn" />
          </Form.Item>
          <Form.Item name="role" label="Rôle" rules={[{ required: true, message: 'Choisissez un rôle' }]}>
            <Select
              placeholder="Sélectionner un rôle"
              options={[
                { value: Role.MAGASINIER, label: 'Magasinier' },
                { value: Role.SECURITE, label: 'Agent Sécurité' },
              ]}
            />
          </Form.Item>
        </Form>
        <div style={{ color: '#888', fontSize: 12, marginTop: 8 }}>
          Le compte sera créé immédiatement. Un email contenant les identifiants de connexion sera envoyé à l'utilisateur.
        </div>
      </Modal>
    </div>
  );
};

export default FiliereAdminUsersPage;
