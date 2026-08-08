import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import CandidateSidebar from './components/CandidateSidebar';
import ChatStream from './components/ChatStream';
import FeedbackModal from './components/FeedbackModal';
import { CANDIDATES_SAMPLE } from './data/mockData';

export default function App() {
  const [candidates, setCandidates] = useState(CANDIDATES_SAMPLE);
  const [selectedCandidateId, setSelectedCandidateId] = useState(CANDIDATES_SAMPLE[0].member.id);
  const [sessionId, setSessionId] = useState(`sess-${Date.now()}`);
  
  const [backendUrl, setBackendUrl] = useState('http://localhost:8001');
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  
  const [messages, setMessages] = useState([]);
  const [targetDays, setTargetDays] = useState([]);
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const [daysCovered, setDaysCovered] = useState(new Set());
  const [memories, setMemories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [theme, setTheme] = useState('dark');

  // Synchronize document theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const activeCandidate = candidates.find(c => c.member.id === selectedCandidateId) || candidates[0];

  // 1. Health check poll for FastAPI backend
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${backendUrl}/health`);
        if (res.ok) {
          setIsBackendOnline(true);
        } else {
          setIsBackendOnline(false);
        }
      } catch (e) {
        setIsBackendOnline(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 6000);
    return () => clearInterval(interval);
  }, [backendUrl]);

  // 2. Start or reset interview session
  const initSession = async (candidateObj, newSessionId) => {
    setIsLoading(true);
    setIsComplete(false);
    setFeedback(null);
    setMemories([]);
    setQuestionsAsked(1);
    
    // Derive initial target days
    const missions = candidateObj.missions || [];
    const passed = missions.filter(m => m.passed).slice(0, 4);
    const skipped = missions.filter(m => m.skipped || !m.passed).slice(0, 1);
    const combinedTargets = [...passed, ...skipped];
    
    const formattedTargets = combinedTargets.map(m => ({
      day: m.day,
      title: m.title,
      tools: ["Python", "FastAPI", "LLMs"],
      passed: !!m.passed,
      skipped: !!m.skipped,
      attempts: m.attempts || 1
    }));
    setTargetDays(formattedTargets);

    const initialCovered = new Set([formattedTargets[0]?.day || 7]);
    setDaysCovered(initialCovered);

    if (isBackendOnline) {
      try {
        const res = await fetch(`${backendUrl}/api/interview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: newSessionId,
            candidate: candidateObj
          })
        });
        const data = await res.json();
        setMessages([{ role: 'assistant', content: data.reply }]);
        if (data.memories && Array.isArray(data.memories)) {
          setMemories(data.memories);
        }
        setIsLoading(false);
        return;
      } catch (e) {
        console.warn('Backend call failed, using client fallback', e);
      }
    }

    // Client fallback initialization
    setTimeout(() => {
      const firstQ = `Welcome ${candidateObj.member.name}! Let's begin your technical evaluation. Starting with Day ${formattedTargets[0]?.day || 7} (${formattedTargets[0]?.title || 'Embeddings'}): Can you walk me through how you selected your text chunking size and distance metric for vector embeddings?`;
      setMessages([{ role: 'assistant', content: firstQ }]);
      setIsLoading(false);
    }, 600);
  };

  useEffect(() => {
    if (activeCandidate) {
      initSession(activeCandidate, sessionId);
    }
  }, [selectedCandidateId]);

  const handleResetSession = () => {
    const freshSessionId = `sess-${Date.now()}`;
    setSessionId(freshSessionId);
    initSession(activeCandidate, freshSessionId);
  };

  const handleSendMessage = async (text) => {
    const updatedMessages = [...messages, { role: 'user', content: text }];
    setMessages(updatedMessages);
    setIsLoading(true);

    if (isBackendOnline) {
      try {
        const res = await fetch(`${backendUrl}/api/interview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessionId,
            message: text
          })
        });
        const data = await res.json();

        setMessages([...updatedMessages, { role: 'assistant', content: data.reply }]);
        setQuestionsAsked(prev => prev + 1);
        
        // Pick up covered days dynamically
        if (targetDays[questionsAsked % targetDays.length]) {
          setDaysCovered(prev => new Set([...prev, targetDays[questionsAsked % targetDays.length].day]));
        }

        // Update memories from Breeth search
        if (data.memories && Array.isArray(data.memories)) {
          setMemories(prev => {
            const existingFacts = new Set(prev.map(m => m.fact.toLowerCase().trim()));
            const filteredNew = data.memories.filter(m => !existingFacts.has(m.fact.toLowerCase().trim()));
            return [...prev, ...filteredNew];
          });
        }

        if (data.done) {
          setIsComplete(true);
          setFeedback(data.feedback);
          setShowFeedbackModal(true);
        }
        setIsLoading(false);
        return;
      } catch (e) {
        console.warn('Backend turn failed, falling back', e);
      }
    }

    // Client fallback progression
    setTimeout(() => {
      const nextTurnNum = questionsAsked + 1;
      setQuestionsAsked(nextTurnNum);

      const targetIndex = (nextTurnNum - 1) % targetDays.length;
      const currentTarget = targetDays[targetIndex] || targetDays[0];
      setDaysCovered(prev => new Set([...prev, currentTarget.day]));

      if (nextTurnNum >= 8 && daysCovered.size >= 3) {
        const finalReply = "Thank you for answering all my technical questions today! That completes our evaluation.";
        const mockFeedback = {
          summary: `${activeCandidate.member.name} demonstrated strong competency across vector embeddings, retrieval engines, prompt engineering, and multi-agent workflows.`,
          strengths: [
            "Clear understanding of text chunking and vector database indexing",
            "Practical experience with FastAPI backend session management",
            "Solid grasp of multi-agent routing architectures"
          ],
          gaps: [
            "Could elaborate further on container observability probes (Day 29)",
            "Could provide more details on token cost optimization metrics"
          ],
          next: [
            "Implement OpenTelemetry tracing across FastAPI endpoints",
            "Explore hybrid BM25 + vector re-ranking for RAG optimization"
          ]
        };

        setMessages([...updatedMessages, { role: 'assistant', content: finalReply }]);
        setIsComplete(true);
        setFeedback(mockFeedback);
        setShowFeedbackModal(true);
      } else {
        const followUps = [
          `Great explanation regarding '${text.slice(0, 30)}...'. Next, focusing on Day ${currentTarget.day} (${currentTarget.title}): How did you optimize query latency and handle metadata filtering in production?`,
          `That makes sense. Moving to Day ${currentTarget.day} (${currentTarget.title}): What specific fallback mechanisms did you put in place when external LLM API calls fail or timeout?`,
          `Understood. Regarding Day ${currentTarget.day} (${currentTarget.title}): How did you evaluate whether prompt engineering was sufficient versus needing fine-tuning with LoRA?`
        ];
        const chosenReply = followUps[(nextTurnNum - 1) % followUps.length];
        setMessages([...updatedMessages, { role: 'assistant', content: chosenReply }]);
      }
      setIsLoading(false);
    }, 750);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', background: 'var(--bg-dark)' }}>
      <Header 
        candidates={candidates}
        selectedCandidateId={selectedCandidateId}
        onSelectCandidate={(id) => {
          setSelectedCandidateId(id);
          const freshId = `sess-${Date.now()}`;
          setSessionId(freshId);
        }}
        onResetSession={handleResetSession}
        isBackendOnline={isBackendOnline}
        backendUrl={backendUrl}
        setBackendUrl={setBackendUrl}
        sessionId={sessionId}
        theme={theme}
        setTheme={setTheme}
      />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
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
          onShowFeedback={() => setShowFeedbackModal(true)}
        />

        {/* Candidate Memory Graph sidebar */}
        <div style={{
          width: '300px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-card)',
          borderLeft: '1px solid var(--border-color)',
          overflowY: 'auto',
          color: 'var(--text-main)',
          fontFamily: "var(--font-family)"
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-card)'
          }}>
            <span style={{ fontSize: '1.25rem' }}>🧠</span>
            <h2 style={{
              fontSize: '1rem',
              fontWeight: '700',
              color: 'var(--text-main)',
              margin: 0,
              fontFamily: "var(--font-display)"
            }}>Things Learned</h2>
          </div>
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: '1', minHeight: 0 }}>
            {memories.length === 0 ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center',
                color: 'var(--text-dim)',
                fontSize: '0.8rem',
                padding: '16px'
              }}>
                <p>Memory graph is empty. Formulate a substantive technical reply to write memory nodes.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {memories.map((m, idx) => (
                  <div key={idx} style={{
                    backgroundColor: 'var(--bg-dark)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        backgroundColor: 'var(--primary-glow)',
                        color: 'var(--primary)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: '1px solid var(--border-color)'
                      }}>{m.source_node}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>➔</span>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        backgroundColor: 'var(--primary-glow)',
                        color: 'var(--primary)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: '1px solid var(--border-color)'
                      }}>{m.target_node}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', lineHeight: '1.4', color: 'var(--text-main)' }}>{m.fact}</div>
                    {m.cognitive_pattern && (
                      <div style={{
                        fontSize: '0.7rem',
                        color: 'var(--emerald)',
                        backgroundColor: 'var(--emerald-glow)',
                        border: '1px solid var(--border-color)',
                        padding: '3px 6px',
                        borderRadius: '4px',
                        marginTop: '2px'
                      }}>
                        <strong>Cognitive Pattern:</strong> {m.cognitive_pattern}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showFeedbackModal && (
        <FeedbackModal 
          feedback={feedback}
          candidate={activeCandidate}
          onRestart={handleResetSession}
          onClose={() => setShowFeedbackModal(false)}
        />
      )}
    </div>
  );
}
