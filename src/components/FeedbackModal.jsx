import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, AlertTriangle, ArrowRight, Copy, RefreshCw, X } from 'lucide-react';

export default function FeedbackModal({ feedback, candidate, onRestart, onClose }) {
  const [toast, setToast] = useState('');

  useEffect(() => {
    try {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 }, colors: ['#0071e3', '#ffffff', '#a1a1a6'] });
      setTimeout(() => confetti({ particleCount: 25, spread: 100, origin: { y: 0.5 }, colors: ['#0071e3', '#d1d1d6'] }), 300);
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  if (!feedback) return null;

  const copyMarkdown = async () => {
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
    try {
      await navigator.clipboard.writeText(md);
      setToast('Report copied to clipboard');
    } catch {
      setToast('Could not copy — please try again');
    }
  };

  const Section = ({ icon: Icon, title, color, items }) => (
    <div style={{
      padding: '20px 22px', borderRadius: 'var(--r-lg)',
      border: '1px solid var(--border)', background: 'var(--bg-surface)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <Icon size={15} color={color} strokeWidth={1.8} />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>{title}</span>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
          {items.length}
        </span>
      </div>
      <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingLeft: 4, listStyle: 'none' }}>
        {items.map((item, i) => (
          <li key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            fontSize: 15, color: 'var(--text-2)', lineHeight: 1.55,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 9, opacity: 0.6 }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <>
      <div className="modal-overlay feedback-overlay" onClick={onClose} role="presentation">
        <div
          className="modal-box glass-heavy feedback-box"
          onClick={e => e.stopPropagation()}
          role="dialog"
          aria-labelledby="feedback-title"
          aria-modal="true"
        >
          <div className="feedback-header" style={{
            padding: '22px 28px', borderBottom: '1px solid var(--border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <h2 id="feedback-title" style={{
                fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600,
                color: 'var(--text-1)', letterSpacing: '-0.022em',
              }}>
                Evaluation Report
              </h2>
              <p style={{ fontSize: 14, color: 'var(--text-3)', marginTop: 4 }}>
                {candidate?.member?.name} · {candidate?.member?.jobRole}
              </p>
            </div>
            <button className="icon-btn" onClick={onClose} aria-label="Close report">
              <X size={16} />
            </button>
          </div>

          <div className="feedback-body" style={{
            flex: 1, overflowY: 'auto', padding: '22px 28px',
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            <div style={{
              padding: '20px 22px', borderRadius: 'var(--r-lg)',
              border: '1px solid var(--border)', background: 'var(--bg-surface)',
              borderLeft: '3px solid var(--blue)',
            }}>
              <p className="section-label" style={{ marginBottom: 8 }}>Summary</p>
              <p style={{ fontSize: 17, lineHeight: 1.55, color: 'var(--text-1)' }}>{feedback.summary}</p>
            </div>

            <div className="feedback-grid">
              <Section icon={CheckCircle2} title="Strengths" color="var(--green)" items={feedback.strengths || []} />
              <Section icon={AlertTriangle} title="Gaps" color="var(--amber)" items={feedback.gaps || []} />
            </div>

            <Section icon={ArrowRight} title="Next Steps" color="var(--blue)" items={feedback.next || []} />
          </div>

          <div className="feedback-footer" style={{
            padding: '16px 28px', borderTop: '1px solid var(--border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
          }}>
            <button className="btn-ghost" onClick={copyMarkdown}>
              <Copy size={14} /> Copy Report
            </button>
            <button className="btn-primary" onClick={onRestart}>
              <RefreshCw size={14} /> New Interview
            </button>
          </div>
        </div>
      </div>

      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}
