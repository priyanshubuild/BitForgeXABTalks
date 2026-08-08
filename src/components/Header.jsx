import React from 'react';
import { BrainCircuit, RefreshCw, Sun, Moon, Sparkles } from 'lucide-react';

export default function Header({
  candidates,
  selectedCandidateId,
  onSelectCandidate,
  onResetSession,
  isBackendOnline,
  sessionId,
  theme,
  setTheme
}) {
  return (
    <header className="glass" style={{
      padding: '12px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderLeft: 'none',
      borderRight: 'none',
      borderTop: 'none',
      borderRadius: 0,
      borderBottom: '1px solid var(--border)',
      position: 'relative',
      zIndex: 50,
      flexShrink: 0,
    }}>
      {/* ── Brand ─────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 38, height: 38,
          borderRadius: 'var(--r-lg)',
          background: 'linear-gradient(135deg, var(--indigo), var(--violet))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 18px var(--indigo-glow)',
          flexShrink: 0,
        }}>
          <BrainCircuit size={20} color="#fff" strokeWidth={1.8} />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 style={{
              fontFamily: 'var(--font-disp)',
              fontSize: '1.05rem',
              fontWeight: 800,
              letterSpacing: '-0.4px',
              color: 'var(--text-1)',
              lineHeight: 1,
            }}>
              AI Interview Agent
            </h1>
            <span className="chip chip-indigo">
              <Sparkles size={9} strokeWidth={2.5} />
              BitForge
            </span>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, letterSpacing: '0.01em' }}>
            Curriculum-aware technical evaluator · Breeth memory
          </p>
        </div>
      </div>

      {/* ── Controls ──────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Candidate selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span className="section-label" style={{ marginLeft: 2 }}>Candidate</span>
          <select
            className="styled-select"
            value={selectedCandidateId}
            onChange={(e) => onSelectCandidate(e.target.value)}
          >
            {candidates.map(c => (
              <option key={c.member.id} value={c.member.id}>
                {c.member.name} · {c.member.jobRole}
              </option>
            ))}
          </select>
        </div>

        {/* Backend status */}
        <div className="glass" style={{
          padding: '6px 12px',
          borderRadius: 'var(--r-lg)',
          display: 'flex', alignItems: 'center', gap: 7,
        }}>
          <span className={`status-dot ${isBackendOnline ? 'online' : 'offline'}`} />
          <span style={{ fontSize: 12, fontWeight: 600, color: isBackendOnline ? 'var(--green)' : 'var(--amber)' }}>
            {isBackendOnline ? 'Backend Online' : 'Simulated'}
          </span>
        </div>

        {/* Session ID */}
        <span className="mono" style={{ color: 'var(--text-3)', fontSize: 11 }}>
          {sessionId.slice(0, 14)}
        </span>

        {/* Reset */}
        <button className="btn-ghost" onClick={onResetSession} title="Reset interview session">
          <RefreshCw size={13} />
          Reset
        </button>

        {/* Theme toggle */}
        <button
          className="icon-btn"
          onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} mode`}
        >
          {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
        </button>
      </div>
    </header>
  );
}
