import React from 'react';
import { BrainCircuit, RefreshCw, Sun, Moon, Sparkles, ArrowLeft, LogOut } from 'lucide-react';

export default function Header({
  candidate, onBack, onResetSession, isBackendOnline,
  sessionId, theme, setTheme
}) {
  const name = candidate?.member?.name || 'Candidate';
  const role = candidate?.member?.jobRole || '';

  return (
    <header className="glass" style={{
      padding: '10px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      borderLeft: 'none', borderRight: 'none', borderTop: 'none', borderRadius: 0,
      borderBottom: '1px solid var(--border)', position: 'relative', zIndex: 50, flexShrink: 0,
    }}>
      {/* Left: Brand + Back */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="icon-btn" onClick={onBack} title="Back to candidates" style={{ width: 32, height: 32 }}>
          <ArrowLeft size={14} />
        </button>

        <div style={{
          width: 34, height: 34, borderRadius: 'var(--r-md)',
          background: 'linear-gradient(135deg, var(--indigo), var(--violet))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 14px var(--indigo-glow)', flexShrink: 0,
        }}>
          <BrainCircuit size={18} color="#fff" strokeWidth={1.8} />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 style={{ fontSize: '0.95rem', fontWeight: 800, letterSpacing: '-0.3px', color: 'var(--text-1)', lineHeight: 1 }}>
              AI Interview Agent
            </h1>
            <span className="chip chip-indigo" style={{ fontSize: 10, padding: '2px 8px' }}>
              <Sparkles size={8} strokeWidth={2.5} /> BitForge
            </span>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
            Evaluating <span style={{ color: 'var(--indigo-hov)', fontWeight: 600 }}>{name}</span> · {role}
          </p>
        </div>
      </div>

      {/* Right: Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Backend status */}
        <div className="glass" style={{ padding: '5px 12px', borderRadius: 'var(--r-full)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className={`status-dot ${isBackendOnline ? 'online' : 'offline'}`} />
          <span style={{ fontSize: 11, fontWeight: 600, color: isBackendOnline ? 'var(--green)' : 'var(--amber)' }}>
            {isBackendOnline ? 'Live' : 'Sim'}
          </span>
        </div>

        <span className="mono" style={{ color: 'var(--text-3)', fontSize: 10 }}>{sessionId.slice(0, 12)}</span>

        <button className="icon-btn" onClick={onResetSession} title="Reset interview" style={{ width: 32, height: 32 }}>
          <RefreshCw size={13} />
        </button>

        <button className="icon-btn" onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')} title="Toggle theme" style={{ width: 32, height: 32 }}>
          {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
        </button>
      </div>
    </header>
  );
}
