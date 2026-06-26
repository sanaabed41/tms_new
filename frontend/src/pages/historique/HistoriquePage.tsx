import React, { useState, useCallback } from 'react';
import {
  DatePicker, Table, Tag, Typography, Button, Space, Spin,
} from 'antd';
import {
  CalendarOutlined, TruckOutlined, FileTextOutlined, HistoryOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { loadingPlansAPI } from '../../api';
import { LoadingPlan } from '../../types';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const HistoriquePage: React.FC = () => {
  const [plans, setPlans] = useState<LoadingPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [searched, setSearched] = useState(false);

  const fetchHistory = useCallback(async (from?: string, to?: string) => {
    setLoading(true);
    setSearched(true);
    try {
      const res = await loadingPlansAPI.getHistory(from, to);
      setPlans(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = () => {
    fetchHistory(
      dateRange?.[0]?.format('YYYY-MM-DD'),
      dateRange?.[1]?.format('YYYY-MM-DD'),
    );
  };

  const handleShowAll = () => {
    setDateRange(null);
    fetchHistory();
  };

  const columns = [
    {
      title: 'Date livraison',
      dataIndex: 'dateLivraison',
      key: 'date',
      width: 130,
      render: (d: string) => (
        <Space size={4}>
          <CalendarOutlined style={{ color: '#1890ff', fontSize: 12 }} />
          <Text>{dayjs(d).format('DD/MM/YYYY')}</Text>
        </Space>
      ),
      sorter: (a: LoadingPlan, b: LoadingPlan) => a.dateLivraison.localeCompare(b.dateLivraison),
    },
    {
      title: 'Camion',
      key: 'camion',
      render: (_: any, record: LoadingPlan) => (
        <Space size={4}>
          <TruckOutlined style={{ color: '#1890ff' }} />
          <Text strong>{record.truck?.matricule}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {record.truck?.type || 'Standard'}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Société de transport',
      key: 'societe',
      render: (_: any, record: LoadingPlan) => (
        <Text>{(record.truck as any)?.deliveryCompany?.nom || '—'}</Text>
      ),
    },
    {
      title: 'BLs',
      key: 'bls',
      width: 70,
      render: (_: any, record: LoadingPlan) => (
        <Tag color="blue" style={{ fontFamily: 'monospace' }}>
          {record.bonsLivraison?.length ?? 0}
        </Tag>
      ),
    },
    {
      title: 'Tonnage',
      dataIndex: 'tonnageCharge',
      key: 'tonnage',
      width: 100,
      render: (t: number) => (
        <Text strong style={{ color: '#1890ff' }}>{Number(t).toFixed(1)} T</Text>
      ),
    },
    {
      title: 'RDV',
      dataIndex: 'heureArrivee',
      key: 'rdv',
      width: 120,
      render: (h: string | null) => {
        if (!h) return <Text type="secondary">—</Text>;
        const d = dayjs(h, 'YYYY-MM-DD HH:mm');
        return <Text>{d.isValid() ? d.format('DD/MM HH:mm') : h}</Text>;
      },
    },
    {
      title: 'Statut',
      key: 'statut',
      width: 100,
      render: (_: any, record: LoadingPlan) => (
        record.isValidated
          ? <Tag color="success">Validé</Tag>
          : <Tag color="default">Non validé</Tag>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <HistoryOutlined style={{ fontSize: 24, color: '#1890ff' }} />
        <Title level={3} style={{ margin: 0 }}>Historique des Plans de Chargement</Title>
      </div>

      {/* Filtres */}
      <div style={{
        background: 'white', borderRadius: 10, padding: '16px 20px',
        border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
      }}>
        <RangePicker
          value={dateRange}
          onChange={(vals) => setDateRange(vals as [dayjs.Dayjs, dayjs.Dayjs] | null)}
          format="DD/MM/YYYY"
          placeholder={['Date début', 'Date fin']}
        />
        <Button type="primary" onClick={handleSearch} loading={loading}>
          Rechercher
        </Button>
        <Button onClick={handleShowAll} loading={loading}>
          Tout afficher
        </Button>
        {searched && !loading && (
          <Text type="secondary" style={{ marginLeft: 'auto', fontSize: 12 }}>
            <FileTextOutlined style={{ marginRight: 4 }} />
            {plans.length} plan{plans.length > 1 ? 's' : ''} trouvé{plans.length > 1 ? 's' : ''}
          </Text>
        )}
      </div>

      {/* Table */}
      <div style={{
        background: 'white', borderRadius: 10, border: '1px solid #f0f0f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden',
      }}>
        {!searched ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#bfbfbf' }}>
            <HistoryOutlined style={{ fontSize: 48, display: 'block', margin: '0 auto 12px' }} />
            <div style={{ fontSize: 14 }}>
              Sélectionnez une période ou cliquez sur "Tout afficher"
            </div>
          </div>
        ) : (
          <Table
            dataSource={plans}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `${t} plans au total` }}
            size="small"
            expandable={{
              expandedRowRender: (record) => (
                <div style={{ padding: '8px 16px' }}>
                  <Text strong style={{ fontSize: 12, color: '#595959' }}>BLs chargés :</Text>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                    {[...(record.bonsLivraison || [])]
                      .sort((a, b) => ((a as any).ordreChargement ?? 0) - ((b as any).ordreChargement ?? 0))
                      .map((bl) => (
                        <div key={bl.id} style={{
                          background: '#fafafa', border: '1px solid #e8e8e8',
                          borderRadius: 6, padding: '4px 10px', fontSize: 12,
                        }}>
                          <Text strong>{bl.numeroBl}</Text>
                          <Text type="secondary" style={{ marginLeft: 6 }}>{bl.clientNom}</Text>
                          {bl.destination && (
                            <Tag style={{ margin: '0 0 0 6px', fontSize: 10 }}>{bl.destination}</Tag>
                          )}
                          <Text type="secondary" style={{ marginLeft: 6, fontSize: 11 }}>
                            {bl.tonnageTotal} T
                          </Text>
                        </div>
                      ))}
                  </div>
                </div>
              ),
              rowExpandable: (record) => (record.bonsLivraison?.length ?? 0) > 0,
            }}
          />
        )}
      </div>
    </div>
  );
};

export default HistoriquePage;
