import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role, CompanyType } from '../types';
import { authAPI } from '../api';

interface RegisterData {
  companyNom: string; companyType: string; code?: string; couleur?: string;
  prenom: string; nom: string; email: string; password: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  register: (data: RegisterData) => Promise<{ role: Role; companyType?: CompanyType }>;
  login: (email: string, password: string) => Promise<{ role: Role; companyType?: CompanyType }>;
  logout: () => void;
  isRole: (...roles: Role[]) => boolean;
  isExpéditeur: () => boolean;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('tms_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('tms_user');
    if (stored && token) setUser(JSON.parse(stored));
    setLoading(false);
  }, [token]);

  const _storeSession = (access_token: string, u: any) => {
    localStorage.setItem('tms_token', access_token);
    localStorage.setItem('tms_user', JSON.stringify(u));
    setToken(access_token);
    setUser(u);
    return { role: u.role as Role, companyType: u.company?.type as CompanyType | undefined };
  };

  const register = async (data: RegisterData) => {
    const res = await authAPI.register(data);
    return _storeSession(res.data.access_token, res.data.user);
  };

  const login = async (email: string, password: string) => {
    const res = await authAPI.login(email, password);
    return _storeSession(res.data.access_token, res.data.user);
  };

  const logout = () => {
    localStorage.removeItem('tms_token');
    localStorage.removeItem('tms_user');
    setToken(null);
    setUser(null);
  };

  const isRole = (...roles: Role[]) => !!user && roles.includes(user.role);
  const isExpéditeur = () => user?.company?.type === CompanyType.EXPEDITEUR;

  const refreshUser = async () => {
    try {
      const res = await authAPI.profile();
      const updatedUser = res.data;
      localStorage.setItem('tms_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, token, register, login, logout, isRole, isExpéditeur, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
