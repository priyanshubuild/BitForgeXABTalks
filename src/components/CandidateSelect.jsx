import React, { useState, useMemo } from 'react';
import { Search, ArrowLeft, ArrowRight, Briefcase, GraduationCap, Clock, CheckCircle, XCircle, SkipForward, Users } from 'lucide-react';

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
  const getSkippedCount = (c) => c.missions.filter(m => m.skipped).length;
  const getFailedCount = (c) => c.missions.filter(m => m.passed === false && !m.skipped).length;

  return (
    <div className="candidates-page">
      <div className="mesh-bg" />

      {/* Header */}
      <div style={{
        padding: '16px 28px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg-card)', backdropFilter: 'blur(16px)', position: 'relative', zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button className="icon-btn" onClick={onBack}><ArrowLeft size={15} /></button>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)' }}>Select Candidate</h2>
            <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Choose a candidate to begin their technical interview</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input
              className="search-bar"
              placeholder="Search by name or role..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="chip chip-indigo">
            <Users size={11} /> {filtered.length} candidates
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="candidates-grid" style={{ position: 'relative', zIndex: 1 }}>
        {filtered.map((c, idx) => {
          const initials = c.member.name.split(' ').map(n => n[0]).join('');
          const pct = getCompletionPct(c);
          const passed = getPassedCount(c);
          const skipped = getSkippedCount(c);
          const failed = getFailedCount(c);

          return (
            <div
              key={c.member.id}
              className={`candidate-card animate-scale-in`}
              style={{ animationDelay: `${idx * 0.03}s` }}
              onClick={() => onSelect(c)}
              onMouseEnter={() => setHoveredId(c.member.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Top row */}
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
                <div className="candidate-avatar">{initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.member.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <Briefcase size={11} color="var(--indigo-hov)" />
                    <span style={{ fontSize: 12, color: 'var(--indigo-hov)', fontWeight: 600 }}>{c.member.jobRole}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 4, fontSize: 11, color: 'var(--text-3)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Clock size={10} /> {c.member.yearsExperience} yr{c.member.yearsExperience !== 1 ? 's' : ''}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <GraduationCap size={10} /> {c.member.education}
                    </span>
                  </div>
                </div>
              </div>

              {/* Completion bar */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-3)' }}>Cohort Progress</span>
                  <span style={{ fontWeight: 700, color: pct >= 90 ? 'var(--green)' : pct >= 60 ? 'var(--amber)' : 'var(--red)', fontFamily: 'var(--font-mono)' }}>
                    {pct}%
                  </span>
                </div>
                <div className="progress-track" style={{ height: 5 }}>
                  <div className="progress-fill" style={{
                    width: `${pct}%`,
                    background: pct >= 90 ? 'var(--green)' : pct >= 60 ? 'linear-gradient(90deg, var(--amber), var(--green))' : 'var(--amber)',
                  }} />
                </div>
              </div>

              {/* Mini stats */}
              <div className="candidate-mini-stats">
                <div className="candidate-mini-stat">
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--green)', lineHeight: 1 }}>{passed}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 600, marginTop: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                    <CheckCircle size={8} /> Passed
                  </div>
                </div>
                <div className="candidate-mini-stat">
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1 }}>{c.signals.missionsFirstTry}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 600, marginTop: 3 }}>1st Try</div>
                </div>
                <div className="candidate-mini-stat">
                  <div style={{ fontSize: 16, fontWeight: 800, color: skipped + failed > 0 ? 'var(--amber)' : 'var(--text-3)', lineHeight: 1 }}>{skipped + failed}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 600, marginTop: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                    <SkipForward size={8} /> Gaps
                  </div>
                </div>
              </div>

              {/* Hover CTA */}
              {hoveredId === c.member.id && (
                <div className="animate-fade-in" style={{
                  position: 'absolute', bottom: 12, right: 16,
                  display: 'flex', alignItems: 'center', gap: 4,
                  color: 'var(--indigo-hov)', fontSize: 11, fontWeight: 700,
                }}>
                  Start Interview <ArrowRight size={12} />
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 60, color: 'var(--text-3)' }}>
            <p style={{ fontSize: 14, fontWeight: 600 }}>No candidates match your search</p>
          </div>
        )}
      </div>
    </div>
  );
}
