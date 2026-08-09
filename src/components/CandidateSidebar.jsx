import React from 'react';
import { Target, CheckCircle, Activity, Clock, XCircle, AlertTriangle, MinusCircle, HelpCircle } from 'lucide-react';

function CircularProgress({ value, max, size = 48, stroke = 3 }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(value / max, 1);
  const offset = circumference * (1 - pct);

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="var(--border)" strokeWidth={stroke} />
      <circle
        cx={size/2} cy={size/2} r={radius} fill="none"
        stroke="var(--blue)" strokeWidth={stroke}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s var(--ease-out)' }}
      />
    </svg>
  );
}

function StatRing({ value, max, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative' }}>
        <CircularProgress value={value} max={max} />
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 600, color: 'var(--text-1)', fontFamily: 'var(--font-mono)',
        }}>
          {value}
        </div>
      </div>
      <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
    </div>
  );
}

function getResultJudgment(result) {
  if (!result) return null;
  if (typeof result === 'string') return result;
  return result.judgment;
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
      return { label: 'Needs Depth', chipClass: 'chip-amber', Icon: AlertTriangle, color: 'var(--amber)' };
    case 'insufficient':
    case 'too_brief':
      return { label: 'Insufficient', chipClass: 'chip-red', Icon: MinusCircle, color: 'var(--red)' };
    case 'off_topic':
      return { label: 'Off-Topic', chipClass: 'chip-red', Icon: XCircle, color: 'var(--red)' };
    case 'wrong':
      return { label: 'Incorrect', chipClass: 'chip-red', Icon: XCircle, color: 'var(--red)' };
    case 'skipped':
      return { label: 'Skipped', chipClass: 'chip-red', Icon: MinusCircle, color: 'var(--red)' };
    default:
      return { label: 'Pending', chipClass: 'chip-muted', Icon: HelpCircle, color: 'var(--text-3)' };
  }
}

function missionStatusLabel(td) {
  if (td.skipped) return { text: 'Skipped in cohort', color: 'var(--red)' };
  if (td.passed === false) return { text: 'Not passed', color: 'var(--red)' };
  if ((td.attempts ?? 1) >= 3) return { text: `${td.attempts} attempts`, color: 'var(--amber)' };
  if (td.attempts === 1) return { text: '1st try pass', color: 'var(--green)' };
  return { text: `Passed (${td.attempts ?? 1}x)`, color: 'var(--text-3)' };
}

export default function CandidateSidebar({ candidate, targetDays, questionsAsked, daysCovered, topicResults = {}, currentTopicIdx = 0, isComplete = false }) {
  if (!candidate) return null;
  const { member, missions } = candidate;
  const initials = member.name.split(' ').map(n => n[0]).join('');

  const totalMissions = missions.length;
  const passedMissions = missions.filter(m => m.passed).length;
  const firstTryMissions = missions.filter(m => m.passed && (m.attempts ?? 1) === 1).length;
  const skippedMissions = missions.filter(m => m.skipped).length;

  const questionsShown = questionsAsked ?? 0;
  const daysShown = daysCovered?.size ?? 0;
  const reviewedShown = Object.keys(topicResults).length;

  const qPct = Math.min(100, (questionsShown / 8) * 100);
  const dPct = Math.min(100, (daysShown / Math.max(1, Math.min(targetDays.length || 4, 4))) * 100);

  const resultValues = Object.values(topicResults);
  const strongCount = resultValues.filter(r => ['strong', 'adequate', 'on_topic_strong'].includes(getResultJudgment(r))).length;
  const weakCount = resultValues.filter(r => ['vague', 'on_topic_vague'].includes(getResultJudgment(r))).length;
  const failCount = resultValues.filter(r => ['off_topic', 'wrong', 'skipped', 'too_brief', 'insufficient'].includes(getResultJudgment(r))).length;

  return (
    <aside className="sidebar-panel">
      <div style={{ padding: '20px 20px 22px', borderBottom: '1px solid var(--border)' }}>
        <div className="section-label" style={{ marginBottom: 14 }}>Profile</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
          <div className="avatar-user" style={{ width: 44, height: 44, fontSize: 14 }}>{initials}</div>
          <div style={{ minWidth: 0 }}>
            <h3 style={{
              fontSize: 17, fontWeight: 600, color: 'var(--text-1)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              letterSpacing: '-0.022em',
            }}>
              {member.name}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>{member.jobRole}</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: 12, color: 'var(--text-3)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={10} /> {member.yearsExperience}yr
              </span>
              <span style={{ opacity: 0.35 }}>·</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {member.education}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <StatRing value={passedMissions} max={totalMissions || 1} label="Passed" />
          <StatRing value={firstTryMissions} max={totalMissions || 1} label="1st Try" />
          <StatRing value={skippedMissions} max={totalMissions || 1} label="Skipped" />
        </div>
      </div>

      <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 16 }}>
          <Activity size={12} color="var(--text-3)" />
          <span className="section-label">Live Session</span>
        </div>
        {[
          { label: 'Questions Asked', val: questionsShown, max: 8, pct: qPct },
          { label: 'Topics Covered', val: daysShown, max: Math.max(1, Math.min(targetDays.length || 4, 4)), pct: dPct },
          { label: 'Answers Reviewed', val: reviewedShown, max: 8, pct: Math.min(100, (reviewedShown / 8) * 100) },
        ].map((item, i) => (
          <div key={i} style={{ marginBottom: i < 2 ? 14 : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
              <span style={{ color: 'var(--text-2)' }}>{item.label}</span>
              <span style={{ fontWeight: 600, color: 'var(--text-1)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                {item.val}/{item.max}
              </span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${item.pct}%`, opacity: item.val >= item.max ? 1 : 0.45 }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '18px 20px', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
          <Target size={12} color="var(--text-3)" />
          <span className="section-label">Topics</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {targetDays.map((td, idx) => {
            const interviewResult = topicResults[String(td.day)] || topicResults[td.day];
            const judgmentKey = getResultJudgment(interviewResult);
            const judgmentInfo = judgmentKey
              ? getJudgmentDisplay(judgmentKey)
              : { label: 'Pending', chipClass: 'chip-muted', Icon: HelpCircle, color: 'var(--text-3)' };
            const isActive = idx === currentTopicIdx && !isComplete;
            const cohortStatus = missionStatusLabel(td);

            return (
              <div
                key={td.day}
                style={{
                  padding: '12px 14px', borderRadius: 'var(--r-md)',
                  border: isActive ? '1px solid var(--blue)' : '1px solid var(--border)',
                  background: isActive ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                  boxShadow: isActive ? '0 0 0 1px rgba(59,130,246,0.15)' : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>Day {td.day}</span>
                      {isActive && (
                        <span className="chip chip-blue" style={{ fontSize: 9, padding: '1px 6px' }}>NOW</span>
                      )}
                    </div>
                    <div style={{
                      fontSize: 14, fontWeight: 500, color: 'var(--text-1)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      letterSpacing: '-0.01em', marginTop: 2,
                    }}>
                      {td.title}
                    </div>
                    {td.probe_reason && (
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4, lineHeight: 1.4 }}>
                        {td.probe_reason}
                      </div>
                    )}
                    {td.module && (
                      <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2, opacity: 0.8 }}>
                        {td.module}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <judgmentInfo.Icon size={12} color={judgmentInfo.color} />
                      <span className={`chip ${judgmentInfo.chipClass}`} style={{ fontSize: 10, padding: '2px 8px' }}>
                        {interviewResult?.verdict_label || judgmentInfo.label}
                      </span>
                    </div>
                    <span style={{ fontSize: 10, color: cohortStatus.color }}>{cohortStatus.text}</span>
                  </div>
                </div>
                {interviewResult?.reasoning && (
                  <div style={{
                    fontSize: 11, color: 'var(--text-3)', marginTop: 8, lineHeight: 1.45,
                    borderTop: '1px solid var(--border)', paddingTop: 8,
                  }}>
                    {interviewResult.reasoning}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {resultValues.length > 0 && (
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
          <span className="section-label" style={{ display: 'block', marginBottom: 10 }}>Score</span>
          <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-2)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: 2, background: 'var(--green)', display: 'inline-block' }} />
              {strongCount}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: 2, background: 'var(--amber)', display: 'inline-block' }} />
              {weakCount}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: 2, background: 'var(--red)', display: 'inline-block' }} />
              {failCount}
            </span>
          </div>
          <div style={{ display: 'flex', height: 4, borderRadius: 2, overflow: 'hidden', marginTop: 10, gap: 2 }}>
            {strongCount > 0 && <div style={{ flex: strongCount, background: 'var(--green)', borderRadius: 2 }} />}
            {weakCount > 0 && <div style={{ flex: weakCount, background: 'var(--amber)', borderRadius: 2 }} />}
            {failCount > 0 && <div style={{ flex: failCount, background: 'var(--red)', borderRadius: 2 }} />}
          </div>
        </div>
      )}
    </aside>
  );
}
