import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import CandidateSelect from './components/CandidateSelect';
import Header from './components/Header';
import CandidateSidebar from './components/CandidateSidebar';
import ChatStream from './components/ChatStream';
import FeedbackModal from './components/FeedbackModal';
import { ALL_CANDIDATES } from './data/candidates';
import { Brain, GitBranch } from 'lucide-react';

export default function App() {
  // Navigation: 'landing' | 'select' | 'interview'
  const [page, setPage] = useState('landing');
  const [theme, setTheme] = useState('dark');

  // Interview state
  const [activeCandidate, setActiveCandidate] = useState(null);
  const [sessionId, setSessionId] = useState(`sess-${Date.now()}`);
  const [backendUrl] = useState('http://localhost:8001');
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [messages, setMessages] = useState([]);
  const [targetDays, setTargetDays] = useState([]);
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const [daysCovered, setDaysCovered] = useState(new Set());
  const [memories, setMemories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Health-check
  useEffect(() => {
    const check = async () => {
      try { const r = await fetch(`${backendUrl}/health`); setIsBackendOnline(r.ok); }
      catch { setIsBackendOnline(false); }
    };
    check();
    const iv = setInterval(check, 6000);
    return () => clearInterval(iv);
  }, [backendUrl]);

  // Init session
  const initSession = async (candidateObj, sid) => {
    setIsLoading(true);
    setIsComplete(false);
    setFeedback(null);
    setMemories([]);
    setQuestionsAsked(1);
    setMessages([]);

    const missions = candidateObj.missions || [];
    const passed = missions.filter(m => m.passed).slice(0, 4);
    const skipped = missions.filter(m => m.skipped || !m.passed).slice(0, 1);
    const combined = [...passed, ...skipped];
    const formatted = combined.map(m => ({
      day: m.day, title: m.title,
      tools: ['Python', 'FastAPI', 'LLMs'],
      passed: !!m.passed, skipped: !!m.skipped,
      attempts: m.attempts || 1,
    }));
    setTargetDays(formatted);
    setDaysCovered(new Set([formatted[0]?.day ?? 7]));

    if (isBackendOnline) {
      try {
        const res = await fetch(`${backendUrl}/api/interview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sid, candidate: candidateObj }),
        });
        const data = await res.json();
        setMessages([{ role: 'assistant', content: data.reply }]);
        if (Array.isArray(data.memories)) setMemories(data.memories);
        setIsLoading(false);
        return;
      } catch (e) { console.warn('Backend init failed, using simulation', e); }
    }

    // Simulation fallback
    setTimeout(() => {
      const firstDay = formatted[0] ?? { day: 7, title: 'Embeddings Explained' };
      setMessages([{
        role: 'assistant',
        content: `Welcome, ${candidateObj.member.name}! I'm your AI interviewer for today's technical evaluation.\n\nWe'll work through your AI Cohort journey — assessing what you've built, understood, and where there's room to grow.\n\nLet's start with **Day ${firstDay.day} — ${firstDay.title}**:\n\nWalk me through how you approached this topic. What was your implementation strategy, and what tradeoffs did you consider?`,
      }]);
      setIsLoading(false);
    }, 600);
  };

  const handleSelectCandidate = (candidate) => {
    setActiveCandidate(candidate);
    const sid = `sess-${Date.now()}`;
    setSessionId(sid);
    setPage('interview');
    initSession(candidate, sid);
  };

  const handleResetSession = () => {
    const sid = `sess-${Date.now()}`;
    setSessionId(sid);
    initSession(activeCandidate, sid);
  };

  const handleSendMessage = async (text) => {
    const updated = [...messages, { role: 'user', content: text }];
    setMessages(updated);
    setIsLoading(true);

    if (isBackendOnline) {
      try {
        const res = await fetch(`${backendUrl}/api/interview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, message: text }),
        });
        const data = await res.json();
        setMessages([...updated, { role: 'assistant', content: data.reply }]);
        setQuestionsAsked(q => q + 1);

        if (targetDays[questionsAsked % targetDays.length]) {
          setDaysCovered(prev => new Set([...prev, targetDays[questionsAsked % targetDays.length].day]));
        }

        if (Array.isArray(data.memories)) {
          setMemories(prev => {
            const existing = new Set(prev.map(m => m.fact?.toLowerCase().trim()));
            const fresh = data.memories.filter(m => !existing.has(m.fact?.toLowerCase().trim()));
            return [...prev, ...fresh];
          });
        }

        if (data.done) {
          setIsComplete(true);
          setFeedback(data.feedback);
          setShowFeedback(true);
        }
        setIsLoading(false);
        return;
      } catch (e) { console.warn('Backend turn failed, using simulation', e); }
    }

    // Simulation fallback
    setTimeout(() => {
      const nextTurn = questionsAsked + 1;
      setQuestionsAsked(nextTurn);
      const tidx = (nextTurn - 1) % (targetDays.length || 1);
      const curDay = targetDays[tidx] || targetDays[0];
      if (curDay) setDaysCovered(prev => new Set([...prev, curDay.day]));

      const wordCount = text.trim().split(/\s+/).length;
      const isVague = wordCount < 20;

      if (nextTurn >= 8 && (daysCovered?.size ?? 0) >= 3) {
        const mockFb = {
          summary: `${activeCandidate.member.name} participated across multiple curriculum areas. Note: this evaluation was generated in offline simulation mode.`,
          strengths: ['Engaged with multiple curriculum topic areas.', 'Provided responses spanning early and late-stage days.'],
          gaps: ['Backend unreachable — real LLM evaluation unavailable.', 'Depth of answers could not be verified.'],
          next: ['Start backend (uvicorn backend.main:app --reload --port 8001) for real evaluation.', 'Review skipped/failed missions.'],
        };
        setMessages([...updated, { role: 'assistant', content: "That concludes our session. Thank you — please note this was a simulated offline session." }]);
        setIsComplete(true);
        setFeedback(mockFb);
        setShowFeedback(true);
      } else if (isVague) {
        const probes = [
          `That was quite brief. Walk me through a concrete implementation detail for **Day ${curDay?.day ?? 7} (${curDay?.title ?? 'this topic'})** — what code or configuration did you actually write?`,
          `I need more depth. What specific tool or library did you use on **Day ${curDay?.day ?? 8}**, and what problem did it solve?`,
          `Can you be more precise? For **Day ${curDay?.day ?? 12} (${curDay?.title ?? 'this module'})**, what was the hardest part technically?`,
        ];
        setMessages([...updated, { role: 'assistant', content: probes[(nextTurn - 2) % probes.length] }]);
      } else {
        const deepDive = [
          `For **Day ${curDay?.day ?? 7} (${curDay?.title ?? 'this topic'})**: how did you handle edge cases or failure modes?`,
          `On **Day ${curDay?.day ?? 8}**: what would break first at 10x scale, and how would you address it architecturally?`,
          `Probing **Day ${curDay?.day ?? 12}** further: if a senior engineer reviewed your solution, what criticism would they raise?`,
        ];
        setMessages([...updated, { role: 'assistant', content: deepDive[(nextTurn - 2) % deepDive.length] }]);
      }
      setIsLoading(false);
    }, 700);
  };

  // ─── RENDER ───────────────────────────────────────────────
  if (page === 'landing') {
    return <LandingPage onStart={() => setPage('select')} theme={theme} setTheme={setTheme} />;
  }

  if (page === 'select') {
    return <CandidateSelect candidates={ALL_CANDIDATES} onSelect={handleSelectCandidate} onBack={() => setPage('landing')} />;
  }

  // Interview page
  return (
    <div className="interview-layout">
      <div className="mesh-bg" />

      <Header
        candidate={activeCandidate}
        onBack={() => setPage('select')}
        onResetSession={handleResetSession}
        isBackendOnline={isBackendOnline}
        sessionId={sessionId}
        theme={theme}
        setTheme={setTheme}
      />

      <div className="interview-body">
        <CandidateSidebar
          candidate={activeCandidate}
          targetDays={targetDays}
          questionsAsked={questionsAsked}
          daysCovered={daysCovered}
        />

        <ChatStream
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          candidate={activeCandidate}
          isComplete={isComplete}
          onShowFeedback={() => setShowFeedback(true)}
        />

        {/* Memory Graph Panel */}
        <aside style={{
          width: 250, background: 'var(--bg-base)', borderLeft: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden',
        }}>
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 7, background: 'var(--bg-card)', flexShrink: 0,
          }}>
            <Brain size={13} color="var(--indigo)" />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)' }}>Memory Graph</span>
            {memories.length > 0 && (
              <span className="chip chip-indigo" style={{ marginLeft: 'auto', fontSize: 9, padding: '1px 7px' }}>
                {memories.length}
              </span>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {memories.length === 0 ? (
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', textAlign: 'center', padding: 16, gap: 8, color: 'var(--text-3)',
              }}>
                <Brain size={28} strokeWidth={1.2} />
                <p style={{ fontSize: 11, fontWeight: 600 }}>No memories yet</p>
                <p style={{ fontSize: 10, lineHeight: 1.5 }}>Substantive answers are written to the Breeth memory graph</p>
              </div>
            ) : (
              memories.map((m, idx) => (
                <div key={idx} className="glass animate-slide-in" style={{
                  padding: '9px 11px', borderRadius: 'var(--r-md)', animationDelay: `${idx * 0.04}s`,
                  display: 'flex', flexDirection: 'column', gap: 5,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                    <span className="chip chip-indigo" style={{ fontSize: 9, padding: '1px 6px' }}>{m.source_node}</span>
                    <GitBranch size={9} color="var(--text-3)" />
                    <span className="chip chip-indigo" style={{ fontSize: 9, padding: '1px 6px' }}>{m.target_node}</span>
                  </div>
                  <p style={{ fontSize: 10, lineHeight: 1.5, color: 'var(--text-2)' }}>{m.fact}</p>
                  {m.cognitive_pattern && (
                    <span className="chip chip-green" style={{ fontSize: 9, alignSelf: 'flex-start', padding: '1px 6px' }}>{m.cognitive_pattern}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </aside>
      </div>

      {showFeedback && (
        <FeedbackModal
          feedback={feedback}
          candidate={activeCandidate}
          onRestart={() => { setShowFeedback(false); handleResetSession(); }}
          onClose={() => setShowFeedback(false)}
        />
      )}
    </div>
  );
}
