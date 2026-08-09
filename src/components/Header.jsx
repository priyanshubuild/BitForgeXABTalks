import React from 'react';
import { BrainCircuit, RefreshCw, Sun, Moon, ArrowLeft } from 'lucide-react';

export default function Header({
  candidate, onBack, onResetSession, isBackendOnline, isAiEnabled,
  sessionId, theme, setTheme
}) {
  const name = candidate?.member?.name || 'Candidate';
  const role = candidate?.member?.jobRole || '';

  // Three states: Live AI, Backend Only (no key), Simulation (no backend)
  const statusLabel = isBackendOnline
    ? (isAiEnabled ? 'Live AI' : 'Backend Only')
    : 'Simulation';
  const statusClass = isBackendOnline
    ? (isAiEnabled ? 'online' : 'warning')
    : 'offline';
  const statusColor = isBackendOnline
    ? (isAiEnabled ? 'var(--green)' : 'var(--amber, #f59e0b)')
    : 'var(--text-3)';

  return (
    <header className="app-header">
      <div className="app-header-left">
        <button className="icon-btn" onClick={onBack} title="Back to candidates" aria-label="Back to candidates">
          <ArrowLeft size={16} />
        </button>

        <div className="app-header-logo">
          <BrainCircuit size={16} strokeWidth={1.8} />
        </div>

        <div>
          <div className="app-header-title">AI Interview Agent</div>
          <p className="app-header-sub">
            Evaluating <strong>{name}</strong>
            {role && <>· {role}</>}
          </p>
        </div>
      </div>

      <div className="app-header-right">
        <div className="status-pill">
          <span className={`status-dot ${statusClass}`} />
          <span style={{ color: statusColor }}>
            {statusLabel}
          </span>
        </div>

        <span className="mono" style={{ color: 'var(--text-3)' }}>{sessionId.slice(0, 12)}</span>

        <button className="icon-btn" onClick={onResetSession} title="Reset interview" aria-label="Reset interview">
          <RefreshCw size={15} />
        </button>

        <button
          className="icon-btn"
          onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
          title="Toggle theme"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
        </button>
      </div>
    </header>
  );
}
