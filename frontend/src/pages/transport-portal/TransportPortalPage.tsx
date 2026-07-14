import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography, Table, Tag, Button, Modal, Form,
  Input, InputNumber, Space, message, Popconfirm, Row, Col,
  Badge, Select,
} from 'antd';
import {
  TruckOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  CheckCircleOutlined, StopOutlined, PhoneOutlined, UserOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { transportPortalAPI } from '../../api';

const { Title, Text } = Typography;

const TRUCK_TYPES = ['Plateau', 'Frigorifique', 'Semi-remorque', 'Citerne', 'Benne', 'Fourgon', 'FRIGO', 'VRAC', 'PALETTE', 'CITERNE'];

interface TodayAvailability {
  id: string;
  statut: 'DISPONIBLE' | 'INDISPONIBLE';
  motif: string | null;
  date: string;
}

interface FleetEntry {
  id: string;
  matricule: string;
  capaciteTonnage: number;
  capacitePalettes: number;
  type: string | null;
  isActive: boolean;
  chauffeurNom: string | null;
  chauffeurTel: string | null;
  todayAvailability: TodayAvailability | null;
}

const TransportPortalPage: React.FC = () => {
  const [fleet, setFleet] = useState<FleetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [availModalOpen, setAvailModalOpen] = useState(false);
  const [editingTruck, setEditingTruck] = useState<FleetEntry | null>(null);
  const [availTruck, setAvailTruck] = useState<FleetEntry | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [availForm] = Form.useForm();

  const fetchFleet = useCallback(async () => {
    setLoading(true);
    try {
      const res = await transportPortalAPI.getFleet();
      setFleet(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFleet(); }, [fetchFleet]);

  const openCreate = () => {
    setEditingTruck(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (entry: FleetEntry) => {
    setEditingTruck(entry);
    form.setFieldsValue({
      matricule: entry.matricule,
      type: entry.type,
      capaciteTonnage: entry.capaciteTonnage,
      capacitePalettes: entry.capacitePalettes,
      chauffeurNom: entry.chauffeurNom ?? '',
      chauffeurTel: entry.chauffeurTel ?? '',
    });
    setModalOpen(true);
  };

  const openAvailModal = (entry: FleetEntry) => {
    setAvailTruck(entry);
    const currentStatut = entry.todayAvailability?.statut ?? 'DISPONIBLE';
    availForm.setFieldsValue({
      statut: currentStatut,
      motif: entry.todayAvailability?.motif ?? '',
    });
    setAvailModalOpen(true);
  };

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      const payload: any = {
        matricule: values.matricule,
        type: values.type ?? null,
        capaciteTonnage: values.capaciteTonnage,
        capacitePalettes: values.capacitePalettes ?? 0,
        chauffeurNom: values.chauffeurNom || null,
        chauffeurTel: values.chauffeurTel || null,
      };

      if (editingTruck) {
        await transportPortalAPI.updateTruck(editingTruck.id, payload);
        message.success('Camion mis à jour');
      } else {
        await transportPortalAPI.createTruck(payload);
        message.success('Camion ajouté — disponible par défaut aujourd\'hui');
      }
      setModalOpen(false);
      fetchFleet();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAvailSubmit = async (values: any) => {
    if (!availTruck) return;
    setSubmitting(true);
    try {
      await transportPortalAPI.setAvailability(availTruck.id, {
        statut: values.statut,
        motif: values.statut === 'INDISPONIBLE' ? (values.motif || null) : null,
      });
      message.success(values.statut === 'DISPONIBLE' ? 'Camion marqué disponible' : 'Camion marqué indisponible');
      setAvailModalOpen(false);
      fetchFleet();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await transportPortalAPI.removeTruck(id);
      message.success('Camion supprimé');
      fetchFleet();
    } catch {
      message.error('Erreur lors de la suppression');
    }
  };

  const disponibles  = fleet.filter((f) => f.todayAvailability?.statut === 'DISPONIBLE');
  const indisponibles = fleet.filter((f) => f.todayAvailability?.statut === 'INDISPONIBLE');
  const sansRecord   = fleet.filter((f) => !f.todayAvailability);

  const columns = [
    {
      title: 'Matricule',
      key: 'matricule',
      render: (_: any, entry: FleetEntry) => (
        <Space size={6}>
          <TruckOutlined style={{ color: '#13c2c2' }} />
          <Text strong style={{ fontFamily: 'monospace' }}>{entry.matricule}</Text>
          {entry.type && <Tag style={{ fontSize: 10, margin: 0 }}>{entry.type}</Tag>}
        </Space>
      ),
    },
    {
      title: 'Capacité',
      key: 'capacite',
      render: (_: any, entry: FleetEntry) => (
        <Space size={4}>
          <Tag color="blue" style={{ fontSize: 11 }}>{entry.capaciteTonnage} T</Tag>
          {entry.capacitePalettes > 0 && (
            <Tag color="purple" style={{ fontSize: 11 }}>{entry.capacitePalettes} pal.</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Chauffeur',
      key: 'chauffeur',
      render: (_: any, entry: FleetEntry) => {
        if (!entry.chauffeurNom) return <Text type="secondary" style={{ fontSize: 11 }}>—</Text>;
        return (
          <Space direction="vertical" size={1}>
            <Space size={4}>
              <UserOutlined style={{ fontSize: 11, color: '#595959' }} />
              <Text style={{ fontSize: 12 }}>{entry.chauffeurNom}</Text>
            </Space>
            {entry.chauffeurTel && (
              <Space size={4}>
                <PhoneOutlined style={{ fontSize: 10, color: '#8c8c8c' }} />
                <Text type="secondary" style={{ fontSize: 11 }}>{entry.chauffeurTel}</Text>
              </Space>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Statut aujourd\'hui',
      key: 'statut',
      render: (_: any, entry: FleetEntry) => {
        const avail = entry.todayAvailability;
        if (!avail) {
          return <Tag color="default" style={{ fontSize: 11 }}>Non renseigné</Tag>;
        }
        if (avail.statut === 'DISPONIBLE') {
          return <Tag color="success" icon={<CheckCircleOutlined />}>Disponible</Tag>;
        }
        return (
          <Space direction="vertical" size={1}>
            <Tag color="error" icon={<StopOutlined />}>Indisponible</Tag>
            {avail.motif && <Text type="secondary" style={{ fontSize: 10 }}>{avail.motif}</Text>}
          </Space>
        );
      },
    },
    {
      title: '',
      key: 'actions',
      width: 120,
      render: (_: any, entry: FleetEntry) => (
        <Space size={4}>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(entry)} />
          <Button
            size="small"
            icon={entry.todayAvailability?.statut === 'DISPONIBLE' ? <StopOutlined /> : <CheckCircleOutlined />}
            style={{
              color: entry.todayAvailability?.statut === 'DISPONIBLE' ? '#fa8c16' : '#52c41a',
              borderColor: entry.todayAvailability?.statut === 'DISPONIBLE' ? '#fa8c16' : '#52c41a',
            }}
            onClick={() => openAvailModal(entry)}
          />
          <Popconfirm
            title={`Supprimer ${entry.matricule} ?`}
            icon={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
            onConfirm={() => handleDelete(entry.id)}
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Ma Flotte</Title>
          <Text type="secondary">Gérez vos camions et leur disponibilité du jour</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreate}
          style={{ background: '#13c2c2', borderColor: '#13c2c2' }}
        >
          Ajouter un camion
        </Button>
      </div>

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={8}>
          <div style={{ background: '#f6ffed', borderRadius: 8, border: '1px solid #b7eb8f', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <CheckCircleOutlined style={{ fontSize: 26, color: '#52c41a' }} />
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#52c41a', lineHeight: 1 }}>{disponibles.length}</div>
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>Disponibles aujourd'hui</div>
            </div>
          </div>
        </Col>
        <Col span={8}>
          <div style={{ background: '#fff2e8', borderRadius: 8, border: '1px solid #ffbb96', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <StopOutlined style={{ fontSize: 26, color: '#fa8c16' }} />
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#fa8c16', lineHeight: 1 }}>{indisponibles.length + sansRecord.length}</div>
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>Indisponibles / non renseignés</div>
            </div>
          </div>
        </Col>
        <Col span={8}>
          <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #f0f0f0', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <TruckOutlined style={{ fontSize: 26, color: '#13c2c2' }} />
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#13c2c2', lineHeight: 1 }}>{fleet.length}</div>
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>Total camions</div>
            </div>
          </div>
        </Col>
      </Row>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 10, border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#fafafa', display: 'flex', alignItems: 'center', gap: 10 }}>
          <TruckOutlined style={{ color: '#13c2c2' }} />
          <Text strong>Mes camions</Text>
          <Badge count={disponibles.length} style={{ backgroundColor: '#52c41a' }} />
          <Text type="secondary" style={{ fontSize: 11 }}>disponibles / {fleet.length} total</Text>
        </div>
        <Table
          dataSource={fleet}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          size="small"
          locale={{ emptyText: 'Aucun camion — cliquez sur "Ajouter un camion"' }}
        />
      </div>

      {/* Modal ajouter / modifier camion */}
      <Modal
        title={
          <Space>
            <TruckOutlined style={{ color: '#13c2c2' }} />
            {editingTruck ? `Modifier — ${editingTruck.matricule}` : 'Ajouter un camion'}
          </Space>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        okText={editingTruck ? 'Modifier' : 'Ajouter'}
        cancelText="Annuler"
        confirmLoading={submitting}
        okButtonProps={{ style: { background: '#13c2c2', borderColor: '#13c2c2' } }}
        width={480}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 12 }}>
          <Row gutter={12}>
            <Col span={14}>
              <Form.Item name="matricule" label="Matricule" rules={[{ required: true, message: 'Matricule requis' }]}>
                <Input placeholder="TU-123-456" size="large" style={{ fontFamily: 'monospace' }} />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="type" label="Type">
                <Select placeholder="Type" size="large" allowClear>
                  {TRUCK_TYPES.map((t) => <Select.Option key={t} value={t}>{t}</Select.Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="capaciteTonnage" label="Capacité (tonnes)" rules={[{ required: true, message: 'Requis' }]}>
                <InputNumber min={1} max={100} size="large" style={{ width: '100%' }} addonAfter="T" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="capacitePalettes" label="Capacité (palettes)">
                <InputNumber min={0} max={50} size="large" style={{ width: '100%' }} addonAfter="pal." />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="chauffeurNom" label="Nom du chauffeur">
                <Input prefix={<UserOutlined />} placeholder="Ben Ali Mohamed" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="chauffeurTel" label="Téléphone">
                <Input prefix={<PhoneOutlined />} placeholder="+216 20 000 000" size="large" />
              </Form.Item>
            </Col>
          </Row>
          {!editingTruck && (
            <div style={{ background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#52c41a' }}>
              ✓ Le camion sera automatiquement marqué <strong>Disponible</strong> pour aujourd'hui.
            </div>
          )}
        </Form>
      </Modal>

      {/* Modal disponibilité */}
      <Modal
        title={
          <Space>
            <TruckOutlined style={{ color: '#13c2c2' }} />
            Disponibilité — {availTruck?.matricule}
          </Space>
        }
        open={availModalOpen}
        onCancel={() => setAvailModalOpen(false)}
        onOk={() => availForm.submit()}
        okText="Confirmer"
        cancelText="Annuler"
        confirmLoading={submitting}
        width={380}
      >
        <Form form={availForm} layout="vertical" onFinish={handleAvailSubmit} style={{ marginTop: 12 }}>
          <Form.Item name="statut" label="Statut" rules={[{ required: true }]}>
            <Select size="large">
              <Select.Option value="DISPONIBLE">
                <Space><CheckCircleOutlined style={{ color: '#52c41a' }} />Disponible</Space>
              </Select.Option>
              <Select.Option value="INDISPONIBLE">
                <Space><StopOutlined style={{ color: '#ff4d4f' }} />Indisponible</Space>
              </Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prev, curr) => prev.statut !== curr.statut}
          >
            {({ getFieldValue }) =>
              getFieldValue('statut') === 'INDISPONIBLE' ? (
                <Form.Item name="motif" label="Motif d'indisponibilité">
                  <Input placeholder="Ex : En panne, Révision, Accident…" size="large" />
                </Form.Item>
              ) : null
            }
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TransportPortalPage;
