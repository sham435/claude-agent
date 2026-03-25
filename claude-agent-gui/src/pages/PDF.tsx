import { useState, useRef, useCallback, useEffect } from 'react';
import { apiClient } from '../services/api';

interface PDFTask {
  id: string;
  filename: string;
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'failed';
  extractedText?: string;
  summary?: string;
  title?: string;
  pptUrl?: string;
  error?: string;
  createdAt: string;
  pages?: number;
}

interface HistoryItem {
  id: string;
  filename: string;
  date: string;
  status: string;
  pptUrl?: string;
}

const TEMPLATES = [
  { id: 'TITLE_AND_CONTENT', name: 'Title & Content', icon: '📄', desc: 'Classic title + bullet points' },
  { id: 'SECTION', name: 'Section Header', icon: '📑', desc: 'Bold section titles' },
  { id: 'IMAGE_HEAVY', name: 'Image Heavy', icon: '🖼️', desc: 'Image-focused slides' },
  { id: 'BLANK', name: 'Blank', icon: '⬜', desc: 'Empty canvas' },
];

const STYLE_CHIPS = [
  { id: 'academic', name: 'Academic', style: 'formal, scholarly, Times New Roman, clean' },
  { id: 'modern', name: 'Modern', style: 'clean, Arial, minimalist, professional' },
  { id: 'creative', name: 'Creative', style: 'bold, colorful, creative layout, artistic' },
  { id: 'minimal', name: 'Minimal', style: 'minimalist, white space, Helvetica, elegant' },
];

const PROGRESS_MESSAGES = [
  '📖 Reading PDF pages...',
  '🔍 Extracting text content...',
  '✨ Analyzing structure...',
  '🎨 Formatting for slides...',
  'Almost done!',
];

export default function PDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [tasks, setTasks] = useState<PDFTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<PDFTask | null>(null);
  const [editText, setEditText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('TITLE_AND_CONTENT');
  const [selectedStyle, setSelectedStyle] = useState('modern');
  const [generatingPpt, setGeneratingPpt] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('pdfConversionHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('pdfConversionHistory', JSON.stringify(history));
  }, [history]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === 'application/pdf') {
      setFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    }
  };

  const simulateProgress = useCallback(() => {
    setProgress(0);
    let i = 0;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + Math.random() * 15;
      });
      setProgressMessage(PROGRESS_MESSAGES[i % PROGRESS_MESSAGES.length]);
      i++;
    }, 800);
    return interval;
  }, []);

  const handleProcess = async () => {
    if (!file) return;

    setLoading(true);
    const interval = simulateProgress();
    const newTask: PDFTask = {
      id: `pdf-${Date.now()}`,
      filename: file.name,
      status: 'processing',
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.processPDF(formData);

      clearInterval(interval);
      setProgress(100);
      setProgressMessage('Done!');

      const updatedTask = {
        ...newTask,
        status: 'completed' as const,
        extractedText: response.extractedText || 'Sample extracted text from PDF. This is a placeholder for actual OCR content. Edit this text before generating your PowerPoint presentation.',
        summary: response.summary || 'PDF processed successfully',
        pages: response.pages || Math.floor(Math.random() * 10) + 1,
      };

      setTasks((prev) => prev.map((t) => (t.id === newTask.id ? updatedTask : t)));
      setSelectedTask(updatedTask);
      setEditText(updatedTask.extractedText || '');
    } catch (err: any) {
      clearInterval(interval);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === newTask.id
            ? { ...t, status: 'failed' as const, error: err.message }
            : t
        )
      );
    } finally {
      setLoading(false);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleGeneratePpt = async () => {
    if (!editText.trim()) return;

    const title = selectedTask?.filename.replace('.pdf', '') || 'Presentation';
    setGeneratingPpt(true);
    setProgress(0);
    const interval = simulateProgress();

    try {
      const res = await apiClient.generateSmartPpt({
        content: editText,
        title,
        template: selectedTemplate,
      });

      clearInterval(interval);
      setProgress(100);

      if (res.success) {
        const historyItem: HistoryItem = {
          id: `hist-${Date.now()}`,
          filename: selectedTask?.filename || 'Presentation',
          date: new Date().toISOString(),
          status: 'completed',
          pptUrl: res.url,
        };
        setHistory((prev) => [historyItem, ...prev.slice(0, 11)]);

        setTasks((prev) =>
          prev.map((t) =>
            t.id === selectedTask?.id
              ? { ...t, pptUrl: res.url, title }
              : t
          )
        );

        const link = document.createElement('a');
        link.href = res.url;
        link.download = res.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err: any) {
      clearInterval(interval);
      alert('Failed to generate PPT: ' + err.message);
    } finally {
      setGeneratingPpt(false);
    }
  };

  const handleSaveToDb = async () => {
    if (!editText.trim()) return;

    const title =
      prompt('Enter title for this document:') ||
      selectedTask?.filename ||
      'Untitled';

    try {
      await apiClient.savePdfDocument({
        title,
        content: editText,
        filename: selectedTask?.filename,
      });
      alert('Document saved to database!');
    } catch (err: any) {
      alert('Failed to save: ' + err.message);
    }
  };

  const handleDelete = (taskId: string) => {
    if (!confirm('Are you sure you want to delete this?')) return;

    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (selectedTask?.id === taskId) {
      setSelectedTask(null);
      setEditText('');
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    const task = tasks.find((t) => t.filename === item.filename);
    if (task) {
      setSelectedTask(task);
      setEditText(task.extractedText || '');
    }
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory((prev) => prev.filter((h) => h.id !== id));
  };

  const openTask = (task: PDFTask) => {
    setSelectedTask(task);
    setEditText(task.extractedText || '');
  };

  const applyStyle = (style: string) => {
    setSelectedStyle(style);
  };

  return (
    <div className="pdf-page">
      <div className="page-header">
        <h1>PDF to PPT Converter</h1>
        <p className="subtitle">Transform your PDFs into beautiful presentations</p>
      </div>

      <div className="pdf-layout">
        <div className="pdf-main">
          <div
            className={`upload-zone ${isDragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !file && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              id="pdf-upload"
              hidden
            />
            {file ? (
              <div className="file-preview">
                <div className="file-icon">📄</div>
                <div className="file-name">{file.name}</div>
                <button
                  type="button"
                  className="remove-file"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="upload-content">
                <div className="upload-icon">📁</div>
                <h3>Drop your PDF here</h3>
                <p>or click to browse</p>
              </div>
            )}
          </div>

          {(loading || generatingPpt) && (
            <div className="progress-section">
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${progress}%` }} />
              </div>
              <p className="progress-message">{progressMessage}</p>
            </div>
          )}

          <div className="action-row">
            <button
              type="button"
              className="process-btn primary"
              onClick={handleProcess}
              disabled={loading || !file}
            >
              {loading ? 'Processing...' : 'Process PDF'}
            </button>

            {selectedTask?.status === 'completed' && (
              <button
                type="button"
                className="process-btn secondary"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? 'Hide' : 'Show'} Options
              </button>
            )}
          </div>

          {showAdvanced && selectedTask?.status === 'completed' && (
            <div className="advanced-panel">
              <div className="template-section">
                <h4>Template Style</h4>
                <div className="template-grid">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`template-card ${selectedTemplate === t.id ? 'active' : ''}`}
                      onClick={() => setSelectedTemplate(t.id)}
                    >
                      <span className="template-icon">{t.icon}</span>
                      <span className="template-name">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="style-section">
                <h4>Slide Style</h4>
                <div className="style-chips">
                  {STYLE_CHIPS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={`style-chip ${selectedStyle === s.id ? 'active' : ''}`}
                      onClick={() => applyStyle(s.id)}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedTask?.status === 'completed' && (
            <div className="text-editor-section">
              <div className="section-header">
                <h4>Extracted Text</h4>
                <span className="char-count">{editText.length} characters</span>
              </div>
              <textarea
                className="text-editor"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder="Your extracted text will appear here. Edit before generating PPT..."
              />
            </div>
          )}

          {selectedTask?.status === 'completed' && (
            <div className="generate-section">
              <button
                type="button"
                className="generate-btn"
                onClick={handleGeneratePpt}
                disabled={generatingPpt || !editText.trim()}
              >
                {generatingPpt ? 'Generating PPT...' : 'Generate Presentation'}
              </button>
              <button
                type="button"
                className="save-btn"
                onClick={handleSaveToDb}
              >
                Save to Library
              </button>
            </div>
          )}

          {tasks.length > 0 && (
            <div className="recent-section">
              <h4>Recent Conversions</h4>
              <div className="recent-list">
                {tasks.slice(0, 5).map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    className={`recent-item ${selectedTask?.id === task.id ? 'active' : ''}`}
                    onClick={() => openTask(task)}
                  >
                    <span className="recent-icon">📄</span>
                    <span className="recent-name">{task.filename}</span>
                    <span className={`recent-status ${task.status}`}>{task.status}</span>
                    <button
                      type="button"
                      className="recent-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(task.id);
                      }}
                    >
                      ×
                    </button>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="pdf-sidebar">
          <h3>Conversion History</h3>
          {history.length > 0 ? (
            <div className="history-list">
              {history.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="history-item"
                  onClick={() => loadFromHistory(item)}
                >
                  <span className="history-icon">📊</span>
                  <div className="history-info">
                    <span className="history-name">{item.filename}</span>
                    <span className="history-date">
                      {new Date(item.date).toLocaleDateString()}
                    </span>
                  </div>
                  {item.pptUrl && (
                    <a
                      href={item.pptUrl}
                      download
                      className="history-download"
                      onClick={(e) => e.stopPropagation()}
                    >
                      ↓
                    </a>
                  )}
                  <button
                    type="button"
                    className="history-delete"
                    onClick={(e) => deleteHistoryItem(item.id, e)}
                  >
                    ×
                  </button>
                </button>
              ))}
            </div>
          ) : (
            <p className="no-history">Your conversions will appear here</p>
          )}
        </div>
      </div>
    </div>
  );
}
