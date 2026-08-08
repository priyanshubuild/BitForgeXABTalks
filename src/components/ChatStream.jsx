import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Bot, User, Award, Zap } from 'lucide-react';

/* Typing animation */
function TypewriterText({ text, speed = 8, onDone }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const iRef = useRef(0);

  useEffect(() => {
    setDisplayed(''); setDone(false); iRef.current = 0;
    const iv = setInterval(() => {
      if (iRef.current >= text.length) { clearInterval(iv); setDone(true); onDone?.(); return; }
      const chunk = text.slice(iRef.current, iRef.current + speed);
      setDisplayed(prev => prev + chunk);
      iRef.current += speed;
    }, 16);
    return () => clearInterval(iv);
  }, [text]);

  return (
    <span>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>{displayed}</ReactMarkdown>
      {!done && <span className="typing-cursor" />}
    </span>
  );
}

/* Markdown renderer components */
const MD_COMPONENTS = {
  p: ({ children }) => <p style={{ marginBottom: 8 }}>{children}</p>,
  strong: ({ children }) => <strong style={{ color: 'var(--indigo-hov)', fontWeight: 700 }}>{children}</strong>,
  code: ({ children }) => (
    <code style={{
      background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 4,
      fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--cyan)',
    }}>{children}</code>
  ),
  ul: ({ children }) => <ul style={{ paddingLeft: 18, marginBottom: 6 }}>{children}</ul>,
  ol: ({ children }) => <ol style={{ paddingLeft: 18, marginBottom: 6 }}>{children}</ol>,
  li: ({ children }) => <li style={{ marginBottom: 3, fontSize: 13.5 }}>{children}</li>,
};

/* Quick prompts */
const QUICK_PROMPTS = [
  "We used recursive chunking with 512-token size and 50-token overlap, using cosine similarity for matching.",
  "ChromaDB locally with metadata filtering; Pinecone for cloud with namespace isolation.",
  "Session state persisted via SQLite, token truncation to keep within 4k context window.",
  "Router agent delegated via intent classification before calling specialist sub-agents.",
  "MCP gives standardized tool schemas, making tools reusable across different LLM clients.",
  "Docker readiness probe on /health with 5s timeout and 3 retry attempts.",
];

export default function ChatStream({ messages, onSendMessage, isLoading, candidate, isComplete, onShowFeedback }) {
  const [input, setInput] = useState('');
  const [lastAnimated, setLastAnimated] = useState(-1);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isLoading]);
  useEffect(() => { if (!isLoading && !isComplete) inputRef.current?.focus(); }, [isLoading, isComplete]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isLoading || isComplete) return;
    onSendMessage(text);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const initials = candidate?.member?.name?.split(' ').map(n => n[0]).join('') || 'U';

  return (
    <main style={{
      flex: 1, display: 'flex', flexDirection: 'column', height: '100%',
      overflow: 'hidden', background: 'var(--bg-surface)', position: 'relative',
    }}>
      {/* Top bar */}
      <div className="glass" style={{
        padding: '9px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderLeft: 'none', borderRight: 'none', borderTop: 'none', borderRadius: 0, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className={`status-dot ${isLoading ? 'loading' : 'online'}`} />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)' }}>
            {isLoading ? 'AI formulating question…' : isComplete ? 'Interview completed' : 'Live interview'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isComplete && (
            <button className="btn-primary" onClick={onShowFeedback} style={{ fontSize: 11, padding: '5px 14px' }}>
              <Award size={12} /> View Report
            </button>
          )}
          <span className="mono" style={{ color: 'var(--text-3)', fontSize: 10 }}>
            {messages.filter(m => m.role === 'assistant').length} Q
          </span>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        {messages.length === 0 && (
          <div style={{
            margin: 'auto', textAlign: 'center', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 10, opacity: 0.5,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 'var(--r-xl)',
              background: 'linear-gradient(135deg, var(--indigo), var(--violet))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 24px var(--indigo-glow)',
            }}>
              <Bot size={28} color="#fff" />
            </div>
            <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-1)' }}>Interview Ready</p>
            <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Preparing your evaluation session…</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isAI = msg.role === 'assistant';
          const isLatestAI = isAI && i === messages.length - 1 && i > lastAnimated;

          return (
            <div key={i} className="animate-fade-up" style={{
              display: 'flex', gap: 10, maxWidth: '78%',
              alignSelf: isAI ? 'flex-start' : 'flex-end',
              flexDirection: isAI ? 'row' : 'row-reverse',
              animationDelay: `${i * 0.02}s`,
            }}>
              {isAI
                ? <div className="avatar-ai"><Bot size={16} color="#fff" strokeWidth={2} /></div>
                : <div className="avatar-user">{initials}</div>
              }
              <div className={isAI ? 'bubble-ai' : 'bubble-user'} style={{ padding: '12px 16px' }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
                  color: isAI ? 'var(--indigo-hov)' : 'var(--text-3)',
                  marginBottom: 5, textTransform: 'uppercase',
                }}>
                  {isAI ? 'AI Interviewer' : candidate?.member?.name || 'Candidate'}
                </div>
                <div style={{ fontSize: 13.5, lineHeight: 1.7, color: 'var(--text-1)' }}>
                  {isAI ? (
                    isLatestAI
                      ? <TypewriterText text={msg.content} speed={6} onDone={() => setLastAnimated(i)} />
                      : <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>{msg.content}</ReactMarkdown>
                  ) : (
                    <p style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div style={{ display: 'flex', gap: 10, alignSelf: 'flex-start' }} className="animate-fade-in">
            <div className="avatar-ai"><Bot size={16} color="#fff" strokeWidth={2} /></div>
            <div className="bubble-ai" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="wave-bars"><span /><span /><span /><span /><span /></div>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>thinking…</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Quick prompts */}
      {!isComplete && (
        <div style={{ padding: '0 24px 6px', flexShrink: 0 }}>
          <div className="pills-strip">
            {QUICK_PROMPTS.map((qp, idx) => (
              <button key={idx} className="prompt-pill" onClick={() => setInput(qp)}>
                <Zap size={9} style={{ flexShrink: 0, display: 'inline', marginRight: 2 }} />
                {qp.slice(0, 48)}…
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="glass" style={{
        padding: '12px 20px', display: 'flex', gap: 8,
        borderLeft: 'none', borderRight: 'none', borderBottom: 'none', borderRadius: 0, flexShrink: 0,
      }}>
        <textarea
          ref={inputRef}
          className="textarea-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isComplete ? 'Interview complete — view your report above.' : 'Type your response… (Enter to send)'}
          disabled={isComplete || isLoading}
          rows={1}
          style={{ minHeight: 42, maxHeight: 110, lineHeight: 1.5 }}
        />
        <button className="btn-primary" onClick={handleSubmit} disabled={isComplete || isLoading || !input.trim()} style={{ height: 42, padding: '0 16px', flexShrink: 0 }}>
          <Send size={14} />
        </button>
      </div>
    </main>
  );
}
