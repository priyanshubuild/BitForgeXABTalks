import React from 'react';
import { Target, BookOpen, Clock } from 'lucide-react';

export default function CandidateSidebar({ candidate, targetDays, questionsAsked, daysCovered }) {
  if (!candidate) return null;
  const { member, signals } = candidate;

  return (
    <aside style={{
      width: '340px',
      background: 'var(--bg-card)',
      borderRight: '1px solid var(--border-color)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      overflowY: 'auto'
    }}>
      <div className="glass-card" style={{ padding: '16px', display: 'flex', gap: '14px', alignItems: 'center' }}>
        <div style={{
          width: '46px',
          height: '46px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontWeight: 800,
          fontSize: '1.1rem'
        }}>
          {member.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>{member.name}</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>{member.jobRole}</p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span><Clock size={12} style={{ display: 'inline', verticalAlign: '-1px' }} /> {member.yearsExperience} yrs exp</span>
            <span>•</span>
            <span>{member.education}</span>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '16px' }}>
        <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Target size={14} color="var(--primary)" /> Evaluation Requirements
        </h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
              <span>Question Turns</span>
              <span style={{ fontWeight: 700, color: questionsAsked >= 8 ? 'var(--emerald)' : 'var(--text-main)' }}>
                {questionsAsked} / 8 min
              </span>
            </div>
            <div style={{ height: '6px', background: 'var(--bg-dark)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ 
                width: `${Math.min(100, (questionsAsked / 8) * 100)}%`, 
                height: '100%', 
                background: questionsAsked >= 8 ? 'var(--emerald)' : 'var(--primary)',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
              <span>Curriculum Days Covered</span>
              <span style={{ fontWeight: 700, color: daysCovered.size >= 4 ? 'var(--emerald)' : 'var(--text-main)' }}>
                {daysCovered.size} / 4 min
              </span>
            </div>
            <div style={{ height: '6px', background: 'var(--bg-dark)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ 
                width: `${Math.min(100, (daysCovered.size / 4) * 100)}%`, 
                height: '100%', 
                background: daysCovered.size >= 4 ? 'var(--emerald)' : 'var(--amber)',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <BookOpen size={14} color="var(--primary)" /> Target Topics
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {targetDays.map((td) => {
            const isCovered = daysCovered.has(td.day);
            return (
              <div key={td.day} className="glass-card" style={{ 
                padding: '10px 12px', 
                borderColor: isCovered ? 'var(--emerald)' : 'var(--border-color)',
                background: isCovered ? 'rgba(16, 185, 129, 0.08)' : 'rgba(24, 32, 51, 0.6)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff' }}>
                    Day {td.day} - {td.title}
                  </span>
                  {td.passed ? (
                    <span className="badge badge-passed" style={{ fontSize: '0.65rem' }}>Passed</span>
                  ) : (
                    <span className="badge badge-skipped" style={{ fontSize: '0.65rem' }}>Skipped</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
