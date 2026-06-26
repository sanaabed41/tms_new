import React, { useEffect, useState, useCallback } from 'react';
import {
  Card, Table, Tag, Typography, Button, Modal, Form, Input, Space,
  message, Popconfirm, Select, Switch, Tooltip,
} from 'antd';
import {
  EditOutlined, DeleteOutlined, PlusOutlined, ApartmentOutlined,
  InboxOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import { expediteurPortalAPI } from '../../api';
import { SocieteExpeditrice, Filiere, Quai } from '../../types';

const { Title, Text } = Typography;

const FilieresPage: React.FC = () => {
  const [societe, setSociete] = useState<SocieteExpeditrice | null>(null);
  const [quais, setQuais] = useState<Quai[]>([]);

  const [filiereModalOpen, setFiliereModalOpen] = useState(false);
  const [editingFiliere, setEditingFiliere] = useState<Filiere | null>(null);
  const [quaiModalOpen, setQuaiModalOpen] = useState(false);
  const [editingQuai, setEditingQuai] = useState<Quai | null>(null);

  const [saving, setSaving] = useState(false);
  const [filiereForm] = Form.useForm();
  const [quaiForm] = Form.useForm();

  const fetch = useCallback(() => {
    Promise.all([
      expediteurPortalAPI.getMySociete(),
      expediteurPortalAPI.getMyQuais(),
    ]).then(([sRes, qRes]) => {
      setSociete(sRes.data);
      setQuais(qRes.data);
    });
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const openFiliereCreate = () => {
    setEditingFiliere(null);
    filiereForm.resetFields();
    setFiliereModalOpen(true);
  };

  const openFiliereEdit = (f: Filiere) => {
    setEditingFiliere(f);
    filiereForm.setFieldsValue({ nom: f.nom, code: f.code });
    setFiliereModalOpen(true);
  };

  const handleFiliereSubmit = async (values: any) => {
    setSaving(true);
    try {
      if (editingFiliere) {
        await expediteurPortalAPI.updateFiliere(editingFiliere.id, values);
        message.success('Filière mise à jour');
      } else {
        await expediteurPortalAPI.createFiliere(values);
        message.success('Filière créée');
      }
      setFiliereModalOpen(false);
      fetch();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Erreur');
    } finally { setSaving(false); }
  };

  const handleFiliereDelete = async (id: string) => {
    try {
      await expediteurPortalAPI.deleteFiliere(id);
      message.success('Filière supprimée');
      fetch();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Erreur');
    }
  };

  const openQuaiCreate = () => {
    setEditingQuai(null);
    quaiForm.resetFields();
    setQuaiModalOpen(true);
  };

  const openQuaiEdit = (q: Quai) => {
    setEditingQuai(q);
    quaiForm.setFieldsValue({
      nom: q.nom, isActive: q.isActive, filiereId: q.filiere?.id ?? null,
    });
    setQuaiModalOpen(true);
  };

  const handleQuaiSubmit = async (values: any) => {
    setSaving(true);
    try {
      const payload = {
        nom: values.nom,
        isActive: values.isActive ?? true,
        filiereId: values.filiereId ?? null,
      };
      if (editingQuai) {
        await expediteurPortalAPI.updateQuai(editingQuai.id, payload);
        message.success('Quai mis à jour');
      } else {
        await expediteurPortalAPI.createQuai(payload);
        message.success('Quai créé');
      }
      setQuaiModalOpen(false);
      fetch();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Erreur');
    } finally { setSaving(false); }
  };

  const handleQuaiDelete = async (id: string) => {
    try {
      await expediteurPortalAPI.deleteQuai(id);
      message.success('Quai supprimé');
      fetch();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Erreur');
    }
  };

  const filiereOptions = (societe?.filieres ?? []).map((f: Filiere) => ({
    value: f.id,
    label: `${f.code} – ${f.nom}`,
  }));

  const filiereColumns = [
    { title: 'Code', dataIndex: 'code', key: 'code', width: 80 },
    { title: 'Nom', dataIndex: 'nom', key: 'nom' },
    {
      title: 'Quais',
      key: 'quais',
      render: (_: any, f: Filiere) => {
        const fq = quais.filter((q) => q.filiere?.id === f.id);
        if (!fq.length) return <Text type="secondary">—</Text>;
        return (
          <Space size={4} wrap>
            {fq.map((q) => (
              <Tag key={q.id} icon={<InboxOutlined />} color={q.isActive ? 'cyan' : 'default'}>
                {q.nom}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: any, f: Filiere) => (
        <Space>
          <Tooltip title="Modifier">
            <Button size="small" icon={<EditOutlined />} onClick={() => openFiliereEdit(f)} />
          </Tooltip>
          <Popconfirm
            title={`Supprimer la filière "${f.nom}" ?`}
            description="Les BLs liés à cette filière seront déliés."
            icon={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
            onConfirm={() => handleFiliereDelete(f.id)}
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

  const quaiColumns = [
    { title: 'Nom', dataIndex: 'nom', key: 'nom' },
    {
      title: 'Filière',
      key: 'filiere',
      render: (_: any, q: Quai) =>
        q.filiere ? <Tag color="purple">{q.filiere.code || q.filiere.nom}</Tag>
          : <Text type="secondary">Générique</Text>,
    },
    {
      title: 'Statut',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? 'Actif' : 'Inactif'}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: any, q: Quai) => (
        <Space>
          <Tooltip title="Modifier">
            <Button size="small" icon={<EditOutlined />} onClick={() => openQuaiEdit(q)} />
          </Tooltip>
          <Popconfirm
            title={`Supprimer le quai "${q.nom}" ?`}
            icon={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
            onConfirm={() => handleQuaiDelete(q.id)}
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
      <Title level={3} style={{ marginTop: 0, marginBottom: 16 }}>Filières & Quais</Title>

      <Card
        style={{ marginBottom: 20 }}
        title={<><ApartmentOutlined style={{ marginRight: 8, color: '#722ed1' }} />Filières</>}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openFiliereCreate}
            style={{ background: '#722ed1', borderColor: '#722ed1' }}>
            Nouvelle filière
          </Button>
        }
      >
        <Table
          dataSource={societe?.filieres ?? []}
          columns={filiereColumns}
          rowKey="id"
          pagination={false}
          locale={{ emptyText: 'Aucune filière — créez-en une pour commencer' }}
        />
      </Card>

      <Card
        title={<><InboxOutlined style={{ marginRight: 8, color: '#722ed1' }} />Quais</>}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openQuaiCreate}
            style={{ background: '#722ed1', borderColor: '#722ed1' }}>
            Nouveau quai
          </Button>
        }
      >
        <Table
          dataSource={quais}
          columns={quaiColumns}
          rowKey="id"
          pagination={false}
          locale={{ emptyText: 'Aucun quai — créez-en un et assignez-le à une filière' }}
        />
      </Card>

      <Modal
        title={editingFiliere ? 'Modifier la filière' : 'Nouvelle filière'}
        open={filiereModalOpen}
        onCancel={() => setFiliereModalOpen(false)}
        onOk={() => filiereForm.submit()}
        confirmLoading={saving}
        okText={editingFiliere ? 'Enregistrer' : 'Créer'}
        cancelText="Annuler"
      >
        <Form form={filiereForm} layout="vertical" onFinish={handleFiliereSubmit}>
          <Form.Item name="nom" label="Nom" rules={[{ required: true }]}>
            <Input placeholder="Ex: Alimentation & Minoterie Tunisie" />
          </Form.Item>
          <Form.Item name="code" label="Code (unique)" rules={[{ required: true }]}>
            <Input placeholder="Ex: AMT" maxLength={10} style={{ textTransform: 'uppercase' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingQuai ? 'Modifier le quai' : 'Nouveau quai'}
        open={quaiModalOpen}
        onCancel={() => setQuaiModalOpen(false)}
        onOk={() => quaiForm.submit()}
        confirmLoading={saving}
        okText={editingQuai ? 'Enregistrer' : 'Créer'}
        cancelText="Annuler"
      >
        <Form form={quaiForm} layout="vertical" onFinish={handleQuaiSubmit}>
          <Form.Item name="nom" label="Nom du quai" rules={[{ required: true }]}>
            <Input placeholder="Ex: QAMT1" />
          </Form.Item>
          <Form.Item name="filiereId" label="Filière assignée">
            <Select
              placeholder="Laisser vide = quai générique"
              options={filiereOptions}
              allowClear
            />
          </Form.Item>
          {editingQuai && (
            <Form.Item name="isActive" label="Statut" valuePropName="checked">
              <Switch checkedChildren="Actif" unCheckedChildren="Inactif" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default FilieresPage;
