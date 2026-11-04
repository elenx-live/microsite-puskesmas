import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ShareEditor from './ShareEditor';

/**
 * Layar editor dashboard publik (visual builder), dibuka dari Studio → Dashboard Publik.
 * Route: /studio/share/editor  — layar penuh, tanpa chrome Studio.
 */
export default function ShareEditorScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  return (
    <ShareEditor
      onExit={() => navigate('/studio/share')}
      user={user as any}
      onNotify={(msg: string, kind?: 'success' | 'error') => showToast?.(msg, 'info')}
    />
  );
}
