import React from 'react';
import { BookOpen, Target, CheckCircle, Activity, Clock, XCircle, AlertTriangle, MinusCircle, HelpCircle } from 'lucide-react';

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

/* Map interview judgment to display config */
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
  const { member, missions, signals } = candidate;
  const passedCount = missions.filter(m => m.passed).length;
  const skippedCount = missions.filter(m => m.skipped).length;
  const failedCount = missions.filter(m => m.passed === false && !m.skipped).length;
  const initials = member.name.split(' ').map(n => n[0]).join('');

  const qPct = Math.min(100, (questionsAsked / 8) * 100);
  const dPct = Math.min(100, ((daysCovered?.size ?? 0) / 4) * 100);

  // Count interview results
  const resultValues = Object.values(topicResults);
  const strongCount = resultValues.filter(j => ['strong', 'adequate', 'on_topic_strong'].includes(j)).length;
  const weakCount = resultValues.filter(j => ['vague', 'on_topic_vague'].includes(j)).length;
  const failCount = resultValues.filter(j => ['off_topic', 'wrong', 'skipped', 'too_brief'].includes(j)).length;

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

      {/* Evaluation Topics — NOW shows INTERVIEW results, not mission history */}
      <div style={{ padding: '14px 18px', flex: 1, background: 'rgba(255,255,255,0.005)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Target size={12} color="var(--indigo)" />
          <span className="section-label">Evaluation Topics</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {targetDays.map(td => {
            const covered = daysCovered?.has(td.day);
            const interviewResult = topicResults[td.day];
            const judgmentInfo = interviewResult
              ? getJudgmentDisplay(interviewResult)
              : (covered ? { label: 'In Progress', chipClass: 'chip-muted', Icon: HelpCircle, color: 'var(--text-3)' } : null);

            return (
              <div key={td.day} className="glass" style={{
                padding: '9px 11px', borderRadius: 'var(--r-md)',
                borderColor: interviewResult
                  ? (['strong', 'adequate', 'on_topic_strong'].includes(interviewResult) ? 'rgba(52,211,153,0.25)' : ['vague', 'on_topic_vague'].includes(interviewResult) ? 'rgba(251,191,36,0.25)' : 'rgba(239,68,68,0.25)')
                  : 'var(--border)',
                background: interviewResult
                  ? (['strong', 'adequate', 'on_topic_strong'].includes(interviewResult) ? 'rgba(52,211,153,0.04)' : ['vague', 'on_topic_vague'].includes(interviewResult) ? 'rgba(251,191,36,0.04)' : 'rgba(239,68,68,0.04)')
                  : 'var(--bg-card)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-3)' }}>Day {td.day}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{td.title}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    {judgmentInfo && (
                      <>
                        <judgmentInfo.Icon size={12} color={judgmentInfo.color} />
                        <span className={`chip ${judgmentInfo.chipClass}`} style={{ fontSize: 9, padding: '1px 7px' }}>
                          {judgmentInfo.label}
                        </span>
                      </>
                    )}
                    {!judgmentInfo && !covered && (
                      <span className="chip chip-muted" style={{ fontSize: 9, padding: '1px 7px' }}>
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interview Score Summary */}
      {resultValues.length > 0 && (
        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <BookOpen size={12} color="var(--indigo)" />
            <span className="section-label">Interview Score</span>
          </div>
          <div style={{ display: 'flex', gap: 10, fontSize: 10, color: 'var(--text-3)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ width: 6, height: 6, borderRadius: 2, background: 'var(--green)', display: 'inline-block' }} /> {strongCount} strong
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ width: 6, height: 6, borderRadius: 2, background: 'var(--amber)', display: 'inline-block' }} /> {weakCount} weak
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ width: 6, height: 6, borderRadius: 2, background: 'var(--red)', display: 'inline-block' }} /> {failCount} failed
            </span>
          </div>
          {/* Score bar */}
          {resultValues.length > 0 && (
            <div style={{ display: 'flex', height: 4, borderRadius: 2, overflow: 'hidden', marginTop: 8, gap: 1 }}>
              {strongCount > 0 && <div style={{ flex: strongCount, background: 'var(--green)', borderRadius: 1 }} />}
              {weakCount > 0 && <div style={{ flex: weakCount, background: 'var(--amber)', borderRadius: 1 }} />}
              {failCount > 0 && <div style={{ flex: failCount, background: 'var(--red)', borderRadius: 1 }} />}
            </div>
          )}
        </div>
      )}

      {/* Mission heatmap — historical context only */}
      <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <BookOpen size={12} color="var(--text-3)" />
          <span className="section-label" style={{ color: 'var(--text-3)' }}>Mission History</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {missions.map((m, i) => (
            <div key={i} title={`Day ${m.day}: ${m.title}`} style={{
              width: 7, height: 7, borderRadius: 2,
              background: m.passed ? 'var(--green)' : m.skipped ? 'var(--text-3)' : 'var(--red)',
              opacity: 0.5,
            }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 6, fontSize: 9, color: 'var(--text-3)', opacity: 0.7 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 5, height: 5, borderRadius: 1, background: 'var(--green)', display: 'inline-block', opacity: 0.5 }} /> {passedCount} passed
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 5, height: 5, borderRadius: 1, background: 'var(--red)', display: 'inline-block', opacity: 0.5 }} /> {failedCount + skippedCount} gaps
          </span>
        </div>
      </div>
    </aside>
  );
}
