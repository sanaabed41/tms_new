import React, { useState } from 'react';
import {
  Form, Input, Button, Card, Typography, Alert, Row, Col, Divider,
} from 'antd';
import {
  TruckOutlined, UserOutlined, MailOutlined,
  LockOutlined, BankOutlined, ArrowRightOutlined,
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CompanyType, Role } from '../../types';

const { Title, Text, Paragraph } = Typography;

const RegisterPage: React.FC = () => {
  const companyType = CompanyType.EXPEDITEUR;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const onFinish = async (values: any) => {
    setLoading(true);
    setError('');
    try {
      const { role, companyType: ct } = await register({
        companyNom: values.companyNom,
        companyType,
        code: values.code,
        prenom: values.prenom,
        nom: values.nom,
        email: values.email,
        password: values.password,
      });
      if (role === Role.EXPEDITEUR_ADMIN || ct === CompanyType.EXPEDITEUR) navigate('/expediteur');
      else navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #001529 0%, #003366 100%)',
      padding: '24px 16px',
    }}>
      <Card style={{ width: 520, borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
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
          <Text type="secondary" style={{ fontSize: 13 }}>Créer un compte expéditeur</Text>
        </div>

        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

        <Form form={form} layout="vertical" onFinish={onFinish} size="large">
          <Divider orientationMargin={0} style={{ fontSize: 13, marginTop: 0 }}>
            Votre société
          </Divider>

          <Row gutter={12}>
            <Col span={16}>
              <Form.Item
                name="companyNom"
                label="Nom de la société"
                rules={[{ required: true, message: 'Requis' }]}
              >
                <Input prefix={<BankOutlined />} placeholder="Ex : Rose Blanche" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="code" label="Code court">
                <Input placeholder="Ex : RB" maxLength={6} style={{ textTransform: 'uppercase' }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientationMargin={0} style={{ fontSize: 13 }}>
            Votre compte administrateur
          </Divider>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="prenom" label="Prénom" rules={[{ required: true, message: 'Requis' }]}>
                <Input prefix={<UserOutlined />} placeholder="Prénom" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="nom" label="Nom" rules={[{ required: true, message: 'Requis' }]}>
                <Input placeholder="Nom de famille" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="email"
            label="Email professionnel"
            rules={[{ required: true, type: 'email', message: 'Email valide requis' }]}
          >
            <Input prefix={<MailOutlined />} placeholder="admin@societe.tn" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mot de passe"
            rules={[{ required: true, message: 'Requis' }, { min: 8, message: 'Minimum 8 caractères' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Minimum 8 caractères" />
          </Form.Item>

          <Form.Item
            name="confirm"
            label="Confirmer le mot de passe"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Requis' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) return Promise.resolve();
                  return Promise.reject(new Error('Les mots de passe ne correspondent pas'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Confirmer le mot de passe" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 8 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              icon={<ArrowRightOutlined />}
              style={{ background: '#722ed1', borderColor: '#722ed1' }}
            >
              Créer mon compte
            </Button>
          </Form.Item>
        </Form>

        <Divider style={{ margin: '12px 0' }} />
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Déjà un compte ? <Link to="/login">Se connecter</Link>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default RegisterPage;
