import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, AlertTriangle, ArrowRight, Award, Copy, RefreshCw, X } from 'lucide-react';

export default function FeedbackModal({ feedback, candidate, onRestart, onClose }) {
  useEffect(() => {
    try {
      confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
    } catch (e) {}
  }, []);

  if (!feedback) return null;

  const copyMarkdown = () => {
    const md = `# Evaluation Report: ${candidate?.member?.name}
**Role:** ${candidate?.member?.jobRole}

## Summary
${feedback.summary}

## Key Strengths
${(feedback.strengths || []).map(s => `- ${s}`).join('\n')}

## Areas for Growth
${(feedback.gaps || []).map(g => `- ${g}`).join('\n')}

## Recommended Next Steps
${(feedback.next || []).map(n => `- ${n}`).join('\n')}
`;
    navigator.clipboard.writeText(md);
    alert('Report copied in Markdown format!');
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(9, 12, 21, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '700px',
        maxHeight: '90vh',
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid var(--primary)'
      }}>
        <div style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Award size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>Evaluation Report</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Candidate: <strong>{candidate?.member?.name}</strong>
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid var(--primary)' }}>
            <h3 style={{ fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '6px' }}>Summary</h3>
            <p style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>{feedback.summary}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="glass-card" style={{ padding: '16px' }}>
              <h4 style={{ fontSize: '0.85rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <CheckCircle2 size={16} /> Key Strengths
              </h4>
              <ul style={{ paddingLeft: '18px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {(feedback.strengths || []).map((s, idx) => <li key={idx}>{s}</li>)}
              </ul>
            </div>

            <div className="glass-card" style={{ padding: '16px' }}>
              <h4 style={{ fontSize: '0.85rem', color: '#fb7185', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <AlertTriangle size={16} /> Growth Areas
              </h4>
              <ul style={{ paddingLeft: '18px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {(feedback.gaps || []).map((g, idx) => <li key={idx}>{g}</li>)}
              </ul>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '16px' }}>
            <h4 style={{ fontSize: '0.85rem', color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <ArrowRight size={16} /> Recommended Next Steps
            </h4>
            <ul style={{ paddingLeft: '18px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {(feedback.next || []).map((n, idx) => <li key={idx}>{n}</li>)}
            </ul>
          </div>
        </div>

        <div style={{ padding: '16px 24px', background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={copyMarkdown} style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
            <Copy size={14} /> Copy Markdown
          </button>
          <button onClick={onRestart} style={{ background: 'var(--primary)', border: 'none', color: '#fff', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
            <RefreshCw size={14} /> New Session
          </button>
        </div>
      </div>
    </div>
  );
}
