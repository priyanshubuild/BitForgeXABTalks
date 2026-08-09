import React from 'react';
import { Target, CheckCircle, Activity, Clock, XCircle, AlertTriangle, MinusCircle, HelpCircle } from 'lucide-react';

function CircularProgress({ value, max, size = 48, stroke = 3 }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(value / max, 1);
  const offset = circumference * (1 - pct);

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="var(--border)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="var(--text-1)" strokeWidth={stroke}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s var(--ease-out)', opacity: 0.8 }} />
    </svg>
  );
}

function StatRing({ value, max, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ position: 'relative' }}>
        <CircularProgress value={value} max={max} />
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: 'var(--text-1)', fontFamily: 'var(--font-mono)',
        }}>
          {value}
        </div>
      </div>
      <span style={{ fontSize: 9, fontWeight: 500, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
    </div>
  );
}

function getJudgmentDisplay(judgment) {
  switch (judgment) {
    case 'strong':
    case 'on_topic_strong':
      return { label: 'Strong', chipClass: 'chip-green', Icon: CheckCircle, color: 'var(--green)' };
    case 'adequate':
      return { label: 'Adequate', chipClass: 'chip-green', Icon: CheckCircle, color: 'var(--green)' };
    case 'vague':
    case 'on_topic_vague':
      return { label: 'Weak', chipClass: 'chip-amber', Icon: AlertTriangle, color: 'var(--amber)' };
    case 'off_topic':
      return { label: 'Off-Topic', chipClass: 'chip-red', Icon: XCircle, color: 'var(--red)' };
    case 'wrong':
      return { label: 'Wrong', chipClass: 'chip-red', Icon: XCircle, color: 'var(--red)' };
    case 'skipped':
      return { label: 'Skipped', chipClass: 'chip-red', Icon: MinusCircle, color: 'var(--red)' };
    case 'too_brief':
      return { label: 'Too Brief', chipClass: 'chip-red', Icon: MinusCircle, color: 'var(--red)' };
    default:
      return { label: 'Pending', chipClass: 'chip-muted', Icon: HelpCircle, color: 'var(--text-3)' };
  }
}

export default function CandidateSidebar({ candidate, targetDays, questionsAsked, daysCovered, topicResults = {} }) {
  if (!candidate) return null;
  const { member, missions } = candidate;
  const initials = member.name.split(' ').map(n => n[0]).join('');

  const totalMissions = missions.length;
  const passedMissions = missions.filter(m => m.passed).length;
  const firstTryMissions = missions.filter(m => m.passed && (m.attempts ?? 1) === 1).length;
  const skippedMissions = missions.filter(m => m.skipped).length;

  const questionsShown = Math.max(0, (questionsAsked ?? 0) - 1);
  const daysShown = Math.max(0, (daysCovered?.size ?? 0) - 1);
  const reviewedShown = Object.keys(topicResults).length;

  const qPct = Math.min(100, (questionsShown / 8) * 100);
  const dPct = Math.min(100, (daysShown / Math.max(1, Math.min(targetDays.length || 4, 4))) * 100);

  const resultValues = Object.values(topicResults);
  const strongCount = resultValues.filter(j => ['strong', 'adequate', 'on_topic_strong'].includes(j)).length;
  const weakCount = resultValues.filter(j => ['vague', 'on_topic_vague'].includes(j)).length;
  const failCount = resultValues.filter(j => ['off_topic', 'wrong', 'skipped', 'too_brief'].includes(j)).length;

  return (
    <aside className="sidebar-panel" style={{
      width: 272, background: 'var(--bg-base)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', overflowY: 'auto', flexShrink: 0,
    }}>
      {/* Profile Snapshot */}
      <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 12 }}>
          Profile Snapshot
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5, marginBottom: 14 }}>
          Loaded from candidates.json. This block summarizes Sarah's historical cohort record, not the current interview session.
        </p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 'var(--r-full)',
            background: 'var(--text-1)', color: 'var(--bg-base)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 14, flexShrink: 0,
          }}>{initials}</div>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.01em' }}>{member.name}</h3>
            <p style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 500, marginTop: 1 }}>{member.jobRole}</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 3, fontSize: 10, color: 'var(--text-3)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={9} /> {member.yearsExperience}yr</span>
              <span>·</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.education}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <StatRing value={passedMissions} max={totalMissions || 1} label="Passed" />
          <StatRing value={firstTryMissions} max={totalMissions || 1} label="1st Try" />
          <StatRing value={skippedMissions} max={totalMissions || 1} label="Skipped" />
        </div>
      </div>

      {/* Live Session */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
          <Activity size={11} color="var(--text-3)" />
          <span className="section-label">Live Session Progress</span>
        </div>
        {[
          { label: 'Questions Asked', val: questionsShown, max: 8, pct: qPct },
          { label: 'Topics Covered', val: daysShown, max: Math.max(1, Math.min(targetDays.length || 4, 4)), pct: dPct },
          { label: 'Answers Reviewed', val: reviewedShown, max: 8, pct: Math.min(100, (reviewedShown / 8) * 100) },
        ].map((item, i) => (
          <div key={i} style={{ marginBottom: i === 0 ? 12 : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 5 }}>
              <span style={{ color: 'var(--text-3)' }}>{item.label}</span>
              <span style={{ fontWeight: 600, color: item.val >= item.max ? 'var(--green)' : 'var(--text-2)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                {item.val}/{item.max}
              </span>
            </div>
            <div className="progress-track" style={{ height: 3 }}>
              <div className="progress-fill" style={{
                width: `${item.pct}%`,
                background: item.val >= item.max ? 'var(--green)' : 'var(--text-1)',
                opacity: item.val >= item.max ? 1 : 0.4,
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Evaluation Topics */}
      <div style={{ padding: '16px 20px', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <Target size={11} color="var(--text-3)" />
          <span className="section-label">Topics</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {targetDays.map(td => {
            const interviewResult = topicResults[td.day];
            const judgmentInfo = interviewResult
              ? getJudgmentDisplay(interviewResult)
              : { label: 'Pending', chipClass: 'chip-muted', Icon: HelpCircle, color: 'var(--text-3)' };

            return (
              <div key={td.day} style={{
                padding: '10px 12px', borderRadius: 'var(--r-md)',
                border: '1px solid var(--border)',
                background: interviewResult
                  ? (['strong', 'adequate', 'on_topic_strong'].includes(interviewResult) ? 'rgba(48,209,88,0.04)' : ['vague', 'on_topic_vague'].includes(interviewResult) ? 'rgba(255,214,10,0.04)' : 'rgba(255,69,58,0.04)')
                  : 'transparent',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>Day {td.day}</div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.01em' }}>{td.title}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <judgmentInfo.Icon size={11} color={judgmentInfo.color} />
                    <span className={`chip ${judgmentInfo.chipClass}`} style={{ fontSize: 9, padding: '1px 7px' }}>
                      {judgmentInfo.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Score Summary */}
      {resultValues.length > 0 && (
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
          <span className="section-label" style={{ display: 'block', marginBottom: 8 }}>Score</span>
          <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-3)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: 2, background: 'var(--green)', display: 'inline-block' }} />
              {strongCount}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: 2, background: 'var(--amber)', display: 'inline-block' }} />
              {weakCount}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: 2, background: 'var(--red)', display: 'inline-block' }} />
              {failCount}
            </span>
          </div>
          {resultValues.length > 0 && (
            <div style={{ display: 'flex', height: 3, borderRadius: 2, overflow: 'hidden', marginTop: 8, gap: 1 }}>
              {strongCount > 0 && <div style={{ flex: strongCount, background: 'var(--green)', borderRadius: 1 }} />}
              {weakCount > 0 && <div style={{ flex: weakCount, background: 'var(--amber)', borderRadius: 1 }} />}
              {failCount > 0 && <div style={{ flex: failCount, background: 'var(--red)', borderRadius: 1 }} />}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
