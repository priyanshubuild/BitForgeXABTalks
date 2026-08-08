import React from 'react';
import { Bot, Sparkles, RefreshCw } from 'lucide-react';

export default function Header({ 
  candidates, 
  selectedCandidateId, 
  onSelectCandidate, 
  onResetSession, 
  isBackendOnline 
}) {
  return (
    <header className="glass-panel" style={{ padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 16px var(--primary-glow)'
        }}>
          <Bot size={24} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
              AI Interview Agent
            </h1>
            <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
              <Sparkles size={10} /> Hackathon Evaluation
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Curriculum-Based Technical Candidate Evaluation Engine
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Candidate Profile
          </label>
          <select 
            value={selectedCandidateId}
            onChange={(e) => onSelectCandidate(e.target.value)}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {candidates.map(c => (
              <option key={c.member.id} value={c.member.id}>
                {c.member.name} ({c.member.jobRole})
              </option>
            ))}
          </select>
        </div>

        <div className="glass-card" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isBackendOnline ? (
            <>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--emerald)', boxShadow: '0 0 8px var(--emerald-glow)' }}></span>
              <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600 }}>FastAPI Online</span>
            </>
          ) : (
            <>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--amber)' }}></span>
              <span style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 600 }}>Simulated Engine</span>
            </>
          )}
        </div>

        <button 
          onClick={onResetSession}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            padding: '8px 12px',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8rem',
            fontWeight: 600,
            transition: 'all 0.2s'
          }}
        >
          <RefreshCw size={14} /> Reset
        </button>
      </div>
    </header>
  );
}
