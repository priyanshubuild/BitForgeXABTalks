import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Bot, Award, Lightbulb } from 'lucide-react';

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
      const chunk = text.slice(iRef.current, iRef.current + speed);
      setDisplayed(prev => prev + chunk);
      iRef.current += speed;
    }, 16);
    return () => clearInterval(iv);
  }, [text, onDone, speed]);

  return (
    <span>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>{displayed}</ReactMarkdown>
      {!done && <span className="typing-cursor" />}
    </span>
  );
}

const MD_COMPONENTS = {
  p: ({ children }) => <p style={{ marginBottom: 10 }}>{children}</p>,
  strong: ({ children }) => <strong style={{ color: 'var(--text-1)', fontWeight: 600 }}>{children}</strong>,
  em: ({ children }) => <em style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>{children}</em>,
  code: ({ children }) => (
    <code style={{
      background: 'var(--bg-elevated)', padding: '2px 7px', borderRadius: 6,
      fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-2)',
    }}>{children}</code>
  ),
  ul: ({ children }) => <ul style={{ paddingLeft: 20, marginBottom: 8 }}>{children}</ul>,
  ol: ({ children }) => <ol style={{ paddingLeft: 20, marginBottom: 8 }}>{children}</ol>,
  li: ({ children }) => <li style={{ marginBottom: 4, fontSize: 15 }}>{children}</li>,
};

function getTopicHints(topic) {
  if (!topic) return [];
  if (topic.objectives?.length) {
    return topic.objectives.slice(0, 3).map(o =>
      o.length > 72 ? `${o.slice(0, 69)}…` : o
    );
  }
  const title = (topic.title || '').toLowerCase();

  if (title.includes('embedding')) {
    return ['vector dimensions & similarity metrics', 'chunking strategy impact', 'semantic meaning encoding'];
  }
  if (title.includes('vector') && title.includes('database')) {
    return ['indexing strategies (IVF, HNSW)', 'metadata filtering vs similarity', 'scaling challenges'];
  }
  if (title.includes('retrieval') || title.includes('matching')) {
    return ['hybrid search approaches', 're-ranking quality', 'query routing strategies'];
  }
  if (title.includes('prompt')) {
    return ['few-shot vs zero-shot', 'output format control', 'hallucination handling'];
  }
  if (title.includes('agent') || title.includes('orchestration')) {
    return ['task decomposition', 'agent communication', 'error recovery patterns'];
  }
  if (title.includes('docker') || title.includes('kubernetes') || title.includes('deploy')) {
    return ['health checks & probes', 'resource limits', 'CI/CD & rollback'];
  }
  if (title.includes('mcp') || title.includes('protocol')) {
    return ['standardized tool interfaces', 'cross-client reusability', 'protocol benefits'];
  }
  return ['implementation approach', 'tradeoffs considered', 'tools & patterns used'];
}

export default function ChatStream({ messages, onSendMessage, isLoading, candidate, isComplete, onShowFeedback, currentTopic }) {
  const [input, setInput] = useState('');
  const [lastAnimated, setLastAnimated] = useState(-1);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isLoading, scrollToBottom]);
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
  const hints = getTopicHints(currentTopic);

  return (
    <main className="chat-panel">
      <div className="chat-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className={`status-dot ${isLoading ? 'loading' : 'online'}`} />
          <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-2)' }}>
            {isLoading ? 'Reviewing response…' : isComplete ? 'Interview Complete' : currentTopic ? `Reviewing Day ${currentTopic.day}` : 'Live Interview'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isComplete && (
            <button className="btn-primary" onClick={onShowFeedback} style={{ fontSize: 14, padding: '8px 18px' }}>
              <Award size={14} /> View Report
            </button>
          )}
          <span className="mono" style={{ color: 'var(--text-3)' }}>
            {messages.filter(m => m.role === 'assistant').length} Q
          </span>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div style={{
            margin: 'auto', textAlign: 'center', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 12, opacity: 0.4,
          }}>
            <div className="avatar-ai" style={{ width: 52, height: 52 }}>
              <Bot size={22} />
            </div>
            <p style={{ fontWeight: 600, fontSize: 17, color: 'var(--text-1)' }}>Interview Ready</p>
            <p style={{ fontSize: 14, color: 'var(--text-3)' }}>Preparing evaluation session…</p>
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
                display: 'flex', gap: 12, maxWidth: '72%',
                alignSelf: isAI ? 'flex-start' : 'flex-end',
                flexDirection: isAI ? 'row' : 'row-reverse',
                animationDelay: `${i * 0.02}s`,
              }}
            >
              {isAI
                ? <div className="avatar-ai"><Bot size={16} strokeWidth={1.8} /></div>
                : <div className="avatar-user">{initials}</div>
              }
              <div className={isAI ? 'bubble-ai' : 'bubble-user'} style={{ padding: '14px 18px' }}>
                <div style={{
                  fontSize: 11, fontWeight: 600, letterSpacing: '0.04em',
                  color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase',
                }}>
                  {isAI ? 'Interviewer' : candidate?.member?.name || 'You'}
                </div>
                <div style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text-1)' }}>
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
          <div style={{ display: 'flex', gap: 12, alignSelf: 'flex-start' }} className="animate-fade-in">
            <div className="avatar-ai"><Bot size={16} strokeWidth={1.8} /></div>
            <div className="bubble-ai" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="wave-bars"><span /><span /><span /><span /><span /></div>
              <span style={{ fontSize: 14, color: 'var(--text-3)' }}>Thinking…</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {!isComplete && currentTopic && hints.length > 0 && (
        <div className="chat-hints">
          <div className="pills-strip">
            {hints.map((hint, idx) => (
              <div key={idx} className="hint-pill">
                <Lightbulb size={11} style={{ opacity: 0.5 }} />
                <span>{hint}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <form className="chat-composer" onSubmit={handleSubmit}>
        <textarea
          ref={inputRef}
          className="textarea-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isComplete ? 'Interview complete — view your report.' : 'Type your response…'}
          disabled={isComplete || isLoading}
          rows={1}
          style={{ minHeight: 48, maxHeight: 120, lineHeight: 1.5 }}
          aria-label="Your response"
        />
        <button
          type="submit"
          className="btn-primary"
          disabled={isComplete || isLoading || !input.trim()}
          style={{ height: 48, padding: '0 20px', flexShrink: 0, borderRadius: 'var(--r-lg)' }}
          aria-label="Send message"
        >
          <Send size={16} />
        </button>
      </form>
    </main>
  );
}
