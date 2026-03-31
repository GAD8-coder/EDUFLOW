import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { teachMeStep } from '../../lib/groq';
import { X, Brain, Send, RotateCcw, CheckCircle, ArrowRight } from 'lucide-react';

const TeachMeMode = ({ resource, onClose }) => {
  const { updateResource } = useApp();
  const [selectedConcept, setSelectedConcept] = useState('');
  const [customConcept, setCustomConcept] = useState('');
  const [sessionState, setSessionState] = useState('setup'); // setup, session, complete
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [error, setError] = useState(null);
  const [masterySummary, setMasterySummary] = useState('');

  const startSession = async (concept) => {
    setSelectedConcept(concept);
    setSessionState('session');
    setTurnCount(1);
    setIsTyping(true);
    setError(null);

    try {
      const response = await teachMeStep(resource.extractedText, concept, []);
      setMessages([{ role: 'assistant', content: response }]);
    } catch (err) {
      setError(err.message);
      setIsTyping(false);
    } finally {
      setIsTyping(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);
    setTurnCount(turnCount + 1);

    try {
      const conversationHistory = newMessages.map(m => ({ role: m.role, content: m.content }));
      const response = await teachMeStep(resource.extractedText, selectedConcept, conversationHistory);
      
      setMessages([...newMessages, { role: 'assistant', content: response }]);
      
      // Check if session should end (after ~6 turns or if AI indicates mastery)
      if (turnCount >= 5 || response.toLowerCase().includes('summary') || response.toLowerCase().includes('mastered')) {
        setMasterySummary(response);
        setSessionState('complete');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsTyping(false);
    }
  };

  const markAsMastered = () => {
    const currentProgress = resource.studyProgress || { flashcardsReviewed: [], conceptsReviewed: [], totalStudyMinutes: 0 };
    updateResource(resource.id, {
      studyProgress: {
        ...currentProgress,
        conceptsReviewed: [...currentProgress.conceptsReviewed, selectedConcept]
      }
    });
    onClose();
  };

  const goDeeper = () => {
    setTurnCount(0);
    setMessages([]);
    setSessionState('setup');
    setMasterySummary('');
  };

  const getProgressPercent = () => Math.min(100, (turnCount / 6) * 100);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex flex-col"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="flex-1 flex flex-col bg-[var(--background)] m-4 rounded-xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="teach-session-header">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Brain size={20} style={{ color: 'var(--accent)' }} />
              <h3 className="font-heading text-lg">
                {sessionState === 'setup' ? 'Teach Me Mode' : `Teaching: ${selectedConcept}`}
              </h3>
            </div>
            <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
          </div>
          
          {sessionState === 'session' && (
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                <span>Session Progress</span>
                <span>Turn {turnCount} of ~6</span>
              </div>
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${getProgressPercent()}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Setup State */}
        {sessionState === 'setup' && (
          <div className="flex-1 overflow-y-auto p-6">
            <h4 className="font-heading text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
              Choose a concept to master
            </h4>
            
            {resource.keyConcepts?.length > 0 && (
              <div className="mb-6">
                <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>From this document:</p>
                <div className="flex flex-wrap gap-2">
                  {resource.keyConcepts.map((concept, i) => (
                    <button
                      key={i}
                      onClick={() => startSession(concept)}
                      className="notion-small-button text-sm"
                      style={{ 
                        padding: '0.5rem 1rem',
                        background: resource.studyProgress?.conceptsReviewed?.includes(concept) ? 'var(--accent)' : undefined,
                        color: resource.studyProgress?.conceptsReviewed?.includes(concept) ? 'var(--background)' : undefined
                      }}
                    >
                      {concept}
                      {resource.studyProgress?.conceptsReviewed?.includes(concept) && <CheckCircle size={12} className="ml-1" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>Or enter a custom concept:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customConcept}
                  onChange={e => setCustomConcept(e.target.value)}
                  placeholder="e.g., Quantum entanglement"
                  className="flex-1"
                />
                <button 
                  onClick={() => customConcept && startSession(customConcept)}
                  disabled={!customConcept.trim()}
                  className="notion-button"
                >
                  Start Session
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Session State */}
        {sessionState === 'session' && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] p-3 rounded-xl ${
                      msg.role === 'user' 
                        ? 'chat-bubble-user' 
                        : 'chat-bubble-ai'
                    }`}
                    style={msg.role === 'assistant' ? { background: 'rgba(0,255,135,0.05)' } : {}}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="chat-bubble-ai flex gap-1" style={{ background: 'rgba(0,255,135,0.05)' }}>
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                  </div>
                </motion.div>
              )}

              {error && (
                <div className="flex justify-center">
                  <div className="notion-card" style={{ borderColor: 'var(--error)', background: 'rgba(239,68,68,0.1)' }}>
                    <p className="text-sm text-red-400">⚠️ {error}</p>
                    <button onClick={sendMessage} className="notion-small-button mt-2">
                      <RotateCcw size={12} /> Retry
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Type your response..."
                  className="flex-1"
                  disabled={isTyping}
                />
                <button 
                  onClick={sendMessage} 
                  disabled={!input.trim() || isTyping}
                  className="notion-button"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Complete State */}
        {sessionState === 'complete' && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mastery-banner">
              <CheckCircle size={48} className="mx-auto mb-4" style={{ color: 'var(--accent)' }} />
              <h4 className="font-heading text-xl mb-2" style={{ color: 'var(--text-primary)' }}>
                Session Complete!
              </h4>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                You've explored <strong>{selectedConcept}</strong> through Socratic questioning.
              </p>
              <div className="flex gap-3 justify-center">
                <button onClick={markAsMastered} className="notion-button">
                  <CheckCircle size={16} /> Mark as Mastered
                </button>
                <button onClick={goDeeper} className="notion-small-button">
                  <ArrowRight size={16} /> Go Deeper
                </button>
              </div>
            </div>
            
            <div className="mt-4">
              <h5 className="font-heading text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Session Summary:</h5>
              <div className="notion-card" style={{ background: 'var(--surface-hover)' }}>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{masterySummary}</p>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default TeachMeMode;
