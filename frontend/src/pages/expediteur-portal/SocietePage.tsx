import React, { useEffect, useState } from 'react';
import {
  Card, Form, Input, Button, Typography, Descriptions, Tag, message, Space,
} from 'antd';
import { ApartmentOutlined, EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { expediteurPortalAPI } from '../../api';
import { SocieteExpeditrice } from '../../types';

const { Title, Text } = Typography;

const SocietePage: React.FC = () => {
  const [societe, setSociete] = useState<SocieteExpeditrice | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const fetch = () => {
    setLoading(true);
    expediteurPortalAPI.getMySociete()
      .then((res) => setSociete(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const startEdit = () => {
    form.setFieldsValue({
      nom: societe?.nom,
      adresse: societe?.adresse,
      telephone: societe?.telephone,
      couleur: societe?.couleur,
    });
    setEditing(true);
  };

  const handleSave = async (values: any) => {
    setSaving(true);
    try {
      await expediteurPortalAPI.updateMySociete(values);
      message.success('Informations mises à  jour');
      setEditing(false);
      fetch();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Erreur lors de la mise à  jour');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <ApartmentOutlined style={{ fontSize: 22, color: '#722ed1' }} />
        <Title level={3} style={{ margin: 0 }}>Ma Société</Title>
      </div>

      <Card
        style={{ borderTop: `3px solid ${societe?.couleur || '#722ed1'}` }}
        extra={
          !editing && (
            <Button icon={<EditOutlined />} onClick={startEdit}>
              Modifier
            </Button>
          )
        }
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {societe?.couleur && (
              <span style={{
                display: 'inline-block', width: 14, height: 14,
                borderRadius: '50%', background: societe.couleur,
                border: '1px solid #d9d9d9', flexShrink: 0,
              }} />
            )}
            <Text strong style={{ fontSize: 15 }}>{societe?.nom}</Text>
            {societe?.code && <Tag color="purple">{societe.code}</Tag>}
          </div>
        }
      >
        {editing ? (
          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Form.Item name="nom" label="Nom de la société" rules={[{ required: true, message: 'Requis' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="adresse" label="Adresse">
              <Input placeholder="Ex: Zone Industrielle, Sfax" />
            </Form.Item>
            <Form.Item name="telephone" label="Téléphone">
              <Input placeholder="Ex: +216 74 000 000" />
            </Form.Item>
            <Form.Item
              name="couleur"
              label="Couleur d'identification"
              rules={[{ pattern: /^#[0-9a-fA-F]{6}$/, message: 'Format attendu : #RRGGBB' }]}
            >
              <Input
                placeholder="#722ed1"
                prefix={
                  <span style={{
                    display: 'inline-block', width: 14, height: 14,
                    borderRadius: 3, background: form.getFieldValue('couleur') || '#d9d9d9',
                    border: '1px solid #d9d9d9',
                  }} />
                }
              />
            </Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={saving}
                icon={<SaveOutlined />}
                style={{ background: '#722ed1', borderColor: '#722ed1' }}
              >
                Enregistrer
              </Button>
              <Button icon={<CloseOutlined />} onClick={() => setEditing(false)}>
                Annuler
              </Button>
            </Space>
          </Form>
        ) : (
          <Descriptions column={{ xs: 1, sm: 2 }} size="middle">
            <Descriptions.Item label="Adresse">
              {societe?.adresse || <Text type="secondary">-</Text>}
            </Descriptions.Item>
            <Descriptions.Item label="Téléphone">
              {societe?.telephone || <Text type="secondary">-</Text>}
            </Descriptions.Item>
            <Descriptions.Item label="Couleur">
              {societe?.couleur ? (
                <Space>
                  <span style={{
                    display: 'inline-block', width: 18, height: 18,
                    borderRadius: 4, background: societe.couleur,
                    border: '1px solid #d9d9d9', verticalAlign: 'middle',
                  }} />
                  <Text code>{societe.couleur}</Text>
                </Space>
              ) : <Text type="secondary">-</Text>}
            </Descriptions.Item>
            <Descriptions.Item label="Filières">
              <Tag color="purple">{societe?.filieres?.length ?? 0} filière{(societe?.filieres?.length ?? 0) !== 1 ? 's' : ''}</Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Card>
    </div>
  );
};

export default SocietePage;

