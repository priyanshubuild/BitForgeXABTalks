import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import CandidateSidebar from './components/CandidateSidebar';
import ChatStream from './components/ChatStream';
import FeedbackModal from './components/FeedbackModal';
import { CANDIDATES_SAMPLE } from './data/mockData';
import { Brain, GitBranch } from 'lucide-react';

export default function App() {
  const [candidates]            = useState(CANDIDATES_SAMPLE);
  const [selectedCandidateId, setSelectedCandidateId] = useState(CANDIDATES_SAMPLE[0].member.id);
  const [sessionId, setSessionId]   = useState(`sess-${Date.now()}`);

  const [backendUrl]            = useState('http://localhost:8001');
  const [isBackendOnline, setIsBackendOnline] = useState(false);

  const [messages, setMessages]         = useState([]);
  const [targetDays, setTargetDays]     = useState([]);
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const [daysCovered, setDaysCovered]   = useState(new Set());
  const [memories, setMemories]         = useState([]);
  const [isLoading, setIsLoading]       = useState(false);
  const [isComplete, setIsComplete]     = useState(false);
  const [feedback, setFeedback]         = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [theme, setTheme]               = useState('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const activeCandidate = candidates.find(c => c.member.id === selectedCandidateId) || candidates[0];

  // Health-check polling
  useEffect(() => {
    const check = async () => {
      try {
        const r = await fetch(`${backendUrl}/health`);
        setIsBackendOnline(r.ok);
      } catch { setIsBackendOnline(false); }
    };
    check();
    const iv = setInterval(check, 6000);
    return () => clearInterval(iv);
  }, [backendUrl]);

  // Init / reset session
  const initSession = async (candidateObj, sid) => {
    setIsLoading(true);
    setIsComplete(false);
    setFeedback(null);
    setMemories([]);
    setQuestionsAsked(1);
    setMessages([]);

    const missions = candidateObj.missions || [];
    const passed   = missions.filter(m => m.passed).slice(0, 4);
    const skipped  = missions.filter(m => m.skipped || !m.passed).slice(0, 1);
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
        const res  = await fetch(`${backendUrl}/api/interview`, {
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
        content: `Welcome, ${candidateObj.member.name}! I'm your AI interviewer for today's technical evaluation.\n\nWe'll be working through your AI Cohort journey together — assessing what you've built, understood, and where there's room to grow.\n\nLet's start with Day ${firstDay.day} — ${firstDay.title}:\n\nWalk me through how you approached this topic. What was your mental model going in, and what surprised you most after completing it?`,
      }]);
      setIsLoading(false);
    }, 500);
  };

  useEffect(() => {
    if (activeCandidate) initSession(activeCandidate, sessionId);
  }, [selectedCandidateId]);

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
        const res  = await fetch(`${backendUrl}/api/interview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, message: text }),
        });
        const data = await res.json();
        setMessages([...updated, { role: 'assistant', content: data.reply }]);
        setQuestionsAsked(q => q + 1);

        // Update day coverage
        if (targetDays[questionsAsked % targetDays.length]) {
          setDaysCovered(prev => new Set([...prev, targetDays[questionsAsked % targetDays.length].day]));
        }

        // Update memories (deduplicated)
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

    // Simulation fallback turn
    setTimeout(() => {
      const nextTurn    = questionsAsked + 1;
      setQuestionsAsked(nextTurn);

      const tidx   = (nextTurn - 1) % (targetDays.length || 1);
      const curDay = targetDays[tidx] || targetDays[0];
      if (curDay) setDaysCovered(prev => new Set([...prev, curDay.day]));

      if (nextTurn >= 8 && (daysCovered?.size ?? 0) >= 3) {
        const mockFb = {
          summary: `${activeCandidate.member.name} demonstrated strong competency across vector embeddings, retrieval engines, prompt engineering, and multi-agent workflows — showing genuine implementation depth.`,
          strengths: [
            'Clear mental models for text chunking, embedding similarity, and ChromaDB metadata filtering',
            'Practical FastAPI session management and context-window optimization experience',
            'Solid grasp of multi-agent routing and MCP tool standardization benefits',
          ],
          gaps: [
            'Container observability probes and rolling-restart strategies need more depth (Day 28–29)',
            'Token cost optimization and retrieval precision tuning could be more concrete',
          ],
          next: [
            'Implement hybrid BM25 + dense re-ranking (Cohere Rerank) for RAG optimization',
            'Explore OpenTelemetry distributed tracing across FastAPI + multi-agent pipelines',
          ],
        };
        setMessages([...updated, { role: 'assistant', content: 'That concludes our technical evaluation. Thank you for walking me through your AI Cohort journey — it\'s been a genuinely insightful conversation.' }]);
        setIsComplete(true);
        setFeedback(mockFb);
        setShowFeedback(true);
      } else {
        const followUps = [
          `Good answer regarding "${text.slice(0, 35)}…". Let's dig deeper — on Day ${curDay?.day ?? 7} (${curDay?.title ?? 'Core AI'}): what specific engineering decisions surprised you most, and how did you validate your approach?`,
          `Interesting perspective. Following up on Day ${curDay?.day ?? 8}: if you had to optimize this for production scale — what bottleneck would you tackle first, and why?`,
          `That makes sense. Probing Day ${curDay?.day ?? 12} a bit further: what does a failure scenario look like, and what observability did you put in place to detect it?`,
          `Got it. Shifting focus to Day ${curDay?.day ?? 16}: how would a senior engineer reviewing your code raise concerns about this approach, and what would your rebuttal be?`,
        ];
        const reply = followUps[(nextTurn - 2) % followUps.length];
        setMessages([...updated, { role: 'assistant', content: reply }]);
      }
      setIsLoading(false);
    }, 700);
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100vh', width: '100vw',
      background: 'var(--bg-base)',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Ambient glows */}
      <div className="ambient-glow" style={{
        width: 500, height: 500, top: -150, left: -100,
        background: 'var(--indigo)',
      }} />
      <div className="ambient-glow" style={{
        width: 400, height: 400, bottom: -100, right: 200,
        background: 'var(--violet)',
      }} />

      <Header
        candidates={candidates}
        selectedCandidateId={selectedCandidateId}
        onSelectCandidate={(id) => {
          setSelectedCandidateId(id);
          const sid = `sess-${Date.now()}`;
          setSessionId(sid);
        }}
        onResetSession={handleResetSession}
        isBackendOnline={isBackendOnline}
        sessionId={sessionId}
        theme={theme}
        setTheme={setTheme}
      />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
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

        {/* ── Memory Graph Panel ─────────────── */}
        <aside style={{
          width: 260,
          background: 'var(--bg-base)',
          borderLeft: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          overflow: 'hidden',
        }}>
          {/* Panel Header */}
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--bg-card)',
            flexShrink: 0,
          }}>
            <Brain size={14} color="var(--indigo)" />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)' }}>Memory Graph</span>
            {memories.length > 0 && (
              <span className="chip chip-indigo" style={{ marginLeft: 'auto', fontSize: 10 }}>
                {memories.length} node{memories.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Memory List */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            {memories.length === 0 ? (
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: 16,
                gap: 10,
                color: 'var(--text-3)',
              }}>
                <Brain size={32} strokeWidth={1.2} />
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>No memories yet</p>
                  <p style={{ fontSize: 11, lineHeight: 1.5 }}>
                    Substantive answers will be written to the Breeth memory graph and retrieved here
                  </p>
                </div>
              </div>
            ) : (
              memories.map((m, idx) => (
                <div
                  key={idx}
                  className="glass animate-slide-in"
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--r-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    animationDelay: `${idx * 0.05}s`,
                  }}
                >
                  {/* Source → Target */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                    <span className="chip chip-indigo" style={{ fontSize: 10, padding: '2px 7px' }}>
                      {m.source_node}
                    </span>
                    <GitBranch size={10} color="var(--text-3)" />
                    <span className="chip chip-indigo" style={{ fontSize: 10, padding: '2px 7px' }}>
                      {m.target_node}
                    </span>
                  </div>

                  {/* Fact */}
                  <p style={{ fontSize: 11, lineHeight: 1.55, color: 'var(--text-2)' }}>
                    {m.fact}
                  </p>

                  {/* Cognitive pattern */}
                  {m.cognitive_pattern && (
                    <span className="chip chip-green" style={{ fontSize: 10, alignSelf: 'flex-start' }}>
                      {m.cognitive_pattern}
                    </span>
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
