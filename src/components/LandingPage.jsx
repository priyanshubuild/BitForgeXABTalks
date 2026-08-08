import React from 'react';
import { BrainCircuit, Sparkles, MessageSquare, Target, Shield, BarChart3, ArrowRight, Cpu, Database, Zap, Sun, Moon } from 'lucide-react';

const FEATURES = [
  { icon: MessageSquare, title: 'Adaptive Conversations', desc: 'Multi-turn interviews that adapt based on your answers — not a scripted questionnaire.', color: 'var(--indigo)' },
  { icon: Target, title: 'Curriculum-Aware', desc: 'Questions target your specific completed, skipped, and failed missions across 31 days.', color: 'var(--green)' },
  { icon: BrainCircuit, title: 'Breeth Memory', desc: 'Persistent memory graph tracks facts across turns for deeper, context-aware follow-ups.', color: 'var(--violet)' },
  { icon: BarChart3, title: 'Structured Feedback', desc: 'Detailed evaluation report with strengths, gaps, and actionable next steps.', color: 'var(--cyan)' },
  { icon: Shield, title: 'Answer Evaluation', desc: 'Real-time judgment pipeline catches off-topic, vague, or incorrect responses.', color: 'var(--amber)' },
  { icon: Cpu, title: 'Multi-LLM Fallback', desc: 'Gemini primary with Anthropic fallback and offline simulation for reliability.', color: 'var(--red)' },
];

const TECH = [
  { label: 'Gemini 2.0 Flash', icon: Sparkles },
  { label: 'FastAPI', icon: Zap },
  { label: 'Breeth Memory', icon: Database },
  { label: 'React + Vite', icon: Cpu },
];

export default function LandingPage({ onStart, theme, setTheme }) {
  return (
    <div className="landing-container">
      <div className="mesh-bg" />

      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'transparent', backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 'var(--r-md)',
            background: 'linear-gradient(135deg, var(--indigo), var(--violet))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <BrainCircuit size={18} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-1)' }}>BitForge</span>
          <span className="chip chip-indigo" style={{ fontSize: 10 }}>AI Interview Agent</span>
        </div>
        <button className="icon-btn" onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
          {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
        </button>
      </nav>

      {/* Hero */}
      <section className="hero-section">
        <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="chip chip-indigo" style={{ marginBottom: 24, fontSize: 12, padding: '5px 16px' }}>
            <Sparkles size={12} /> AI Cohort Hackathon · Problem Statement 1
          </div>
        </div>

        <h1 className="hero-title animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <span className="gradient-text">Build the Interviewer,</span>
          <br />
          <span style={{ color: 'var(--text-1)' }}>Not the Interview.</span>
        </h1>

        <p className="hero-subtitle animate-fade-up" style={{ animationDelay: '0.3s' }}>
          An AI agent that conducts personalized, multi-turn technical interviews based on each candidate's
          learning journey through the 31-day AI Cohort curriculum.
        </p>

        <div className="hero-stats animate-fade-up" style={{ animationDelay: '0.4s' }}>
          <div className="hero-stat"><span className="hero-stat-value">20</span><span className="hero-stat-label">Candidates</span></div>
          <div className="hero-stat"><span className="hero-stat-value">31</span><span className="hero-stat-label">Days</span></div>
          <div className="hero-stat"><span className="hero-stat-value">8</span><span className="hero-stat-label">Modules</span></div>
          <div className="hero-stat"><span className="hero-stat-value">∞</span><span className="hero-stat-label">Adaptivity</span></div>
        </div>

        <button className="hero-cta animate-fade-up" onClick={onStart} style={{ animationDelay: '0.5s' }}>
          Select a Candidate <ArrowRight size={16} style={{ marginLeft: 4 }} />
        </button>

        {/* Tech badges */}
        <div className="animate-fade-up" style={{ animationDelay: '0.6s', marginTop: 48, display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          {TECH.map((t, i) => (
            <div key={i} className="chip" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-2)', padding: '5px 14px' }}>
              <t.icon size={12} /> {t.label}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <div className="features-grid">
        {FEATURES.map((f, i) => (
          <div key={i} className="feature-card animate-fade-up" style={{ animationDelay: `${0.1 * i}s` }}>
            <div className="feature-icon" style={{ background: `${f.color}15`, border: `1px solid ${f.color}25` }}>
              <f.icon size={20} color={f.color} />
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: 'var(--text-1)' }}>{f.title}</h3>
            <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '32px 24px 48px', color: 'var(--text-3)', fontSize: 12 }}>
        Built by <span style={{ color: 'var(--indigo-hov)', fontWeight: 600 }}>Team BitForge</span> · AI Cohort Hackathon 2026
      </div>
    </div>
  );
}
