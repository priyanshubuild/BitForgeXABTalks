import React from 'react';
import { BookOpen, Target, CheckCircle, AlertTriangle, Clock, Activity } from 'lucide-react';

function StatCell({ value, label, color }) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      borderRadius: 'var(--r-md)',
      padding: '10px 8px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: color || 'var(--text-1)', lineHeight: 1 }}>
        {value}
      </div>
      <div className="section-label" style={{ marginTop: 4 }}>{label}</div>
    </div>
  );
}

export default function CandidateSidebar({ candidate, targetDays, questionsAsked, daysCovered }) {
  if (!candidate) return null;

  const { member, missions, signals } = candidate;
  const passedCount  = missions.filter(m => m.passed).length;
  const skippedCount = missions.filter(m => m.skipped || m.passed === false).length;

  const qPct  = Math.min(100, (questionsAsked / 8) * 100);
  const dPct  = Math.min(100, ((daysCovered?.size ?? 0) / 4) * 100);

  const initials = member.name.split(' ').map(n => n[0]).join('');

  return (
    <aside style={{
      width: 290,
      background: 'var(--bg-base)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      flexShrink: 0,
    }}>
      {/* ── Candidate Card ───────────────────── */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-card)',
      }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
          {/* Avatar */}
          <div style={{
            width: 48, height: 48,
            borderRadius: 'var(--r-lg)',
            background: 'linear-gradient(135deg, var(--indigo), var(--violet))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: 16,
            flexShrink: 0,
            boxShadow: '0 4px 16px var(--indigo-glow)',
          }}>
            {initials}
          </div>

          <div style={{ minWidth: 0 }}>
            <h3 style={{
              fontSize: 14, fontWeight: 700, color: 'var(--text-1)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {member.name}
            </h3>
            <p style={{ fontSize: 12, color: 'var(--indigo-hov)', fontWeight: 600, marginTop: 1 }}>
              {member.jobRole}
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: 11, color: 'var(--text-3)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Clock size={10} /> {member.yearsExperience} yr{member.yearsExperience !== 1 ? 's' : ''}
              </span>
              <span>·</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {member.education}
              </span>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          <StatCell value={signals.missionsCompleted} label="Completed" color="var(--text-1)" />
          <StatCell value={signals.missionsFirstTry}  label="1st Try"   color="var(--green)"  />
          <StatCell value={signals.commitDays}        label="Commit Days" color="var(--indigo-hov)" />
        </div>
      </div>

      {/* ── Progress ─────────────────────────── */}
      <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
          <Activity size={13} color="var(--indigo)" />
          <span className="section-label">Interview Requirements</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Questions */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
              <span style={{ color: 'var(--text-2)' }}>Questions asked</span>
              <span style={{
                fontWeight: 700,
                color: questionsAsked >= 8 ? 'var(--green)' : 'var(--text-1)',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
              }}>
                {questionsAsked} / 8
              </span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{
                width: `${qPct}%`,
                background: questionsAsked >= 8
                  ? 'var(--green)'
                  : 'linear-gradient(90deg, var(--indigo), var(--violet))',
              }} />
            </div>
          </div>

          {/* Days */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
              <span style={{ color: 'var(--text-2)' }}>Days covered</span>
              <span style={{
                fontWeight: 700,
                color: (daysCovered?.size ?? 0) >= 4 ? 'var(--green)' : 'var(--text-1)',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
              }}>
                {daysCovered?.size ?? 0} / 4
              </span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{
                width: `${dPct}%`,
                background: (daysCovered?.size ?? 0) >= 4 ? 'var(--green)' : 'var(--amber)',
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Target Topics ─────────────────────── */}
      <div style={{ padding: '16px 18px', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <Target size={13} color="var(--indigo)" />
          <span className="section-label">Evaluation Topics</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {targetDays.map((td) => {
            const covered = daysCovered?.has(td.day);
            return (
              <div
                key={td.day}
                className="glass"
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--r-md)',
                  borderColor: covered ? 'rgba(52,211,153,0.3)' : 'var(--border)',
                  background: covered ? 'rgba(52,211,153,0.06)' : 'var(--bg-card)',
                  transition: 'all 0.3s var(--ease)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 1 }}>Day {td.day}</div>
                    <div style={{
                      fontSize: 12, fontWeight: 600, color: 'var(--text-1)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {td.title}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    {covered && (
                      <CheckCircle size={13} color="var(--green)" style={{ flexShrink: 0 }} />
                    )}
                    <span className={td.passed ? 'chip chip-green' : 'chip chip-red'}>
                      {td.passed ? 'Passed' : td.skipped ? 'Skipped' : 'Failed'}
                    </span>
                  </div>
                </div>

                {td.attempts > 1 && (
                  <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>
                    {td.attempts} attempts
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Mission breakdown ─────────────────── */}
      <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <BookOpen size={13} color="var(--indigo)" />
          <span className="section-label">Mission Log</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {missions.map((m, i) => (
            <div key={i} title={`Day ${m.day}: ${m.title}`} style={{
              width: 8, height: 8,
              borderRadius: 2,
              background: m.passed ? 'var(--green)' : m.skipped ? 'var(--text-3)' : 'var(--red)',
              opacity: 0.8,
              cursor: 'default',
              transition: 'transform 0.1s',
            }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 10, color: 'var(--text-3)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 6, height: 6, borderRadius: 1, background: 'var(--green)', display: 'inline-block' }} />
            Passed ({passedCount})
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 6, height: 6, borderRadius: 1, background: 'var(--red)', display: 'inline-block' }} />
            Gaps ({skippedCount})
          </span>
        </div>
      </div>
    </aside>
  );
}
