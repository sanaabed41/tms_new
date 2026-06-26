import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Card, Typography, Result, Spin, Alert, Tag } from 'antd';
import { UserOutlined, LockOutlined, TruckOutlined } from '@ant-design/icons';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { invitationsAPI } from '../../api';

const { Title, Text } = Typography;

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Administrateur',
  LOGISTIC_ADMIN: 'Responsable Logistique',
  EXPEDITEUR_ADMIN: 'Admin Expéditeur',
  FILIERE_ADMIN: 'Admin Filière',
  MAGASINIER: 'Magasinier',
  SECURITE: 'Agent Sécurité',
};

const AcceptInvitationPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    invitationsAPI.verify(token)
      .then((res) => setInvitation(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Invitation invalide'))
      .finally(() => setVerifying(false));
  }, [token]);

  const onFinish = async (values: { nom: string; prenom: string; password: string }) => {
    setLoading(true);
    setError('');
    try {
      await invitationsAPI.accept(token!, values);
      setDone(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #001529 0%, #003366 100%)' }}>
      <Spin size="large" />
    </div>
  );

  if (error && !invitation) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #001529 0%, #003366 100%)' }}>
      <Card style={{ width: 440, borderRadius: 12, textAlign: 'center' }}>
        <Result
          status="error"
          title="Invitation invalide"
          subTitle={error}
          extra={<Link to="/login"><Button type="primary">Aller à la connexion</Button></Link>}
        />
      </Card>
    </div>
  );

  if (done) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #001529 0%, #003366 100%)' }}>
      <Card style={{ width: 440, borderRadius: 12, textAlign: 'center' }}>
        <Result
          status="success"
          title="Compte créé avec succès !"
          subTitle="Vous pouvez maintenant vous connecter avec votre email et mot de passe."
          extra={<Button type="primary" onClick={() => navigate('/login')}>Se connecter</Button>}
        />
      </Card>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #001529 0%, #003366 100%)' }}>
      <Card style={{ width: 460, borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <TruckOutlined style={{ fontSize: 44, color: '#1890ff' }} />
          <Title level={3} style={{ marginTop: 12, marginBottom: 4 }}>Créer votre compte</Title>
          <Text type="secondary">Invitation de <strong>{invitation?.company?.nom}</strong></Text>
          <br />
          <Tag color="blue" style={{ marginTop: 6 }}>{roleLabels[invitation?.role] || invitation?.role}</Tag>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>{invitation?.email}</Text>
        </div>

        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

        <Form layout="vertical" onFinish={onFinish} size="large">
          <Form.Item name="prenom" label="Prénom" rules={[{ required: true }]}>
            <Input prefix={<UserOutlined />} placeholder="Votre prénom" />
          </Form.Item>
          <Form.Item name="nom" label="Nom" rules={[{ required: true }]}>
            <Input prefix={<UserOutlined />} placeholder="Votre nom" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Mot de passe"
            rules={[
              { required: true },
              { min: 8, message: 'Minimum 8 caractères' },
              { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: 'Doit contenir majuscule, minuscule et chiffre' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Minimum 8 caractères" />
          </Form.Item>
          <Form.Item
            name="confirm"
            label="Confirmer le mot de passe"
            dependencies={['password']}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) return Promise.resolve();
                  return Promise.reject('Les mots de passe ne correspondent pas');
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Répétez le mot de passe" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              Créer mon compte
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AcceptInvitationPage;
