import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';

interface Backup {
  id: string;
  timestamp: string;
  version: string;
  branch: string;
  backupPath: string;
  user: string;
  notes?: string;
}

interface DeploymentLog {
  id: string;
  timestamp: string;
  version: string;
  branch: string;
  user: string;
  status: 'success' | 'rollback' | 'failed';
  notes?: string;
}

export default function VersionControlPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [logs, setLogs] = useState<DeploymentLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [diff, setDiff] = useState<any>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [backupsRes, logsRes] = await Promise.all([
        apiClient.getVersions(),
        apiClient.getVersionLogs(),
      ]);
      if (backupsRes.success) setBackups(backupsRes.data);
      if (logsRes.success) setLogs(logsRes.data);
    } catch (err) {
      console.error('Failed to fetch version data:', err);
    }
  };

  const createBackup = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await apiClient.createVersion({ user: 'admin' });
      if (res.success) {
        setMessage({ type: 'success', text: 'Backup created successfully!' });
        fetchData();
      } else {
        setMessage({ type: 'error', text: res.message || 'Failed to create backup' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const rollbackBackup = async (id: string) => {
    if (!confirm('Are you sure you want to rollback? This may require a restart.')) return;
    
    setLoading(true);
    setMessage(null);
    try {
      const res = await apiClient.rollbackVersion(id);
      if (res.success) {
        setMessage({ type: 'success', text: res.message });
        fetchData();
      } else {
        setMessage({ type: 'error', text: res.message || 'Rollback failed' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const showDiff = async (id: string) => {
    try {
      const res = await apiClient.getVersionDiff(id);
      if (res.success) {
        setDiff(res.data);
        setSelectedBackup(backups.find(b => b.id === id) || null);
      }
    } catch (err) {
      console.error('Failed to get diff:', err);
    }
  };

  const closeDiff = () => {
    setDiff(null);
    setSelectedBackup(null);
  };

  return (
    <div className="version-control-page">
      <div className="page-header">
        <h1>Version Control</h1>
        <p className="subtitle">Backup, rollback, and track deployments</p>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="vc-actions">
        <button
          type="button"
          className="action-btn primary"
          onClick={createBackup}
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Backup'}
        </button>
      </div>

      <div className="vc-grid">
        <div className="vc-section">
          <h2>Backups</h2>
          {backups.length > 0 ? (
            <table className="vc-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Branch</th>
                  <th>Version</th>
                  <th>User</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((backup) => (
                  <tr key={backup.id}>
                    <td>{new Date(backup.timestamp).toLocaleString()}</td>
                    <td><span className="branch-tag">{backup.branch}</span></td>
                    <td><code>{backup.version}</code></td>
                    <td>{backup.user}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          type="button"
                          className="btn-small"
                          onClick={() => showDiff(backup.id)}
                        >
                          Diff
                        </button>
                        <button
                          type="button"
                          className="btn-small danger"
                          onClick={() => rollbackBackup(backup.id)}
                          disabled={loading}
                        >
                          Rollback
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="empty">No backups yet. Create one to get started.</p>
          )}
        </div>

        <div className="vc-section">
          <h2>Deployment Logs</h2>
          {logs.length > 0 ? (
            <table className="vc-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Action</th>
                  <th>Version</th>
                  <th>User</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                    <td>{log.notes || log.status}</td>
                    <td><code>{log.version}</code></td>
                    <td>{log.user}</td>
                    <td>
                      <span className={`status-tag ${log.status}`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="empty">No deployment logs yet.</p>
          )}
        </div>
      </div>

      {diff && (
        <div className="diff-modal">
          <div className="diff-content">
            <div className="diff-header">
              <h3>Changes in {selectedBackup?.version}</h3>
              <button type="button" className="close-btn" onClick={closeDiff}>×</button>
            </div>
            <div className="diff-body">
              <p><strong>Backup:</strong> {selectedBackup?.id}</p>
              <p><strong>Time:</strong> {new Date(selectedBackup?.timestamp || '').toLocaleString()}</p>
              <h4>Changed Files:</h4>
              <ul>
                {diff.changes?.map((change: any, idx: number) => (
                  <li key={idx}>
                    <span className={`file-${change.status}`}>{change.status}</span> {change.file}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
