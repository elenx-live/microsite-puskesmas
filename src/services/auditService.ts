import { AuditLog } from '../types';
import { INITIAL_AUDIT_LOGS } from '../firebase/seedData';

const LOCAL_STORAGE_KEY = 'puskesmas_audit_logs';

function getStoredAuditLogs(): AuditLog[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_AUDIT_LOGS));
      return INITIAL_AUDIT_LOGS;
    }
    return JSON.parse(data);
  } catch {
    return INITIAL_AUDIT_LOGS;
  }
}

function saveStoredAuditLogs(logs: AuditLog[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(logs));
  } catch (err) {
    console.error('Failed to save audit logs to localStorage:', err);
  }
}

export const auditService = {
  async recordLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    const newLog: AuditLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString()
    };

    const logs = getStoredAuditLogs();
    const updated = [newLog, ...logs];
    saveStoredAuditLogs(updated);

    return newLog;
  },

  async getLogs(params?: { module?: string; action?: string; search?: string }): Promise<AuditLog[]> {
    let logs = getStoredAuditLogs();

    if (params?.module) {
      logs = logs.filter(l => l.module === params.module);
    }

    if (params?.action) {
      logs = logs.filter(l => l.action === params.action);
    }

    if (params?.search) {
      const q = params.search.toLowerCase();
      logs = logs.filter(l => 
        l.description.toLowerCase().includes(q) ||
        l.userName.toLowerCase().includes(q) ||
        l.userEmail.toLowerCase().includes(q)
      );
    }

    return logs;
  }
};
