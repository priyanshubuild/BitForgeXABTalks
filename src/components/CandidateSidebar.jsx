import React from 'react';
import { BookOpen, Target, CheckCircle, Activity, Clock, TrendingUp, AlertTriangle, SkipForward } from 'lucide-react';

function CircularProgress({ value, max, size = 52, stroke = 4, color }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(value / max, 1);
  const offset = circumference * (1 - pct);

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="var(--border)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s var(--ease)' }} />
    </svg>
  );
}

function StatRing({ value, max, label, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ position: 'relative' }}>
        <CircularProgress value={value} max={max} color={color} />
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 800, color: 'var(--text-1)', fontFamily: 'var(--font-mono)',
        }}>
          {value}
        </div>
      </div>
      <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
    </div>
  );
}

export default function CandidateSidebar({ candidate, targetDays, questionsAsked, daysCovered }) {
  if (!candidate) return null;
  const { member, missions, signals } = candidate;
  const passedCount = missions.filter(m => m.passed).length;
  const skippedCount = missions.filter(m => m.skipped).length;
  const failedCount = missions.filter(m => m.passed === false && !m.skipped).length;
  const initials = member.name.split(' ').map(n => n[0]).join('');

  const qPct = Math.min(100, (questionsAsked / 8) * 100);
  const dPct = Math.min(100, ((daysCovered?.size ?? 0) / 4) * 100);

  return (
    <aside style={{
      width: 280, background: 'var(--bg-base)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', overflowY: 'auto', flexShrink: 0,
    }}>
      {/* Candidate Card */}
      <div style={{ padding: 18, borderBottom: '1px solid var(--border)', background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 'var(--r-lg)',
            background: 'linear-gradient(135deg, var(--indigo), var(--violet))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: 15, flexShrink: 0,
          }}>{initials}</div>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.name}</h3>
            <p style={{ fontSize: 11, color: 'var(--indigo-hov)', fontWeight: 600, marginTop: 1 }}>{member.jobRole}</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 3, fontSize: 10, color: 'var(--text-3)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={9} /> {member.yearsExperience}yr</span>
              <span>·</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.education}</span>
            </div>
          </div>
        </div>

        {/* Circular stats */}
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <StatRing value={signals.missionsCompleted} max={31} label="Done" color="var(--indigo)" />
          <StatRing value={signals.missionsFirstTry} max={31} label="1st Try" color="var(--green)" />
          <StatRing value={signals.commitDays} max={31} label="Active" color="var(--cyan)" />
        </div>
      </div>

      {/* Progress */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <Activity size={12} color="var(--indigo)" />
          <span className="section-label">Interview Progress</span>
        </div>
        {[
          { label: 'Questions', val: questionsAsked, max: 8, pct: qPct, doneColor: 'var(--green)', progressBg: 'linear-gradient(90deg, var(--indigo), var(--violet))' },
          { label: 'Days Covered', val: daysCovered?.size ?? 0, max: 4, pct: dPct, doneColor: 'var(--green)', progressBg: 'var(--amber)' },
        ].map((item, i) => (
          <div key={i} style={{ marginBottom: i === 0 ? 10 : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
              <span style={{ color: 'var(--text-2)' }}>{item.label}</span>
              <span style={{ fontWeight: 700, color: item.val >= item.max ? item.doneColor : 'var(--text-1)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                {item.val} / {item.max}
              </span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${item.pct}%`, background: item.val >= item.max ? item.doneColor : item.progressBg }} />
            </div>
          </div>
        ))}
      </div>

      {/* Target Topics */}
      <div style={{ padding: '14px 18px', flex: 1, background: 'rgba(255,255,255,0.005)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Target size={12} color="var(--indigo)" />
          <span className="section-label">Evaluation Topics</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {targetDays.map(td => {
            const covered = daysCovered?.has(td.day);
            return (
              <div key={td.day} className="glass" style={{
                padding: '9px 11px', borderRadius: 'var(--r-md)',
                borderColor: covered ? 'rgba(52,211,153,0.25)' : 'var(--border)',
                background: covered ? 'rgba(52,211,153,0.04)' : 'var(--bg-card)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-3)' }}>Day {td.day}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{td.title}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    {covered && <CheckCircle size={12} color="var(--green)" />}
                    <span className={td.passed ? 'chip chip-green' : td.skipped ? 'chip chip-amber' : 'chip chip-red'} style={{ fontSize: 9, padding: '1px 7px' }}>
                      {td.passed ? 'Pass' : td.skipped ? 'Skip' : 'Fail'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mission heatmap */}
      <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <BookOpen size={12} color="var(--indigo)" />
          <span className="section-label">Mission Log</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {missions.map((m, i) => (
            <div key={i} title={`Day ${m.day}: ${m.title}`} style={{
              width: 7, height: 7, borderRadius: 2,
              background: m.passed ? 'var(--green)' : m.skipped ? 'var(--text-3)' : 'var(--red)',
              opacity: 0.8,
            }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 6, fontSize: 9, color: 'var(--text-3)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 5, height: 5, borderRadius: 1, background: 'var(--green)', display: 'inline-block' }} /> {passedCount} passed
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 5, height: 5, borderRadius: 1, background: 'var(--red)', display: 'inline-block' }} /> {failedCount + skippedCount} gaps
          </span>
        </div>
      </div>
    </aside>
  );
}
