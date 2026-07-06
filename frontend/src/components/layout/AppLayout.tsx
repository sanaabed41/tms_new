import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography, Tag } from 'antd';
import {
  DashboardOutlined, FileTextOutlined, TruckOutlined,
  TeamOutlined,
  LogoutOutlined, UserOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
  CalendarOutlined, AuditOutlined, BankOutlined, SafetyOutlined,
  InboxOutlined, ApartmentOutlined, IdcardOutlined, SettingOutlined,
  HistoryOutlined, UsergroupAddOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../types';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const roleColors: Record<Role, string> = {
  [Role.SUPER_ADMIN]: 'red',
  [Role.LOGISTIC_ADMIN]: 'blue',
  [Role.EXPEDITEUR_ADMIN]: 'purple',
  [Role.FILIERE_ADMIN]: 'magenta',
  [Role.MAGASINIER]: 'green',
  [Role.SECURITE]: 'orange',
  [Role.TRANSPORT_ADMIN]: 'cyan',
};

const roleLabels: Record<Role, string> = {
  [Role.SUPER_ADMIN]: 'Super Admin',
  [Role.LOGISTIC_ADMIN]: 'Resp. Logistique',
  [Role.EXPEDITEUR_ADMIN]: 'Admin Expéditeur',
  [Role.FILIERE_ADMIN]: 'Admin Filière',
  [Role.MAGASINIER]: 'Magasinier',
  [Role.SECURITE]: 'Agent Sécurité',
  [Role.TRANSPORT_ADMIN]: 'Admin Transport',
};

const superAdminMenu = [
  { key: '/admin/companies', icon: <BankOutlined />, label: 'Comptes Admins' },
  { key: '/admin/logs', icon: <AuditOutlined />, label: 'Audits' },
];

const logisticAdminMenu = [
  { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/bons-livraison', icon: <FileTextOutlined />, label: 'Bons de Livraison' },
  { key: '/planning', icon: <CalendarOutlined />, label: 'Planning Chargement' },
  { key: '/transport', icon: <TruckOutlined />, label: 'Camions disponibles' },
  { key: '/historique', icon: <HistoryOutlined />, label: 'Historique' },
  { key: '/users', icon: <UsergroupAddOutlined />, label: 'Société Transport' },
  { key: '/parametres', icon: <SettingOutlined />, label: 'Paramètres' },
];

const expediteurAdminMenu = [
  { key: '/expediteur', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/expediteur/filieres', icon: <ApartmentOutlined />, label: 'Filières & Quais' },
  { key: '/expediteur/users', icon: <TeamOutlined />, label: 'Admins Filières' },
  { key: '/expediteur/bls', icon: <FileTextOutlined />, label: 'Bons de Livraison' },
  { key: '/expediteur/planning', icon: <CalendarOutlined />, label: 'Plans validés' },
  { key: '/expediteur/societe', icon: <BankOutlined />, label: 'Ma Société' },
  { key: '/expediteur/logistique', icon: <TruckOutlined />, label: 'Société Logistique' },
];

const filiereAdminMenu = [
  { key: '/filiere-admin', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/filiere-admin/users', icon: <TeamOutlined />, label: 'Utilisateurs' },
  { key: '/filiere-admin/bls', icon: <FileTextOutlined />, label: 'Bons de Livraison' },
  { key: '/filiere-admin/planning', icon: <CalendarOutlined />, label: 'Plans validés' },
  { key: '/filiere-admin/quais', icon: <InboxOutlined />, label: 'Mes Quais' },
  { key: '/filiere-admin/profile', icon: <IdcardOutlined />, label: 'Mon profil' },
];

const magasinierMenu = [
  { key: '/magasin/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/magasin/planning', icon: <CalendarOutlined />, label: 'Plans de chargement' },
  { key: '/magasin/quai', icon: <InboxOutlined />, label: 'Gestion du Quai' },
  { key: '/magasin/parametres', icon: <SettingOutlined />, label: 'Paramètres' },
];

const securiteMenu = [
  { key: '/securite', icon: <SafetyOutlined />, label: 'Contrôle des Entrées' },
];

const transportAdminMenu = [
  { key: '/transport-portal', icon: <TruckOutlined />, label: 'Mes Camions' },
  { key: '/transport-portal/rapport', icon: <FileTextOutlined />, label: 'Rapport de chargement' },
];

const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isSuperAdmin      = user?.role === Role.SUPER_ADMIN;
  const isExpéditeurAdmin = user?.role === Role.EXPEDITEUR_ADMIN;
  const isFiliereAdmin    = user?.role === Role.FILIERE_ADMIN;
  const isMagasinier      = user?.role === Role.MAGASINIER;
  const isSecurite        = user?.role === Role.SECURITE;
  const isTransportAdmin  = user?.role === Role.TRANSPORT_ADMIN;

  const menuItems = isSuperAdmin      ? superAdminMenu
    : isExpéditeurAdmin ? expediteurAdminMenu
    : isFiliereAdmin    ? filiereAdminMenu
    : isMagasinier      ? magasinierMenu
    : isSecurite        ? securiteMenu
    : isTransportAdmin  ? transportAdminMenu
    : logisticAdminMenu;

  const selectedKey = (() => {
    if (isSuperAdmin) {
      const match = [...superAdminMenu].reverse().find(m => location.pathname.startsWith(m.key));
      return match?.key ?? '/admin/companies';
    }
    if (isExpéditeurAdmin) {
      const match = [...expediteurAdminMenu].reverse().find(m => location.pathname.startsWith(m.key));
      return match?.key ?? '/expediteur';
    }
    if (isFiliereAdmin) {
      const match = [...filiereAdminMenu].reverse().find(m => location.pathname.startsWith(m.key));
      return match?.key ?? '/filiere-admin';
    }
    if (isMagasinier) {
      const match = [...magasinierMenu].reverse().find(m => location.pathname.startsWith(m.key));
      return match?.key ?? '/magasin/dashboard';
    }
    if (isSecurite) {
      const match = [...securiteMenu].reverse().find(m => location.pathname.startsWith(m.key));
      return match?.key ?? '/securite';
    }
    if (isTransportAdmin) return '/transport-portal';
    return location.pathname;
  })();

  const userMenu = {
    items: [
      { key: 'logout', icon: <LogoutOutlined />, label: 'Déconnexion', danger: true },
    ],
    onClick: ({ key }: any) => { if (key === 'logout') logout(); },
  };

  const siderBg     = isSuperAdmin ? '#1a1a2e' : isExpéditeurAdmin ? '#150a2e' : isFiliereAdmin ? '#1a0a2e' : isMagasinier ? '#0a1f14' : isSecurite ? '#1a1000' : isTransportAdmin ? '#002329' : '#001529';
  const accentColor = isSuperAdmin ? '#ff4d4f' : isExpéditeurAdmin ? '#722ed1' : isFiliereAdmin ? '#eb2f96' : isMagasinier ? '#52c41a' : isSecurite ? '#fa8c16' : isTransportAdmin ? '#13c2c2' : '#1890ff';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={230}
        style={{ background: siderBg }}
      >
        <div style={{
          padding: collapsed ? '14px 8px' : '12px 16px',
          textAlign: 'center',
          borderBottom: `1px solid ${isSuperAdmin ? '#2d2d4e' : isExpéditeurAdmin ? '#2e1a4e' : '#2a2a2a'}`,
          background: isSuperAdmin ? '#16213e' : isExpéditeurAdmin ? '#1a0d38' : '#002140',
        }}>
          {collapsed ? (
            <div style={{
              width: 36, height: 36, borderRadius: 10, margin: '0 auto',
              background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}aa 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <TruckOutlined style={{ fontSize: 18, color: '#fff' }} />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}aa 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <TruckOutlined style={{ fontSize: 18, color: '#fff' }} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 16, letterSpacing: 0.5, lineHeight: 1.1 }}>
                  Logi<span style={{ color: accentColor }}>Flow</span>
                </div>
                <div style={{ color: '#ffffff55', fontSize: 10, lineHeight: 1.1 }}>
                  {isSuperAdmin ? 'Administration'
                    : isExpéditeurAdmin ? 'Portail Expéditeur'
                    : isFiliereAdmin ? 'Admin Filière'
                    : isMagasinier ? (user?.filieres?.[0]?.nom || 'Magasin')
                    : isSecurite ? 'Sécurité'
                    : isTransportAdmin ? 'Portail Transport'
                    : user?.company?.nom || 'Logistique'}
                </div>
              </div>
            </div>
          )}
        </div>

        <Menu
          theme="dark"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ marginTop: 8, background: siderBg }}
        />

        {(isSuperAdmin || isExpéditeurAdmin || isFiliereAdmin) && !collapsed && (
          <div style={{
            position: 'absolute', bottom: 56, left: 0, right: 0,
            padding: '8px 16px',
            borderTop: `1px solid ${isSuperAdmin ? '#2d2d4e' : '#2e1a4e'}`,
          }}>
            {isSuperAdmin
              ? <Tag color="red" style={{ width: '100%', textAlign: 'center', margin: 0 }}><SafetyOutlined /> Accès plateforme</Tag>
              : isExpéditeurAdmin
                ? <Tag color="purple" style={{ width: '100%', textAlign: 'center', margin: 0 }}><ApartmentOutlined /> Portail Expéditeur</Tag>
                : <Tag color="magenta" style={{ width: '100%', textAlign: 'center', margin: 0 }}><ApartmentOutlined /> Admin Filière</Tag>
            }
          </div>
        )}
      </Sider>

      <Layout>
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
          borderBottom: isSuperAdmin ? '2px solid #fff1f0' : isExpéditeurAdmin ? '2px solid #f9f0ff' : isFiliereAdmin ? '2px solid #fff0f6' : isTransportAdmin ? '2px solid #e6fffb' : 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
              onClick: () => setCollapsed(!collapsed),
              style: { fontSize: 18, cursor: 'pointer', color: '#595959' },
            })}
            <Text strong style={{ fontSize: 15, color: accentColor }}>
              {isSuperAdmin ? 'Panneau d\'administration'
                : isExpéditeurAdmin ? (user?.company?.nom || 'Portail Expéditeur')
                : isFiliereAdmin ? (user?.filieres?.[0]?.nom || 'Admin Filière')
                : isTransportAdmin ? 'Portail Transport'
                : (user?.company?.nom || 'LogiFlow')}
            </Text>
          </div>

          <Dropdown menu={userMenu} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} style={{ background: accentColor }} />
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.prenom} {user?.nom}</div>
                {user?.role && (
                  <Tag color={roleColors[user.role]} style={{ marginTop: 2, fontSize: 10 }}>
                    {roleLabels[user.role]}
                  </Tag>
                )}
              </div>
            </div>
          </Dropdown>
        </Header>

        <Content style={{ margin: '24px', background: '#f5f5f5', minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
