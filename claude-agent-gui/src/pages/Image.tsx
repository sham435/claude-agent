import { useState } from 'react';
import { apiClient } from '../services/api';

interface ImageTask {
  id: string;
  prompt: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  imageUrl?: string;
  error?: string;
  createdAt: string;
}

const IMAGE_MODELS = [
  { id: 'stable-diffusion-3.5', name: 'Stable Diffusion 3.5', provider: 'Stability AI' },
  { id: 'dall-e-3', name: 'DALL-E 3', provider: 'OpenAI' },
  { id: 'flux-pro', name: 'Flux Pro', provider: 'Black Forest Labs' },
];

export default function ImagePage() {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState(IMAGE_MODELS[0].id);
  const [size, setSize] = useState('1024x1024');
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<ImageTask[]>([]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    const newTask: ImageTask = {
      id: `img-${Date.now()}`,
      prompt,
      status: 'processing',
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);

    try {
      const response = await apiClient.generateImage({
        prompt,
        model: selectedModel,
        size,
      });
      
      setGeneratedImage(response.imageUrl || response.data?.[0]?.url);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === newTask.id
            ? { ...t, status: 'completed', imageUrl: response.imageUrl || response.data?.[0]?.url }
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
    <div className="image-page">
      <div className="page-header">
        <h1>Image Generation</h1>
        <p className="subtitle">Create images with AI</p>
      </div>

      <div className="image-generator">
        <div className="generator-form">
          <div className="form-group">
            <label>Model</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              {IMAGE_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} ({model.provider})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Size</label>
            <select value={size} onChange={(e) => setSize(e.target.value)}>
              <option value="1024x1024">1024 x 1024</option>
              <option value="1024x1792">1024 x 1792 (Portrait)</option>
              <option value="1792x1024">1792 x 1024 (Landscape)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              rows={4}
            />
          </div>

          <button
            type="button"
            className="generate-btn"
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
          >
            {loading ? 'Generating...' : 'Generate Image'}
          </button>
        </div>

        <div className="image-preview">
          {generatedImage ? (
            <img src={generatedImage} alt="Generated" />
          ) : (
            <div className="placeholder">
              <Image size={64} />
              <p>Generated image will appear here</p>
            </div>
          )}
        </div>
      </div>

      <div className="task-history">
        <h2>Recent Tasks</h2>
        <div className="tasks-grid">
          {tasks.map((task) => (
            <div key={task.id} className={`task-card ${task.status}`}>
              <div className="task-header">
                <span className="task-status">{task.status}</span>
                <span className="task-time">
                  {new Date(task.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <p className="task-prompt">{task.prompt}</p>
              {task.imageUrl && (
                <img src={task.imageUrl} alt="Task result" className="task-image" />
              )}
              {task.error && <p className="task-error">{task.error}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Image({ size }: { size: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}
