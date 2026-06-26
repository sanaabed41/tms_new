import React, { useEffect, useState } from 'react';
import {
  Table, Button, Space, Modal, Form, Input, Select, Popconfirm,
  message, Typography, Tag, Switch, Tooltip,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { quaisAPI, expediteursAPI } from '../../api';
import { Quai, SocieteExpeditrice, Filiere } from '../../types';

const { Title } = Typography;

const QuaisPage: React.FC = () => {
  const [quais, setQuais] = useState<Quai[]>([]);
  const [societes, setSocietes] = useState<SocieteExpeditrice[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Quai | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const [selectedSocieteId, setSelectedSocieteId] = useState<string | null>(null);

  const fetchAll = async () => {
    const [quaisRes, socRes] = await Promise.all([quaisAPI.getAll(), expediteursAPI.getAll()]);
    setQuais(quaisRes.data);
    setSocietes(socRes.data);
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => {
    setEditing(null);
    setSelectedSocieteId(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (q: Quai) => {
    setEditing(q);
    setSelectedSocieteId(q.societeExpeditrice?.id ?? null);
    form.setFieldsValue({
      nom: q.nom,
      isActive: q.isActive,
      societeExpeditriceId: q.societeExpeditrice?.id ?? null,
      filiereId: q.filiere?.id ?? null,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      if (editing) {
        await quaisAPI.update(editing.id, values);
        message.success('Quai mis à  jour');
      } else {
        await quaisAPI.create(values);
        message.success('Quai créé');
      }
      setModalOpen(false);
      fetchAll();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await quaisAPI.delete(id);
      message.success('Quai supprimé');
      fetchAll();
    } catch {
      message.error('Erreur lors de la suppression');
    }
  };

  const filiereOptions: Filiere[] = selectedSocieteId
    ? (societes.find((s) => s.id === selectedSocieteId)?.filieres ?? [])
    : [];

  const columns = [
    {
      title: 'Nom du quai',
      dataIndex: 'nom',
      key: 'nom',
      render: (v: string) => <strong>{v}</strong>,
    },
    {
      title: 'Société expéditrice',
      key: 'soc',
      render: (_: any, q: Quai) =>
        q.societeExpeditrice
          ? <Tag color={q.societeExpeditrice.couleur || 'blue'}>{q.societeExpeditrice.nom}</Tag>
          : <Tag>Générique</Tag>,
    },
    {
      title: 'Filière',
      key: 'fil',
      render: (_: any, q: Quai) => q.filiere ? <Tag>{q.filiere.code}- {q.filiere.nom}</Tag> : '-',
    },
    {
      title: 'Actif',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? 'Actif' : 'Inactif'}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
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
        <Title level={3} style={{ margin: 0 }}>Gestion des quais</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Nouveau quai
        </Button>
      </div>

      <Table
        dataSource={quais}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 20 }}
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
            <Input placeholder="Ex: QPW1, Quai 3, QAMT-Aâ€¦" />
          </Form.Item>

          <Form.Item name="societeExpeditriceId" label="Société expéditrice (optionnel)">
            <Select
              allowClear
              placeholder="Sélectionner une société (laisser vide = générique)"
              onChange={(val) => {
                setSelectedSocieteId(val ?? null);
                form.setFieldValue('filiereId', null);
              }}
            >
              {societes.map((s) => (
                <Select.Option key={s.id} value={s.id}>
                  <Tag color={s.couleur || 'blue'} style={{ marginRight: 6 }}>{s.code}</Tag>{s.nom}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="filiereId" label="Filière (optionnel)">
            <Select
              allowClear
              placeholder={selectedSocieteId ? 'Sélectionner une filière' : 'Choisir d\'abord une société'}
              disabled={!selectedSocieteId}
            >
              {filiereOptions.map((f) => (
                <Select.Option key={f.id} value={f.id}>{f.code}- {f.nom}</Select.Option>
              ))}
            </Select>
          </Form.Item>

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

export default QuaisPage;

