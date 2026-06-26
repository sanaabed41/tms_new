import React, { useEffect, useState, useMemo } from 'react';
import {
  Table, Button, Space, Modal, Form, Input, InputNumber, Select, message,
  Popconfirm, Typography, Tag, Switch, Row, Col, Segmented,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined,
  TruckOutlined, SearchOutlined,
} from '@ant-design/icons';
import { trucksAPI, deliveryCompaniesAPI } from '../../api';
import { Truck, DeliveryCompany } from '../../types';

const { Title, Text } = Typography;

const TRUCK_TYPES = ['Palette', 'Citerne', 'Frigo', 'Benne', 'Standard'];

const TYPE_COLORS: Record<string, string> = {
  Palette: '#722ed1',
  Citerne: '#1890ff',
  Frigo: '#13c2c2',
  Benne: '#fa8c16',
  Standard: '#8c8c8c',
};

const TrucksPage: React.FC = () => {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [dcs, setDcs] = useState<DeliveryCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Truck | null>(null);
  const [form] = Form.useForm();

  const [search, setSearch] = useState('');
  const [filterCompany, setFilterCompany] = useState<string | undefined>();
  const [filterType, setFilterType] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('active');

  const fetchData = () => {
    setLoading(true);
    Promise.all([trucksAPI.getAll(), deliveryCompaniesAPI.getAll()])
      .then(([t, d]) => { setTrucks(t.data); setDcs(d.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const filteredTrucks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return trucks.filter((t) => {
      if (filterStatus === 'active' && !t.isActive) return false;
      if (filterStatus === 'inactive' && t.isActive) return false;
      if (filterCompany && t.deliveryCompany?.id !== filterCompany) return false;
      if (filterType && t.type !== filterType) return false;
      if (q && !t.matricule.toLowerCase().includes(q) && !(t.type || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [trucks, search, filterCompany, filterType, filterStatus]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true, capacitePalettes: 0 });
    setModalOpen(true);
  };

  const openEdit = (truck: Truck) => {
    setEditing(truck);
    form.setFieldsValue({ ...truck, deliveryCompanyId: truck.deliveryCompany?.id });
    setModalOpen(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editing) {
        await trucksAPI.update(editing.id, values);
        message.success('Camion mis à  jour');
      } else {
        await trucksAPI.create(values);
        message.success('Camion créé');
      }
      setModalOpen(false);
      fetchData();
    } catch {
      message.error('Erreur');
    }
  };

  const toggleActive = async (truck: Truck) => {
    try {
      await trucksAPI.update(truck.id, { isActive: !truck.isActive });
      fetchData();
    } catch {
      message.error('Erreur');
    }
  };

  const activeTrucks = trucks.filter((t) => t.isActive).length;

  const columns = [
    {
      title: 'Matricule',
      dataIndex: 'matricule',
      key: 'matricule',
      sorter: (a: Truck, b: Truck) => a.matricule.localeCompare(b.matricule),
      render: (v: string) => (
        <Text strong style={{ fontFamily: 'monospace', letterSpacing: '0.5px' }}>{v}</Text>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (v: string) => {
        const color = TYPE_COLORS[v] || '#8c8c8c';
        return v ? (
          <Tag style={{
            background: color + '18', color, borderColor: color + '55',
            fontWeight: 600, fontSize: 11,
          }}>{v}</Tag>
        ) : '-';
      },
    },
    {
      title: 'Capacité',
      key: 'capacite',
      render: (_: any, t: Truck) => (
        <Space size={4}>
          <Tag color="blue" style={{ fontSize: 11 }}>{t.capaciteTonnage} T</Tag>
          {t.capacitePalettes > 0 && (
            <Tag color="purple" style={{ fontSize: 11 }}>{t.capacitePalettes} pal</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Société',
      key: 'dc',
      sorter: (a: Truck, b: Truck) =>
        (a.deliveryCompany?.nom || '').localeCompare(b.deliveryCompany?.nom || ''),
      render: (_: any, t: Truck) => t.deliveryCompany?.nom || '-',
    },
    {
      title: 'Actif',
      dataIndex: 'isActive',
      key: 'status',
      render: (v: boolean, truck: Truck) => (
        <Switch
          checked={v}
          size="small"
          onChange={() => toggleActive(truck)}
          checkedChildren="Actif"
          unCheckedChildren="Inactif"
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, truck: Truck) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(truck)} />
          <Popconfirm
            title={`Supprimer le camion ${truck.matricule} ?`}
            description="Cette action est irréversible."
            icon={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
            onConfirm={() => trucksAPI.delete(truck.id).then(fetchData)}
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
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <TruckOutlined style={{ fontSize: 22, color: '#1890ff' }} />
          <div>
            <Title level={3} style={{ margin: 0 }}>Camions</Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {activeTrucks} actif{activeTrucks !== 1 ? 's' : ''} Â· {trucks.length} au total
            </Text>
          </div>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Nouveau Camion
        </Button>
      </div>

      {/* Filters */}
      <Row gutter={[12, 8]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Input
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            placeholder="Matricule, typeâ€¦"
            allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Col>
        <Col xs={12} sm={5}>
          <Select
            placeholder="Société"
            allowClear
            value={filterCompany}
            onChange={setFilterCompany}
            style={{ width: '100%' }}
            options={dcs.map((d) => ({ value: d.id, label: d.nom }))}
          />
        </Col>
        <Col xs={12} sm={4}>
          <Select
            placeholder="Type"
            allowClear
            value={filterType}
            onChange={setFilterType}
            style={{ width: '100%' }}
            options={TRUCK_TYPES.map((t) => ({ value: t, label: t }))}
          />
        </Col>
        <Col xs={24} sm={7}>
          <Segmented
            value={filterStatus}
            onChange={(v) => setFilterStatus(v as any)}
            options={[
              { label: 'Tous', value: 'all' },
              { label: 'Actifs', value: 'active' },
              { label: 'Inactifs', value: 'inactive' },
            ]}
          />
        </Col>
      </Row>

      <Table
        dataSource={filteredTrucks}
        columns={columns}
        rowKey="id"
        size="middle"
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `${total} camion${total !== 1 ? 's' : ''}`,
        }}
      />

      <Modal
        title={editing ? `Modifier- ${editing.matricule}` : 'Nouveau Camion'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        okText="Enregistrer"
        cancelText="Annuler"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="matricule" label="Matricule" rules={[{ required: true }]}>
            <Input placeholder="ex: 123TU456" disabled={!!editing} />
          </Form.Item>
          <Form.Item name="type" label="Type de camion">
            <Select
              placeholder="Sélectionner un typeâ€¦"
              allowClear
              options={TRUCK_TYPES.map((t) => ({ value: t, label: t }))}
            />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="capaciteTonnage" label="Capacité (T)" rules={[{ required: true }]}>
                <InputNumber min={0} step={0.5} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="capacitePalettes" label="Capacité palettes">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="deliveryCompanyId" label="Société de livraison" rules={[{ required: true }]}>
            <Select
              options={dcs.map((d) => ({ value: d.id, label: d.nom }))}
              placeholder="Sélectionnerâ€¦"
            />
          </Form.Item>
          <Form.Item name="isActive" label="Statut" valuePropName="checked">
            <Switch checkedChildren="Actif" unCheckedChildren="Inactif" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TrucksPage;

