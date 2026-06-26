import React, { useEffect, useState } from 'react';
import { Table, Input, Typography, Tag, Alert } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { articlesAPI } from '../../api';
import { Article } from '../../types';

const { Title, Text } = Typography;

const ArticlesPage: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = (search?: string) => {
    setLoading(true);
    articlesAPI.getAll(search).then((res) => setArticles(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const columns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: (v: string) => <Text strong style={{ fontFamily: 'monospace' }}>{v}</Text>,
    },
    { title: 'Désignation', dataIndex: 'libelle', key: 'libelle' },
    {
      title: 'Poids unitaire',
      dataIndex: 'poidsUnitaire',
      key: 'poids',
      render: (v: number) => v ? <Tag color="blue">{v} kg</Tag> : '-',
    },
    {
      title: 'Unité',
      dataIndex: 'unite',
      key: 'unite',
      render: (v: string) => v || '-',
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Title level={3} style={{ margin: 0 }}>Catalogue articles</Title>
        <Input.Search
          placeholder="Rechercher un article..."
          onSearch={(v) => fetchData(v)}
          allowClear
          style={{ width: 260 }}
        />
      </div>

      <Alert
        type="info"
        icon={<InfoCircleOutlined />}
        showIcon
        message="Les articles sont importés depuis l'ERP. La gestion des articles (création, modification, suppression) s'effectue dans l'ERP de la société expéditrice."
        style={{ marginBottom: 16 }}
      />

      <Table
        dataSource={articles}
        columns={columns}
        rowKey="id"
        size="middle"
        pagination={{
          pageSize: 20,
          showTotal: (total) => `${total} article${total !== 1 ? 's' : ''}`,
        }}
        locale={{ emptyText: 'Aucun article importé' }}
      />
    </div>
  );
};

export default ArticlesPage;

