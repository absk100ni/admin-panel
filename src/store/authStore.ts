import { create } from 'zustand';

interface Admin {
  email: string;
  name: string;
}

interface AuthState {
  token: string | null;
  admin: Admin | null;
  isAuthenticated: boolean;
  login: (token: string, admin: Admin) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('admin_token'),
  admin: localStorage.getItem('admin_info')
    ? JSON.parse(localStorage.getItem('admin_info')!)
    : null,
  isAuthenticated: !!localStorage.getItem('admin_token'),
  login: (token, admin) => {
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_info', JSON.stringify(admin));
    set({ token, admin, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_info');
    set({ token: null, admin: null, isAuthenticated: false });
  },
}));
