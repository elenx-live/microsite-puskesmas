import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Pengguna platform (pengelola atau admin) — bentuk ringan dari DbUser server.
 */
export interface PlatformUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'pengelola';
  status: string;
  avatarUrl?: string | null;
  orgName?: string | null;
  phone?: string | null;
  bio?: string | null;
  // ── Alias kompatibilitas (kode lama memakai .uid / .displayName / .photoURL) ──
  uid?: string;
  displayName?: string;
  photoURL?: string | null;
}

/** Lengkapi alias kompatibilitas dari data server (id→uid, name→displayName). */
function compatUser(u: any): PlatformUser | null {
  if (!u) return null;
  return {
    ...u,
    uid: u.uid ?? u.id,
    displayName: u.displayName ?? u.name,
    photoURL: u.photoURL ?? u.avatarUrl ?? null,
  } as PlatformUser;
}

interface AuthContextType {
  user: PlatformUser | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, pass: string) => Promise<PlatformUser>;
  loginWithGoogle: (credential: string) => Promise<PlatformUser>;
  register: (email: string, password: string, name?: string) => Promise<PlatformUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthContext multi-user app Microsite.
 * Sesi diverifikasi 100% di server lewat /api/auth/me (cookie HttpOnly).
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<PlatformUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (!res.ok) throw new Error('no-session');
      const data = await res.json();
      setUser(data?.authenticated && data.user ? compatUser(data.user) : null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const post = async (url: string, body: any) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || 'Permintaan gagal.');
    return data;
  };

  const login = async (email: string, pass: string) => {
    const data = await post('/api/auth/login', { email, password: pass });
    setUser(compatUser(data.user));
    return data.user as PlatformUser;
  };

  const loginWithGoogle = async (credential: string) => {
    const data = await post('/api/auth/google', { credential });
    setUser(compatUser(data.user));
    return data.user as PlatformUser;
  };

  const register = async (email: string, password: string, name?: string) => {
    const data = await post('/api/auth/register', { email, password, name });
    setUser(compatUser(data.user));
    return data.user as PlatformUser;
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    setUser(null);
    try {
      sessionStorage.clear();
    } catch {}
    window.location.replace('/');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin: !!user && user.role === 'admin',
        login,
        loginWithGoogle,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
