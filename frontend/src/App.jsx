import React, { useState, useEffect, useRef } from 'react';
import candidatesData from '../../candidates.json';

const BACKEND_URL = 'http://localhost:8001';

export default function App() {
  const [candidates] = useState(candidatesData.candidates || []);
  const [selectedId, setSelectedId] = useState(candidates[0]?.member?.id || '');
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [memories, setMemories] = useState([]);
  const [statusMessage, setStatusMessage] = useState('Select a candidate and click "Start Interview"');
  const [theme, setTheme] = useState('dark');

  const messagesEndRef = useRef(null);

  // Synchronize document theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Auto-scroll chat to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const activeCandidate = candidates.find(c => c.member.id === selectedId) || candidates[0];

  const handleStartInterview = async () => {
    if (!activeCandidate) return;

    setIsLoading(true);
    setIsDone(false);
    setFeedback(null);
    setMemories([]);
    setMessages([]);
    setInputText('');
    
    const newSessionId = `sess-${Date.now()}`;
    setSessionId(newSessionId);
    setStatusMessage(`Initializing session for ${activeCandidate.member.name}...`);

    try {
      const res = await fetch(`${BACKEND_URL}/api/interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: newSessionId,
          candidate: activeCandidate
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned status: ${res.status}`);
      }

      const data = await res.json();
      setMessages([{ role: 'assistant', content: data.reply }]);
      setIsDone(data.done || false);
      setFeedback(data.feedback || null);
      if (data.memories && Array.isArray(data.memories)) {
        setMemories(data.memories);
      }
      setStatusMessage(`Interview active: Session ID ${newSessionId}`);
    } catch (error) {
      console.error('Error starting interview:', error);
      setStatusMessage(`Error: ${error.message}. Is backend server running on ${BACKEND_URL}?`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || isLoading || isDone) return;

    // Append user message immediately
    const userMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId,
          message: text
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned status: ${res.status}`);
      }

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      setIsDone(data.done || false);
      
      // Update running memory items retrieved from Breeth search
      if (data.memories && Array.isArray(data.memories)) {
        setMemories(prev => {
          const existingFacts = new Set(prev.map(m => m.fact.toLowerCase().trim()));
          const filteredNew = data.memories.filter(m => !existingFacts.has(m.fact.toLowerCase().trim()));
          return [...prev, ...filteredNew];
        });
      }

      if (data.done) {
        setFeedback(data.feedback || null);
        setStatusMessage('Interview completed. Structured feedback generated.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `⚠️ Failed to send response: ${error.message}. Please try again.` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Header bar */}
      <header style={styles.header}>
        <div style={styles.titleContainer}>
          <span style={styles.emoji}>🤖</span>
          <h1 style={styles.title}>AI Interview Simulator</h1>
          <span style={styles.badge}>Local Test Client</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={styles.status}>{statusMessage}</div>
          {/* Theme Toggle Button */}
          <button 
            onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
            style={styles.btnTheme}
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      {/* Control Panel */}
      <div style={styles.controlPanel}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Select Candidate Profile:</label>
          <select 
            style={styles.select} 
            value={selectedId} 
            onChange={(e) => setSelectedId(e.target.value)}
            disabled={isLoading || (sessionId && !isDone)}
          >
            {candidates.map(c => (
              <option key={c.member.id} value={c.member.id}>
                {c.member.name} — {c.member.jobRole} ({c.member.yearsExperience} yrs exp)
              </option>
            ))}
          </select>
        </div>
        <button 
          style={styles.btnStart} 
          onClick={handleStartInterview}
          disabled={isLoading}
        >
          {sessionId && !isDone ? 'Restart Interview' : 'Start Interview'}
        </button>
      </div>

      {/* Main Workspace Layout */}
      <div style={styles.workspace}>
        {/* Chat Feed */}
        <div style={styles.chatSection}>
          <div style={styles.chatFeed}>
            {messages.length === 0 ? (
              <div style={styles.emptyState}>
                <p>No active interview. Choose a candidate profile above and click "Start Interview" to begin your technical evaluation dialogue.</p>
              </div>
            ) : (
              messages.map((m, idx) => (
                <div 
                  key={idx} 
                  style={{
                    ...styles.messageRow,
                    justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div 
                    style={{
                      ...styles.bubble,
                      ...(m.role === 'user' ? styles.bubbleUser : styles.bubbleAI)
                    }}
                  >
                    <div style={styles.bubbleHeader}>
                      {m.role === 'user' ? 'Candidate' : 'Interviewer'}
                    </div>
                    <div>{m.content}</div>
                  </div>
                </div>
              ))
            )}
            
            {isLoading && (
              <div style={{ ...styles.messageRow, justifyContent: 'flex-start' }}>
                <div style={{ ...styles.bubble, ...styles.bubbleAI, opacity: 0.8 }}>
                  <div style={styles.typingIndicator}>
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Panel */}
          <form style={styles.inputArea} onSubmit={handleSendMessage}>
            <input 
              style={styles.input} 
              type="text" 
              placeholder={
                isDone 
                  ? "Interview finished. Check the evaluation feedback below." 
                  : !sessionId 
                    ? "Start the interview to unlock responses..." 
                    : "Type your technical answer here..."
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isLoading || isDone || !sessionId}
            />
            <button 
              type="submit" 
              style={{
                ...styles.btnSend,
                opacity: isLoading || isDone || !sessionId || !inputText.trim() ? 0.6 : 1
              }}
              disabled={isLoading || isDone || !sessionId || !inputText.trim()}
            >
              Send
            </button>
          </form>
        </div>

        {/* Candidate Memory Graph sidebar */}
        {sessionId && (
          <div style={styles.memorySection}>
            <div style={styles.memoryHeader}>
              <span style={{ fontSize: '1.25rem' }}>🧠</span>
              <h2 style={styles.panelTitle}>Things Learned</h2>
            </div>
            <div style={styles.memoryContent}>
              {memories.length === 0 ? (
                <div style={styles.memoryEmpty}>
                  <p>Memory graph is empty. Formulate a substantive technical reply to write memory nodes.</p>
                </div>
              ) : (
                <div style={styles.memoryList}>
                  {memories.map((m, idx) => (
                    <div key={idx} style={styles.memoryCard}>
                      <div style={styles.memoryMeta}>
                        <span style={styles.memoryNode}>{m.source_node}</span>
                        <span style={styles.memoryRelation}>➔</span>
                        <span style={styles.memoryNode}>{m.target_node}</span>
                      </div>
                      <div style={styles.memoryFact}>{m.fact}</div>
                      {m.cognitive_pattern && (
                        <div style={styles.memoryPattern}>
                          <strong>Cognitive Pattern:</strong> {m.cognitive_pattern}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Feedback Panel */}
        {isDone && feedback && (
          <div style={styles.feedbackSection}>
            <div style={styles.feedbackHeader}>
              <span style={{ fontSize: '1.25rem' }}>🏆</span>
              <h2 style={styles.panelTitle}>Evaluation Report</h2>
            </div>
            
            <div style={styles.feedbackContent}>
              <div style={styles.sectionBlock}>
                <h3 style={styles.sectionTitle}>Summary</h3>
                <p style={styles.summaryText}>{feedback.summary}</p>
              </div>

              <div style={styles.gridContainer}>
                <div style={styles.sectionBlock}>
                  <h3 style={{ ...styles.sectionTitle, color: 'var(--emerald)' }}>Strengths</h3>
                  <ul style={styles.list}>
                    {feedback.strengths?.map((item, i) => (
                      <li key={i} style={styles.listItem}>
                        <span style={{ color: 'var(--emerald)', marginRight: '8px' }}>✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={styles.sectionBlock}>
                  <h3 style={{ ...styles.sectionTitle, color: 'var(--rose)' }}>Gaps & Weaknesses</h3>
                  <ul style={styles.list}>
                    {feedback.gaps?.map((item, i) => (
                      <li key={i} style={styles.listItem}>
                        <span style={{ color: 'var(--rose)', marginRight: '8px' }}>⚠</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div style={styles.sectionBlock}>
                <h3 style={{ ...styles.sectionTitle, color: 'var(--primary)' }}>Next Steps & Recommendations</h3>
                <ul style={styles.list}>
                  {feedback.next?.map((item, i) => (
                    <li key={i} style={styles.listItem}>
                      <span style={{ color: 'var(--primary)', marginRight: '8px' }}>→</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// In-line styles for self-containment & clean styling
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    maxHeight: '100vh',
    width: '100vw',
    backgroundColor: 'var(--bg-dark)',
    color: 'var(--text-main)',
    fontFamily: "var(--font-family)",
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 24px',
    backgroundColor: 'var(--bg-card)',
    borderBottom: '1px solid var(--border-color)',
  },
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  emoji: {
    fontSize: '1.6rem',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: 'var(--text-main)',
    margin: 0,
    fontFamily: "var(--font-display)",
  },
  badge: {
    backgroundColor: 'var(--primary-glow)',
    color: 'var(--primary)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '2px 8px',
    fontSize: '0.7rem',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  status: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
  },
  btnTheme: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    cursor: 'pointer',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.9rem',
    outline: 'none',
  },
  controlPanel: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '16px 24px',
    backgroundColor: 'var(--bg-dark)',
    borderBottom: '1px solid var(--border-color)',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: '1',
    maxWidth: '400px',
  },
  label: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    fontWeight: '500',
  },
  select: {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-main)',
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: '0.9rem',
    outline: 'none',
    cursor: 'pointer',
    width: '100%',
  },
  btnStart: {
    backgroundColor: 'var(--primary)',
    border: 'none',
    color: '#fff',
    borderRadius: '6px',
    padding: '10px 20px',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    alignSelf: 'flex-end',
  },
  workspace: {
    display: 'flex',
    flex: '1',
    minHeight: 0,
    overflow: 'hidden',
  },
  chatSection: {
    display: 'flex',
    flexDirection: 'column',
    flex: '1',
    backgroundColor: 'var(--bg-dark)',
    overflow: 'hidden',
  },
  chatFeed: {
    flex: '1',
    padding: '24px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  emptyState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center',
    color: 'var(--text-muted)',
    padding: '40px',
  },
  messageRow: {
    display: 'flex',
    width: '100%',
  },
  bubble: {
    padding: '12px 16px',
    borderRadius: '12px',
    maxWidth: '70%',
    lineHeight: '1.5',
    fontSize: '0.95rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
  },
  bubbleAI: {
    backgroundColor: 'var(--bg-card)',
    color: 'var(--text-main)',
    borderBottomLeftRadius: '2px',
    border: '1px solid var(--border-color)',
  },
  bubbleUser: {
    backgroundColor: 'var(--primary)',
    color: '#ffffff',
    borderBottomRightRadius: '2px',
  },
  bubbleHeader: {
    fontSize: '0.75rem',
    fontWeight: '600',
    marginBottom: '4px',
    opacity: 0.8,
  },
  inputArea: {
    display: 'flex',
    padding: '16px 24px',
    borderTop: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-card)',
    gap: '12px',
  },
  input: {
    flex: '1',
    backgroundColor: 'var(--bg-dark)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-main)',
    borderRadius: '6px',
    padding: '12px 16px',
    fontSize: '0.95rem',
    outline: 'none',
  },
  btnSend: {
    backgroundColor: 'var(--primary)',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '0 24px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  memorySection: {
    width: '320px',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--bg-card)',
    borderLeft: '1px solid var(--border-color)',
    overflowY: 'auto',
  },
  memoryHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '20px 24px',
    borderBottom: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-card)',
  },
  panelTitle: {
    fontSize: '1rem',
    fontWeight: '700',
    color: 'var(--text-main)',
    margin: 0,
    fontFamily: "var(--font-display)",
  },
  memoryContent: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    flex: '1',
    minHeight: 0,
  },
  memoryEmpty: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '0.8rem',
    padding: '16px',
  },
  memoryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  memoryCard: {
    backgroundColor: 'var(--bg-dark)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  memoryMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
  },
  memoryNode: {
    fontSize: '0.7rem',
    fontWeight: '600',
    backgroundColor: 'var(--primary-glow)',
    color: 'var(--primary)',
    padding: '2px 6px',
    borderRadius: '4px',
    border: '1px solid var(--border-color)',
  },
  memoryRelation: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  },
  memoryFact: {
    fontSize: '0.8rem',
    lineHeight: '1.4',
    color: 'var(--text-main)',
  },
  memoryPattern: {
    fontSize: '0.7rem',
    color: 'var(--emerald)',
    backgroundColor: 'var(--emerald-glow)',
    border: '1px solid var(--border-color)',
    padding: '3px 6px',
    borderRadius: '4px',
    marginTop: '2px',
  },
  feedbackSection: {
    width: '380px',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--bg-card)',
    borderLeft: '1px solid var(--border-color)',
    overflowY: 'auto',
  },
  feedbackHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '20px 24px',
    borderBottom: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-card)',
  },
  feedbackContent: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  sectionBlock: {
    backgroundColor: 'var(--bg-dark)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '16px',
  },
  sectionTitle: {
    fontSize: '0.85rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '10px',
    color: 'var(--text-muted)',
    fontFamily: "var(--font-display)",
  },
  summaryText: {
    fontSize: '0.85rem',
    lineHeight: '1.6',
    margin: 0,
    color: 'var(--text-main)',
  },
  gridContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  listItem: {
    fontSize: '0.8rem',
    lineHeight: '1.4',
    color: 'var(--text-main)',
    display: 'flex',
    alignItems: 'flex-start',
  },
  typingIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 0',
    width: '32px',
    height: '12px',
  },
};
