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

function loadAdmin(): Admin | null {
  try {
    const raw = localStorage.getItem('admin_info');
    return raw ? JSON.parse(raw) : null;
  } catch {
    localStorage.removeItem('admin_info');
    localStorage.removeItem('admin_token');
    return null;
  }
}

const initialAdmin = loadAdmin();
const initialToken = initialAdmin ? localStorage.getItem('admin_token') : null;

export const useAuthStore = create<AuthState>((set) => ({
  token: initialToken,
  admin: initialAdmin,
  isAuthenticated: !!initialToken,
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
