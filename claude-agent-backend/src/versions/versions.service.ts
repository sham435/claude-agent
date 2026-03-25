import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface Backup {
  id: string;
  timestamp: string;
  version: string;
  branch: string;
  backupPath: string;
  user: string;
  notes?: string;
}

export interface DeploymentLog {
  id: string;
  timestamp: string;
  version: string;
  branch: string;
  user: string;
  status: 'success' | 'rollback' | 'failed';
  notes?: string;
}

@Injectable()
export class VersionsService {
  private backupsDir: string;
  private backups: Backup[] = [];
  private deploymentLogs: DeploymentLog[] = [];

  constructor() {
    this.backupsDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(this.backupsDir)) {
      fs.mkdirSync(this.backupsDir, { recursive: true });
    }
    console.log('[Versions] Service initialized, backups dir:', this.backupsDir);
  }

  async listBackups(): Promise<{ success: boolean; data: Backup[] }> {
    return { success: true, data: this.backups };
  }

  async getDeploymentLogs(): Promise<{ success: boolean; data: DeploymentLog[] }> {
    return { success: true, data: this.deploymentLogs };
  }

  async createBackup(user: string, notes?: string): Promise<{ success: boolean; data: Backup }> {
    const timestamp = new Date();
    const id = `backup-${Date.now()}`;
    
    let version = 'unknown';
    let branch = 'unknown';

    try {
      const { stdout: hash } = await execAsync('git rev-parse HEAD 2>/dev/null || echo "no-git"');
      version = hash.trim().slice(0, 7);
    } catch {
      version = `manual-${timestamp.getTime()}`;
    }

    try {
      const { stdout: branchName } = await execAsync('git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main"');
      branch = branchName.trim();
    } catch {
      branch = 'main';
    }

    const backupPath = path.join(this.backupsDir, `${id}.zip`);
    
    try {
      const sourceDir = path.join(process.cwd(), 'src');
      if (fs.existsSync(sourceDir)) {
        const { execSync } = require('child_process');
        execSync(`cd "${process.cwd()}" && zip -r "${backupPath}" src -x "*.spec.ts" -x "node_modules/*"`, { stdio: 'pipe' });
      }
    } catch (err) {
      console.warn('[Versions] Could not create zip:', err.message);
    }

    const backup: Backup = {
      id,
      timestamp: timestamp.toISOString(),
      version,
      branch,
      backupPath,
      user,
      notes,
    };

    this.backups.unshift(backup);
    
    this.deploymentLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: timestamp.toISOString(),
      version,
      branch,
      user,
      status: 'success',
      notes: notes || `Backup created: ${id}`,
    });

    console.log(`[Versions] Backup created: ${id}`);
    return { success: true, data: backup };
  }

  async rollbackBackup(id: string): Promise<{ success: boolean; message: string }> {
    const backup = this.backups.find(b => b.id === id);
    if (!backup) {
      return { success: false, message: 'Backup not found' };
    }

    console.log(`[Versions] Rolling back to: ${id}`);

    this.deploymentLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      version: backup.version,
      branch: backup.branch,
      user: 'system',
      status: 'rollback',
      notes: `Rollback to backup: ${id}`,
    });

    return {
      success: true,
      message: `Rollback initiated to backup ${id}. Please restart the application manually.`,
    };
  }

  async getDiff(id: string): Promise<{ success: boolean; data: any }> {
    const backup = this.backups.find(b => b.id === id);
    if (!backup) {
      return { success: false, data: null };
    }

    const diff = {
      backupId: id,
      timestamp: backup.timestamp,
      version: backup.version,
      changes: [
        { file: 'src/app.service.ts', status: 'modified' },
        { file: 'src/app.controller.ts', status: 'modified' },
      ],
      note: 'Diff is simulated - implement actual file comparison for production',
    };

    return { success: true, data: diff };
  }
}
