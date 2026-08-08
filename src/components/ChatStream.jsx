import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Award, Zap } from 'lucide-react';

/* ── Typing Animation ────────────────────────────────────────── */
function TypewriterText({ text, speed = 8, onDone }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const iRef = useRef(0);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    iRef.current = 0;

    const iv = setInterval(() => {
      if (iRef.current >= text.length) {
        clearInterval(iv);
        setDone(true);
        onDone?.();
        return;
      }
      // Advance multiple chars per tick for speed
      const chunk = text.slice(iRef.current, iRef.current + speed);
      setDisplayed(prev => prev + chunk);
      iRef.current += speed;
    }, 16);

    return () => clearInterval(iv);
  }, [text]);

  return (
    <span>
      {displayed}
      {!done && <span className="typing-cursor" />}
    </span>
  );
}

/* ── Quick prompts ───────────────────────────────────────────── */
const QUICK_PROMPTS = [
  "We used recursive chunking with 512-token size and 50-token overlap, and cosine similarity.",
  "ChromaDB locally with metadata filtering; Pinecone for cloud with exact namespace isolation.",
  "Session state persisted in-memory dict, token truncation to keep within 4k context window.",
  "Router agent delegated via intent classification before calling specialist sub-agents.",
  "MCP gives standardized tool schemas, making our tools reusable across different LLM clients.",
  "Docker readiness probe on /health endpoint with 5s timeout and 3 retry attempts.",
];

export default function ChatStream({
  messages,
  onSendMessage,
  isLoading,
  candidate,
  isComplete,
  onShowFeedback,
}) {
  const [input, setInput] = useState('');
  const [lastAnimated, setLastAnimated] = useState(-1);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isLoading]);

  useEffect(() => {
    if (!isLoading && !isComplete) inputRef.current?.focus();
  }, [isLoading, isComplete]);

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
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
      background: 'var(--bg-surface)',
      position: 'relative',
    }}>
      {/* ── Top bar ─────────────────────────────── */}
      <div className="glass" style={{
        padding: '10px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderLeft: 'none', borderRight: 'none', borderTop: 'none',
        borderRadius: 0,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className={`status-dot ${isLoading ? 'loading' : isComplete ? 'online' : 'online'}`} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>
            {isLoading
              ? 'AI Interviewer is formulating question…'
              : isComplete
              ? 'Interview completed — view your evaluation report'
              : 'Live technical interview in progress'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isComplete && (
            <button className="btn-primary" onClick={onShowFeedback} style={{ fontSize: 12, padding: '6px 14px' }}>
              <Award size={13} />
              View Evaluation Report
            </button>
          )}
          <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
            {messages.filter(m => m.role === 'assistant').length} questions asked
          </span>
        </div>
      </div>

      {/* ── Messages ────────────────────────────── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}>
        {messages.length === 0 && (
          <div style={{
            margin: 'auto',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            opacity: 0.6,
          }}>
            <div style={{
              width: 64, height: 64,
              borderRadius: 'var(--r-xl)',
              background: 'linear-gradient(135deg, var(--indigo), var(--violet))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 30px var(--indigo-glow)',
            }}>
              <Bot size={32} color="#fff" />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-1)' }}>Interview Ready</p>
              <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Select a candidate to begin the AI evaluation session</p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          const isAI = msg.role === 'assistant';
          const isLatestAI = isAI && i === messages.length - 1 && i > lastAnimated;

          return (
            <div
              key={i}
              className="animate-fade-up"
              style={{
                display: 'flex',
                gap: 12,
                maxWidth: '80%',
                alignSelf: isAI ? 'flex-start' : 'flex-end',
                flexDirection: isAI ? 'row' : 'row-reverse',
                animationDelay: `${i * 0.02}s`,
              }}
            >
              {/* Avatar */}
              {isAI
                ? <div className="avatar-ai"><Bot size={17} color="#fff" strokeWidth={2} /></div>
                : <div className="avatar-user">{initials}</div>
              }

              {/* Bubble */}
              <div className={isAI ? 'bubble-ai' : 'bubble-user'} style={{ padding: '13px 17px' }}>
                <div style={{
                  fontSize: 10.5, fontWeight: 700, letterSpacing: '0.05em',
                  color: isAI ? 'var(--indigo-hov)' : 'var(--text-3)',
                  marginBottom: 6, textTransform: 'uppercase',
                }}>
                  {isAI ? 'AI Interviewer' : candidate?.member?.name || 'Candidate'}
                </div>

                <p style={{
                  fontSize: 14, lineHeight: 1.7,
                  color: 'var(--text-1)',
                  whiteSpace: 'pre-wrap',
                  fontWeight: isAI ? 400 : 400,
                }}>
                  {isLatestAI
                    ? <TypewriterText
                        text={msg.content}
                        speed={6}
                        onDone={() => setLastAnimated(i)}
                      />
                    : msg.content
                  }
                </p>
              </div>
            </div>
          );
        })}

        {/* Loading indicator */}
        {isLoading && (
          <div style={{ display: 'flex', gap: 12, alignSelf: 'flex-start' }} className="animate-fade-in">
            <div className="avatar-ai"><Bot size={17} color="#fff" strokeWidth={2} /></div>
            <div className="bubble-ai" style={{ padding: '13px 17px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="wave-bars">
                <span /><span /><span /><span /><span />
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>thinking…</span>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* ── Quick Prompt Pills ───────────────────── */}
      {!isComplete && (
        <div style={{ padding: '0 28px 8px', flexShrink: 0 }}>
          <div className="pills-strip">
            {QUICK_PROMPTS.map((qp, idx) => (
              <button
                key={idx}
                className="prompt-pill"
                onClick={() => setInput(qp)}
              >
                <Zap size={10} style={{ flexShrink: 0, display: 'inline', marginRight: 3 }} />
                {qp.slice(0, 52)}…
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Input Bar ────────────────────────────── */}
      <div className="glass" style={{
        padding: '14px 20px',
        display: 'flex',
        gap: 10,
        borderLeft: 'none', borderRight: 'none', borderBottom: 'none',
        borderRadius: 0,
        flexShrink: 0,
      }}>
        <textarea
          ref={inputRef}
          className="textarea-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isComplete
              ? 'Interview complete. View your evaluation report above.'
              : 'Type your technical response… (Enter to send, Shift+Enter for newline)'
          }
          disabled={isComplete || isLoading}
          rows={1}
          style={{ minHeight: 44, maxHeight: 120, lineHeight: 1.5 }}
        />
        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={isComplete || isLoading || !input.trim()}
          style={{ height: 44, padding: '0 18px', flexShrink: 0 }}
        >
          <Send size={15} />
          Send
        </button>
      </div>
    </main>
  );
}
