import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppUser } from '../types';

interface PublicAuthContextType {
  user: AppUser | null;
  loading: boolean;
}

const PublicAuthContext = createContext<PublicAuthContextType>({ user: null, loading: false });

/**
 * Versi ringan PublicAuthContext untuk app Microsite — publik tanpa Firebase.
 * Sesi admin (bila ada) dibaca dari server agar fitur terkunci bisa dibuka.
 */
export const PublicAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/auth/session', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (alive && data && data.isAdmin) {
            setUser({
              uid: data.email, email: data.email, name: data.name || data.email,
              roleId: 'role-superadmin', permissions: ['manage_microsites'],
            } as unknown as AppUser);
          }
        }
      } catch {}
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  return <PublicAuthContext.Provider value={{ user, loading }}>{children}</PublicAuthContext.Provider>;
};

export const usePublicAuth = () => useContext(PublicAuthContext);
export const useAuth = () => useContext(PublicAuthContext);
