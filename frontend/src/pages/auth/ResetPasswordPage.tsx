import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Card, Typography, Result, Spin, Alert } from 'antd';
import { LockOutlined, TruckOutlined } from '@ant-design/icons';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../../api';

const { Title, Text } = Typography;

const ResetPasswordPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    authAPI.verifyResetToken(token)
      .then((res) => { setTokenValid(true); setEmail(res.data.email); })
      .catch(() => setTokenValid(false))
      .finally(() => setVerifying(false));
  }, [token]);

  const onFinish = async (values: { password: string }) => {
    setLoading(true);
    setError('');
    try {
      await authAPI.resetPassword(token!, values.password);
      setDone(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la réinitialisation');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #001529 0%, #003366 100%)' }}>
      <Spin size="large" />
    </div>
  );

  if (!tokenValid) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #001529 0%, #003366 100%)' }}>
      <Card style={{ width: 440, borderRadius: 12, textAlign: 'center' }}>
        <Result
          status="error"
          title="Lien invalide ou expiré"
          subTitle="Ce lien de réinitialisation n'est plus valide. Veuillez faire une nouvelle demande."
          extra={<Link to="/forgot-password"><Button type="primary">Nouvelle demande</Button></Link>}
        />
      </Card>
    </div>
  );

  if (done) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #001529 0%, #003366 100%)' }}>
      <Card style={{ width: 440, borderRadius: 12, textAlign: 'center' }}>
        <Result
          status="success"
          title="Mot de passe réinitialisé !"
          subTitle="Vous pouvez maintenant vous connecter avec votre nouveau mot de passe."
          extra={<Button type="primary" onClick={() => navigate('/login')}>Se connecter</Button>}
        />
      </Card>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #001529 0%, #003366 100%)' }}>
      <Card style={{ width: 420, borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <TruckOutlined style={{ fontSize: 44, color: '#1890ff' }} />
          <Title level={3} style={{ marginTop: 12, marginBottom: 4 }}>Nouveau mot de passe</Title>
          <Text type="secondary">{email}</Text>
        </div>

        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

        <Form layout="vertical" onFinish={onFinish} size="large">
          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Mot de passe requis' },
              { min: 8, message: 'Minimum 8 caractères' },
              { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: 'Doit contenir majuscule, minuscule et chiffre' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Nouveau mot de passe" />
          </Form.Item>
          <Form.Item
            name="confirm"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Confirmez le mot de passe' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) return Promise.resolve();
                  return Promise.reject('Les mots de passe ne correspondent pas');
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Confirmer le mot de passe" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Réinitialiser
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
