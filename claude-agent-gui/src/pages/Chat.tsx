import { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Loader2, User, Bot } from 'lucide-react';
import { useStore } from '../store/useStore';
import { apiClient } from '../services/api';
import type { Message } from '../types';
import './Chat.css';

export default function Chat() {
  const { messages, addMessage, clearMessages, settings } = useStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (settings.autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, settings.autoScroll]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    addMessage(userMessage);
    setInput('');
    setIsLoading(true);

    try {
      const response = await apiClient.runAgent(userMessage.content, {
        model: settings.model,
        maxTokens: settings.maxTokens,
        temperature: settings.temperature,
      });
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: typeof response.result === 'string' 
          ? response.result 
          : JSON.stringify(response.result, null, 2),
        timestamp: Date.now(),
      };
      addMessage(assistantMessage);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`,
        timestamp: Date.now(),
      };
      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="chat-page">
      <div className="page-header">
        <h1>Chat</h1>
        <p>Interact with your Claude Agent</p>
      </div>

      <div className="chat-container">
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-empty">
              <Bot size={48} />
              <h3>Start a conversation</h3>
              <p>Send a message to begin interacting with your agent</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.role}`}
              >
                <div className="message-avatar">
                  {message.role === 'user' ? (
                    <User size={20} />
                  ) : (
                    <Bot size={20} />
                  )}
                </div>
                <div className="message-content">
                  <div className="message-header">
                    <span className="message-role">
                      {message.role === 'user' ? 'You' : 'Assistant'}
                    </span>
                    {settings.showTimestamps && (
                      <span className="message-time">
                        {formatTime(message.timestamp)}
                      </span>
                    )}
                  </div>
                  <div className="message-text">{message.content}</div>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="message assistant loading">
              <div className="message-avatar">
                <Loader2 size={20} className="spinner" />
              </div>
              <div className="message-content">
                <div className="message-text">Thinking...</div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="chat-input input"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            className="btn btn-primary send-btn"
            disabled={isLoading || !input.trim()}
          >
            <Send size={18} />
          </button>
          {messages.length > 0 && (
            <button
              type="button"
              className="btn btn-secondary clear-btn"
              onClick={clearMessages}
            >
              <Trash2 size={18} />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
