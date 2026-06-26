import React, { useState } from 'react';
import {
  Card, Form, Input, Button, Typography, Tag, Space, Divider, message, Row, Col,
} from 'antd';
import {
  UserOutlined, MailOutlined, ApartmentOutlined, LockOutlined,
  EditOutlined, SaveOutlined, CloseOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { expediteurPortalAPI } from '../../api';

const { Title, Text } = Typography;

const FiliereAdminProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [profileForm] = Form.useForm();
  const [pwdForm] = Form.useForm();

  const filiere = user?.filieres?.[0];

  const handleProfileSave = async (values: any) => {
    setSubmitting(true);
    try {
      await expediteurPortalAPI.updateMyProfile({ prenom: values.prenom, nom: values.nom });
      message.success('Profil mis à jour');
      setEditing(false);
      refreshUser();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordSave = async (values: any) => {
    setSubmitting(true);
    try {
      await expediteurPortalAPI.updateMyProfile({ newPassword: values.newPassword });
      message.success('Mot de passe mis à jour');
      setChangingPwd(false);
      pwdForm.resetFields();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <UserOutlined style={{ fontSize: 22, color: '#eb2f96' }} />
        <Title level={3} style={{ margin: 0 }}>Mon profil</Title>
      </div>

      {/* Informations personnelles */}
      <Card
        title={
          <Space>
            <UserOutlined style={{ color: '#eb2f96' }} />
            <span>Informations personnelles</span>
          </Space>
        }
        extra={
          !editing
            ? (
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => {
                  profileForm.setFieldsValue({ prenom: user?.prenom, nom: user?.nom });
                  setEditing(true);
                }}
              >
                Modifier
              </Button>
            )
            : null
        }
        style={{ marginBottom: 16 }}
      >
        {editing ? (
          <Form form={profileForm} layout="vertical" onFinish={handleProfileSave}>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="prenom" label="Prénom" rules={[{ required: true, message: 'Requis' }]}>
                  <Input prefix={<UserOutlined />} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="nom" label="Nom" rules={[{ required: true, message: 'Requis' }]}>
                  <Input prefix={<UserOutlined />} />
                </Form.Item>
              </Col>
            </Row>
            <Space>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                htmlType="submit"
                loading={submitting}
                style={{ background: '#eb2f96', borderColor: '#eb2f96' }}
              >
                Enregistrer
              </Button>
              <Button icon={<CloseOutlined />} onClick={() => setEditing(false)}>Annuler</Button>
            </Space>
          </Form>
        ) : (
          <Row gutter={[0, 12]}>
            <Col span={24}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Nom complet</Text>
                <Text strong style={{ fontSize: 15 }}>{user?.prenom} {user?.nom}</Text>
              </div>
            </Col>
            <Col span={24}>
              <Space size={6}>
                <MailOutlined style={{ color: '#888' }} />
                <Text>{user?.email}</Text>
              </Space>
            </Col>
            <Col span={24}>
              <Space size={6}>
                <Tag color="magenta">Admin Filière</Tag>
                {!user?.isActive && <Tag color="red">Compte inactif</Tag>}
              </Space>
            </Col>
          </Row>
        )}
      </Card>

      {/* Ma filière */}
      <Card
        title={
          <Space>
            <ApartmentOutlined style={{ color: '#eb2f96' }} />
            <span>Ma filière</span>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        {filiere ? (
          <Row gutter={[0, 12]}>
            <Col span={24}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Nom</Text>
                <Text strong>{filiere.nom}</Text>
              </div>
            </Col>
            <Col span={24}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Code</Text>
                <Tag color="magenta" style={{ fontSize: 13 }}>{filiere.code}</Tag>
              </div>
            </Col>
          </Row>
        ) : (
          <Text type="secondary">Aucune filière assignée</Text>
        )}
      </Card>

      {/* Changer le mot de passe */}
      <Card
        title={
          <Space>
            <LockOutlined style={{ color: '#eb2f96' }} />
            <span>Mot de passe</span>
          </Space>
        }
        extra={
          !changingPwd
            ? <Button size="small" icon={<EditOutlined />} onClick={() => setChangingPwd(true)}>Changer</Button>
            : null
        }
      >
        {changingPwd ? (
          <Form form={pwdForm} layout="vertical" onFinish={handlePasswordSave}>
            <Form.Item
              name="newPassword"
              label="Nouveau mot de passe"
              rules={[{ required: true, min: 6, message: 'Au moins 6 caractères' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Nouveau mot de passe" />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label="Confirmer le mot de passe"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: 'Requis' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                    return Promise.reject(new Error('Les mots de passe ne correspondent pas'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Confirmer le mot de passe" />
            </Form.Item>
            <Divider style={{ margin: '8px 0 16px' }} />
            <Space>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                htmlType="submit"
                loading={submitting}
                style={{ background: '#eb2f96', borderColor: '#eb2f96' }}
              >
                Mettre à jour
              </Button>
              <Button icon={<CloseOutlined />} onClick={() => { setChangingPwd(false); pwdForm.resetFields(); }}>
                Annuler
              </Button>
            </Space>
          </Form>
        ) : (
          <Text type="secondary" style={{ fontSize: 13 }}>••••••••</Text>
        )}
      </Card>
    </div>
  );
};

export default FiliereAdminProfilePage;
