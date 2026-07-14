import React, { useEffect, useState } from 'react';
import {
  Table, Button, Tag, Space, Modal, Form, Input, InputNumber,
  DatePicker, Select, message, Popconfirm, Typography, Tabs, Badge,
  Tooltip, Divider, Row, Col,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined,
  ArrowRightOutlined, FileTextOutlined, EyeOutlined, ExclamationCircleOutlined,
  FileExcelOutlined,
} from '@ant-design/icons';
import { exportBonsLivraison } from '../../utils/exportExcel';
import BlDetailDrawer from './BlDetailDrawer';
import dayjs from 'dayjs';
import { blAPI, expediteursAPI } from '../../api';
import { BonLivraison, BlStatus, TypeChargement, Role, SocieteExpeditrice } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { getDestinationColor } from '../planning/BLCard';

const { Title, Text } = Typography;

const TUNISIAN_CITIES = [
  'Tunis', 'Ariana', 'Ben Arous', 'Manouba', 'Nabeul', 'Zaghouan', 'Bizerte',
  'Béja', 'Jendouba', 'Le Kef', 'Siliana', 'Sousse', 'Monastir', 'Mahdia',
  'Sfax', 'Kairouan', 'Kasserine', 'Sidi Bouzid', 'Gabès', 'Médenine',
  'Tataouine', 'Gafsa', 'Tozeur', 'Kébili',
];

const CITY_OPTIONS = TUNISIAN_CITIES.map((c) => ({ value: c, label: c }));

const STATUS_CONFIG: Record<BlStatus, { color: string; label: string }> = {
  [BlStatus.DRAFT]: { color: 'default', label: 'Brouillon' },
  [BlStatus.VALIDATED]: { color: 'blue', label: 'Validé' },
  [BlStatus.LOADED]: { color: 'orange', label: 'Chargé' },
  [BlStatus.DELIVERED]: { color: 'green', label: 'Livré' },
};

const TYPE_CONFIG: Record<TypeChargement, { color: string; label: string; icon: string }> = {
  [TypeChargement.VRAC]: { color: 'default', label: 'Vrac', icon: '📦' },
  [TypeChargement.PALETTE]: { color: 'purple', label: 'Palette', icon: '🪵' },
  [TypeChargement.FRIGO]: { color: 'cyan', label: 'Frigorifique', icon: '❄️' },
  [TypeChargement.CITERNE]: { color: 'geekblue', label: 'Citerne', icon: '🛢️' },
};

const BonsLivraisonPage: React.FC = () => {
  const [bls, setBls] = useState<BonLivraison[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBl, setEditingBl] = useState<BonLivraison | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [detailBl, setDetailBl] = useState<BonLivraison | null>(null);
  const [societes, setSocietes] = useState<SocieteExpeditrice[]>([]);
  const [selectedSocieteId, setSelectedSocieteId] = useState<string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [validatingSelection, setValidatingSelection] = useState(false);
  const [form] = Form.useForm();
  const { isRole } = useAuth();

  const canCreate = isRole(Role.SUPER_ADMIN);
  const canValidate = isRole(Role.SUPER_ADMIN);

  const fetchBls = () => {
    blAPI.getAll().then((res) => setBls(res.data));
  };

  useEffect(() => {
    fetchBls();
    expediteursAPI.getAll().then((res) => setSocietes(res.data));
  }, []);

  const openCreate = () => {
    setEditingBl(null);
    setSelectedSocieteId(null);
    form.resetFields();
    form.setFieldsValue({ typeChargement: TypeChargement.VRAC, nombrePalettes: 0 });
    setModalOpen(true);
  };

  const openEdit = (bl: BonLivraison) => {
    setEditingBl(bl);
    setSelectedSocieteId(bl.societeExpeditrice?.id ?? null);
    form.setFieldsValue({
      ...bl,
      datelivraison: bl.datelivraison ? dayjs(bl.datelivraison) : null,
      societeExpediticeId: bl.societeExpeditrice?.id ?? null,
      filiereId: bl.filiere?.id ?? null,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    const payload = {
      ...values,
      datelivraison: values.datelivraison?.toISOString(),
      societeExpediticeId: values.societeExpediticeId ?? null,
      filiereId: values.filiereId ?? null,
    };
    try {
      if (editingBl) {
        await blAPI.update(editingBl.id, payload);
        message.success('BL mis à jour');
      } else {
        await blAPI.create(payload);
        message.success('BL créé');
      }
      setModalOpen(false);
      fetchBls();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleValidate = async (bl: BonLivraison) => {
    try {
      await blAPI.update(bl.id, { statut: BlStatus.VALIDATED });
      message.success(`BL ${bl.numeroBl} validé`);
      fetchBls();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Erreur');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await blAPI.delete(id);
      message.success('BL supprimé');
      fetchBls();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Erreur');
    }
  };

  const handleValidateSelection = async () => {
    const draftSelected = selectedRowKeys.filter((id) =>
      bls.find((bl) => bl.id === id && bl.statut === BlStatus.DRAFT),
    );
    if (draftSelected.length === 0) return;
    setValidatingSelection(true);
    try {
      await Promise.all(draftSelected.map((id) => blAPI.update(id, { statut: BlStatus.VALIDATED })));
      message.success(`${draftSelected.length} BL${draftSelected.length > 1 ? 's' : ''} validé${draftSelected.length > 1 ? 's' : ''}`);
      setSelectedRowKeys([]);
      fetchBls();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Erreur lors de la validation');
    } finally {
      setValidatingSelection(false);
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys as string[]),
    getCheckboxProps: (record: BonLivraison) => ({
      disabled: record.statut !== BlStatus.DRAFT || !canValidate,
    }),
  };

  const columns = [
    {
      title: 'N° BL',
      dataIndex: 'numeroBl',
      key: 'numeroBl',
      sorter: (a: BonLivraison, b: BonLivraison) => a.numeroBl.localeCompare(b.numeroBl),
      render: (v: string) => <Text strong style={{ fontFamily: 'monospace' }}>{v}</Text>,
    },
    {
      title: 'Expéditeur',
      key: 'expediteur',
      render: (_: any, bl: BonLivraison) => bl.societeExpeditrice ? (
        <div>
          <Tag
            style={{
              fontSize: 11, fontWeight: 600,
              background: (bl.societeExpeditrice.couleur || '#1890ff') + '22',
              color: bl.societeExpeditrice.couleur || '#1890ff',
              borderColor: (bl.societeExpeditrice.couleur || '#1890ff') + '66',
            }}
          >
            {bl.societeExpeditrice.nom}
          </Tag>
          {bl.filiere && (
            <Text type="secondary" style={{ fontSize: 10, display: 'block' }}>{bl.filiere.nom}</Text>
          )}
        </div>
      ) : <Text type="secondary" style={{ fontSize: 11 }}>—</Text>,
    },
    {
      title: 'Client',
      dataIndex: 'clientNom',
      key: 'client',
      render: (nom: string, bl: BonLivraison) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>{nom}</Text>
          {bl.clientTelephone && <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>📞 {bl.clientTelephone}</Text>}
          {bl.clientAdresse && <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>{bl.clientAdresse}</Text>}
        </div>
      ),
    },
    {
      title: 'Trajet',
      key: 'trajet',
      render: (_: any, bl: BonLivraison) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Text style={{ fontSize: 12 }}>{bl.origine || '—'}</Text>
          <ArrowRightOutlined style={{ fontSize: 10, color: '#999' }} />
          <Tag
            color={getDestinationColor(bl.destination)}
            style={{ fontWeight: 600, fontSize: 11 }}
          >
            {bl.destination || '—'}
          </Tag>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'typeChargement',
      key: 'type',
      render: (t: TypeChargement) => {
        const cfg = TYPE_CONFIG[t] || TYPE_CONFIG[TypeChargement.VRAC];
        return <Tag color={cfg.color}>{cfg.icon} {cfg.label}</Tag>;
      },
    },
    {
      title: 'Charge',
      key: 'charge',
      render: (_: any, bl: BonLivraison) => (
        <div>
          <Tag color="blue" style={{ fontSize: 11 }}>{bl.tonnageTotal} T</Tag>
          {bl.nombrePalettes > 0 && <Tag color="purple" style={{ fontSize: 11 }}>{bl.nombrePalettes} pal.</Tag>}
        </div>
      ),
      sorter: (a: BonLivraison, b: BonLivraison) => a.tonnageTotal - b.tonnageTotal,
    },
    {
      title: 'Livraison',
      dataIndex: 'datelivraison',
      key: 'date',
      render: (d: string) => d ? dayjs(d).format('DD/MM/YYYY') : <Text type="secondary">—</Text>,
      sorter: (a: BonLivraison, b: BonLivraison) =>
        new Date(a.datelivraison).getTime() - new Date(b.datelivraison).getTime(),
    },
    {
      title: 'Statut',
      dataIndex: 'statut',
      key: 'statut',
      render: (s: BlStatus) => {
        const cfg = STATUS_CONFIG[s];
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
      filters: Object.entries(STATUS_CONFIG).map(([v, cfg]) => ({ text: cfg.label, value: v })),
      onFilter: (value: any, record: BonLivraison) => record.statut === value,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, bl: BonLivraison) => (
        <Space>
          <Tooltip title="Voir les détails">
            <Button size="small" icon={<EyeOutlined />} onClick={() => setDetailBl(bl)} />
          </Tooltip>
          {bl.statut === BlStatus.DRAFT && canValidate && (
            <Popconfirm
              title={`Valider le BL ${bl.numeroBl} ?`}
              description="Une fois validé, ce BL sera disponible pour le planning de chargement."
              icon={<ExclamationCircleOutlined style={{ color: '#1890ff' }} />}
              onConfirm={() => handleValidate(bl)}
              okText="Valider"
              cancelText="Annuler"
            >
              <Tooltip title="Valider ce BL">
                <Button size="small" type="primary" icon={<CheckCircleOutlined />}>
                  Valider
                </Button>
              </Tooltip>
            </Popconfirm>
          )}
          {canCreate && bl.statut === BlStatus.DRAFT && (
            <Tooltip title="Modifier">
              <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(bl)} />
            </Tooltip>
          )}
          {canCreate && bl.statut === BlStatus.DRAFT && (
            <Popconfirm
              title={`Supprimer le BL ${bl.numeroBl} ?`}
              description="Cette action est irréversible."
              icon={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
              onConfirm={() => handleDelete(bl.id)}
              okText="Supprimer"
              cancelText="Annuler"
              okButtonProps={{ danger: true }}
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // ── Filtres ──────────────────────────────────────────────────────────────
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  const [filterSociete, setFilterSociete] = useState<string | null>(null);
  const [filterFiliere, setFilterFiliere] = useState<string | null>(null);
  const [filterDest, setFilterDest] = useState<string | null>(null);
  const [filterOrigine, setFilterOrigine] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<TypeChargement | null>(null);
  const [filterStatut, setFilterStatut] = useState<BlStatus | null>(null);
  const [tonnageMin, setTonnageMin] = useState<number | null>(null);
  const [tonnageMax, setTonnageMax] = useState<number | null>(null);
  const [searchText, setSearchText] = useState('');

  const filterBls = (list: BonLivraison[]) => list.filter((bl) => {
    if (dateRange[0] && dateRange[1]) {
      const d = bl.datelivraison ? dayjs(bl.datelivraison) : null;
      if (!d || d.isBefore(dateRange[0], 'day') || d.isAfter(dateRange[1], 'day')) return false;
    }
    if (filterSociete && bl.societeExpeditrice?.id !== filterSociete) return false;
    if (filterFiliere && bl.filiere?.id !== filterFiliere) return false;
    if (filterDest && bl.destination !== filterDest) return false;
    if (filterOrigine && bl.origine !== filterOrigine) return false;
    if (filterType && bl.typeChargement !== filterType) return false;
    if (filterStatut && bl.statut !== filterStatut) return false;
    if (tonnageMin !== null && Number(bl.tonnageTotal) < tonnageMin) return false;
    if (tonnageMax !== null && Number(bl.tonnageTotal) > tonnageMax) return false;
    if (searchText) {
      const q = searchText.toLowerCase();
      if (
        !bl.numeroBl.toLowerCase().includes(q) &&
        !bl.clientNom.toLowerCase().includes(q) &&
        !(bl.destination || '').toLowerCase().includes(q) &&
        !(bl.origine || '').toLowerCase().includes(q) &&
        !(bl.erpReference || '').toLowerCase().includes(q) &&
        !(bl.societeExpeditrice?.nom || '').toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const filteredSocieteFilieres = filterSociete
    ? (societes.find((s) => s.id === filterSociete)?.filieres ?? [])
    : [];

  const uniqueDestinations = Array.from(new Set(bls.map((b) => b.destination).filter(Boolean))).sort() as string[];
  const uniqueOrigines = Array.from(new Set(bls.map((b) => b.origine).filter(Boolean))).sort() as string[];

  const currentMonth = dayjs().month();
  const quarterStart = dayjs().month(Math.floor(currentMonth / 3) * 3).startOf('month');
  const quarterEnd = quarterStart.add(2, 'month').endOf('month');

  const dateRangePresets: { label: string; value: [dayjs.Dayjs, dayjs.Dayjs] }[] = [
    { label: 'Aujourd\'hui', value: [dayjs().startOf('day'), dayjs().endOf('day')] },
    { label: 'Cette semaine', value: [dayjs().startOf('week'), dayjs().endOf('week')] },
    { label: 'Ce mois', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
    { label: 'Ce trimestre', value: [quarterStart, quarterEnd] },
    { label: 'Cette année', value: [dayjs().startOf('year'), dayjs().endOf('year')] },
  ];

  const resetFilters = () => {
    setDateRange([null, null]);
    setFilterSociete(null);
    setFilterFiliere(null);
    setFilterDest(null);
    setFilterOrigine(null);
    setFilterType(null);
    setFilterStatut(null);
    setTonnageMin(null);
    setTonnageMax(null);
    setSearchText('');
  };

  const hasActiveFilters = dateRange[0] || filterSociete || filterFiliere || filterDest ||
    filterOrigine || filterType || filterStatut || tonnageMin !== null || tonnageMax !== null || searchText;

  const blsByStatus = {
    all: filterBls(bls),
    [BlStatus.DRAFT]: filterBls(bls.filter((b) => b.statut === BlStatus.DRAFT)),
    [BlStatus.VALIDATED]: filterBls(bls.filter((b) => b.statut === BlStatus.VALIDATED)),
    [BlStatus.LOADED]: filterBls(bls.filter((b) => b.statut === BlStatus.LOADED)),
    [BlStatus.DELIVERED]: filterBls(bls.filter((b) => b.statut === BlStatus.DELIVERED)),
  };

  const tabLabel = (label: string, status: BlStatus | 'all', color?: string) => {
    const count = status === 'all' ? blsByStatus.all.length : blsByStatus[status].length;
    const bgColor = color ?? (status !== 'all' && STATUS_CONFIG[status].color !== 'default'
      ? STATUS_CONFIG[status].color : '#8c8c8c');
    return (
      <span>
        {label}
        {count > 0 && <Badge count={count} size="small" style={{ marginLeft: 6, backgroundColor: bgColor }} />}
      </span>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FileTextOutlined style={{ fontSize: 22, color: '#1890ff' }} />
          <Title level={3} style={{ margin: 0 }}>Bons de Livraison</Title>
        </div>
        <Space>
          {canValidate && selectedRowKeys.length > 0 && (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              loading={validatingSelection}
              onClick={handleValidateSelection}
            >
              Valider la sélection ({selectedRowKeys.length})
            </Button>
          )}
          <Button
            icon={<FileExcelOutlined style={{ color: '#217346' }} />}
            onClick={() => exportBonsLivraison(bls, 'BonsLivraison')}
            disabled={bls.length === 0}
          >
            Excel
          </Button>
          {canCreate && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Nouveau BL
            </Button>
          )}
        </Space>
      </div>

      {/* ── Filtres ── */}
      <div style={{
        background: '#fff', borderRadius: 8, padding: '12px 16px',
        marginBottom: 12, border: '1px solid #e8e8e8',
      }}>
        {/* Ligne 1 */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
          <Input.Search
            placeholder="N° BL, client, origine, destination, ERP…"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            style={{ width: 260 }}
            size="small"
          />
          <DatePicker.RangePicker
            size="small"
            value={dateRange as [dayjs.Dayjs, dayjs.Dayjs]}
            onChange={(v) => setDateRange(v ? [v[0], v[1]] : [null, null])}
            presets={dateRangePresets}
            format="DD/MM/YYYY"
            placeholder={['Date début', 'Date fin']}
            allowClear
          />
          <Select
            size="small"
            placeholder="Statut"
            value={filterStatut}
            onChange={(v) => setFilterStatut(v ?? null)}
            allowClear
            style={{ width: 130 }}
            options={Object.entries(STATUS_CONFIG).map(([v, c]) => ({ value: v, label: c.label }))}
          />
          <Select
            size="small"
            placeholder="Type chargement"
            value={filterType}
            onChange={(v) => setFilterType(v ?? null)}
            allowClear
            style={{ width: 150 }}
            options={Object.entries(TYPE_CONFIG).map(([v, c]) => ({ value: v, label: `${c.icon} ${c.label}` }))}
          />
        </div>
        {/* Ligne 2 */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <Select
            size="small"
            placeholder="Société expéditrice"
            value={filterSociete}
            onChange={(v) => { setFilterSociete(v ?? null); setFilterFiliere(null); }}
            allowClear
            style={{ width: 180 }}
            options={societes.map((s) => ({ value: s.id, label: s.nom }))}
          />
          <Select
            size="small"
            placeholder="Filière"
            value={filterFiliere}
            onChange={(v) => setFilterFiliere(v ?? null)}
            allowClear
            disabled={!filterSociete}
            style={{ width: 160 }}
            options={filteredSocieteFilieres.map((f) => ({ value: f.id, label: `${f.code} — ${f.nom}` }))}
          />
          <Select
            size="small"
            placeholder="Origine"
            value={filterOrigine}
            onChange={(v) => setFilterOrigine(v ?? null)}
            allowClear
            style={{ width: 140 }}
            options={uniqueOrigines.map((d) => ({ value: d, label: d }))}
            showSearch
          />
          <Select
            size="small"
            placeholder="Destination"
            value={filterDest}
            onChange={(v) => setFilterDest(v ?? null)}
            allowClear
            style={{ width: 140 }}
            options={uniqueDestinations.map((d) => ({ value: d, label: d }))}
            showSearch
          />
          <InputNumber
            size="small"
            placeholder="Tonnage min"
            min={0}
            value={tonnageMin ?? undefined}
            onChange={(v) => setTonnageMin(v ?? null)}
            style={{ width: 110 }}
            addonAfter="T"
          />
          <InputNumber
            size="small"
            placeholder="Tonnage max"
            min={0}
            value={tonnageMax ?? undefined}
            onChange={(v) => setTonnageMax(v ?? null)}
            style={{ width: 110 }}
            addonAfter="T"
          />
          {hasActiveFilters && (
            <Button size="small" onClick={resetFilters}>
              Réinitialiser
            </Button>
          )}
          <Text type="secondary" style={{ fontSize: 11, marginLeft: 'auto' }}>
            {blsByStatus.all.length} résultat{blsByStatus.all.length !== 1 ? 's' : ''}
          </Text>
        </div>
      </div>

      <Tabs
        items={[
          {
            key: 'all',
            label: tabLabel('Tous', 'all', '#595959'),
            children: (
              <Table
                dataSource={blsByStatus.all}
                columns={columns}
                rowKey="id"
                rowSelection={rowSelection}
                size="middle"
                pagination={{ pageSize: 20, showTotal: (t) => `${t} BL${t !== 1 ? 's' : ''}` }}
              />
            ),
          },
          {
            key: 'draft',
            label: tabLabel('À valider', BlStatus.DRAFT),
            children: (
              <Table
                dataSource={blsByStatus[BlStatus.DRAFT]}
                columns={columns}
                rowKey="id"
                rowSelection={rowSelection}
                size="middle"
                rowClassName={(r) => r.statut === BlStatus.DRAFT ? 'bl-row-draft' : ''}
                pagination={{ pageSize: 20, showTotal: (t) => `${t} BL${t !== 1 ? 's' : ''}` }}
              />
            ),
          },
          {
            key: 'validated',
            label: tabLabel('Validés', BlStatus.VALIDATED),
            children: (
              <Table
                dataSource={blsByStatus[BlStatus.VALIDATED]}
                columns={columns}
                rowKey="id"
                size="middle"
                pagination={{ pageSize: 20, showTotal: (t) => `${t} BL${t !== 1 ? 's' : ''}` }}
              />
            ),
          },
          {
            key: 'loaded',
            label: tabLabel('En transit', BlStatus.LOADED),
            children: (
              <Table
                dataSource={blsByStatus[BlStatus.LOADED]}
                columns={columns}
                rowKey="id"
                size="middle"
                pagination={{ pageSize: 20, showTotal: (t) => `${t} BL${t !== 1 ? 's' : ''}` }}
              />
            ),
          },
          {
            key: 'delivered',
            label: tabLabel('Livrés', BlStatus.DELIVERED),
            children: (
              <Table
                dataSource={blsByStatus[BlStatus.DELIVERED]}
                columns={columns}
                rowKey="id"
                size="middle"
                pagination={{ pageSize: 20, showTotal: (t) => `${t} BL${t !== 1 ? 's' : ''}` }}
              />
            ),
          },
        ]}
      />

      <Modal
        title={editingBl ? `Modifier BL — ${editingBl.numeroBl}` : 'Nouveau Bon de Livraison'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        width={720}
        okText="Enregistrer"
        cancelText="Annuler"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="numeroBl" label="N° BL" rules={[{ required: true }]}>
                <Input placeholder="BL-2025-001" disabled={!!editingBl} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="erpReference" label="Référence ERP">
                <Input placeholder="ERP-XXXX" />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ fontSize: 12, color: '#666' }}>Expéditeur</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="societeExpediticeId" label="Société expéditrice">
                <Select
                  showSearch
                  allowClear
                  placeholder="Rose Blanche, SFBT…"
                  onChange={(v) => {
                    setSelectedSocieteId(v ?? null);
                    form.setFieldsValue({ filiereId: null });
                  }}
                  options={societes.map((s) => ({
                    value: s.id,
                    label: s.nom,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="filiereId" label="Filière">
                <Select
                  showSearch
                  allowClear
                  placeholder="Pâte Blanche, MCSR…"
                  disabled={!selectedSocieteId}
                  options={(societes.find((s) => s.id === selectedSocieteId)?.filieres ?? []).map((f) => ({
                    value: f.id,
                    label: f.code ? `${f.nom} (${f.code})` : f.nom,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ fontSize: 12, color: '#666' }}>Client destinataire</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="clientNom" label="Nom du client" rules={[{ required: true }]}>
                <Input placeholder="Société XYZ" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="clientAdresse" label="Adresse complète">
                <Input placeholder="Zone Industrielle, Sfax" />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ fontSize: 12, color: '#666' }}>Trajet</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="origine" label="Ville d'origine" rules={[{ required: true }]}>
                <Select showSearch placeholder="Choisir ville" options={CITY_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="destination" label="Ville de destination" rules={[{ required: true }]}>
                <Select showSearch placeholder="Choisir ville" options={CITY_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ fontSize: 12, color: '#666' }}>Chargement</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="typeChargement" label="Type de chargement" rules={[{ required: true }]}>
                <Select
                  options={Object.entries(TYPE_CONFIG).map(([v, cfg]) => ({
                    value: v,
                    label: `${cfg.icon} ${cfg.label}`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="tonnageTotal" label="Tonnage (T)" rules={[{ required: true }]}>
                <InputNumber min={0} step={0.1} style={{ width: '100%' }} placeholder="0.0" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="nombrePalettes" label="Nb palettes">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="datelivraison" label="Date de livraison prévue">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Notes / Observations">
            <Input.TextArea rows={2} placeholder="Instructions spéciales, fragilité, température..." />
          </Form.Item>
        </Form>
      </Modal>

      <BlDetailDrawer bl={detailBl} onClose={() => setDetailBl(null)} />
    </div>
  );
};

export default BonsLivraisonPage;
