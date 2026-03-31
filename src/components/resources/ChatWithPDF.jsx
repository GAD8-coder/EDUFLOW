import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { chatWithPDF } from '../../lib/groq';
import { X, Send, Brain, RotateCcw } from 'lucide-react';

const ChatWithPDF = ({ resource, onClose }) => {
  const { updateResource } = useApp();
  const [messages, setMessages] = useState(resource.chatHistory || []);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const suggestedQuestions = [
    "Summarize this document in simple terms",
    "What would likely appear on an exam?",
    "Explain the hardest concept here",
    "What should I know before studying this?"
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (text) => {
    if (!text.trim()) return;
    
    const userMessage = { role: 'user', content: text, timestamp: Date.now() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);
    setError(null);

    try {
      const conversationHistory = newMessages.map(m => ({ role: m.role, content: m.content }));
      const response = await chatWithPDF(resource.extractedText, conversationHistory);
      
      const aiMessage = { role: 'assistant', content: response, timestamp: Date.now() };
      const updatedMessages = [...newMessages, aiMessage];
      setMessages(updatedMessages);
      
      // Save to resource
      updateResource(resource.id, { chatHistory: updatedMessages });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsTyping(false);
    }
  };

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
        <div className="flex justify-between items-center p-4 border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <div className="flex items-center gap-2">
            <Brain size={20} style={{ color: 'var(--accent)' }} />
            <h3 className="font-heading text-lg">Chat with {resource.title}</h3>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Start the conversation with a suggested question:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q)}
                    className="notion-small-button text-sm"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`chat-bubble-${msg.role === 'user' ? 'user' : 'ai'}`}>
                <p className="text-sm">{msg.content}</p>
                <span className="text-xs opacity-50 mt-1 block">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </motion.div>
          ))}
          
          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="chat-bubble-ai flex gap-1">
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
                <button onClick={() => handleSend(input)} className="notion-small-button mt-2">
                  <RotateCcw size={12} /> Retry
                </button>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend(input)}
              placeholder="Ask anything about this document..."
              className="flex-1"
              disabled={isTyping}
            />
            <button 
              onClick={() => handleSend(input)} 
              disabled={!input.trim() || isTyping}
              className="notion-button"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ChatWithPDF;
