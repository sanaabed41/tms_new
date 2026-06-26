import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, Popconfirm, Typography, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, TruckOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { deliveryCompaniesAPI } from '../../api';
import { DeliveryCompany } from '../../types';

const { Title } = Typography;

const DeliveryCompaniesPage: React.FC = () => {
  const [dcs, setDcs] = useState<DeliveryCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DeliveryCompany | null>(null);
  const [form] = Form.useForm();

  const fetchData = () => {
    setLoading(true);
    deliveryCompaniesAPI.getAll().then((res) => setDcs(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const openEdit = (dc: DeliveryCompany) => { setEditing(dc); form.setFieldsValue(dc); setModalOpen(true); };

  const handleSubmit = async (values: any) => {
    try {
      if (editing) { await deliveryCompaniesAPI.update(editing.id, values); message.success('Mis à  jour'); }
      else { await deliveryCompaniesAPI.create(values); message.success('Créé'); }
      setModalOpen(false);
      fetchData();
    } catch { message.error('Erreur'); }
  };

  const columns = [
    { title: 'Nom', dataIndex: 'nom', key: 'nom' },
    { title: 'Adresse', dataIndex: 'adresse', key: 'adresse', render: (v: string) => v || '-' },
    { title: 'Téléphone', dataIndex: 'telephone', key: 'telephone', render: (v: string) => v || '-' },
    { title: 'Camions', key: 'trucks', render: (_: any, dc: DeliveryCompany) => <Tag icon={<TruckOutlined />} color="blue">{dc.camions?.length || 0} camions</Tag> },
    {
      title: 'Actions', key: 'actions',
      render: (_: any, dc: DeliveryCompany) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(dc)} />
          <Popconfirm
            title={`Supprimer Â« ${dc.nom} Â» ?`}
            description="Tous les camions associés seront également supprimés."
            icon={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
            onConfirm={() => deliveryCompaniesAPI.delete(dc.id).then(fetchData)}
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
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Sociétés de Livraison</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Nouvelle Société</Button>
      </div>
      <Table dataSource={dcs} columns={columns} rowKey="id" />
      <Modal title={editing ? 'Modifier' : 'Nouvelle Société de Livraison'} open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="nom" label="Nom" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="adresse" label="Adresse"><Input /></Form.Item>
          <Form.Item name="telephone" label="Téléphone"><Input /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DeliveryCompaniesPage;

