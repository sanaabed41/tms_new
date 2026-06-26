import React, { useEffect, useState, useCallback } from 'react';
import {
  Card, Table, Tag, Typography, Select, Space, DatePicker, Input, InputNumber,
  Button, Drawer, Descriptions,
} from 'antd';
import { FileTextOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { expediteurPortalAPI } from '../../api';
import { BonLivraison, BlStatus, Filiere, SocieteExpeditrice, TypeChargement } from '../../types';
import dayjs, { Dayjs } from 'dayjs';

const { Title, Text } = Typography;

const STATUS_COLORS: Record<BlStatus, string> = {
  [BlStatus.DRAFT]: 'default',
  [BlStatus.VALIDATED]: 'blue',
  [BlStatus.LOADED]: 'orange',
  [BlStatus.DELIVERED]: 'green',
};
const STATUS_LABELS: Record<BlStatus, string> = {
  [BlStatus.DRAFT]: 'Brouillon',
  [BlStatus.VALIDATED]: 'Validé',
  [BlStatus.LOADED]: 'Chargé',
  [BlStatus.DELIVERED]: 'Livré',
};
const TYPE_LABELS: Record<TypeChargement, string> = {
  [TypeChargement.VRAC]: 'Vrac',
  [TypeChargement.PALETTE]: 'Palette',
  [TypeChargement.FRIGO]: 'Frigo',
  [TypeChargement.CITERNE]: 'Citerne',
};
const TYPE_COLORS: Record<TypeChargement, string> = {
  [TypeChargement.VRAC]: 'default',
  [TypeChargement.PALETTE]: 'purple',
  [TypeChargement.FRIGO]: 'cyan',
  [TypeChargement.CITERNE]: 'geekblue',
};

const PortalBLsPage: React.FC = () => {
  const [allBls, setAllBls]     = useState<BonLivraison[]>([]);
  const [societe, setSociete]   = useState<SocieteExpeditrice | null>(null);
  const [selectedBl, setSelectedBl] = useState<BonLivraison | null>(null);

  // ── Filtres ────────────────────────────────────────────────────────────────
  const [search,        setSearch]        = useState('');
  const [dateRange,     setDateRange]     = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const [filterFiliere, setFilterFiliere] = useState<string | undefined>();
  const [filterStatut,  setFilterStatut]  = useState<BlStatus | undefined>();
  const [filterDest,    setFilterDest]    = useState<string | undefined>();
  const [filterOrigine, setFilterOrigine] = useState<string | undefined>();
  const [filterType,    setFilterType]    = useState<TypeChargement | undefined>();
  const [tonnageMin,    setTonnageMin]    = useState<number | null>(null);
  const [tonnageMax,    setTonnageMax]    = useState<number | null>(null);

  const fetchBls = useCallback(() => {
    expediteurPortalAPI.getMyBls(undefined).then((res) => setAllBls(res.data));
  }, []);

  useEffect(() => {
    fetchBls();
    expediteurPortalAPI.getMySociete().then((res) => setSociete(res.data)).catch(() => {});
  }, [fetchBls]);

  const filiereOptions = (societe?.filieres ?? []).map((f: Filiere) => ({
    value: f.id,
    label: `${f.code} — ${f.nom}`,
  }));

  const uniqueDests    = Array.from(new Set(allBls.map((b) => b.destination).filter(Boolean))).sort() as string[];
  const uniqueOrigines = Array.from(new Set(allBls.map((b) => b.origine).filter(Boolean))).sort() as string[];

  const hasActiveFilters = search || dateRange[0] || filterFiliere || filterStatut ||
    filterDest || filterOrigine || filterType || tonnageMin !== null || tonnageMax !== null;

  const resetFilters = () => {
    setSearch('');
    setDateRange([null, null]);
    setFilterFiliere(undefined);
    setFilterStatut(undefined);
    setFilterDest(undefined);
    setFilterOrigine(undefined);
    setFilterType(undefined);
    setTonnageMin(null);
    setTonnageMax(null);
  };

  const displayed = allBls.filter((bl) => {
    if (dateRange[0] && dateRange[1]) {
      const d = bl.datelivraison ? dayjs(bl.datelivraison) : null;
      if (!d || d.isBefore(dateRange[0], 'day') || d.isAfter(dateRange[1], 'day')) return false;
    }
    if (filterFiliere && bl.filiere?.id !== filterFiliere) return false;
    if (filterStatut  && bl.statut !== filterStatut) return false;
    if (filterDest    && bl.destination !== filterDest) return false;
    if (filterOrigine && bl.origine !== filterOrigine) return false;
    if (filterType    && bl.typeChargement !== filterType) return false;
    if (tonnageMin !== null && Number(bl.tonnageTotal) < tonnageMin) return false;
    if (tonnageMax !== null && Number(bl.tonnageTotal) > tonnageMax) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !bl.numeroBl.toLowerCase().includes(q) &&
        !(bl.clientNom || '').toLowerCase().includes(q) &&
        !(bl.destination || '').toLowerCase().includes(q) &&
        !(bl.origine || '').toLowerCase().includes(q) &&
        !(bl.erpReference || '').toLowerCase().includes(q) &&
        !(bl.filiere?.nom || '').toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const columns = [
    {
      title: 'N° BL',
      dataIndex: 'numeroBl',
      key: 'numeroBl',
      width: 140,
      render: (v: string) => <Text strong style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</Text>,
      sorter: (a: BonLivraison, b: BonLivraison) => a.numeroBl.localeCompare(b.numeroBl),
    },
    {
      title: 'Client',
      dataIndex: 'clientNom',
      key: 'clientNom',
      render: (nom: string, bl: BonLivraison) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>{nom}</Text>
          {bl.clientAdresse && (
            <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>{bl.clientAdresse}</Text>
          )}
        </div>
      ),
    },
    {
      title: 'Trajet',
      key: 'trajet',
      render: (_: any, bl: BonLivraison) => (
        <Text style={{ fontSize: 12 }}>
          {bl.origine || '—'} → <strong>{bl.destination || '—'}</strong>
        </Text>
      ),
    },
    {
      title: 'Filière',
      key: 'filiere',
      render: (_: any, bl: BonLivraison) =>
        bl.filiere
          ? <Tag color="purple">{bl.filiere.code} — {bl.filiere.nom}</Tag>
          : <Text type="secondary">—</Text>,
    },
    {
      title: 'Type',
      dataIndex: 'typeChargement',
      key: 'typeChargement',
      render: (t: TypeChargement) => (
        <Tag color={TYPE_COLORS[t]}>{TYPE_LABELS[t] || t}</Tag>
      ),
    },
    {
      title: 'Charge',
      key: 'charge',
      render: (_: any, bl: BonLivraison) => (
        <Space size={4}>
          <Tag color="blue" style={{ fontSize: 11 }}>{bl.tonnageTotal} T</Tag>
          {bl.nombrePalettes > 0 && (
            <Tag color="purple" style={{ fontSize: 11 }}>{bl.nombrePalettes} pal.</Tag>
          )}
        </Space>
      ),
      sorter: (a: BonLivraison, b: BonLivraison) => Number(a.tonnageTotal) - Number(b.tonnageTotal),
    },
    {
      title: 'Livraison',
      dataIndex: 'datelivraison',
      key: 'datelivraison',
      render: (d: string) => d ? dayjs(d).format('DD/MM/YYYY') : <Text type="secondary">—</Text>,
      sorter: (a: BonLivraison, b: BonLivraison) =>
        new Date(a.datelivraison ?? 0).getTime() - new Date(b.datelivraison ?? 0).getTime(),
    },
    {
      title: 'Statut',
      dataIndex: 'statut',
      key: 'statut',
      render: (s: BlStatus) => <Tag color={STATUS_COLORS[s]}>{STATUS_LABELS[s]}</Tag>,
    },
    {
      title: 'Camion',
      key: 'truck',
      render: (_: any, bl: BonLivraison) =>
        bl.loadingPlan?.truck?.matricule
          ? <Tag>{bl.loadingPlan.truck.matricule}</Tag>
          : <Text type="secondary">—</Text>,
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_: any, bl: BonLivraison) => (
        <Tag
          icon={<EyeOutlined />}
          color="purple"
          style={{ cursor: 'pointer' }}
          onClick={() => setSelectedBl(bl)}
        >
          Voir
        </Tag>
      ),
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginTop: 0, marginBottom: 16 }}>
        <FileTextOutlined style={{ marginRight: 8, color: '#722ed1' }} />
        Bons de Livraison
      </Title>

      {/* ── Filtres ── */}
      <Card style={{ marginBottom: 16 }} bodyStyle={{ padding: '12px 16px' }}>
        {/* Ligne 1 */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
          <Input
            prefix={<SearchOutlined style={{ color: '#bbb' }} />}
            placeholder="N° BL, client, destination, ERP…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ width: 240 }}
            size="small"
          />
          <DatePicker.RangePicker
            size="small"
            value={dateRange as [Dayjs, Dayjs]}
            onChange={(v) => setDateRange(v ? [v[0], v[1]] : [null, null])}
            format="DD/MM/YYYY"
            placeholder={['Date début', 'Date fin']}
            presets={[
              { label: "Aujourd'hui", value: [dayjs().startOf('day'), dayjs().endOf('day')] },
              { label: 'Cette semaine', value: [dayjs().startOf('week'), dayjs().endOf('week')] },
              { label: 'Ce mois', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
            ]}
            allowClear
          />
          <Select
            size="small"
            placeholder="Statut"
            value={filterStatut}
            onChange={(v) => setFilterStatut(v as BlStatus | undefined)}
            allowClear
            style={{ width: 130 }}
            options={Object.values(BlStatus).map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
          />
          <Select
            size="small"
            placeholder="Type chargement"
            value={filterType}
            onChange={(v) => setFilterType(v as TypeChargement | undefined)}
            allowClear
            style={{ width: 145 }}
            options={Object.values(TypeChargement).map((t) => ({ value: t, label: TYPE_LABELS[t] }))}
          />
        </div>

        {/* Ligne 2 */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <Select
            size="small"
            placeholder="Filière"
            value={filterFiliere}
            onChange={setFilterFiliere}
            allowClear
            style={{ width: 200 }}
            options={filiereOptions}
          />
          <Select
            size="small"
            placeholder="Origine"
            value={filterOrigine}
            onChange={(v) => setFilterOrigine(v)}
            allowClear
            showSearch
            style={{ width: 140 }}
            options={uniqueOrigines.map((d) => ({ value: d, label: d }))}
          />
          <Select
            size="small"
            placeholder="Destination"
            value={filterDest}
            onChange={(v) => setFilterDest(v)}
            allowClear
            showSearch
            style={{ width: 140 }}
            options={uniqueDests.map((d) => ({ value: d, label: d }))}
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
            {displayed.length} résultat{displayed.length !== 1 ? 's' : ''}
          </Text>
        </div>
      </Card>

      <Table
        dataSource={displayed}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 20, showTotal: (t) => `${t} BL${t !== 1 ? 's' : ''}` }}
        locale={{ emptyText: 'Aucun bon de livraison' }}
        size="small"
      />

      {/* ── Drawer détail BL ── */}
      <Drawer
        title={
          selectedBl && (
            <Space>
              <FileTextOutlined style={{ color: '#722ed1' }} />
              <span>BL {selectedBl.numeroBl}</span>
              <Tag color={STATUS_COLORS[selectedBl.statut]}>{STATUS_LABELS[selectedBl.statut]}</Tag>
            </Space>
          )
        }
        open={!!selectedBl}
        onClose={() => setSelectedBl(null)}
        styles={{ wrapper: { width: 480 } }}
      >
        {selectedBl && (
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="N° BL">{selectedBl.numeroBl}</Descriptions.Item>
            <Descriptions.Item label="Client">{selectedBl.clientNom}</Descriptions.Item>
            {selectedBl.clientAdresse && (
              <Descriptions.Item label="Adresse client">{selectedBl.clientAdresse}</Descriptions.Item>
            )}
            {selectedBl.origine && (
              <Descriptions.Item label="Origine">{selectedBl.origine}</Descriptions.Item>
            )}
            <Descriptions.Item label="Destination">{selectedBl.destination || '—'}</Descriptions.Item>
            <Descriptions.Item label="Filière">
              {selectedBl.filiere
                ? <Tag color="purple">{selectedBl.filiere.code} — {selectedBl.filiere.nom}</Tag>
                : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Type chargement">
              <Tag color={TYPE_COLORS[selectedBl.typeChargement]}>
                {TYPE_LABELS[selectedBl.typeChargement] || selectedBl.typeChargement}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Tonnage">{selectedBl.tonnageTotal} T</Descriptions.Item>
            {Number(selectedBl.nombrePalettes) > 0 && (
              <Descriptions.Item label="Palettes">{selectedBl.nombrePalettes}</Descriptions.Item>
            )}
            <Descriptions.Item label="Date livraison">
              {selectedBl.datelivraison ? dayjs(selectedBl.datelivraison).format('DD/MM/YYYY') : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Statut">
              <Tag color={STATUS_COLORS[selectedBl.statut]}>{STATUS_LABELS[selectedBl.statut]}</Tag>
            </Descriptions.Item>
            {selectedBl.loadingPlan?.truck && (
              <Descriptions.Item label="Camion assigné">
                {selectedBl.loadingPlan.truck.matricule}
                {selectedBl.loadingPlan.truck.type ? ` (${selectedBl.loadingPlan.truck.type})` : ''}
              </Descriptions.Item>
            )}
            {selectedBl.loadingPlan?.reference && (
              <Descriptions.Item label="Plan de chargement">
                {selectedBl.loadingPlan.reference}
                {selectedBl.loadingPlan.isValidated
                  ? <Tag color="green" style={{ marginLeft: 8, fontSize: 10 }}>Validé</Tag>
                  : <Tag color="default" style={{ marginLeft: 8, fontSize: 10 }}>En attente</Tag>}
              </Descriptions.Item>
            )}
            {selectedBl.erpReference && (
              <Descriptions.Item label="Réf. ERP">{selectedBl.erpReference}</Descriptions.Item>
            )}
            {selectedBl.notes && (
              <Descriptions.Item label="Notes">{selectedBl.notes}</Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
};

export default PortalBLsPage;
