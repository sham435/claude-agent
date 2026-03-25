import { useState } from 'react';
import { Save, RotateCcw } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Settings } from '../types';
import './Settings.css';

export default function SettingsPage() {
  const { settings, setSettings } = useStore();
  const [localSettings, setLocalSettings] = useState<Settings>(settings);
  const [saved, setSaved] = useState(false);

  const handleChange = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    setSettings(localSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setLocalSettings(settings);
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Configure your Claude Agent behavior</p>
      </div>

      <div className="settings-content">
        <div className="card settings-section">
          <h2 className="section-title">Model Configuration</h2>
          
          <div className="form-group">
            <label className="label">Model</label>
            <select
              className="input"
              value={localSettings.model}
              onChange={(e) => handleChange('model', e.target.value)}
            >
              <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
              <option value="claude-3-opus-20240229">Claude 3 Opus</option>
              <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="label">Max Tokens</label>
              <input
                type="number"
                className="input"
                value={localSettings.maxTokens}
                onChange={(e) => handleChange('maxTokens', parseInt(e.target.value))}
                min={256}
                max={200000}
              />
            </div>

            <div className="form-group">
              <label className="label">Temperature</label>
              <input
                type="number"
                className="input"
                value={localSettings.temperature}
                onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                min={0}
                max={2}
                step={0.1}
              />
            </div>
          </div>
        </div>

        <div className="card settings-section">
          <h2 className="section-title">System Prompt</h2>
          
          <div className="form-group">
            <textarea
              className="input"
              value={localSettings.systemPrompt}
              onChange={(e) => handleChange('systemPrompt', e.target.value)}
              rows={4}
              placeholder="Enter system prompt..."
            />
          </div>
        </div>

        <div className="card settings-section">
          <h2 className="section-title">Interface</h2>
          
          <div className="toggle-group">
            <div className="toggle-item">
              <div className="toggle-info">
                <span className="toggle-label">Auto-scroll</span>
                <span className="toggle-description">Automatically scroll to new messages</span>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={localSettings.autoScroll}
                  onChange={(e) => handleChange('autoScroll', e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="toggle-item">
              <div className="toggle-info">
                <span className="toggle-label">Show Timestamps</span>
                <span className="toggle-description">Display time for each message</span>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={localSettings.showTimestamps}
                  onChange={(e) => handleChange('showTimestamps', e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>
        </div>

        <div className="settings-actions">
          <button className="btn btn-secondary" onClick={handleReset}>
            <RotateCcw size={18} />
            Reset
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            <Save size={18} />
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
