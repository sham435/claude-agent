import { useState } from 'react';
import { Search, Wrench, FileSearch, Terminal, Code, Globe, MoreHorizontal } from 'lucide-react';
import { useAllTools } from '../hooks';
import type { Tool } from '../types';
import './Tools.css';

const categoryIcons: Record<string, typeof Wrench> = {
  file: FileSearch,
  search: Search,
  command: Terminal,
  code: Code,
  web: Globe,
  other: MoreHorizontal,
};

export default function Tools() {
  const { data: tools = [], isLoading, error } = useAllTools();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

  const categories = ['all', 'file', 'search', 'command', 'code', 'web', 'other'];

  const filteredTools = tools.filter((tool) => {
    const matchesSearch =
      tool.name.toLowerCase().includes(search.toLowerCase()) ||
      tool.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="tools-page">
      <div className="page-header">
        <h1>Tool Explorer</h1>
        <p>Browse and test available agent tools</p>
      </div>

      <div className="tools-toolbar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="input search-input"
            placeholder="Search tools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="category-filters">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      </div>

      <div className="tools-content">
        <div className="tools-list">
          {isLoading ? (
            <div className="empty-state">
              <Wrench size={48} className="empty-state-icon" />
              <p>Loading tools...</p>
            </div>
          ) : error ? (
            <div className="empty-state">
              <Wrench size={48} className="empty-state-icon" />
              <p>Error loading tools</p>
            </div>
          ) : filteredTools.length === 0 ? (
            <div className="empty-state">
              <Wrench size={48} className="empty-state-icon" />
              <p>No tools found</p>
            </div>
          ) : (
            filteredTools.map((tool) => {
              const Icon = categoryIcons[tool.category] || MoreHorizontal;
              return (
                <div
                  key={tool.id}
                  className={`tool-card ${selectedTool?.id === tool.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTool(tool)}
                >
                  <div className="tool-card-header">
                    <Icon size={18} className={`tool-icon ${tool.category}`} />
                    <h3 className="tool-name">{tool.name}</h3>
                  </div>
                  <p className="tool-description">{tool.description}</p>
                  <span className="tool-category-badge">{tool.category}</span>
                </div>
              );
            })
          )}
        </div>

        {selectedTool && (
          <div className="tool-detail">
            <div className="tool-detail-header">
              <h2>{selectedTool.name}</h2>
              <span className="tool-category-badge">{selectedTool.category}</span>
            </div>
            <p className="tool-detail-description">{selectedTool.description}</p>

            <div className="tool-parameters">
              <h3>Parameters</h3>
              {selectedTool.parameters.length === 0 ? (
                <p className="no-params">No parameters</p>
              ) : (
                <div className="param-list">
                  {selectedTool.parameters.map((param) => (
                    <div key={param.name} className="param-item">
                      <div className="param-header">
                        <code className="param-name">{param.name}</code>
                        <span className="param-type">{param.type}</span>
                        {param.required && (
                          <span className="param-required">required</span>
                        )}
                      </div>
                      <p className="param-description">{param.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
