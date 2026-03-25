import { useState } from 'react';
import { apiClient } from '../services/api';

interface PPTSlide {
  title: string;
  content: string[];
}

interface PPTTask {
  id: string;
  topic: string;
  numSlides: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  slides?: PPTSlide[];
  downloadUrl?: string;
  error?: string;
  createdAt: string;
}

export default function PPTPage() {
  const [topic, setTopic] = useState('');
  const [numSlides, setNumSlides] = useState(5);
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<PPTTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<PPTTask | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    setLoading(true);
    const newTask: PPTTask = {
      id: `ppt-${Date.now()}`,
      topic,
      numSlides,
      status: 'processing',
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);

    try {
      const response = await apiClient.generatePPT({ topic, numSlides });
      
      setTasks((prev) =>
        prev.map((t) =>
          t.id === newTask.id
            ? {
                ...t,
                status: 'completed',
                slides: response.slides,
                downloadUrl: response.downloadUrl,
              }
            : t
        )
      );
    } catch (err: any) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === newTask.id
            ? { ...t, status: 'failed', error: err.message }
            : t
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ppt-page">
      <div className="page-header">
        <h1>PPT Generation</h1>
        <p className="subtitle">Create presentations with AI</p>
      </div>

      <div className="ppt-generator">
        <div className="generator-form">
          <div className="form-group">
            <label htmlFor="topic">Presentation Topic</label>
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Introduction to Machine Learning"
            />
          </div>

          <div className="form-group">
            <label htmlFor="slides">Number of Slides</label>
            <input
              id="slides"
              type="number"
              min={3}
              max={20}
              value={numSlides}
              onChange={(e) => setNumSlides(parseInt(e.target.value) || 5)}
            />
          </div>

          <button
            type="button"
            className="generate-btn"
            onClick={handleGenerate}
            disabled={loading || !topic.trim()}
          >
            {loading ? 'Generating...' : 'Generate Presentation'}
          </button>
        </div>
      </div>

      <div className="ppt-content">
        <div className="tasks-list">
          <h2>Presentations</h2>
          {tasks.length > 0 ? (
            <div className="tasks-grid">
              {tasks.map((task) => (
                <button
                  type="button"
                  key={task.id}
                  className={`task-card ${task.status} ${selectedTask?.id === task.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTask(task)}
                >
                  <div className="task-header">
                    <span className="task-topic">{task.topic}</span>
                    <span className={`task-status ${task.status}`}>{task.status}</span>
                  </div>
                  <span className="task-meta">{task.numSlides} slides</span>
                  <span className="task-time">
                    {new Date(task.createdAt).toLocaleTimeString()}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="no-tasks">No presentations generated yet</p>
          )}
        </div>

        <div className="slides-preview">
          {selectedTask ? (
            <>
              <div className="slides-header">
                <h3>{selectedTask.topic}</h3>
                {selectedTask.downloadUrl && (
                  <a
                    href={selectedTask.downloadUrl}
                    download
                    className="download-btn"
                  >
                    Download PPTX
                  </a>
                )}
              </div>
              {selectedTask.status === 'completed' && selectedTask.slides ? (
                <div className="slides-grid">
                  {selectedTask.slides.map((slide, idx) => (
                    <div key={idx} className="slide-preview">
                      <h4>Slide {idx + 1}</h4>
                      <h5>{slide.title}</h5>
                      <ul>
                        {slide.content.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : selectedTask.status === 'processing' ? (
                <p className="processing">Generating slides...</p>
              ) : selectedTask.error ? (
                <p className="error">{selectedTask.error}</p>
              ) : null}
            </>
          ) : (
            <p className="placeholder">Select a presentation to preview</p>
          )}
        </div>
      </div>
    </div>
  );
}
