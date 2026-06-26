import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Result } from 'antd';
import { MailOutlined, TruckOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { authAPI } from '../../api';

const { Title, Text } = Typography;

const ForgotPasswordPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');

  const onFinish = async (values: { email: string }) => {
    setLoading(true);
    try {
      await authAPI.forgotPassword(values.email);
      setEmail(values.email);
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #001529 0%, #003366 100%)' }}>
        <Card style={{ width: 440, borderRadius: 12, textAlign: 'center' }}>
          <Result
            status="success"
            title="Email envoyé !"
            subTitle={
              <>
                <Text>Si un compte existe pour <strong>{email}</strong>, vous recevrez un email avec un lien de réinitialisation.</Text>
                <br /><br />
                <Text type="secondary">Le lien expire dans <strong>1 heure</strong>. Vérifiez aussi vos spams.</Text>
              </>
            }
            extra={<Link to="/login"><Button type="primary">Retour à la connexion</Button></Link>}
          />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #001529 0%, #003366 100%)' }}>
      <Card style={{ width: 420, borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <TruckOutlined style={{ fontSize: 44, color: '#1890ff' }} />
          <Title level={3} style={{ marginTop: 12, marginBottom: 4 }}>Mot de passe oublié</Title>
          <Text type="secondary">Entrez votre email pour recevoir un lien de réinitialisation</Text>
        </div>

        <Form layout="vertical" onFinish={onFinish} size="large">
          <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Email invalide' }]}>
            <Input prefix={<MailOutlined />} placeholder="votre@email.com" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Envoyer le lien
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center' }}>
          <Link to="/login"><ArrowLeftOutlined /> Retour à la connexion</Link>
        </div>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
