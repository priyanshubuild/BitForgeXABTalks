import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Volume2, VolumeX, MessageSquare, Award } from 'lucide-react';

export default function ChatStream({ 
  messages, 
  onSendMessage, 
  isLoading, 
  candidate,
  isComplete,
  onShowFeedback 
}) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const quickPrompts = [
    "We used recursive text splitting with a 512-token chunk size and 50-token overlap.",
    "For vector database storage, we indexed ChromaDB locally and queried using cosine similarity.",
    "In our FastAPI backend, we persisted session state in-memory and used token truncation for context management.",
    "For multi-agent orchestration, we built a router agent to delegate tasks to specialist agents."
  ];

  return (
    <main style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg-dark)',
      position: 'relative'
    }}>
      {/* Header Bar */}
      <div style={{
        padding: '12px 24px',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-card)',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: isLoading ? 'var(--amber)' : 'var(--emerald)',
            boxShadow: isLoading ? '0 0 10px var(--amber)' : '0 0 10px var(--emerald)'
          }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
            {isLoading ? 'AI Interviewer is thinking...' : 'Live Evaluation Dialogue'}
          </span>
        </div>

        {isComplete && (
          <button 
            onClick={onShowFeedback}
            className="badge badge-primary"
            style={{ padding: '6px 14px', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            <Award size={14} /> View Final Evaluation Report
          </button>
        )}
      </div>

      {/* Messages Feed */}
      <div style={{
        flex: 1,
        padding: '24px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px'
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)' }}>
            <Bot size={48} color="var(--primary)" style={{ opacity: 0.8, marginBottom: '12px' }} />
            <h3 style={{ color: 'var(--text-main)', fontSize: '1.1rem', marginBottom: '6px' }}>Interview Ready</h3>
            <p style={{ fontSize: '0.85rem' }}>Select a candidate profile to initialize the AI evaluation session.</p>
          </div>
        )}

        {messages.map((msg, index) => {
          const isAgent = msg.role === 'assistant' || msg.role === 'agent';
          return (
            <div 
              key={index} 
              className="animate-slide-up"
              style={{
                display: 'flex',
                gap: '14px',
                maxWidth: '82%',
                alignSelf: isAgent ? 'flex-start' : 'flex-end',
                flexDirection: isAgent ? 'row' : 'row-reverse'
              }}
            >
              {/* Avatar */}
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: isAgent ? 'linear-gradient(135deg, var(--primary) 0%, #8b5cf6 100%)' : 'var(--bg-card-hover)',
                border: isAgent ? 'none' : '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: 'var(--text-main)'
              }}>
                {isAgent ? <Bot size={18} /> : <User size={18} />}
              </div>

              {/* Bubble Content */}
              <div className="glass-card" style={{
                padding: '14px 18px',
                background: isAgent ? 'var(--bg-card)' : 'var(--primary-glow)',
                borderColor: isAgent ? 'var(--border-color)' : 'var(--primary)',
                borderRadius: isAgent ? '0 14px 14px 14px' : '14px 0 14px 14px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isAgent ? 'var(--primary)' : 'var(--text-muted)' }}>
                    {isAgent ? 'AI Interviewer' : candidate?.member?.name || 'Candidate'}
                  </span>
                </div>
                <p style={{ fontSize: '0.92rem', lineHeight: '1.55', whiteSpace: 'pre-wrap', color: 'var(--text-main)' }}>
                  {msg.content}
                </p>
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div style={{ display: 'flex', gap: '14px', alignSelf: 'flex-start' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--primary) 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-main)'
            }}>
              <Bot size={18} />
            </div>
            <div className="glass-card" style={{ padding: '12px 18px', borderRadius: '0 14px 14px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', animation: 'pulseGlow 1s infinite 0s' }} />
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', animation: 'pulseGlow 1s infinite 0.2s' }} />
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', animation: 'pulseGlow 1s infinite 0.4s' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      {!isComplete && (
        <div style={{ padding: '0 24px 8px 24px', display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => setInput(qp)}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                padding: '6px 12px',
                borderRadius: '16px',
                fontSize: '0.75rem',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
            >
              💡 {qp.slice(0, 45)}...
            </button>
          ))}
        </div>
      )}

      {/* Input Box */}
      <form onSubmit={handleSubmit} style={{
        padding: '16px 24px',
        borderTop: '1px solid var(--border-color)',
        background: 'var(--bg-card)',
        display: 'flex',
        gap: '12px'
      }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isComplete ? "Interview complete. Click 'View Final Evaluation Report' above." : "Type candidate response (Press Enter to send)..."}
          disabled={isComplete || isLoading}
          style={{
            flex: 1,
            background: 'var(--bg-dark)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-main)',
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '0.9rem',
            resize: 'none',
            outline: 'none',
            fontFamily: 'inherit',
            minHeight: '48px',
            maxHeight: '120px'
          }}
        />
        <button
          type="submit"
          disabled={isComplete || isLoading || !input.trim()}
          style={{
            background: isComplete || !input.trim() ? 'var(--bg-dark)' : 'var(--primary)',
            border: '1px solid var(--border-color)',
            color: '#fff',
            padding: '0 20px',
            borderRadius: '10px',
            cursor: isComplete || !input.trim() ? 'not-allowed' : 'pointer',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <Send size={16} /> Send
        </button>
      </form>
    </main>
  );
}
