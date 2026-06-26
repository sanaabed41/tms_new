import React, { useEffect, useState, useCallback } from 'react';
import { Card, Table, Tag, Typography, Select, Space, DatePicker, Row, Col } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import { expediteurPortalAPI } from '../../api';
import { BonLivraison, BlStatus, TypeChargement } from '../../types';
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

const FiliereAdminBLsPage: React.FC = () => {
  const [allBls, setAllBls] = useState<BonLivraison[]>([]);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const [filterStatut, setFilterStatut] = useState<BlStatus | undefined>();

  const fetchBls = useCallback(() => {
    expediteurPortalAPI.getMyBls(undefined).then((res) => setAllBls(res.data));
  }, []);

  useEffect(() => { fetchBls(); }, []);

  const displayed = allBls.filter((bl) => {
    if (dateRange[0] && dateRange[1]) {
      const d = bl.datelivraison ? dayjs(bl.datelivraison) : null;
      if (!d || d.isBefore(dateRange[0], 'day') || d.isAfter(dateRange[1], 'day')) return false;
    }
    if (filterStatut && bl.statut !== filterStatut) return false;
    return true;
  });

  const columns = [
    { title: 'N° BL', dataIndex: 'numeroBl', key: 'numeroBl', width: 130 },
    { title: 'Client', dataIndex: 'clientNom', key: 'clientNom' },
    { title: 'Destination', dataIndex: 'destination', key: 'destination' },
    {
      title: 'Type',
      dataIndex: 'typeChargement',
      key: 'typeChargement',
      render: (t: TypeChargement) => TYPE_LABELS[t] || t,
    },
    {
      title: 'Tonnage',
      dataIndex: 'tonnageTotal',
      key: 'tonnageTotal',
      render: (v: number) => `${v} T`,
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
          ? <Tag icon={<FileTextOutlined />}>{bl.loadingPlan.truck.matricule}</Tag>
          : <Text type="secondary">-</Text>,
    },
    {
      title: 'Date livraison',
      dataIndex: 'datelivraison',
      key: 'datelivraison',
      render: (d: string) => d ? dayjs(d).format('DD/MM/YYYY') : '-',
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginTop: 0, marginBottom: 16 }}>
        <FileTextOutlined style={{ marginRight: 8, color: '#eb2f96' }} />
        Bons de Livraison
      </Title>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 8]} align="middle">
          <Col>
            <DatePicker.RangePicker
              value={dateRange as [Dayjs, Dayjs]}
              onChange={(v) => setDateRange(v ? [v[0], v[1]] : [null, null])}
              format="DD/MM/YYYY"
              placeholder={['Début', 'Fin']}
              allowClear
            />
          </Col>
          <Col>
            <Select
              placeholder="Tous les statuts"
              style={{ width: 160 }}
              value={filterStatut}
              onChange={(v) => setFilterStatut(v as BlStatus)}
              allowClear
              options={Object.values(BlStatus).map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
            />
          </Col>
          <Col>
            <Space>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {displayed.length} résultat{displayed.length !== 1 ? 's' : ''}
              </Text>
            </Space>
          </Col>
        </Row>
      </Card>

      <Table
        dataSource={displayed}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 20, showSizeChanger: false }}
        locale={{ emptyText: 'Aucun bon de livraison' }}
        size="small"
      />
    </div>
  );
};

export default FiliereAdminBLsPage;

