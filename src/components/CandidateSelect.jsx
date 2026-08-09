import React, { useState, useMemo } from 'react';
import { Search, ArrowLeft, ArrowRight, Briefcase, GraduationCap, Clock, CheckCircle, SkipForward, Users, Info } from 'lucide-react';

export default function CandidateSelect({ candidates, onSelect, onBack }) {
  const [search, setSearch] = useState('');
  const [hoveredId, setHoveredId] = useState(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return candidates;
    return candidates.filter(c =>
      c.member.name.toLowerCase().includes(q) ||
      c.member.jobRole.toLowerCase().includes(q) ||
      c.member.id.toLowerCase().includes(q)
    );
  }, [candidates, search]);

  const getCompletionPct = (c) => Math.round((c.signals.missionsCompleted / 31) * 100);
  const getPassedCount = (c) => c.missions.filter(m => m.passed).length;
  const getFirstTryCount = (c) => c.missions.filter(m => m.passed && (m.attempts ?? 1) === 1).length;
  const getSkippedCount = (c) => c.missions.filter(m => m.skipped).length;
  const getFailedCount = (c) => c.missions.filter(m => m.passed === false && !m.skipped).length;

  return (
    <div className="candidates-page">
      <div className="mesh-bg" />

      {/* Header */}
      <div className="candidates-topbar">
        <div className="candidates-topbar-copy">
          <button className="icon-btn" onClick={onBack}><ArrowLeft size={15} /></button>
          <div className="candidates-topbar-text">
            <h2>Select Candidate</h2>
            <p>Choose a candidate to begin their technical interview</p>
          </div>
        </div>

        <div className="candidates-topbar-actions">
          <div className="search-wrap">
            <Search size={14} className="search-icon" />
            <input
              className="search-bar"
              placeholder="Search by name or role..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="chip chip-muted candidates-count">
            <Users size={11} /> {filtered.length} candidates
          </div>
        </div>
      </div>

      <div style={{ padding: '0 28px 14px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: 'var(--text-3)', fontSize: 11, lineHeight: 1.5 }}>
          <Info size={12} style={{ flexShrink: 0, marginTop: 1 }} />
          <p>
            The profile snapshot comes from <span style={{ color: 'var(--text-2)', fontWeight: 600 }}>candidates.json</span>. The mission stats below are derived from the listed missions, while cohort progress uses the summary signal field.
          </p>
        </div>
      </div>

      <div className="candidates-grid">
        {filtered.map((c, idx) => {
          const initials = c.member.name.split(' ').map(n => n[0]).join('');
          const pct = getCompletionPct(c);
          const passed = getPassedCount(c);
          const firstTry = getFirstTryCount(c);
          const skipped = getSkippedCount(c);
          const failed = getFailedCount(c);

          return (
            <div
              key={c.member.id}
              className="candidate-card animate-scale-in"
              style={{ animationDelay: `${idx * 0.03}s` }}
              onClick={() => onSelect(c)}
              onMouseEnter={() => setHoveredId(c.member.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div className="candidate-card-head">
                <div className="candidate-avatar">{initials}</div>
                <div className="candidate-card-copy">
                  <h3>
                    {c.member.name}
                  </h3>
                  <div className="candidate-role">
                    <Briefcase size={11} />
                    <span>{c.member.jobRole}</span>
                  </div>
                  <div className="candidate-meta">
                    <span className="candidate-meta-item">
                      <Clock size={10} /> {c.member.yearsExperience} yr{c.member.yearsExperience !== 1 ? 's' : ''}
                    </span>
                    <span className="candidate-meta-item candidate-education">
                      <GraduationCap size={10} /> {c.member.education}
                    </span>
                  </div>
                </div>
              </div>

              <div className="candidate-progress">
                <div className="candidate-progress-head">
                  <span>Cohort Progress</span>
                  <span className="candidate-progress-value" style={{ color: pct >= 90 ? 'var(--green)' : pct >= 60 ? 'var(--amber)' : 'var(--red)' }}>
                    {pct}%
                  </span>
                </div>
                <div className="progress-track candidate-progress-track">
                  <div className="progress-fill" style={{
                    width: `${pct}%`,
                    background: pct >= 90 ? 'var(--green)' : pct >= 60 ? 'linear-gradient(90deg, var(--amber), var(--green))' : 'var(--amber)',
                  }} />
                </div>
              </div>

              <div className="candidate-mini-stats">
                <div className="candidate-mini-stat">
                  <div className="candidate-stat-value candidate-gap-value">{passed}</div>
                  <div className="candidate-stat-label">
                    <CheckCircle size={8} /> Passed
                  </div>
                </div>
                <div className="candidate-mini-stat">
                  <div className="candidate-stat-value">{firstTry}</div>
                  <div className="candidate-stat-label">1st Try</div>
                </div>
                <div className="candidate-mini-stat">
                  <div className="candidate-stat-value" style={{ color: skipped + failed > 0 ? 'var(--amber)' : 'var(--text-3)' }}>{skipped + failed}</div>
                  <div className="candidate-stat-label">
                    <SkipForward size={8} /> Gaps
                  </div>
                </div>
              </div>

              {hoveredId === c.member.id && (
                <div className="candidate-card-cta animate-fade-in">
                  Start Interview <ArrowRight size={12} />
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="candidates-empty">
            <p>No candidates match your search</p>
          </div>
        )}
      </div>
    </div>
  );
}
