import React, { useCallback, useEffect, useState } from 'react';
import {
  Button, Form, Input, Modal, Popconfirm,
  Space, Switch, Table, Tag, Tooltip, Typography, message,
} from 'antd';
import {
  DeleteOutlined, EditOutlined, ExclamationCircleOutlined,
  InboxOutlined, PlusOutlined,
} from '@ant-design/icons';
import { expediteurPortalAPI } from '../../api';
import { Quai } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

const { Title } = Typography;

const FiliereAdminQuaisPage: React.FC = () => {
  const { user } = useAuth();
  const [quais, setQuais] = useState<Quai[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Quai | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // The filiere(s) this admin manages
  const myFiliereIds = (user?.filieres ?? []).map((f) => f.id);
  const myFilieres   = user?.filieres ?? [];

  const fetchQuais = useCallback(async () => {
    setLoading(true);
    try {
      const res = await expediteurPortalAPI.getMyQuais();
      // Keep only quais belonging to this user's filières
      const filtered = (res.data as Quai[]).filter(
        (q) => !q.filiere || myFiliereIds.includes(q.filiere.id),
      );
      setQuais(filtered);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchQuais(); }, [fetchQuais]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      filiereId: myFilieres.length === 1 ? myFilieres[0].id : undefined,
    });
    setModalOpen(true);
  };

  const openEdit = (q: Quai) => {
    setEditing(q);
    form.setFieldsValue({
      nom: q.nom,
      isActive: q.isActive,
      filiereId: q.filiere?.id ?? undefined,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      if (editing) {
        await expediteurPortalAPI.updateQuai(editing.id, values);
        message.success('Quai mis à  jour');
      } else {
        await expediteurPortalAPI.createQuai(values);
        message.success('Quai créé');
      }
      setModalOpen(false);
      fetchQuais();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await expediteurPortalAPI.deleteQuai(id);
      message.success('Quai supprimé');
      fetchQuais();
    } catch {
      message.error('Erreur lors de la suppression');
    }
  };

  const handleToggle = async (q: Quai) => {
    try {
      await expediteurPortalAPI.updateQuai(q.id, { isActive: !q.isActive });
      fetchQuais();
    } catch {
      message.error('Erreur');
    }
  };

  const columns = [
    {
      title: 'Nom du quai',
      dataIndex: 'nom',
      key: 'nom',
      render: (v: string) => <strong>{v}</strong>,
    },
    {
      title: 'Filière',
      key: 'filiere',
      render: (_: any, q: Quai) =>
        q.filiere
          ? <Tag color="magenta">{q.filiere.code}- {q.filiere.nom}</Tag>
          : <Tag>Sans filière</Tag>,
    },
    {
      title: 'Actif',
      key: 'isActive',
      width: 90,
      render: (_: any, q: Quai) => (
        <Switch
          checked={q.isActive}
          onChange={() => handleToggle(q)}
          checkedChildren="Actif"
          unCheckedChildren="Inactif"
          size="small"
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: any, q: Quai) => (
        <Space>
          <Tooltip title="Modifier">
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(q)} />
          </Tooltip>
          <Popconfirm
            title={`Supprimer Â« ${q.nom} Â» ?`}
            icon={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
            onConfirm={() => handleDelete(q.id)}
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0, color: '#eb2f96' }}>
          <InboxOutlined style={{ marginRight: 8 }} />
          Mes Quais
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}
          style={{ background: '#eb2f96', borderColor: '#eb2f96' }}>
          Nouveau quai
        </Button>
      </div>

      <Table
        dataSource={quais}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 20 }}
        locale={{ emptyText: 'Aucun quai configuré' }}
      />

      <Modal
        title={editing ? 'Modifier le quai' : 'Nouveau quai'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText={editing ? 'Enregistrer' : 'Créer'}
        cancelText="Annuler"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="nom" label="Nom du quai" rules={[{ required: true, message: 'Nom requis' }]}>
            <Input placeholder="Ex: QAMT-1, Quai Aâ€¦" />
          </Form.Item>


          {myFilieres.length > 1 && (
            <Form.Item name="filiereId" label="Filière">
              <select style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #d9d9d9' }}>
                <option value="">- Sélectionner-</option>
                {myFilieres.map((f) => (
                  <option key={f.id} value={f.id}>{f.code}- {f.nom}</option>
                ))}
              </select>
            </Form.Item>
          )}

          {editing && (
            <Form.Item name="isActive" label="Actif" valuePropName="checked">
              <Switch checkedChildren="Actif" unCheckedChildren="Inactif" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default FiliereAdminQuaisPage;

