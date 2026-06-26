import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Divider } from 'antd';
import { TruckOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Role, CompanyType } from '../../types';

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    setError('');
    try {
      const { role, companyType } = await login(values.email, values.password);
      if (role === Role.SUPER_ADMIN)           navigate('/admin');
      else if (role === Role.EXPEDITEUR_ADMIN) navigate('/expediteur');
      else if (role === Role.MAGASINIER)       navigate('/magasin');
      else if (role === Role.SECURITE)         navigate('/securite');
      else if (companyType === CompanyType.EXPEDITEUR) navigate('/expediteur');
      else                                     navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #001529 0%, #003366 100%)',
    }}>
      <Card style={{ width: 420, borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(24,144,255,0.35)',
            }}>
              <TruckOutlined style={{ fontSize: 30, color: '#fff' }} />
            </div>
          </div>
          <Title level={2} style={{ margin: '0 0 2px' }}>
            <span style={{ color: '#1890ff' }}>Logi</span>
            <span style={{ color: '#722ed1' }}>Flow</span>
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>Transport Management System</Text>
        </div>

        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

        <Form layout="vertical" onFinish={onFinish} size="large">
          <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Email requis' }]}>
            <Input prefix={<MailOutlined />} placeholder="Email" autoComplete="email" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'Mot de passe requis' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Mot de passe" autoComplete="current-password" />
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: -12, marginBottom: 16 }}>
            <Link to="/forgot-password" style={{ fontSize: 13 }}>Mot de passe oublié ?</Link>
          </div>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Se connecter
            </Button>
          </Form.Item>
        </Form>

        <Divider style={{ margin: '8px 0 16px' }} />
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Nouvelle société ?{' '}
            <Link to="/register" style={{ fontSize: 13 }}>Créer un compte</Link>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
