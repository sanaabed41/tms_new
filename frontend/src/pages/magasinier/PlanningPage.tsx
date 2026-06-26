import React, { useEffect, useState, useCallback } from 'react';
import {
  Table, Tag, Typography, Card, DatePicker, Space, Drawer, Badge,
} from 'antd';
import {
  CalendarOutlined, TruckOutlined, CheckCircleOutlined, EyeOutlined,
} from '@ant-design/icons';
import { expediteurPortalAPI } from '../../api';
import { LoadingPlan, BonLivraison, LoadingStatus, BlStatus, TypeChargement } from '../../types';
import dayjs, { Dayjs } from 'dayjs';

const { Title, Text } = Typography;

const ACCENT = '#52c41a';

const LOADING_STATUS_COLORS: Record<LoadingStatus, string> = {
  [LoadingStatus.WAITING]: 'default',
  [LoadingStatus.IN_PROGRESS]: 'processing',
  [LoadingStatus.PAUSED]: 'warning',
  [LoadingStatus.DONE]: 'success',
};
const LOADING_STATUS_LABELS: Record<LoadingStatus, string> = {
  [LoadingStatus.WAITING]: 'En attente',
  [LoadingStatus.IN_PROGRESS]: 'En cours',
  [LoadingStatus.PAUSED]: 'En pause',
  [LoadingStatus.DONE]: 'Terminé',
};
const BL_STATUS_COLORS: Record<BlStatus, string> = {
  [BlStatus.DRAFT]: 'default',
  [BlStatus.VALIDATED]: 'blue',
  [BlStatus.LOADED]: 'orange',
  [BlStatus.DELIVERED]: 'green',
};
const BL_STATUS_LABELS: Record<BlStatus, string> = {
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

interface DayGroup {
  date: string;
  plans: LoadingPlan[];
  truckCount: number;
  blCount: number;
  tonnage: number;
  validatedBy?: string;
}

const MagasinierPlanningPage: React.FC = () => {
  const [plans, setPlans] = useState<LoadingPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [drawerGroup, setDrawerGroup] = useState<DayGroup | null>(null);

  const fetchPlans = useCallback((date?: string) => {
    setLoading(true);
    expediteurPortalAPI.getMyPlanning(date)
      .then((res) => setPlans(res.data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const handleDateChange = (date: Dayjs | null) => {
    setSelectedDate(date);
    fetchPlans(date ? date.format('YYYY-MM-DD') : undefined);
  };

  const dayGroups: DayGroup[] = React.useMemo(() => {
    const map: Record<string, LoadingPlan[]> = {};
    for (const p of plans) {
      const d = String(p.dateLivraison);
      if (!map[d]) map[d] = [];
      map[d].push(p);
    }
    return Object.entries(map)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, dayPlans]) => {
        const allBls = dayPlans.flatMap((p) => p.bonsLivraison ?? []);
        const tonnage = allBls.reduce((sum, bl) => sum + Number((bl as any).tonnageTotal ?? 0), 0);
        const validator = dayPlans.find((p) => p.validatedBy)?.validatedBy;
        return {
          date,
          plans: dayPlans,
          truckCount: dayPlans.length,
          blCount: allBls.length,
          tonnage,
          validatedBy: validator ? `${validator.prenom} ${validator.nom}` : undefined,
        };
      });
  }, [plans]);

  const mainColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (d: string) => (
        <Text strong style={{ fontSize: 14 }}>
          {dayjs(d).format('DD/MM/YYYY')}
          {d === dayjs().format('YYYY-MM-DD') && (
            <Tag color="green" style={{ marginLeft: 8, fontSize: 10 }}>Aujourd'hui</Tag>
          )}
        </Text>
      ),
    },
    {
      title: 'Camions',
      key: 'trucks',
      align: 'center' as const,
      render: (_: any, g: DayGroup) => (
        <Space size={4}>
          <TruckOutlined style={{ color: ACCENT }} />
          <Tag color="green">{g.truckCount}</Tag>
        </Space>
      ),
    },
    {
      title: 'BLs (ma filière)',
      key: 'bls',
      align: 'center' as const,
      render: (_: any, g: DayGroup) => <Tag color="lime">{g.blCount}</Tag>,
    },
    {
      title: 'Tonnage',
      key: 'tonnage',
      render: (_: any, g: DayGroup) => (
        <Text style={{ fontSize: 13 }}>{g.tonnage.toFixed(2)} T</Text>
      ),
    },
    {
      title: 'Validé par',
      key: 'validatedBy',
      render: (_: any, g: DayGroup) =>
        g.validatedBy
          ? (
            <Space size={4}>
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
              <Text style={{ fontSize: 12 }}>{g.validatedBy}</Text>
            </Space>
          )
          : <Text type="secondary">-</Text>,
    },
    {
      title: '',
      key: 'actions',
      width: 120,
      render: (_: any, g: DayGroup) => (
        <Tag
          icon={<EyeOutlined />}
          color="green"
          style={{ cursor: 'pointer' }}
          onClick={() => setDrawerGroup(g)}
        >
          Voir le plan
        </Tag>
      ),
    },
  ];

  const blColumns = [
    {
      title: '#',
      key: 'ordre',
      width: 36,
      render: (_: any, __: BonLivraison, idx: number) => (
        <Text type="secondary" style={{ fontSize: 11 }}>{idx + 1}</Text>
      ),
    },
    {
      title: 'N° BL',
      dataIndex: 'numeroBl',
      key: 'numeroBl',
      render: (v: string) => <Text strong style={{ fontSize: 12 }}>{v}</Text>,
    },
    { title: 'Client', dataIndex: 'clientNom', key: 'clientNom', render: (v: string) => <Text style={{ fontSize: 12 }}>{v}</Text> },
    { title: 'Destination', dataIndex: 'destination', key: 'destination', render: (v: string) => <Text style={{ fontSize: 12 }}>{v || '-'}</Text> },
    {
      title: 'Type',
      dataIndex: 'typeChargement',
      key: 'typeChargement',
      render: (t: TypeChargement) => <Text style={{ fontSize: 11 }}>{TYPE_LABELS[t] || t}</Text>,
    },
    {
      title: 'Tonnage',
      dataIndex: 'tonnageTotal',
      key: 'tonnageTotal',
      align: 'right' as const,
      render: (v: number) => <Text style={{ fontSize: 12 }}>{v} T</Text>,
    },
    {
      title: 'Statut',
      dataIndex: 'statut',
      key: 'statut',
      render: (s: BlStatus) => (
        <Tag color={BL_STATUS_COLORS[s]} style={{ fontSize: 10 }}>{BL_STATUS_LABELS[s]}</Tag>
      ),
    },
  ];

  const truckColumns = [
    {
      title: 'Camion',
      key: 'truck',
      render: (_: any, plan: LoadingPlan) => (
        <Space size={4}>
          <TruckOutlined style={{ color: ACCENT }} />
          <Text strong>{plan.truck?.matricule || '-'}</Text>
          {plan.truck?.type && <Tag style={{ fontSize: 10 }}>{plan.truck.type}</Tag>}
        </Space>
      ),
    },
    {
      title: 'Référence',
      dataIndex: 'reference',
      key: 'reference',
      render: (ref: string) => <Text style={{ fontSize: 12, color: ACCENT }}>{ref}</Text>,
    },
    {
      title: 'BLs filière',
      key: 'bls',
      align: 'center' as const,
      render: (_: any, plan: LoadingPlan) => (
        <Tag color="green">{plan.bonsLivraison?.length ?? 0}</Tag>
      ),
    },
    {
      title: 'Tonnage',
      key: 'tonnage',
      render: (_: any, plan: LoadingPlan) => {
        const t = (plan.bonsLivraison ?? []).reduce((s, bl) => s + Number((bl as any).tonnageTotal ?? 0), 0);
        return <Text style={{ fontSize: 12 }}>{t.toFixed(2)} T</Text>;
      },
    },
    {
      title: 'Chargement',
      key: 'loadingStatus',
      render: (_: any, plan: LoadingPlan) => (
        <Badge
          status={LOADING_STATUS_COLORS[plan.loadingStatus] as any}
          text={<span style={{ fontSize: 12 }}>{LOADING_STATUS_LABELS[plan.loadingStatus]}</span>}
        />
      ),
    },
  ];

  const sortedBls = (plan: LoadingPlan) =>
    [...(plan.bonsLivraison ?? [])].sort((a, b) => ((a as any).ordreChargement ?? 999) - ((b as any).ordreChargement ?? 999));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <CalendarOutlined style={{ fontSize: 22, color: ACCENT }} />
        <Title level={3} style={{ margin: 0 }}>Plans de chargement- ma filière</Title>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space align="center">
          <DatePicker
            placeholder="Toutes les dates"
            value={selectedDate}
            onChange={handleDateChange}
            format="DD/MM/YYYY"
            allowClear
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {dayGroups.length} plan{dayGroups.length !== 1 ? 's' : ''} validé{dayGroups.length !== 1 ? 's' : ''}
          </Text>
        </Space>
      </Card>

      <Table
        dataSource={dayGroups}
        columns={mainColumns}
        rowKey="date"
        pagination={{ pageSize: 15, showSizeChanger: false }}
        locale={{ emptyText: 'Aucun plan de chargement validé pour votre filière' }}
        size="middle"
      />

      <Drawer
        title={
          drawerGroup && (
            <Space>
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
              <span style={{ fontWeight: 600 }}>Plan du {dayjs(drawerGroup.date).format('DD/MM/YYYY')}</span>
              <Tag color="green">{drawerGroup.truckCount} camion{drawerGroup.truckCount !== 1 ? 's' : ''}</Tag>
              <Tag color="lime">{drawerGroup.blCount} BL{drawerGroup.blCount !== 1 ? 's' : ''}</Tag>
            </Space>
          )
        }
        open={!!drawerGroup}
        onClose={() => setDrawerGroup(null)}
        styles={{ wrapper: { width: 860 } }}
      >
        {drawerGroup && (
          <Table
            dataSource={drawerGroup.plans}
            columns={truckColumns}
            rowKey="id"
            pagination={false}
            size="small"
            locale={{ emptyText: 'Aucun camion' }}
            expandable={{
              expandedRowRender: (plan: LoadingPlan) => (
                <div style={{ padding: '8px 16px', background: '#f6ffed' }}>
                  <Table
                    dataSource={sortedBls(plan)}
                    columns={blColumns}
                    rowKey="id"
                    pagination={false}
                    size="small"
                    locale={{ emptyText: 'Aucun BL de votre filière' }}
                    summary={(bls) => {
                      const total = bls.reduce((s, bl) => s + Number((bl as any).tonnageTotal ?? 0), 0);
                      return (
                        <Table.Summary.Row>
                          <Table.Summary.Cell index={0} colSpan={5}>
                            <Text type="secondary" style={{ fontSize: 11 }}>Total</Text>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={5} align="right">
                            <Text strong style={{ fontSize: 12 }}>{total.toFixed(2)} T</Text>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={6} />
                        </Table.Summary.Row>
                      );
                    }}
                  />
                </div>
              ),
              defaultExpandAllRows: true,
            }}
          />
        )}
      </Drawer>
    </div>
  );
};

export default MagasinierPlanningPage;

