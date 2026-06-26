import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography, Table, Tag, Button, Modal, Form, Select, DatePicker,
  Input, InputNumber, Switch, Space, message, Popconfirm, Row, Col,
  Divider, Badge,
} from 'antd';
import {
  TruckOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  CheckCircleOutlined, ClockCircleOutlined, PhoneOutlined, UserOutlined,
  CalendarOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { transportPortalAPI } from '../../api';

const { Title, Text } = Typography;

const TRUCK_TYPES = ['Plateau', 'Frigorifique', 'Semi-remorque', 'Citerne', 'Benne', 'Fourgon'];

interface Declaration {
  id: string;
  dateDebut: string;
  dateFin: string | null;
  chauffeurNom: string | null;
  chauffeurTel: string | null;
  isActive: boolean;
}

interface FleetEntry {
  id: string;
  matricule: string;
  capaciteTonnage: number;
  capacitePalettes: number;
  type: string | null;
  isActive: boolean;
  declaration: Declaration | null;
}

const TransportPortalPage: React.FC = () => {
  const [fleet, setFleet] = useState<FleetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTruck, setEditingTruck] = useState<FleetEntry | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hasAvailability, setHasAvailability] = useState(false);
  const [form] = Form.useForm();

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
    setHasAvailability(false);
    form.resetFields();
    form.setFieldsValue({ disponible: true });
    setModalOpen(true);
  };

  const openEdit = (entry: FleetEntry) => {
    setEditingTruck(entry);
    const decl = entry.declaration;
    setHasAvailability(!!decl);
    form.setFieldsValue({
      matricule: entry.matricule,
      type: entry.type,
      capaciteTonnage: entry.capaciteTonnage,
      capacitePalettes: entry.capacitePalettes,
      dateDebut: decl?.dateDebut ? dayjs(decl.dateDebut) : null,
      dateFin: decl?.dateFin ? dayjs(decl.dateFin) : null,
      chauffeurNom: decl?.chauffeurNom ?? '',
      chauffeurTel: decl?.chauffeurTel ?? '',
      disponible: decl?.isActive ?? true,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      const payload: any = {
        matricule: values.matricule,
        type: values.type ?? null,
        capaciteTonnage: values.capaciteTonnage,
        capacitePalettes: values.capacitePalettes ?? 0,
      };

      if (hasAvailability && values.dateDebut) {
        payload.dateDebut = values.dateDebut.format('YYYY-MM-DD');
        payload.dateFin = values.dateFin ? values.dateFin.format('YYYY-MM-DD') : null;
        payload.chauffeurNom = values.chauffeurNom || null;
        payload.chauffeurTel = values.chauffeurTel || null;
        payload.disponible = values.disponible !== false;
      }

      if (editingTruck) {
        await transportPortalAPI.updateTruck(editingTruck.id, payload);
        message.success('Camion mis à jour');
      } else {
        await transportPortalAPI.createTruck(payload);
        message.success('Camion ajouté');
      }
      setModalOpen(false);
      fetchFleet();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleDisponible = async (entry: FleetEntry) => {
    try {
      await transportPortalAPI.updateTruck(entry.id, {
        disponible: !entry.declaration?.isActive,
      });
      message.success(entry.declaration?.isActive ? 'Marqué indisponible' : 'Marqué disponible');
      fetchFleet();
    } catch {
      message.error('Erreur');
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

  const available = fleet.filter((f) => f.declaration?.isActive);
  const unavailable = fleet.filter((f) => f.declaration && !f.declaration.isActive);
  const noDeclaration = fleet.filter((f) => !f.declaration);

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
      title: 'Disponibilité',
      key: 'disponibilite',
      render: (_: any, entry: FleetEntry) => {
        const decl = entry.declaration;
        if (!decl) return <Text type="secondary" style={{ fontSize: 11 }}>Non renseignée</Text>;
        return (
          <Space size={4}>
            <CalendarOutlined style={{ color: '#fa8c16', fontSize: 11 }} />
            <Text style={{ fontSize: 12 }}>{dayjs(decl.dateDebut).format('DD/MM/YYYY')}</Text>
            {decl.dateFin ? (
              <>
                <Text type="secondary" style={{ fontSize: 11 }}>→</Text>
                <Text style={{ fontSize: 12 }}>{dayjs(decl.dateFin).format('DD/MM/YYYY')}</Text>
              </>
            ) : (
              <Tag color="blue" style={{ fontSize: 10 }}>Illimitée</Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Chauffeur',
      key: 'chauffeur',
      render: (_: any, entry: FleetEntry) => {
        const decl = entry.declaration;
        if (!decl?.chauffeurNom) return <Text type="secondary" style={{ fontSize: 11 }}>—</Text>;
        return (
          <Space direction="vertical" size={1}>
            <Space size={4}>
              <UserOutlined style={{ fontSize: 11, color: '#595959' }} />
              <Text style={{ fontSize: 12 }}>{decl.chauffeurNom}</Text>
            </Space>
            {decl.chauffeurTel && (
              <Space size={4}>
                <PhoneOutlined style={{ fontSize: 10, color: '#8c8c8c' }} />
                <Text type="secondary" style={{ fontSize: 11 }}>{decl.chauffeurTel}</Text>
              </Space>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Statut',
      key: 'statut',
      width: 120,
      render: (_: any, entry: FleetEntry) => {
        const decl = entry.declaration;
        if (!decl) return <Tag style={{ fontSize: 11 }}>Aucune dispo</Tag>;
        return (
          <Switch
            checked={decl.isActive}
            checkedChildren="Disponible"
            unCheckedChildren="Indispo"
            onChange={() => handleToggleDisponible(entry)}
            style={{ backgroundColor: decl.isActive ? '#52c41a' : undefined }}
          />
        );
      },
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_: any, entry: FleetEntry) => (
        <Space size={4}>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(entry)} />
          <Popconfirm
            title={`Supprimer le camion ${entry.matricule} ?`}
            description="Le camion et sa disponibilité seront supprimés."
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
          <Text type="secondary">Gérez vos camions et leur disponibilité</Text>
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
              <div style={{ fontSize: 26, fontWeight: 800, color: '#52c41a', lineHeight: 1 }}>{available.length}</div>
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>Disponibles</div>
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
        <Col span={8}>
          <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #f0f0f0', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <ClockCircleOutlined style={{ fontSize: 26, color: '#bfbfbf' }} />
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#bfbfbf', lineHeight: 1 }}>{noDeclaration.length}</div>
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>Sans disponibilité</div>
            </div>
          </div>
        </Col>
      </Row>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 10, border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#fafafa', display: 'flex', alignItems: 'center', gap: 10 }}>
          <TruckOutlined style={{ color: '#13c2c2' }} />
          <Text strong>Mes camions</Text>
          <Badge count={available.length} style={{ backgroundColor: '#52c41a' }} />
          <Text type="secondary" style={{ fontSize: 11 }}>/ {fleet.length} total</Text>
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

      {/* Modal ajouter / modifier */}
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
        width={520}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 12 }}>

          {/* ── Infos camion ── */}
          <Divider style={{ fontSize: 12, color: '#666', margin: '0 0 12px' }}>
            Informations du camion
          </Divider>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="matricule"
                label="Matricule"
                rules={[{ required: true, message: 'Matricule requis' }]}
              >
                <Input
                  placeholder="123TUN01"
                  style={{ fontFamily: 'monospace', textTransform: 'uppercase' }}
                  disabled={!!editingTruck}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="type" label="Type">
                <Select
                  placeholder="Type de camion"
                  allowClear
                  options={TRUCK_TYPES.map((t) => ({ value: t, label: t }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="capaciteTonnage"
                label="Capacité (tonnes)"
                rules={[{ required: true, message: 'Capacité requise' }]}
              >
                <InputNumber min={0.1} step={0.5} style={{ width: '100%' }} placeholder="10" addonAfter="T" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="capacitePalettes" label="Nb palettes">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="20" />
              </Form.Item>
            </Col>
          </Row>

          {/* ── Disponibilité ── */}
          <Divider style={{ fontSize: 12, color: '#666', margin: '4px 0 12px' }}>
            <Space size={8}>
              Disponibilité
              <Switch
                size="small"
                checked={hasAvailability}
                onChange={setHasAvailability}
                checkedChildren="Renseignée"
                unCheckedChildren="Non renseignée"
              />
            </Space>
          </Divider>

          {hasAvailability && (
            <>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    name="dateDebut"
                    label="Date de début"
                    rules={[{ required: true, message: 'Date requise' }]}
                  >
                    <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="dateFin" label="Date de fin (optionnel)">
                    <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="chauffeurNom" label="Nom du chauffeur">
                    <Input prefix={<UserOutlined />} placeholder="Nom du chauffeur" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="chauffeurTel" label="Téléphone">
                    <Input prefix={<PhoneOutlined />} placeholder="+216 XX XXX XXX" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="disponible" label="Statut de disponibilité" valuePropName="checked">
                <Switch checkedChildren="Disponible" unCheckedChildren="Indisponible" defaultChecked />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default TransportPortalPage;
