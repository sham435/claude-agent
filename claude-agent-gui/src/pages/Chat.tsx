import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Send, 
  Trash2, 
  Download, 
  Bot, 
  User, 
  Paperclip, 
  Image as ImageIcon,
  X,
  Copy,
  Check,
  Loader2
} from 'lucide-react';
import './Chat.css';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: Date;
  attachments?: Attachment[];
  model?: string;
  duration?: number;
}

interface Attachment {
  id: string;
  file: File;
  type: 'image' | 'pdf' | 'file';
  preview?: string;
  name: string;
  size: string;
}

const SUGGESTIONS = [
  { text: 'Write a short story', prompt: 'Write a short story about a robot discovering emotions' },
  { text: 'Explain quantum physics', prompt: 'Explain quantum entanglement in simple terms' },
  { text: 'Help me code a function', prompt: 'Write a JavaScript function to reverse a string' },
  { text: 'Translate to Tamil', prompt: 'Translate "Hello, how are you?" to Tamil' },
];

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [currentModel, setCurrentModel] = useState('...');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, isTyping]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const files = Array.from(e.target.files || []);
    const newAttachments: Attachment[] = await Promise.all(files.map(async (file) => {
      let preview: string | undefined;
      if (file.type.startsWith('image/')) {
        preview = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
      }
      return {
        id: crypto.randomUUID(),
        file,
        type: file.type.startsWith('image/') ? 'image'
              : file.type === 'application/pdf' ? 'pdf' : 'file',
        preview,
        name: file.name,
        size: (file.size / 1024).toFixed(0) + ' KB'
      };
    }));
    setAttachments(prev => [...prev, ...newAttachments].slice(0, 5));
    e.target.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleSend = async () => {
    if (!prompt.trim() && attachments.length === 0) return;
    if (isTyping) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: prompt,
      timestamp: new Date(),
      attachments: [...attachments]
    };
    setMessages(prev => [...prev, userMsg]);
    setPrompt('');
    setAttachments([]);
    setIsTyping(true);
    scrollToBottom();

    try {
      let fullPrompt = prompt;
      if (attachments.length > 0) {
        const fileNames = attachments.map(a => a.name).join(', ');
        fullPrompt = `[Attached files: ${fileNames}]\n\n${prompt}`;
      }

      const res = await fetch('http://localhost:3000/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: fullPrompt })
      });

      if (!res.ok) throw new Error(`Request failed with status code ${res.status}`);
      const data = await res.json();

      if (!data.success) throw new Error(data.message || 'Agent error');

      setCurrentModel(data.data?.metadata?.model || 'unknown');

      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.data.result,
        timestamp: new Date(),
        model: data.data?.metadata?.model,
        duration: data.data?.duration
      }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'error',
        content: err.message || 'Something went wrong. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
      scrollToBottom();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setAttachments([]);
    setPrompt('');
  };

  const exportChat = () => {
    const text = messages.map(m => 
      `[${m.role.toUpperCase()}] ${m.timestamp.toLocaleTimeString()}\n${m.content}`
    ).join('\n\n---\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyMessage = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSuggestion = (text: string) => {
    setPrompt(text);
    textareaRef.current?.focus();
    setTimeout(() => handleSend(), 100);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-page flex flex-col h-screen bg-[#0d0f14]">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#1e2a3a] bg-[#0d0f14]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Bot size={18} className="text-white" />
          </div>
          <span className="text-white font-medium">Claude Agent</span>
          <span className="bg-[#1a2744] text-blue-400 text-xs px-2 py-1 rounded-full">
            {currentModel === '...' ? 'Select model' : currentModel.split('/').pop()?.split(':')[0] || currentModel}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={clearChat}
            className="text-slate-400 hover:text-white text-sm transition-colors"
          >
            Clear Chat
          </button>
          <button
            type="button"
            onClick={exportChat}
            className="text-slate-400 hover:text-white text-sm transition-colors"
          >
            Export
          </button>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs text-emerald-400">Connected</span>
          </div>
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.length === 0 ? (
          /* Welcome Screen */
          <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
            <Bot size={48} className="text-blue-400 mb-4" />
            <h2 className="text-2xl text-white font-medium mb-2">How can I help you today?</h2>
            <p className="text-slate-400 text-sm mb-6">Powered by free OpenRouter models</p>
            <div className="grid grid-cols-2 gap-3 max-w-md">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.text}
                  type="button"
                  onClick={() => handleSuggestion(s.prompt)}
                  className="bg-[#111827] border border-[#1e2a3a] rounded-xl px-4 py-3 text-slate-300 text-sm hover:border-blue-500 hover:text-white transition-all cursor-pointer text-left"
                >
                  {s.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : message.role === 'error' ? 'justify-center' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-[#1a2744] flex items-center justify-center flex-shrink-0 mr-3">
                  <Bot size={16} className="text-blue-400" />
                </div>
              )}
              
              <div className={`max-w-[75%] ${message.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                {/* Attachments */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {message.attachments.map((att) => (
                      <div key={att.id} className="flex items-center gap-2 bg-[#0d1117] border border-[#1e2a3a] rounded-lg px-3 py-1.5 text-sm text-slate-300">
                        {att.type === 'image' && att.preview ? (
                          <img src={att.preview} alt={att.name} className="w-6 h-6 rounded object-cover" />
                        ) : (
                          <span className="text-base">📄</span>
                        )}
                        {att.name}
                        <span className="text-slate-500">·</span>
                        {att.size}
                      </div>
                    ))}
                  </div>
                )}

                {/* Message Bubble */}
                <div className={`relative group ${
                  message.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[70%]'
                    : message.role === 'error'
                    ? 'bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3'
                    : 'bg-[#111827] border border-[#1e2a3a] text-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[75%]'
                }`}>
                  {message.role === 'assistant' && (
                    <button
                      type="button"
                      onClick={() => copyMessage(message.content, message.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[#1a2744] rounded"
                    >
                      {copiedId === message.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-slate-400" />}
                    </button>
                  )}
                  
                  {message.role === 'assistant' ? (
                    <ReactMarkdown
                      components={{
                        code: ({node, className, children, ...props}) => {
                          return <code className="bg-[#0d1117] text-blue-300 px-1 rounded" {...props}>{children}</code>
                        },
                        pre: ({node, children, ...props}) => {
                          return <pre className="bg-[#0d1117] border border-[#1e2a3a] p-3 rounded overflow-x-auto">{children}</pre>
                        }
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>

                {/* Meta info */}
                <div className="flex items-center gap-2 mt-1 px-1">
                  {message.role === 'assistant' && message.model && (
                    <span className="text-xs text-slate-500">
                      {message.model.split('/').pop()?.split(':')[0]} · {message.duration ? `${(message.duration / 1000).toFixed(1)}s` : ''}
                    </span>
                  )}
                  <span className="text-xs text-slate-500">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 ml-3">
                  <User size={16} className="text-white" />
                </div>
              )}
            </div>
          ))
        )}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#1a2744] flex items-center justify-center">
              <Bot size={16} className="text-blue-400" />
            </div>
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attached Files Preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 py-2 border-t border-[#1e2a3a] bg-[#0d0f14]">
          {attachments.map((att) => (
            <div key={att.id} className="flex items-center gap-2 bg-[#111827] border border-[#1e2a3a] rounded-lg px-3 py-1.5 text-sm text-slate-300">
              {att.type === 'image' && att.preview ? (
                <img src={att.preview} alt={att.name} className="w-6 h-6 rounded object-cover" />
              ) : (
                <span className="text-base">📄</span>
              )}
              <span className="truncate max-w-[150px]">{att.name}</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-500">{att.size}</span>
              <button 
                type="button"
                onClick={() => removeAttachment(att.id)}
                className="text-slate-500 hover:text-red-400 ml-1"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Zone */}
      <div className="px-4 py-3 border-t border-[#1e2a3a] bg-[#0d0f14]">
        <div className="flex items-end gap-3 bg-[#111827] border border-[#1e2a3a] rounded-2xl px-4 py-3 focus-within:border-blue-500 transition-colors">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileAttach(e, 'file')}
            accept="*/*"
            className="hidden"
          />
          <input
            type="file"
            ref={imageInputRef}
            onChange={(e) => handleFileAttach(e, 'image')}
            accept="image/*"
            className="hidden"
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-slate-400 hover:text-blue-400 p-1.5 rounded-lg hover:bg-[#1a2a3a] transition-colors"
            title="Attach file"
          >
            <Paperclip size={20} />
          </button>
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="text-slate-400 hover:text-blue-400 p-1.5 rounded-lg hover:bg-[#1a2a3a] transition-colors"
            title="Add image"
          >
            <ImageIcon size={20} />
          </button>

          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
            rows={1}
            className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm resize-none focus:outline-none max-h-40 overflow-y-auto"
            style={{ height: 'auto' }}
          />

          <button
            type="button"
            onClick={handleSend}
            disabled={(!prompt.trim() && attachments.length === 0) || isTyping}
            className={`p-2 rounded-xl transition-all duration-200 ${
              (!prompt.trim() && attachments.length === 0) || isTyping
                ? 'bg-[#1e2a3a] text-slate-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
        <p className="text-xs text-slate-600 text-center mt-2">
          Shift+Enter for new line · Free models via OpenRouter
        </p>
      </div>
    </div>
  );
}
