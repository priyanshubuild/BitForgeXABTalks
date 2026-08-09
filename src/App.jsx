import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import CandidateSelect from './components/CandidateSelect';
import Header from './components/Header';
import CandidateSidebar from './components/CandidateSidebar';
import ChatStream from './components/ChatStream';
import FeedbackModal from './components/FeedbackModal';
import { ALL_CANDIDATES } from './data/candidates';

const createSessionId = () =>
  globalThis.crypto?.randomUUID?.() ?? `sess-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const configuredBackendUrl = import.meta.env.VITE_BACKEND_URL?.trim().replace(/\/$/, '');
// On Vercel, the FastAPI function is deployed at the same origin under /api.
// A separate backend host can still be supplied explicitly at build time.
const BACKEND_URL = configuredBackendUrl || (import.meta.env.DEV ? 'http://localhost:8001' : '');

export default function App() {
  // Navigation: 'landing' | 'select' | 'interview'
  const [page, setPage] = useState('landing');
  const [theme, setTheme] = useState('dark');

  // Interview state
  const [activeCandidate, setActiveCandidate] = useState(null);
  const [sessionId, setSessionId] = useState(createSessionId);
  const [backendUrl] = useState(BACKEND_URL);
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [messages, setMessages] = useState([]);
  const [targetDays, setTargetDays] = useState([]);
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const [daysCovered, setDaysCovered] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const [topicResults, setTopicResults] = useState({});
  const [currentTopicIdx, setCurrentTopicIdx] = useState(0);
  const [offlineTopicAttempts, setOfflineTopicAttempts] = useState(0);

  const applySessionSnapshot = (data) => {
    if (data.target_days?.length) setTargetDays(data.target_days);
    if (data.questions_asked != null) setQuestionsAsked(data.questions_asked);
    if (data.days_covered) setDaysCovered(new Set(data.days_covered));
    if (data.topic_results) setTopicResults(data.topic_results);
    if (data.current_topic_idx != null) setCurrentTopicIdx(data.current_topic_idx);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Health-check
  useEffect(() => {
    const check = async () => {
      try { const r = await fetch(`${backendUrl}/api/health`); setIsBackendOnline(r.ok); }
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
    setQuestionsAsked(0);
    setMessages([]);
    setTopicResults({});
    setCurrentTopicIdx(0);
    setOfflineTopicAttempts(0);
    setTargetDays([]);
    setDaysCovered(new Set());

    if (isBackendOnline) {
      try {
        const res = await fetch(`${backendUrl}/api/interview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sid, candidate: candidateObj }),
        });
        if (!res.ok) throw new Error(`Backend returned ${res.status}`);
        const data = await res.json();
        if (typeof data.reply !== 'string') throw new Error('Backend returned an invalid interview response');
        setMessages([{ role: 'assistant', content: data.reply }]);
        applySessionSnapshot(data);
        setIsLoading(false);
        return;
      } catch (e) { console.warn('Backend init failed, using simulation', e); }
    }

    // Offline fallback — simplified topic list until backend connects
    const missions = candidateObj.missions || [];
    const gaps = missions.filter(m => m.skipped || m.passed === false).slice(0, 2);
    const depth = missions.filter(m => m.passed && (m.attempts ?? 1) >= 3).slice(0, 2);
    const rest = missions.filter(m => m.passed && !gaps.includes(m) && !depth.includes(m)).slice(0, 2);
    const combined = [...gaps, ...depth, ...rest].slice(0, 5);
    const formatted = combined.map(m => ({
      day: m.day, title: m.title,
      tools: [], objectives: [],
      passed: !!m.passed, skipped: !!m.skipped,
      attempts: m.attempts || 1,
      probe_reason: m.skipped ? 'Gap probe — skipped in cohort' : (m.passed === false ? 'Gap probe — not passed' : `Review — ${m.attempts || 1} attempt(s)`),
    }));
    setTargetDays(formatted);
    setDaysCovered(new Set());
    setQuestionsAsked(1);
    setTimeout(() => {
      const firstDay = formatted[0] ?? { day: 7, title: 'Embeddings Explained' };
      setMessages([{
        role: 'assistant',
        content: `Welcome, ${candidateObj.member.name}! I'm your AI interviewer for today's technical evaluation.\n\n⚠️ _Running in offline simulation mode — connect the backend for full AI-powered evaluation._\n\nWe'll work through your AI Cohort journey — assessing what you've built, understood, and where there's room to grow.\n\nLet's start with **Day ${firstDay.day} — ${firstDay.title}**:\n\nWalk me through how you approached this topic. What was your implementation strategy, and what tradeoffs did you consider?`,
      }]);
      setIsLoading(false);
    }, 600);
  };

  const handleSelectCandidate = (candidate) => {
    setActiveCandidate(candidate);
    const sid = createSessionId();
    setSessionId(sid);
    setPage('interview');
    initSession(candidate, sid);
  };

  const handleResetSession = () => {
    const sid = createSessionId();
    setSessionId(sid);
    initSession(activeCandidate, sid);
  };

  // Helper: evaluate answer quality client-side (for simulation fallback)
  const evaluateAnswerLocally = (text, dayTitle) => {
    const lower = text.trim().toLowerCase();
    const wordCount = text.trim().split(/\s+/).length;

    // Skip/don't know detection
    const skipPhrases = [
      "skip", "i don't know", "i dont know", "no idea", "pass",
      "not sure", "don't know", "dont know", "no clue", "idk",
      "can't answer", "cant answer",
    ];
    for (const phrase of skipPhrases) {
      if (lower.includes(phrase)) return 'skipped';
    }

    // Too brief
    if (wordCount < 8) return 'too_brief';

    // Off-topic check: extract keywords from day title
    const titleWords = (dayTitle || '').match(/[a-zA-Z]{4,}/g) || [];
    const titleKeywords = titleWords.map(w => w.toLowerCase()).filter(w => w !== 'and');
    if (titleKeywords.length > 0) {
      const hits = titleKeywords.filter(kw => lower.includes(kw)).length;
      if (hits === 0 && wordCount < 40) return 'off_topic';
    }

    // Vague
    if (wordCount < 25) return 'vague';

    // Adequate
    if (wordCount < 60) return 'adequate';

    return 'strong';
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
        if (!res.ok) throw new Error(`Backend returned ${res.status}`);
        const data = await res.json();
        if (typeof data.reply !== 'string') throw new Error('Backend returned an invalid interview response');
        setMessages([...updated, { role: 'assistant', content: data.reply }]);
        applySessionSnapshot(data);

        if (data.done) {
          setIsComplete(true);
          setFeedback(data.feedback);
          setShowFeedback(true);
        }
        setIsLoading(false);
        return;
      } catch (e) { console.warn('Backend turn failed, using simulation', e); }
    }

    // Simulation fallback with REAL answer evaluation
    setTimeout(() => {
      const nextTurn = questionsAsked + 1;
      setQuestionsAsked(nextTurn);
      const curDay = targetDays[currentTopicIdx] || targetDays[0];
      const updatedDaysCovered = new Set(daysCovered);
      if (curDay) {
        updatedDaysCovered.add(curDay.day);
        setDaysCovered(updatedDaysCovered);
      }

      // A fallback interview must obey the same order as the backend: judge
      // the current topic first, then remain on weak answers until retry cap.
      const judgment = evaluateAnswerLocally(text, curDay?.title || 'general AI');
      const weakJudgment = ['skipped', 'too_brief', 'off_topic', 'vague'].includes(judgment);
      const attemptsAfterAnswer = offlineTopicAttempts + 1;
      const retryCapReached = weakJudgment && attemptsAfterAnswer >= 2;
      const shouldAdvance = !weakJudgment || retryCapReached;
      const nextIdx = shouldAdvance
        ? Math.min(currentTopicIdx + 1, Math.max(0, targetDays.length - 1))
        : currentTopicIdx;
      const questionDay = targetDays[nextIdx] || curDay;
      setCurrentTopicIdx(nextIdx);
      setOfflineTopicAttempts(shouldAdvance ? 0 : attemptsAfterAnswer);

      // Store result for this topic
      if (curDay) {
        setTopicResults(prev => ({
          ...prev,
          [curDay.day]: judgment,
        }));
      }

      if (nextTurn >= 8 && updatedDaysCovered.size >= 4) {
        // Count weak vs strong answers
        const allResults = { ...topicResults };
        if (curDay) allResults[curDay.day] = judgment;
        const weakCount = Object.values(allResults).filter(j =>
          ['skipped', 'too_brief', 'off_topic'].includes(j)
        ).length;
        const totalCount = Object.values(allResults).length;

        let closingMsg;
        if (weakCount > totalCount * 0.5) {
          closingMsg = `That concludes our session, ${activeCandidate.member.name}. ⚠️ I noted significant gaps — ${weakCount} of your ${totalCount} responses were insufficient or off-topic. You'll need to review these curriculum topics before a real assessment.\n\n_Note: This was an offline simulation. Start the backend for AI-powered evaluation._`;
        } else {
          closingMsg = `That concludes our session. Thank you, ${activeCandidate.member.name}. Your responses demonstrated ${weakCount === 0 ? 'solid' : 'mixed'} engagement with the topics.\n\n_Note: This was an offline simulation. Start the backend for AI-powered evaluation._`;
        }

        const mockFb = {
          summary: weakCount > totalCount * 0.5
            ? `${activeCandidate.member.name} struggled with most topics. ${weakCount} out of ${totalCount} responses were insufficient. ⚠️ Offline simulation mode.`
            : `${activeCandidate.member.name} participated across multiple curriculum areas with ${weakCount === 0 ? 'consistently adequate' : 'mixed'} depth. ⚠️ Offline simulation mode.`,
          strengths: weakCount > totalCount * 0.5
            ? ['Participated in the full interview session.', 'Attempted all assigned topics.']
            : ['Engaged with multiple curriculum topic areas.', 'Provided responses spanning early and late-stage days.'],
          gaps: weakCount > totalCount * 0.5
            ? [`${weakCount} responses were too brief, off-topic, or skipped.`, 'Responses lacked technical depth across most topics.', 'Core curriculum concepts appear unmastered.']
            : ['Backend unreachable — real LLM evaluation unavailable.', 'Depth of answers could not be fully verified in offline mode.'],
          next: ['Start backend (uvicorn backend.main:app --reload --port 8001) for real AI evaluation.', 'Review skipped/failed missions with hands-on practice.'],
        };
        setMessages([...updated, { role: 'assistant', content: closingMsg }]);
        setIsComplete(true);
        setFeedback(mockFb);
        setShowFeedback(true);
      } else {
        // Build response based on judgment
        let responsePrefix = '';
        switch (judgment) {
          case 'skipped':
            responsePrefix = retryCapReached
              ? `You indicated you're unsure about this topic. It is recorded as a **gap**, so we'll move on.\n\n`
              : `**Verdict: Insufficient** — please stay with **${curDay?.title || 'this topic'}** and try again with a concrete explanation.\n\n`;
            break;
          case 'too_brief':
            responsePrefix = retryCapReached
              ? `That answer was too brief to evaluate meaningfully, so it is marked **insufficient** and we'll move on.\n\n`
              : `**Verdict: Insufficient** — that answer is too brief to evaluate. Please answer the same topic with implementation details.\n\n`;
            break;
          case 'off_topic':
            responsePrefix = retryCapReached
              ? `Your answer did not address **${curDay?.title || 'the topic'}**, so it is recorded as **off-topic** and we'll move on.\n\n`
              : `**Verdict: Off-Topic** — the response does not address **${curDay?.title || 'the topic'}**. Please refocus on the original question.\n\n`;
            break;
          case 'vague':
            responsePrefix = retryCapReached
              ? `Your answer needs more depth. This is recorded as a **gap**, so we'll move on.\n\n`
              : `**Verdict: Needs depth** — stay on **${curDay?.title || 'this topic'}** and add concrete tools, steps, and tradeoffs.\n\n`;
            break;
          default:
            responsePrefix = '';
        }

        const question = shouldAdvance && nextIdx > currentTopicIdx
          ? `Moving to **Day ${questionDay?.day ?? 7} (${questionDay?.title ?? 'this topic'})**: explain the core concept, one implementation decision, and a tradeoff you would consider.`
          : `For **Day ${questionDay?.day ?? 7} (${questionDay?.title ?? 'this topic'})**: explain the core concept, the concrete tools or implementation steps you would use, and one tradeoff or failure mode.`;
        setMessages([...updated, { role: 'assistant', content: responsePrefix + question }]);
      }
      setIsLoading(false);
    }, 700);
  };

  const getCurrentTopic = () => {
    if (!targetDays.length) return null;
    return targetDays[currentTopicIdx] || targetDays[0];
  };

  // ─── RENDER ───────────────────────────────────────────────
  if (page === 'landing') {
    return <LandingPage onStart={() => setPage('select')} theme={theme} setTheme={setTheme} />;
  }

  if (page === 'select') {
    return (
      <CandidateSelect
        candidates={ALL_CANDIDATES}
        onSelect={handleSelectCandidate}
        onBack={() => setPage('landing')}
        theme={theme}
        setTheme={setTheme}
      />
    );
  }

  // Interview page — NO memory graph panel
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
          topicResults={topicResults}
          currentTopicIdx={currentTopicIdx}
          isComplete={isComplete}
        />

        <ChatStream
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          candidate={activeCandidate}
          isComplete={isComplete}
          onShowFeedback={() => setShowFeedback(true)}
          currentTopic={getCurrentTopic()}
        />
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
