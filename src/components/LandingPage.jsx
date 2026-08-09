import React from 'react';
import { BrainCircuit, Sparkles, MessageSquare, Target, Shield, BarChart3, ArrowRight, Cpu, Database, Zap, Sun, Moon, ChevronDown } from 'lucide-react';

const FEATURES = [
  { icon: MessageSquare, title: 'Adaptive Conversations', desc: 'Multi-turn interviews that adapt based on your answers — not a scripted questionnaire.' },
  { icon: Target, title: 'Curriculum-Aware', desc: 'Questions target your specific completed, skipped, and failed missions across 31 days.' },
  { icon: BrainCircuit, title: 'Breeth Memory', desc: 'Persistent memory graph tracks facts across turns for deeper, context-aware follow-ups.' },
  { icon: BarChart3, title: 'Structured Feedback', desc: 'Detailed evaluation report with strengths, gaps, and actionable next steps.' },
  { icon: Shield, title: 'Answer Evaluation', desc: 'Real-time judgment pipeline catches off-topic, vague, or incorrect responses.' },
  { icon: Cpu, title: 'Reliable Fallback', desc: 'Gemini with an offline simulation fallback for reliable evaluations.' },
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

      <nav className="landing-nav">
        <div className="landing-nav-brand">
          <div className="landing-nav-logo">
            <BrainCircuit size={16} strokeWidth={1.8} />
          </div>
          <span className="landing-nav-title">BitForge</span>
        </div>
        <button
          className="icon-btn"
          onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </nav>

      <section className="hero-section">
        <div className="hero-eyebrow animate-fade-up" style={{ animationDelay: '0.05s' }}>
          Vicodathon · Problem Statement 2
        </div>

        <h1 className="hero-title animate-fade-up" style={{ animationDelay: '0.12s' }}>
          Build the Interviewer,
          <br />
          <span className="hero-title-muted">Not the Interview.</span>
        </h1>

        <p className="hero-subtitle animate-fade-up" style={{ animationDelay: '0.2s' }}>
          An AI agent that conducts personalized, multi-turn technical interviews
          based on each candidate's learning journey through the 31-day AI Cohort curriculum.
        </p>

        <div className="hero-stats animate-fade-up" style={{ animationDelay: '0.28s' }}>
          {[
            { val: '20', label: 'Candidates' },
            { val: '31', label: 'Days' },
            { val: '8', label: 'Modules' },
            { val: '∞', label: 'Adaptivity' },
          ].map((s, i) => (
            <div className="hero-stat" key={i}>
              <span className="hero-stat-value">{s.val}</span>
              <span className="hero-stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        <button className="hero-cta animate-fade-up" onClick={onStart} style={{ animationDelay: '0.36s' }}>
          Select a Candidate
          <ArrowRight size={17} strokeWidth={1.8} />
        </button>

        <div className="hero-tech animate-fade-up" style={{ animationDelay: '0.44s' }}>
          {TECH.map((t, i) => (
            <div key={i} className="hero-tech-badge">
              <t.icon size={12} strokeWidth={1.8} />
              {t.label}
            </div>
          ))}
        </div>

        <div className="hero-scroll animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <span>Scroll</span>
          <ChevronDown size={14} style={{ animation: 'pulse 2s ease infinite' }} />
        </div>
      </section>

      <section className="features-section">
        <div className="features-section-head animate-fade-up">
          <h2>Everything you need to evaluate.</h2>
          <p>Intelligent, adaptive, and built for real technical depth.</p>
        </div>
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card animate-fade-up" style={{ animationDelay: `${0.06 * i}s` }}>
              <div className="feature-icon">
                <f.icon size={18} strokeWidth={1.6} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="landing-footer">
        Built by <strong>Team BitForge</strong> · Vicodathon 2026
      </footer>
    </div>
  );
}
