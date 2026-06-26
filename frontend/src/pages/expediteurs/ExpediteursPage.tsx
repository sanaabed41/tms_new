import React, { useEffect, useState } from 'react';
import {
  Table, Space, Typography, Tag, Drawer, Alert,
} from 'antd';
import { ApartmentOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { expediteursAPI } from '../../api';
import { SocieteExpeditrice } from '../../types';

const { Title, Text } = Typography;

const ExpediteursPage: React.FC = () => {
  const [societes, setSocietes] = useState<SocieteExpeditrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filiereDrawerOpen, setFiliereDrawerOpen] = useState(false);
  const [selectedSociete, setSelectedSociete] = useState<SocieteExpeditrice | null>(null);

  useEffect(() => {
    expediteursAPI.getAll()
      .then((r) => setSocietes(r.data))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    {
      title: 'Société expéditrice',
      key: 'nom',
      render: (_: any, s: SocieteExpeditrice) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 14, height: 14, borderRadius: '50%',
            background: s.couleur || '#1890ff', flexShrink: 0,
          }} />
          <div>
            <Text strong>{s.nom}</Text>
            {s.code && (
              <Text type="secondary" style={{ fontSize: 11, marginLeft: 6 }}>[{s.code}]</Text>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Filières',
      key: 'filieres',
      render: (_: any, s: SocieteExpeditrice) => (
        <Space wrap>
          {s.filieres?.length > 0
            ? s.filieres.map((f) => (
                <Tag key={f.id} color={s.couleur || 'blue'} style={{ fontSize: 11 }}>
                  {f.nom}{f.code ? ` (${f.code})` : ''}
                </Tag>
              ))
            : <Text type="secondary" style={{ fontSize: 11 }}>Aucune filière</Text>
          }
        </Space>
      ),
    },
    { title: 'Adresse', dataIndex: 'adresse', key: 'adresse', render: (v: string) => v || '-' },
    { title: 'Téléphone', dataIndex: 'telephone', key: 'telephone', render: (v: string) => v || '-' },
    {
      title: 'Filières',
      key: 'actions',
      render: (_: any, s: SocieteExpeditrice) => (
        <Tag
          style={{ cursor: 'pointer' }}
          icon={<ApartmentOutlined />}
          color="blue"
          onClick={() => { setSelectedSociete(s); setFiliereDrawerOpen(true); }}
        >
          Voir les filières ({s.filieres?.length || 0})
        </Tag>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <ApartmentOutlined style={{ fontSize: 22, color: '#1890ff' }} />
        <Title level={3} style={{ margin: 0 }}>Sociétés Expéditrices partenaires</Title>
      </div>

      <Alert
        type="info"
        icon={<InfoCircleOutlined />}
        showIcon
        message="Vous consultez les sociétés expéditrices qui travaillent avec votre société. La gestion est assurée par chaque responsable expéditeur."
        style={{ marginBottom: 16 }}
      />

      <Table
        dataSource={societes}
        columns={columns}
        rowKey="id"
        size="middle"
        pagination={{ pageSize: 20 }}
        locale={{ emptyText: 'Aucune société expéditrice partenaire' }}
      />

      <Drawer
        title={
          selectedSociete && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 12, height: 12, borderRadius: '50%',
                background: selectedSociete.couleur || '#1890ff',
              }} />
              <span>{selectedSociete.nom}</span>
            </div>
          )
        }
        open={filiereDrawerOpen}
        onClose={() => setFiliereDrawerOpen(false)}
        style={{ width: 420 }}
      >
        {selectedSociete?.filieres?.length === 0 ? (
          <Text type="secondary">Aucune filière enregistrée.</Text>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }} size={8}>
            {selectedSociete?.filieres?.map((f) => (
              <div key={f.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', background: '#fafafa', borderRadius: 8,
                border: '1px solid #f0f0f0',
              }}>
                <div>
                  <Tag color={selectedSociete.couleur || 'blue'} style={{ fontSize: 13 }}>
                    {f.nom}
                  </Tag>
                  {f.code && (
                    <Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>[{f.code}]</Text>
                  )}
                </div>
              </div>
            ))}
          </Space>
        )}
      </Drawer>
    </div>
  );
};

export default ExpediteursPage;

