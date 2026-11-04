import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ShareEditor from './ShareEditor';

/**
 * Layar editor dashboard publik (visual builder).
 * Route: /studio/share/editor            → dashboard utama (kompatibel lama)
 *        /studio/share/editor/:id        → dashboard tertentu (multi-dashboard)
 * Layar penuh, tanpa chrome Studio.
 */
export default function ShareEditorScreen() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState('');

  // Ambil nama dashboard untuk judul topbar (hanya mode multi).
  useEffect(() => {
    if (!id) return;
    let alive = true;
    fetch(`/api/me/dashboards/${id}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive && d?.dashboard) setName(d.dashboard.name || ''); })
      .catch(() => {});
    return () => { alive = false; };
  }, [id]);

  return (
    <ShareEditor
      onExit={() => navigate(-1)}
      user={user as any}
      onNotify={(msg: string) => showToast?.(msg, 'info')}
      dashboardId={id}
      dashboardName={name}
    />
  );
}
