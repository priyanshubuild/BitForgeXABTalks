import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, AlertTriangle, ArrowRight, Award, Copy, RefreshCw, X, Star } from 'lucide-react';

export default function FeedbackModal({ feedback, candidate, onRestart, onClose }) {
  useEffect(() => {
    try {
      confetti({ particleCount: 100, spread: 75, origin: { y: 0.6 } });
      setTimeout(() => confetti({ particleCount: 50, spread: 120, origin: { y: 0.5 } }), 300);
    } catch {}
  }, []);

  if (!feedback) return null;

  const copyMarkdown = () => {
    const md = `# Interview Evaluation — ${candidate?.member?.name}
**Role:** ${candidate?.member?.jobRole}  
**Experience:** ${candidate?.member?.yearsExperience} years  
**Education:** ${candidate?.member?.education}

---

## Executive Summary
${feedback.summary}

## Key Strengths
${(feedback.strengths || []).map(s => `- ${s}`).join('\n')}

## Areas for Growth
${(feedback.gaps || []).map(g => `- ${g}`).join('\n')}

## Recommended Next Steps
${(feedback.next || []).map(n => `- ${n}`).join('\n')}
`;
    navigator.clipboard.writeText(md);
    alert('Evaluation report copied to clipboard!');
  };

  const Section = ({ icon: Icon, title, color, items }) => (
    <div className="glass" style={{
      padding: '16px 18px',
      borderRadius: 'var(--r-lg)',
      borderColor: `${color}30`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Icon size={15} color={color} />
        <span style={{ fontSize: 12, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {title}
        </span>
      </div>
      <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 4 }}>
        {items.map((item, i) => (
          <li key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5,
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%', background: color,
              flexShrink: 0, marginTop: 6,
            }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="modal-overlay">
      <div className="modal-box glass-heavy">
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.12))',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 'var(--r-lg)',
              background: 'linear-gradient(135deg, var(--indigo), var(--violet))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px var(--indigo-glow)',
            }}>
              <Award size={22} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)' }}>
                Interview Evaluation Report
              </h2>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                {candidate?.member?.name} · {candidate?.member?.jobRole}
              </p>
            </div>
          </div>

          <button
            className="icon-btn"
            onClick={onClose}
            style={{ borderRadius: 'var(--r-full)', width: 30, height: 30 }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}>
          {/* Summary */}
          <div className="glass" style={{
            padding: '16px 18px',
            borderRadius: 'var(--r-lg)',
            borderLeft: '3px solid var(--indigo)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Star size={13} color="var(--indigo)" />
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--indigo-hov)' }}>
                Executive Summary
              </span>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text-1)' }}>
              {feedback.summary}
            </p>
          </div>

          {/* Two-col grid for strengths + gaps */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Section
              icon={CheckCircle2}
              title="Strengths"
              color="var(--green)"
              items={feedback.strengths || []}
            />
            <Section
              icon={AlertTriangle}
              title="Areas for Growth"
              color="var(--amber)"
              items={feedback.gaps || []}
            />
          </div>

          {/* Next steps */}
          <Section
            icon={ArrowRight}
            title="Recommended Next Steps"
            color="var(--indigo-hov)"
            items={feedback.next || []}
          />
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-card)',
          flexShrink: 0,
        }}>
          <button className="btn-ghost" onClick={copyMarkdown}>
            <Copy size={13} />
            Copy Markdown
          </button>
          <button className="btn-primary" onClick={onRestart}>
            <RefreshCw size={13} />
            New Interview
          </button>
        </div>
      </div>
    </div>
  );
}
