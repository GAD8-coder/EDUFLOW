import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { generateStudyPlan } from '../../lib/groq';
import { X, Calendar, RotateCcw, Copy, Check } from 'lucide-react';

const StudyPlanModal = ({ resource, onClose }) => {
  const [examDate, setExamDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [studyPlan, setStudyPlan] = useState('');
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const generatePlan = async () => {
    if (!examDate) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const plan = await generateStudyPlan(resource, examDate);
      setStudyPlan(plan);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(studyPlan);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Parse plan into day sections for better display
  const parsePlanDays = () => {
    if (!studyPlan) return [];
    const days = studyPlan.split(/Day \d+/i).filter(Boolean);
    return days.map((content, i) => ({
      day: i + 1,
      content: content.trim()
    }));
  };

  const daySections = parsePlanDays();
  const dayColors = ['var(--accent)', 'var(--info)', 'var(--warning)', 'var(--success)', '#8b5cf6'];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="notion-card max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Calendar size={20} style={{ color: 'var(--accent)' }} />
            <h3 className="font-heading text-xl">Build Your Study Plan</h3>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Resource context */}
        <div className="mb-6 p-4 rounded-lg" style={{ background: 'var(--surface-hover)' }}>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>For:</p>
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{resource.title}</p>
        </div>

        {/* Date picker */}
        {!studyPlan && (
          <div className="mb-6">
            <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
              When is your exam?
            </label>
            <div className="flex gap-3">
              <input
                type="date"
                value={examDate}
                onChange={e => setExamDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="flex-1"
              />
              <button 
                onClick={generatePlan} 
                disabled={!examDate || isGenerating}
                className="notion-button"
              >
                {isGenerating ? <RotateCcw size={16} className="animate-spin" /> : 'Generate Plan'}
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {isGenerating && (
          <div className="text-center py-8">
            <RotateCcw size={32} className="animate-spin mx-auto mb-4" style={{ color: 'var(--accent)' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Crafting your personalized schedule...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--error)' }}>
            <p className="text-sm text-red-400">⚠️ {error}</p>
            <button onClick={generatePlan} className="notion-small-button mt-2">
              <RotateCcw size={12} /> Retry
            </button>
          </div>
        )}

        {/* Results */}
        {studyPlan && !isGenerating && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-heading text-lg" style={{ color: 'var(--text-primary)' }}>Your Study Plan</h4>
              <div className="flex gap-2">
                <button onClick={copyToClipboard} className="notion-small-button">
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy to Clipboard'}
                </button>
                <button onClick={() => setStudyPlan('')} className="notion-small-button" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                  Regenerate
                </button>
              </div>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {daySections.map((day, i) => (
                <div 
                  key={i} 
                  className="notion-card"
                  style={{ borderLeft: `4px solid ${dayColors[i % dayColors.length]}` }}
                >
                  <h5 className="font-heading text-base mb-2" style={{ color: dayColors[i % dayColors.length] }}>
                    Day {day.day}
                  </h5>
                  <pre className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-secondary)', fontFamily: 'inherit' }}>
                    {day.content}
                  </pre>
                </div>
              ))}
            </div>

            {/* Raw plan text */}
            <details className="mt-4">
              <summary className="cursor-pointer text-sm" style={{ color: 'var(--text-muted)' }}>View raw plan</summary>
              <pre className="mt-2 p-4 rounded-lg text-sm whitespace-pre-wrap" style={{ background: 'var(--surface-hover)', color: 'var(--text-secondary)' }}>
                {studyPlan}
              </pre>
            </details>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default StudyPlanModal;
