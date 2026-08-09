import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, AlertTriangle, ArrowRight, Copy, RefreshCw, X } from 'lucide-react';

export default function FeedbackModal({ feedback, candidate, onRestart, onClose }) {
  useEffect(() => {
    try {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 }, colors: ['#ffffff', '#a1a1a6', '#6e6e73'] });
      setTimeout(() => confetti({ particleCount: 30, spread: 100, origin: { y: 0.5 }, colors: ['#ffffff', '#d1d1d6'] }), 300);
    } catch {}
  }, []);

  if (!feedback) return null;

  const copyMarkdown = () => {
    const md = `# Interview Evaluation — ${candidate?.member?.name}
**Role:** ${candidate?.member?.jobRole}  
**Experience:** ${candidate?.member?.yearsExperience} years  
**Education:** ${candidate?.member?.education}

---

## Summary
${feedback.summary}

## Strengths
${(feedback.strengths || []).map(s => `- ${s}`).join('\n')}

## Areas for Growth
${(feedback.gaps || []).map(g => `- ${g}`).join('\n')}

## Next Steps
${(feedback.next || []).map(n => `- ${n}`).join('\n')}
`;
    navigator.clipboard.writeText(md);
    alert('Report copied to clipboard');
  };

  const Section = ({ icon: Icon, title, color, items }) => (
    <div style={{
      padding: '16px 18px', borderRadius: 'var(--r-md)',
      border: '1px solid var(--border)', background: 'transparent',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Icon size={13} color={color} strokeWidth={1.8} />
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
          {items.length}
        </span>
      </div>
      <ul style={{ display: 'flex', flexDirection: 'column', gap: 7, paddingLeft: 4 }}>
        {items.map((item, i) => (
          <li key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55,
          }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 7, opacity: 0.6 }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="modal-overlay feedback-overlay">
      <div className="modal-box glass-heavy feedback-box">
        {/* Header */}
        <div className="feedback-header" style={{
          padding: '20px 24px', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
              Evaluation Report
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
              {candidate?.member?.name} · {candidate?.member?.jobRole}
            </p>
          </div>
          <button className="icon-btn" onClick={onClose} style={{ borderRadius: 'var(--r-full)', width: 30, height: 30 }}>
            <X size={13} />
          </button>
        </div>

        {/* Body */}
        <div className="feedback-body" style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Summary */}
          <div style={{
            padding: '16px 18px', borderRadius: 'var(--r-md)',
            border: '1px solid var(--border)', borderLeft: '3px solid var(--text-3)',
          }}>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)', marginBottom: 8 }}>
              Summary
            </p>
            <p style={{ fontSize: 13.5, lineHeight: 1.65, color: 'var(--text-1)' }}>{feedback.summary}</p>
          </div>

          {/* Strengths + Gaps */}
          <div className="feedback-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Section icon={CheckCircle2} title="Strengths" color="var(--green)" items={feedback.strengths || []} />
            <Section icon={AlertTriangle} title="Gaps" color="var(--amber)" items={feedback.gaps || []} />
          </div>

          {/* Next Steps */}
          <Section icon={ArrowRight} title="Next Steps" color="var(--text-2)" items={feedback.next || []} />
        </div>

        {/* Footer */}
        <div className="feedback-footer" style={{
          padding: '14px 24px', borderTop: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <button className="btn-ghost" onClick={copyMarkdown} style={{ fontSize: 12 }}>
            <Copy size={12} /> Copy
          </button>
          <button className="btn-primary" onClick={onRestart} style={{ fontSize: 12, padding: '8px 18px' }}>
            <RefreshCw size={12} /> New Interview
          </button>
        </div>
      </div>
    </div>
  );
}
