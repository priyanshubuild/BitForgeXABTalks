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
  
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

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
