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
    <div className="pdf-page min-h-screen bg-[#0d0f14] text-white p-6">
      <div className="page-header mb-8">
        <h1 className="text-2xl font-semibold">PDF to PPT Converter</h1>
        <p className="subtitle text-slate-400 mt-1">Transform your PDFs into beautiful presentations</p>
      </div>

      <div className="pdf-layout flex gap-6">
        <div className="pdf-main flex-1">
          <section
            aria-label="PDF upload drop zone"
            className={`upload-zone border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 ${
              isDragOver 
                ? 'border-blue-500 bg-blue-500/5' 
                : 'border-[#1e2a3a] hover:border-[#3b82f6]'
            } ${file ? 'has-file' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
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
              <div className="file-preview flex items-center gap-3 p-3 bg-[#111827] border border-[#1e2a3a] rounded-lg mt-4">
                <div className="file-icon text-2xl">📄</div>
                <div className="file-name text-white flex-1 text-left truncate">{file.name}</div>
                <button
                  type="button"
                  className="remove-file text-slate-400 hover:text-red-400 text-xl px-2"
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
              <button
                type="button"
                className="upload-content"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="upload-icon text-4xl mb-3">📁</div>
                <h3 className="text-lg font-medium text-white">Drop your PDF here</h3>
                <p className="text-slate-500 mt-1">or click to browse</p>
              </button>
            )}
          </section>

          {(loading || generatingPpt) && (
            <div className="progress-section mt-6">
              <div className="progress-bar-container w-full bg-[#1e2a3a] rounded-full h-2">
                <div 
                  className="progress-bar bg-blue-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
              <p className="progress-message flex justify-between text-sm text-slate-400 mt-1">
                <span>{progressMessage}</span>
                <span>{Math.round(progress)}%</span>
              </p>
            </div>
          )}

          <div className="action-row flex gap-3 mt-6">
            <button
              type="button"
              className="process-btn bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleProcess}
              disabled={loading || !file}
            >
              {loading ? 'Processing...' : 'Process PDF'}
            </button>

            {selectedTask?.status === 'completed' && (
              <button
                type="button"
                className="process-btn bg-[#111827] border border-[#1e2a3a] hover:border-[#3b82f6] text-white px-4 py-2.5 rounded-lg transition-colors"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? 'Hide' : 'Show'} Options
              </button>
            )}
          </div>

          {showAdvanced && selectedTask?.status === 'completed' && (
            <div className="advanced-panel bg-[#111827] border border-[#1e2a3a] rounded-xl p-6 mt-6">
              <div className="template-section mb-6">
                <h4 className="text-slate-300 font-medium mb-3">Template Style</h4>
                <div className="template-grid grid grid-cols-3 gap-3">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`template-card p-3 rounded-lg border cursor-pointer text-center transition-all duration-150 ${
                        selectedTemplate === t.id
                          ? 'border-2 border-blue-500 bg-blue-500/10 text-blue-400'
                          : 'border-[#1e2a3a] bg-[#0d1117] text-slate-300 hover:border-blue-400'
                      }`}
                      onClick={() => setSelectedTemplate(t.id)}
                    >
                      <span className="template-icon text-2xl block mb-1">{t.icon}</span>
                      <span className="template-name text-sm">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="style-section">
                <h4 className="text-slate-300 font-medium mb-3">Slide Style</h4>
                <div className="style-chips flex flex-wrap gap-2">
                  {STYLE_CHIPS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={`style-chip px-4 py-1.5 rounded-full text-sm transition-colors ${
                        selectedStyle === s.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-[#1e2a3a] text-slate-400 hover:bg-[#2e3a4a]'
                      }`}
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
            <div className="text-editor-section bg-[#111827] border border-[#1e2a3a] rounded-xl p-4 mt-6">
              <div className="section-header flex justify-between items-center mb-3">
                <h4 className="text-slate-300 font-medium">Extracted Text</h4>
                <span className="char-count text-xs bg-[#1e2a3a] text-slate-400 px-2 py-1 rounded-full">
                  {editText.length} characters
                </span>
              </div>
              <textarea
                className="text-editor w-full min-h-[360px] bg-[#0d1117] text-slate-200 font-mono text-sm p-4 rounded-lg border border-[#1e2a3a] focus:border-blue-500 focus:outline-none resize-y"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder="Your extracted text will appear here. Edit before generating PPT..."
              />
            </div>
          )}

          {selectedTask?.status === 'completed' && (
            <div className="generate-section flex gap-3 mt-6">
              <button
                type="button"
                className="generate-btn bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleGeneratePpt}
                disabled={generatingPpt || !editText.trim()}
              >
                {generatingPpt ? 'Generating PPT...' : 'Generate Presentation'}
              </button>
              <button
                type="button"
                className="save-btn bg-[#111827] border border-[#1e2a3a] hover:border-[#3b82f6] text-white px-4 py-2.5 rounded-lg transition-colors"
                onClick={handleSaveToDb}
              >
                Save to Library
              </button>
            </div>
          )}

          {tasks.length > 0 && (
            <div className="recent-section mt-8">
              <h4 className="text-slate-300 font-medium text-sm uppercase tracking-wider mb-3">Recent Conversions</h4>
              <div className="recent-list flex flex-col gap-2">
                {tasks.slice(0, 5).map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    className={`recent-item flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      selectedTask?.id === task.id
                        ? 'bg-blue-500/10 border-blue-500'
                        : 'bg-[#111827] border-[#1e2a3a] hover:border-[#2e3a4a]'
                    }`}
                    onClick={() => openTask(task)}
                  >
                    <span className="recent-icon text-xl">📄</span>
                    <span className="recent-name text-white flex-1 text-left truncate">{task.filename}</span>
                    <span className={`recent-status text-xs px-2 py-0.5 rounded ${
                      task.status === 'completed' ? 'bg-emerald-600/20 text-emerald-400' :
                      task.status === 'failed' ? 'bg-red-600/20 text-red-400' :
                      'bg-yellow-600/20 text-yellow-400'
                    }`}>
                      {task.status}
                    </span>
                    <button
                      type="button"
                      className="recent-delete text-slate-500 hover:text-red-400 px-1"
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

        <div className="pdf-sidebar w-80">
          <h3 className="text-slate-300 font-medium text-sm uppercase tracking-wider mb-3">Conversion History</h3>
          {history.length > 0 ? (
            <div className="history-list flex flex-col gap-2">
              {history.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="history-item flex items-center gap-3 p-3 bg-[#111827] border border-[#1e2a3a] rounded-lg hover:border-[#2e3a4a] transition-colors"
                  onClick={() => loadFromHistory(item)}
                >
                  <span className="history-icon text-xl">📊</span>
                  <div className="history-info flex-1 text-left">
                    <span className="history-name text-white text-sm block truncate">{item.filename}</span>
                    <span className="history-date text-slate-500 text-xs">
                      {new Date(item.date).toLocaleDateString()}
                    </span>
                  </div>
                  {item.pptUrl && (
                    <a
                      href={item.pptUrl}
                      download
                      className="history-download text-blue-400 hover:text-blue-300 px-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      ↓
                    </a>
                  )}
                  <button
                    type="button"
                    className="history-delete text-slate-500 hover:text-red-400 px-1"
                    onClick={(e) => deleteHistoryItem(item.id, e)}
                  >
                    ×
                  </button>
                </button>
              ))}
            </div>
          ) : (
            <p className="no-history text-slate-500 text-sm text-center py-8">Your conversions will appear here</p>
          )}
        </div>
      </div>
    </div>
  );
}
