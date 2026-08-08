import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Award } from 'lucide-react';

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    "In our FastAPI backend, we persisted session state in-memory and used token truncation.",
    "For multi-agent orchestration, we built a router agent to delegate tasks to specialist agents."
  ];

  return (
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-dark)' }}>
      <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isLoading ? 'var(--amber)' : 'var(--emerald)' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
            {isLoading ? 'AI Interviewer thinking...' : 'Live Interview Stream'}
          </span>
        </div>

        {isComplete && (
          <button onClick={onShowFeedback} className="badge badge-primary" style={{ padding: '6px 14px', cursor: 'pointer' }}>
            <Award size={14} /> Evaluation Report
          </button>
        )}
      </div>

      <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.map((msg, index) => {
          const isAgent = msg.role === 'assistant' || msg.role === 'agent';
          return (
            <div key={index} style={{ display: 'flex', gap: '12px', maxWidth: '82%', alignSelf: isAgent ? 'flex-start' : 'flex-end', flexDirection: isAgent ? 'row' : 'row-reverse' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: isAgent ? 'var(--primary)' : 'var(--bg-card-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff' }}>
                {isAgent ? <Bot size={18} /> : <User size={18} />}
              </div>
              <div className="glass-card" style={{ padding: '12px 16px', background: isAgent ? 'rgba(24, 32, 51, 0.75)' : 'rgba(49, 46, 129, 0.6)', borderColor: isAgent ? 'var(--border-color)' : 'var(--primary)', borderRadius: isAgent ? '0 12px 12px 12px' : '12px 0 12px 12px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isAgent ? 'var(--primary)' : '#a5b4fc', display: 'block', marginBottom: '4px' }}>
                  {isAgent ? 'AI Interviewer' : candidate?.member?.name}
                </span>
                <p style={{ fontSize: '0.9rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{msg.content}</p>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div style={{ display: 'flex', gap: '12px', alignSelf: 'flex-start' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Bot size={18} />
            </div>
            <div className="glass-card" style={{ padding: '12px 16px', borderRadius: '0 12px 12px 12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Thinking next follow-up question...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {!isComplete && (
        <div style={{ padding: '0 24px 8px 24px', display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {quickPrompts.map((qp, idx) => (
            <button key={idx} onClick={() => setInput(qp)} style={{ background: 'rgba(24, 32, 51, 0.6)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '5px 10px', borderRadius: '14px', fontSize: '0.75rem', whiteSpace: 'nowrap', cursor: 'pointer' }}>
              💡 {qp.slice(0, 42)}...
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-card)', display: 'flex', gap: '12px' }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isComplete ? "Interview complete." : "Type candidate response..."}
          disabled={isComplete || isLoading}
          style={{ flex: 1, background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '12px', borderRadius: '10px', fontSize: '0.9rem', resize: 'none', outline: 'none', height: '48px' }}
        />
        <button type="submit" disabled={isComplete || isLoading || !input.trim()} style={{ background: isComplete || !input.trim() ? 'var(--bg-dark)' : 'var(--primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '0 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Send size={16} /> Send
        </button>
      </form>
    </main>
  );
}
