import api from './axios';
import { BlStatus } from '../types';

// Auth
export const authAPI = {
  register: (data: {
    companyNom: string; companyType: string; code?: string; couleur?: string;
    prenom: string; nom: string; email: string; password: string;
  }) => api.post('/auth/register', data),
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  profile: () => api.get('/auth/profile'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  verifyResetToken: (token: string) => api.get(`/auth/verify-reset-token/${token}`),
  resetPassword: (token: string, password: string) => api.post('/auth/reset-password', { token, password }),
};

// Invitations
export const invitationsAPI = {
  getAll: (companyId?: string) => api.get('/invitations', { params: { companyId } }),
  create: (data: { email: string; role: string; nom: string; prenom: string; filiereIds?: string[]; companyId?: string; deliveryCompanyNom?: string }) =>
    api.post('/invitations', data),
  verify: (token: string) => api.get(`/invitations/verify/${token}`),
  accept: (token: string, data: { nom: string; prenom: string; password: string }) =>
    api.post(`/invitations/accept/${token}`, data),
  resend: (id: string) => api.post(`/invitations/${id}/resend`),
  delete: (id: string) => api.delete(`/invitations/${id}`),
};

// Companies
export const companiesAPI = {
  getAll: (type?: string) => api.get('/companies', { params: type ? { type } : {} }),
  getOne: (id: string) => api.get(`/companies/${id}`),
  create: (data: any) => api.post('/companies', data),
  update: (id: string, data: any) => api.put(`/companies/${id}`, data),
  delete: (id: string) => api.delete(`/companies/${id}`),
  getByLogistique: (logistiqueId: string) =>
    api.get(`/companies/logistique/${logistiqueId}/expediteurs`),
  setLogistiqueCompany: (expediteurId: string, logistiqueId: string | null) =>
    api.put(`/companies/${expediteurId}/logistique`, { logistiqueId }),
};

// Users
export const usersAPI = {
  getAll: (companyId?: string) => api.get('/users', { params: { companyId } }),
  getOne: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  toggleActive: (id: string) => api.patch(`/users/${id}/toggle-active`),
  setFilieres: (id: string, filiereIds: string[]) => api.put(`/users/${id}/filieres`, { filiereIds }),
  delete: (id: string) => api.delete(`/users/${id}`),
};

// Delivery Companies
export const deliveryCompaniesAPI = {
  getAll: () => api.get('/delivery-companies'),
  getOne: (id: string) => api.get(`/delivery-companies/${id}`),
  create: (data: any) => api.post('/delivery-companies', data),
  update: (id: string, data: any) => api.put(`/delivery-companies/${id}`, data),
  delete: (id: string) => api.delete(`/delivery-companies/${id}`),
};

// Trucks
export const trucksAPI = {
  getAll: (deliveryCompanyId?: string) => api.get('/trucks', { params: { deliveryCompanyId } }),
  getOne: (id: string) => api.get(`/trucks/${id}`),
  create: (data: any) => api.post('/trucks', data),
  update: (id: string, data: any) => api.put(`/trucks/${id}`, data),
  delete: (id: string) => api.delete(`/trucks/${id}`),
};

// Articles
export const articlesAPI = {
  getAll: (search?: string) => api.get('/articles', { params: { search } }),
  getOne: (id: string) => api.get(`/articles/${id}`),
  create: (data: any) => api.post('/articles', data),
  update: (id: string, data: any) => api.put(`/articles/${id}`, data),
  delete: (id: string) => api.delete(`/articles/${id}`),
};

// Bons de Livraison
export const blAPI = {
  getAll: (statut?: BlStatus) => api.get('/bons-livraison', { params: { statut } }),
  getAvailable: () => api.get('/bons-livraison/available'),
  getOne: (id: string) => api.get(`/bons-livraison/${id}`),
  create: (data: any) => api.post('/bons-livraison', data),
  update: (id: string, data: any) => api.put(`/bons-livraison/${id}`, data),
  delete: (id: string) => api.delete(`/bons-livraison/${id}`),
};

// Loading Plans
export const loadingPlansAPI = {
  getAll: (date?: string) => api.get('/loading-plans', { params: { date } }),
  getHistory: (dateFrom?: string, dateTo?: string) => api.get('/loading-plans/history', { params: { dateFrom, dateTo } }),
  getMagasin: (date?: string) => api.get('/loading-plans/magasin', { params: { date } }),
  getOne: (id: string) => api.get(`/loading-plans/${id}`),
  create: (data: any) => api.post('/loading-plans', data),
  assignBl: (planId: string, blId: string, force = false) =>
    api.post(`/loading-plans/${planId}/assign-bl`, { blId }, { params: force ? { force: true } : {} }),
  removeBl: (planId: string, blId: string) => api.delete(`/loading-plans/${planId}/remove-bl/${blId}`),
  validate: (id: string, signature?: string) => api.put(`/loading-plans/${id}/validate`, { signature }),
  validateAll: (date: string, signature?: string) => api.put('/loading-plans/validate-all', { signature }, { params: { date } }),
  setArrivalTime: (id: string, heureArrivee: string) => api.put(`/loading-plans/${id}/heure-arrivee`, { heureArrivee }),
  loadingAction: (id: string, action: 'START' | 'PAUSE' | 'DONE') => api.put(`/loading-plans/${id}/loading-action`, { action }),
  nextStation: (id: string) => api.put(`/loading-plans/${id}/next-station`),
  entryAction: (id: string, action: 'CALL' | 'ENTER' | 'EXIT' | 'UNENTER', quai?: string) =>
    api.put(`/loading-plans/${id}/entry-action`, { action, quai }),
  getSecurity: (date?: string) => api.get('/loading-plans/security', { params: { date } }),
  getDayReport: (date?: string) => api.get('/loading-plans/day-report', { params: { date } }),
  getQuaisLibres: (date?: string) => api.get('/loading-plans/quais-libres', { params: { date } }),
  reorderBls: (planId: string, blIds: string[]) => api.put(`/loading-plans/${planId}/reorder-bls`, { blIds }),
  delete: (id: string) => api.delete(`/loading-plans/${id}`),
  sendReport: (date: string, companyNom: string) =>
    api.post('/loading-plans/send-report', { companyNom }, { params: { date } }),
};

// Quais
export const quaisAPI = {
  getAll: () => api.get('/quais'),
  create: (data: any) => api.post('/quais', data),
  update: (id: string, data: any) => api.put(`/quais/${id}`, data),
  delete: (id: string) => api.delete(`/quais/${id}`),
};

export const truckAvailabilityAPI = {
  getByDate: (date: string) => api.get('/truck-availability', { params: { date } }),
  // bulkSet: (truckIds: string[], date: string) => api.post('/truck-availability/bulk-set', { truckIds, date }),
  // bulkSetRange: (truckIds: string[], dateDebut: string, dateFin: string) =>
  //   api.post('/truck-availability/bulk-set-range', { truckIds, dateDebut, dateFin }),
  getByDateRange: (dateDebut: string, dateFin: string) =>
    api.get('/truck-availability/range', { params: { dateDebut, dateFin } }),
  // remove: (id: string) => api.delete(`/truck-availability/${id}`),
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getLogs: (params?: { companyId?: string; action?: string; fromDate?: string; toDate?: string; search?: string }) =>
    api.get('/admin/audit-logs', { params }),
};

// Portail Expéditeur (EXPEDITEUR_ADMIN)
export const expediteurPortalAPI = {
  getDashboard: () => api.get('/expediteur-portal/dashboard'),
  getMySociete: () => api.get('/expediteur-portal/me'),
  updateMySociete: (data: any) => api.put('/expediteur-portal/me', data),
  getMyBls: (date?: string) => api.get('/expediteur-portal/bls', { params: date ? { date } : {} }),
  getMyPlanning: (date?: string) => api.get('/expediteur-portal/planning', { params: date ? { date } : {} }),
  getMyUsers: () => api.get('/expediteur-portal/users'),
  getMyQuais: () => api.get('/expediteur-portal/quais'),
  toggleUserActive: (id: string) => api.patch(`/expediteur-portal/users/${id}/toggle-active`),
  deleteUser: (id: string) => api.delete(`/expediteur-portal/users/${id}`),
  getMyProfile: () => api.get('/expediteur-portal/profile'),
  updateMyProfile: (data: { prenom?: string; nom?: string; newPassword?: string }) =>
    api.put('/expediteur-portal/profile', data),
  // Filières
  createFiliere: (data: { nom: string; code: string }) => api.post('/expediteur-portal/filieres', data),
  updateFiliere: (id: string, data: { nom?: string; code?: string }) => api.put(`/expediteur-portal/filieres/${id}`, data),
  deleteFiliere: (id: string) => api.delete(`/expediteur-portal/filieres/${id}`),
  // Quais (EXPEDITEUR_ADMIN + FILIERE_ADMIN)
  createQuai: (data: { nom: string; filiereId?: string }) => api.post('/expediteur-portal/quais', data),
  updateQuai: (id: string, data: { nom?: string; isActive?: boolean; filiereId?: string | null }) =>
    api.put(`/expediteur-portal/quais/${id}`, data),
  deleteQuai: (id: string) => api.delete(`/expediteur-portal/quais/${id}`),
  // Magasinier
  getMagasinierDashboard: () => api.get('/expediteur-portal/magasin/dashboard'),
  // Société Logistique
  getMyLogistique: () => api.get('/expediteur-portal/logistique'),
  setupLogistique: (data: { companyNom: string; adresse?: string; telephone?: string; adminEmail: string }) =>
    api.post('/expediteur-portal/logistique', data),
  resendLogistiqueInvitation: () => api.post('/expediteur-portal/logistique/resend-invitation'),
};

// Chauffeurs
export const chauffeursAPI = {
  getAll: (deliveryCompanyId?: string) => api.get('/chauffeurs', { params: deliveryCompanyId ? { deliveryCompanyId } : {} }),
  getOne: (id: string) => api.get(`/chauffeurs/${id}`),
  create: (data: any) => api.post('/chauffeurs', data),
  update: (id: string, data: any) => api.put(`/chauffeurs/${id}`, data),
  toggleActive: (id: string) => api.patch(`/chauffeurs/${id}/toggle-active`),
  delete: (id: string) => api.delete(`/chauffeurs/${id}`),
};

export const transportPortalAPI = {
  getFleet: () => api.get('/transport-portal/fleet'),
  getRapport: (date: string) => api.get('/transport-portal/rapport', { params: { date } }),
  createTruck: (data: any) => api.post('/transport-portal/trucks', data),
  updateTruck: (id: string, data: any) => api.put(`/transport-portal/trucks/${id}`, data),
  removeTruck: (id: string) => api.delete(`/transport-portal/trucks/${id}`),
  setAvailability: (truckId: string, data: { statut: string; motif?: string; date?: string }) =>
    api.put(`/transport-portal/trucks/${truckId}/availability`, data),
  getDeclarations: (dateFrom?: string, dateTo?: string) => api.get('/transport-portal/declarations', { params: { dateFrom, dateTo } }),
};

export const expediteursAPI = {
  getAll: () => api.get('/expediteurs'),
  create: (data: any) => api.post('/expediteurs', data),
  update: (id: string, data: any) => api.put(`/expediteurs/${id}`, data),
  remove: (id: string) => api.delete(`/expediteurs/${id}`),
  createFiliere: (societeId: string, data: any) => api.post(`/expediteurs/${societeId}/filieres`, data),
  updateFiliere: (filiereId: string, data: any) => api.put(`/expediteurs/filieres/${filiereId}`, data),
  removeFiliere: (filiereId: string) => api.delete(`/expediteurs/filieres/${filiereId}`),
};
