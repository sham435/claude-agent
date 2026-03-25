import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Wrench,
  Activity,
  Settings,
  Menu,
  X,
  Bot,
  Cpu,
  Image,
  FileText,
  Presentation,
  GitBranch,
} from 'lucide-react';
import './Layout.css';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/chat', icon: MessageSquare, label: 'Chat' },
  { path: '/image', icon: Image, label: 'Image' },
  { path: '/pdf', icon: FileText, label: 'PDF' },
  { path: '/ppt', icon: Presentation, label: 'PPT' },
  { path: '/tools', icon: Wrench, label: 'Tools' },
  { path: '/executions', icon: Activity, label: 'Executions' },
  { path: '/models', icon: Cpu, label: 'Models' },
  { path: '/versions', icon: GitBranch, label: 'Versions' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <button
        className="mobile-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Bot size={32} className="logo-icon" />
          <span className="logo-text">Claude Agent</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="connection-status">
            <span className="status-dot connected" />
            <span>Connected</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>

      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
