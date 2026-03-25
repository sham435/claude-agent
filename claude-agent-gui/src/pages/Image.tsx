import { useState, useEffect } from 'react';
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
  { id: 'openrouter/flux', name: 'Flux Pro', provider: 'Black Forest Labs' },
  { id: 'openrouter/stable-diffusion', name: 'Stable Diffusion', provider: 'Stability AI' },
];

export default function ImagePage() {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState(IMAGE_MODELS[0].id);
  const [size, setSize] = useState('1024x1024');
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<ImageTask[]>([]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);

  useEffect(() => {
    const savedHistory = localStorage.getItem('imageHistory');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setTasks(parsed.slice(0, 12));
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem('imageHistory', JSON.stringify(tasks.slice(0, 12)));
    }
  }, [tasks]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    const newTask: ImageTask = {
      id: `img-${Date.now()}`,
      prompt,
      status: 'processing',
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev.slice(0, 11)]);

    try {
      const response = await apiClient.generateImage({
        prompt,
        model: selectedModel,
        size,
      });
      
      const imageUrl = response.imageUrl || response.url;
      setGeneratedImage(imageUrl);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === newTask.id
            ? { ...t, status: 'completed', imageUrl }
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
      if (err.response?.status === 401 || err.message?.includes('API key')) {
        setApiKeyMissing(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `generated-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const applyPreset = (modifier: string) => {
    setPrompt(prev => prev ? `${prev}, ${modifier}` : modifier);
  };

  const presets = [
    { id: 'photorealistic', name: 'Photorealistic' },
    { id: 'anime', name: 'Anime' },
    { id: '3d-render', name: '3D Render' },
    { id: 'oil-painting', name: 'Oil Painting' },
  ];

  return (
    <div className="image-page min-h-screen bg-[#0d0f14] text-white p-6">
      {apiKeyMissing && (
        <div className="mb-6 p-4 bg-yellow-600/20 border border-yellow-600/50 rounded-lg">
          <p className="text-yellow-400 text-sm">
            ⚠️ Add OPENROUTER_API_KEY to .env to enable image generation
          </p>
        </div>
      )}

      <div className="page-header mb-8">
        <h1 className="text-2xl font-semibold">Image Generation</h1>
        <p className="subtitle text-slate-400 mt-1">Create images with AI</p>
      </div>

      <div className="image-generator grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="generator-form bg-[#111827] border border-[#1e2a3a] rounded-xl p-6">
          <div className="form-group mb-5">
            <label htmlFor="model-select" className="block text-slate-300 text-sm font-medium mb-2">Model</label>
            <select
              id="model-select"
              className="w-full bg-[#0d1117] text-white border border-[#1e2a3a] rounded-lg px-4 py-2.5 focus:border-blue-500 focus:outline-none"
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

          <div className="form-group mb-5">
            <label htmlFor="size-select" className="block text-slate-300 text-sm font-medium mb-2">Size</label>
            <select 
              id="size-select"
              className="w-full bg-[#0d1117] text-white border border-[#1e2a3a] rounded-lg px-4 py-2.5 focus:border-blue-500 focus:outline-none"
              value={size} 
              onChange={(e) => setSize(e.target.value)}
            >
              <option value="1024x1024">1024 x 1024</option>
              <option value="1024x1792">1024 x 1792 (Portrait)</option>
              <option value="1792x1024">1792 x 1024 (Landscape)</option>
            </select>
          </div>

          <div className="form-group mb-5">
            <label htmlFor="prompt-input" className="block text-slate-300 text-sm font-medium mb-2">Prompt</label>
            <textarea
              id="prompt-input"
              className="w-full bg-[#0d1117] text-white border border-[#1e2a3a] rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none resize-none"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              rows={4}
            />
          </div>

          <div className="mb-5">
            <p className="text-slate-300 text-sm font-medium mb-2">Style Presets</p>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className="px-3 py-1.5 bg-[#1e2a3a] text-slate-400 text-sm rounded-full hover:bg-[#2e3a4a] hover:text-white transition-colors"
                  onClick={() => applyPreset(preset.id)}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="generate-btn w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
          >
            {loading ? 'Generating...' : 'Generate Image'}
          </button>
        </div>

        <div className="image-preview bg-[#111827] border border-[#1e2a3a] rounded-xl p-6">
          {generatedImage ? (
            <div className="relative">
              <img 
                src={generatedImage} 
                alt="Generated" 
                className="w-full rounded-lg"
              />
              <button
                type="button"
                className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                onClick={() => downloadImage(generatedImage)}
              >
                Download
              </button>
            </div>
          ) : loading ? (
            <div className="animate-pulse bg-[#1e2a3a] rounded-lg h-96 flex items-center justify-center">
              <p className="text-slate-500">Generating image...</p>
            </div>
          ) : (
            <div className="h-96 flex flex-col items-center justify-center text-slate-500">
              <ImageIcon size={64} />
              <p className="mt-4">Generated image will appear here</p>
            </div>
          )}
        </div>
      </div>

      <div className="task-history mt-8">
        <h2 className="text-lg font-medium text-slate-300 mb-4">Recent Tasks</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tasks.map((task) => (
            <div 
              key={task.id} 
              className={`task-card bg-[#111827] border rounded-lg p-3 ${
                task.status === 'completed' ? 'border-emerald-500/30' : 
                task.status === 'failed' ? 'border-red-500/30' : 'border-[#1e2a3a]'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className={`text-xs px-2 py-0.5 rounded ${
                  task.status === 'completed' ? 'bg-emerald-600/20 text-emerald-400' :
                  task.status === 'failed' ? 'bg-red-600/20 text-red-400' : 'bg-yellow-600/20 text-yellow-400'
                }`}>
                  {task.status}
                </span>
                <span className="text-xs text-slate-500">
                  {new Date(task.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm text-slate-300 mb-2 line-clamp-2">{task.prompt}</p>
              {task.imageUrl && (
                <img src={task.imageUrl} alt="Task result" className="task-image w-full rounded" />
              )}
              {task.error && <p className="text-xs text-red-400 mt-2">{task.error}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ImageIcon({ size }: { size: number }) {
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
      role="img"
      aria-label="Image placeholder"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}
