import React, { useEffect, useState } from 'react';
import {
  Card, Form, Input, Button, Typography, Alert, Descriptions, Tag, Space, Spin, Divider,
} from 'antd';
import {
  TruckOutlined, CheckCircleOutlined, ClockCircleOutlined,
  MailOutlined, SendOutlined, BankOutlined, UserOutlined,
} from '@ant-design/icons';
import { expediteurPortalAPI } from '../../api';

const { Title, Text, Paragraph } = Typography;

interface LogistiqueState {
  company: { id: string; nom: string; adresse?: string; telephone?: string } | null;
  adminUser: { id: string; prenom: string; nom: string; email: string; isActive: boolean } | null;
  pendingInvitation: boolean;
}

const LogistiquePage: React.FC = () => {
  const [state, setState] = useState<LogistiqueState | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form] = Form.useForm();

  const fetchData = async () => {
    try {
      const res = await expediteurPortalAPI.getMyLogistique();
      setState(res.data);
    } catch {
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSetup = async (values: any) => {
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await expediteurPortalAPI.setupLogistique({
        companyNom: values.companyNom,
        adresse: values.adresse,
        telephone: values.telephone,
        adminEmail: values.adminEmail,
      });
      setSuccess(`Société logistique créée. Invitation envoyée à ${values.adminEmail}.`);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    setSuccess('');
    try {
      await expediteurPortalAPI.resendLogistiqueInvitation();
      setSuccess('Invitation renvoyée avec succès.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du renvoi');
    } finally {
      setResending(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>;

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Ma Société Logistique</Title>
        <Text type="secondary">
          Votre partenaire logistique gère le planning de chargement, les camions et les quais.
        </Text>
      </div>

      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} closable onClose={() => setError('')} />}
      {success && <Alert message={success} type="success" showIcon style={{ marginBottom: 16 }} closable onClose={() => setSuccess('')} />}

      {/* ── Pas encore de société logistique ── */}
      {!state?.company && (
        <Card>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <TruckOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 12 }} />
            <Title level={4} style={{ margin: 0 }}>Configurer votre société logistique</Title>
            <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
              Renseignez les informations de votre prestataire logistique. Un email d'invitation
              sera envoyé au responsable pour qu'il configure son accès à la plateforme.
            </Paragraph>
          </div>

          <Form form={form} layout="vertical" onFinish={handleSetup} size="large">
            <Divider orientationMargin={0} style={{ fontSize: 13, marginTop: 0 }}>
              Informations de la société
            </Divider>

            <Form.Item
              name="companyNom"
              label="Nom de la société logistique"
              rules={[{ required: true, message: 'Requis' }]}
            >
              <Input prefix={<BankOutlined />} placeholder="Ex : TransFood Logistics" />
            </Form.Item>

            <Form.Item name="adresse" label="Adresse">
              <Input placeholder="Ex : Zone Industrielle, Tunis" />
            </Form.Item>

            <Form.Item name="telephone" label="Téléphone">
              <Input placeholder="Ex : +216 71 000 000" />
            </Form.Item>

            <Divider orientationMargin={0} style={{ fontSize: 13 }}>
              Compte du responsable logistique
            </Divider>

            <Form.Item
              name="adminEmail"
              label="Email du responsable logistique"
              rules={[{ required: true, type: 'email', message: 'Email valide requis' }]}
              extra="Il recevra un lien pour créer son mot de passe et accéder à la plateforme."
            >
              <Input prefix={<MailOutlined />} placeholder="responsable@logistique.tn" />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                icon={<SendOutlined />}
                block
              >
                Créer et envoyer l'invitation
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )}

      {/* ── Société logistique configurée ── */}
      {state?.company && (
        <Card>
          <Descriptions
            title={
              <Space>
                <TruckOutlined style={{ color: '#1890ff' }} />
                <span>Société logistique</span>
              </Space>
            }
            bordered
            column={1}
            size="small"
            style={{ marginBottom: 24 }}
          >
            <Descriptions.Item label="Nom">{state.company.nom}</Descriptions.Item>
            {state.company.adresse && (
              <Descriptions.Item label="Adresse">{state.company.adresse}</Descriptions.Item>
            )}
            {state.company.telephone && (
              <Descriptions.Item label="Téléphone">{state.company.telephone}</Descriptions.Item>
            )}
          </Descriptions>

          <Descriptions
            title={
              <Space>
                <UserOutlined />
                <span>Responsable logistique</span>
              </Space>
            }
            bordered
            column={1}
            size="small"
          >
            {state.adminUser ? (
              <>
                <Descriptions.Item label="Nom">
                  {state.adminUser.prenom} {state.adminUser.nom}
                </Descriptions.Item>
                <Descriptions.Item label="Email">{state.adminUser.email}</Descriptions.Item>
                <Descriptions.Item label="Statut">
                  {state.adminUser.isActive
                    ? <Tag color="green" icon={<CheckCircleOutlined />}>Actif</Tag>
                    : <Tag color="red">Inactif</Tag>
                  }
                </Descriptions.Item>
              </>
            ) : state.pendingInvitation ? (
              <Descriptions.Item label="Statut">
                <Space>
                  <Tag color="orange" icon={<ClockCircleOutlined />}>Invitation en attente</Tag>
                  <Button
                    size="small"
                    icon={<SendOutlined />}
                    loading={resending}
                    onClick={handleResend}
                  >
                    Renvoyer l'invitation
                  </Button>
                </Space>
              </Descriptions.Item>
            ) : (
              <Descriptions.Item label="Statut">
                <Tag color="default">Aucun responsable</Tag>
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}
    </div>
  );
};

export default LogistiquePage;
