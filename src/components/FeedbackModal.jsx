import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, AlertTriangle, ArrowRight, Award, Download, Copy, RefreshCw, X } from 'lucide-react';

export default function FeedbackModal({ feedback, candidate, onRestart, onClose }) {
  useEffect(() => {
    // Fire celebratory confetti on feedback presentation
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {}
  }, []);

  if (!feedback) return null;

  const copyMarkdown = () => {
    const md = `# Evaluation Report: ${candidate?.member?.name}
**Role:** ${candidate?.member?.jobRole}
**Experience:** ${candidate?.member?.yearsExperience} years

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
    alert('Report copied to clipboard in Markdown format!');
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
      <div className="glass-panel animate-slide-up" style={{
        width: '100%',
        maxWidth: '720px',
        maxHeight: '90vh',
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        border: '1px solid var(--primary)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <Award size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>Interview Evaluation Report</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Candidate: <strong>{candidate?.member?.name}</strong> ({candidate?.member?.jobRole})
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Summary */}
          <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid var(--primary)' }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--primary)', uppercase: 'true', marginBottom: '6px' }}>
              Executive Summary
            </h3>
            <p style={{ fontSize: '0.95rem', lineHeight: '1.5', color: 'var(--text-main)' }}>
              {feedback.summary}
            </p>
          </div>

          {/* Key Strengths & Growth Areas Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Strengths */}
            <div className="glass-card" style={{ padding: '16px' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--emerald)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <CheckCircle2 size={16} /> Key Strengths
              </h4>
              <ul style={{ paddingLeft: '18px', fontSize: '0.85rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {(feedback.strengths || []).map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>

            {/* Gaps */}
            <div className="glass-card" style={{ padding: '16px' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--rose)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <AlertTriangle size={16} /> Areas for Growth
              </h4>
              <ul style={{ paddingLeft: '18px', fontSize: '0.85rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {(feedback.gaps || []).map((g, idx) => (
                  <li key={idx}>{g}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Next Steps */}
          <div className="glass-card" style={{ padding: '16px' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <ArrowRight size={16} /> Recommended Next Steps
            </h4>
            <ul style={{ paddingLeft: '18px', fontSize: '0.85rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {(feedback.next || []).map((n, idx) => (
                <li key={idx}>{n}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          background: 'var(--bg-card)',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center'
        }}>
          <button 
            onClick={copyMarkdown}
            style={{
              background: 'var(--bg-dark)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Copy size={16} /> Copy Markdown
          </button>

          <button 
            onClick={onRestart}
            style={{
              background: 'var(--primary)',
              border: 'none',
              color: '#fff',
              padding: '8px 20px',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={16} /> Start New Interview
          </button>
        </div>
      </div>
    </div>
  );
}
