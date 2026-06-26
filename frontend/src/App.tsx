import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Spin } from 'antd';
import frFR from 'antd/locale/fr_FR';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import AcceptInvitationPage from './pages/auth/AcceptInvitationPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import BonsLivraisonPage from './pages/bons-livraison/BonsLivraisonPage';
import PlanningPage from './pages/planning/PlanningPage';
import TrucksPage from './pages/trucks/TrucksPage';
import DeliveryCompaniesPage from './pages/delivery-companies/DeliveryCompaniesPage';
import ArticlesPage from './pages/articles/ArticlesPage';
import UsersPage from './pages/users/UsersPage';
import CompaniesAdminPage from './pages/admin/CompaniesPage';
import AdminLogsPage from './pages/admin/AdminLogsPage';
import ExpediteursPage from './pages/expediteurs/ExpediteursPage';
import TransportPage from './pages/transport/TransportPage';
import MagasinPage from './pages/magasin/MagasinPage';
import MagasinierDashboardPage from './pages/magasinier/DashboardPage';
import MagasinierPlanningPage from './pages/magasinier/PlanningPage';
import MagasinierQuaiPage from './pages/magasinier/QuaiPage';
import MagasinierParametresPage from './pages/magasinier/ParametresPage';
import PlanningParametresPage from './pages/planning/ParametresPage';
import SecuritePage from './pages/securite/SecuritePage';
import SecuriteTVPage from './pages/securite/SecuriteTVPage';
import ExpediteursPortalDashboardPage from './pages/expediteur-portal/DashboardPage';
import ExpediteursPortalFilieresPage from './pages/expediteur-portal/FilieresPage';
import ExpediteursPortalUsersPage from './pages/expediteur-portal/UsersPage';
import ExpediteursPortalBLsPage from './pages/expediteur-portal/BLsPage';
import ExpediteursPortalSocietePage from './pages/expediteur-portal/SocietePage';
import ExpediteursPortalPlanningPage from './pages/expediteur-portal/PlanningPage';
import ExpediteursPortalLogistiquePage from './pages/expediteur-portal/LogistiquePage';
import FiliereAdminDashboardPage from './pages/filiere-admin/DashboardPage';
import FiliereAdminUsersPage from './pages/filiere-admin/UsersPage';
import FiliereAdminBLsPage from './pages/filiere-admin/BLsPage';
import FiliereAdminPlanningPage from './pages/filiere-admin/PlanningPage';
import FiliereAdminProfilePage from './pages/filiere-admin/ProfilePage';
import FiliereAdminQuaisPage from './pages/filiere-admin/QuaisPage';
import HistoriquePage from './pages/historique/HistoriquePage';
import TransportPortalPage from './pages/transport-portal/TransportPortalPage';
import { Role } from './types';

dayjs.locale('fr');

const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: Role[] }> = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Spin size="large" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
      <Route path="/forgot-password" element={user ? <Navigate to="/" replace /> : <ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={user ? <Navigate to="/" replace /> : <ResetPasswordPage />} />
      <Route path="/accept-invitation/:token" element={<AcceptInvitationPage />} />

      {/* TV mode – fullscreen, no layout wrapper */}
      <Route path="/securite/tv" element={
        <ProtectedRoute roles={[Role.SECURITE, Role.LOGISTIC_ADMIN, Role.SUPER_ADMIN]}>
          <SecuriteTVPage />
        </ProtectedRoute>
      } />

      {/* Protected */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>

        {/* ── Super Admin routes ── */}
        <Route path="/admin" element={<Navigate to="/admin/companies" replace />} />
        <Route path="/admin/companies" element={
          <ProtectedRoute roles={[Role.SUPER_ADMIN]}><CompaniesAdminPage /></ProtectedRoute>
        } />
        <Route path="/admin/logs" element={
          <ProtectedRoute roles={[Role.SUPER_ADMIN]}><AdminLogsPage /></ProtectedRoute>
        } />

        {/* ── Expediteur Admin routes ── */}
        <Route path="/expediteur" element={
          <ProtectedRoute roles={[Role.EXPEDITEUR_ADMIN]}><ExpediteursPortalDashboardPage /></ProtectedRoute>
        } />
        <Route path="/expediteur/filieres" element={
          <ProtectedRoute roles={[Role.EXPEDITEUR_ADMIN]}><ExpediteursPortalFilieresPage /></ProtectedRoute>
        } />
        <Route path="/expediteur/users" element={
          <ProtectedRoute roles={[Role.EXPEDITEUR_ADMIN]}><ExpediteursPortalUsersPage /></ProtectedRoute>
        } />
        <Route path="/expediteur/bls" element={
          <ProtectedRoute roles={[Role.EXPEDITEUR_ADMIN]}><ExpediteursPortalBLsPage /></ProtectedRoute>
        } />
        <Route path="/expediteur/planning" element={
          <ProtectedRoute roles={[Role.EXPEDITEUR_ADMIN]}><ExpediteursPortalPlanningPage /></ProtectedRoute>
        } />
        <Route path="/expediteur/societe" element={
          <ProtectedRoute roles={[Role.EXPEDITEUR_ADMIN]}><ExpediteursPortalSocietePage /></ProtectedRoute>
        } />
        <Route path="/expediteur/logistique" element={
          <ProtectedRoute roles={[Role.EXPEDITEUR_ADMIN]}><ExpediteursPortalLogistiquePage /></ProtectedRoute>
        } />

        {/* ── Filiere Admin routes ── */}
        <Route path="/filiere-admin" element={
          <ProtectedRoute roles={[Role.FILIERE_ADMIN]}><FiliereAdminDashboardPage /></ProtectedRoute>
        } />
        <Route path="/filiere-admin/users" element={
          <ProtectedRoute roles={[Role.FILIERE_ADMIN]}><FiliereAdminUsersPage /></ProtectedRoute>
        } />
        <Route path="/filiere-admin/bls" element={
          <ProtectedRoute roles={[Role.FILIERE_ADMIN]}><FiliereAdminBLsPage /></ProtectedRoute>
        } />
        <Route path="/filiere-admin/planning" element={
          <ProtectedRoute roles={[Role.FILIERE_ADMIN]}><FiliereAdminPlanningPage /></ProtectedRoute>
        } />
        <Route path="/filiere-admin/profile" element={
          <ProtectedRoute roles={[Role.FILIERE_ADMIN]}><FiliereAdminProfilePage /></ProtectedRoute>
        } />
        <Route path="/filiere-admin/quais" element={
          <ProtectedRoute roles={[Role.FILIERE_ADMIN]}><FiliereAdminQuaisPage /></ProtectedRoute>
        } />

        {/* ── Magasinier routes ── */}
        <Route path="/magasin/dashboard" element={
          <ProtectedRoute roles={[Role.MAGASINIER]}><MagasinierDashboardPage /></ProtectedRoute>
        } />
        <Route path="/magasin/planning" element={
          <ProtectedRoute roles={[Role.MAGASINIER]}><MagasinierPlanningPage /></ProtectedRoute>
        } />
        <Route path="/magasin/quai" element={
          <ProtectedRoute roles={[Role.MAGASINIER]}><MagasinierQuaiPage /></ProtectedRoute>
        } />
        <Route path="/magasin/parametres" element={
          <ProtectedRoute roles={[Role.MAGASINIER]}><MagasinierParametresPage /></ProtectedRoute>
        } />

        {/* ── Securite routes ── */}
        <Route path="/securite" element={
          <ProtectedRoute roles={[Role.SECURITE, Role.LOGISTIC_ADMIN]}><SecuritePage /></ProtectedRoute>
        } />

        {/* ── Logistic Admin routes ── */}
        <Route path="/" element={
          user?.role === Role.EXPEDITEUR_ADMIN
            ? <Navigate to="/expediteur" replace />
            : user?.role === Role.FILIERE_ADMIN
              ? <Navigate to="/filiere-admin" replace />
              : user?.role === Role.SUPER_ADMIN
                ? <Navigate to="/admin/companies" replace />
                : user?.role === Role.MAGASINIER
                  ? <Navigate to="/magasin/dashboard" replace />
                  : user?.role === Role.SECURITE
                    ? <Navigate to="/securite" replace />
                    : user?.role === Role.TRANSPORT_ADMIN
                      ? <Navigate to="/transport-portal" replace />
                      : <DashboardPage />
        } />
        <Route path="/magasin" element={
          <ProtectedRoute roles={[Role.LOGISTIC_ADMIN]}><MagasinPage /></ProtectedRoute>
        } />
        <Route path="/bons-livraison" element={
          <ProtectedRoute roles={[Role.LOGISTIC_ADMIN, Role.SUPER_ADMIN]}><BonsLivraisonPage /></ProtectedRoute>
        } />
        <Route path="/expediteurs" element={
          <ProtectedRoute roles={[Role.LOGISTIC_ADMIN, Role.SUPER_ADMIN]}><ExpediteursPage /></ProtectedRoute>
        } />
        <Route path="/transport" element={
          <ProtectedRoute roles={[Role.LOGISTIC_ADMIN, Role.SUPER_ADMIN]}><TransportPage /></ProtectedRoute>
        } />
        <Route path="/planning" element={
          <ProtectedRoute roles={[Role.LOGISTIC_ADMIN, Role.SUPER_ADMIN]}><PlanningPage /></ProtectedRoute>
        } />
        <Route path="/articles" element={
          <ProtectedRoute roles={[Role.SUPER_ADMIN]}><ArticlesPage /></ProtectedRoute>
        } />
        <Route path="/delivery-companies" element={
          <ProtectedRoute roles={[Role.LOGISTIC_ADMIN, Role.SUPER_ADMIN]}><DeliveryCompaniesPage /></ProtectedRoute>
        } />
        <Route path="/trucks" element={
          <ProtectedRoute roles={[Role.LOGISTIC_ADMIN, Role.SUPER_ADMIN]}><TrucksPage /></ProtectedRoute>
        } />
        <Route path="/users" element={
          <ProtectedRoute roles={[Role.LOGISTIC_ADMIN, Role.SUPER_ADMIN]}><UsersPage /></ProtectedRoute>
        } />
        <Route path="/parametres" element={
          <ProtectedRoute roles={[Role.LOGISTIC_ADMIN]}><PlanningParametresPage /></ProtectedRoute>
        } />
        <Route path="/historique" element={
          <ProtectedRoute roles={[Role.LOGISTIC_ADMIN, Role.SUPER_ADMIN, Role.EXPEDITEUR_ADMIN, Role.FILIERE_ADMIN, Role.MAGASINIER, Role.SECURITE]}>
            <HistoriquePage />
          </ProtectedRoute>
        } />
        <Route path="/transport-portal" element={
          <ProtectedRoute roles={[Role.TRANSPORT_ADMIN]}><TransportPortalPage /></ProtectedRoute>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => (
  <ConfigProvider locale={frFR} theme={{ token: { colorPrimary: '#1890ff', borderRadius: 8 } }}>
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  </ConfigProvider>
);

export default App;
