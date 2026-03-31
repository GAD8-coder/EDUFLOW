import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { analyzeDifficulty } from '../../lib/groq';
import { X, BarChart3, RotateCcw, Clock, BookOpen } from 'lucide-react';

const DifficultyPanel = ({ resource, onClose }) => {
  const { updateResource } = useApp();
  const [difficultyData, setDifficultyData] = useState(resource.difficultyData);
  const [isLoading, setIsLoading] = useState(!resource.difficultyData);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!difficultyData) {
      loadDifficulty();
    }
  }, []);

  const loadDifficulty = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await analyzeDifficulty(resource.extractedText);
      setDifficultyData(data);
      updateResource(resource.id, { difficultyData: data });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score <= 4) return '#22c55e';
    if (score <= 7) return '#f59e0b';
    return '#ef4444';
  };

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = difficultyData 
    ? circumference - (difficultyData.overallScore / 10) * circumference 
    : circumference;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="notion-card max-w-xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <BarChart3 size={20} style={{ color: 'var(--accent)' }} />
            <h3 className="font-heading text-xl">Difficulty Analysis</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadDifficulty} disabled={isLoading} className="notion-small-button">
              <RotateCcw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <RotateCcw size={48} className="animate-spin mx-auto mb-4" style={{ color: 'var(--accent)' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Analyzing difficulty...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-400 mb-4">⚠️ {error}</p>
            <button onClick={loadDifficulty} className="notion-button">
              <RotateCcw size={16} /> Retry
            </button>
          </div>
        ) : difficultyData ? (
          <div>
            {/* Difficulty Circle */}
            <div className="difficulty-circle-wrap">
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle
                  cx="60" cy="60" r="45"
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="8"
                />
                <circle
                  cx="60" cy="60" r="45"
                  fill="none"
                  stroke={getScoreColor(difficultyData.overallScore)}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90 60 60)"
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
                <text
                  x="60" y="60"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="28"
                  fontWeight="bold"
                  fill="var(--text-primary)"
                >
                  {difficultyData.overallScore}
                </text>
              </svg>
              <p className="font-heading text-xl mt-2" style={{ color: getScoreColor(difficultyData.overallScore) }}>
                {difficultyData.overallLabel}
              </p>
              <p className="text-sm text-center mt-1" style={{ color: 'var(--text-secondary)' }}>
                {difficultyData.summary}
              </p>
            </div>

            {/* Study time estimate */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ background: 'var(--surface-hover)' }}>
                <Clock size={16} style={{ color: 'var(--accent)' }} />
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  ~{difficultyData.estimatedStudyHours} hours
                </span>
              </div>
            </div>

            {/* Section breakdown */}
            {difficultyData.sections?.length > 0 && (
              <div className="mb-6">
                <h4 className="font-heading text-base mb-3" style={{ color: 'var(--text-primary)' }}>
                  Section Breakdown
                </h4>
                <div className="space-y-3">
                  {difficultyData.sections.map((section, i) => (
                    <div key={i} className="p-3 rounded-lg" style={{ background: 'var(--surface-hover)' }}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{section.topic}</span>
                        <span 
                          className="text-sm font-bold"
                          style={{ color: getScoreColor(section.difficulty) }}
                        >
                          {section.label}
                        </span>
                      </div>
                      <div className="progress-bar-track mb-2">
                        <div 
                          className="progress-bar-fill" 
                          style={{ 
                            width: `${section.difficulty * 10}%`,
                            background: getScoreColor(section.difficulty)
                          }} 
                        />
                      </div>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        💡 {section.tip}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prerequisite knowledge */}
            {difficultyData.prerequisiteKnowledge?.length > 0 && (
              <div className="mb-4">
                <h4 className="font-heading text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
                  <BookOpen size={14} className="inline mr-1" /> Prerequisite Knowledge
                </h4>
                <div className="flex flex-wrap gap-2">
                  {difficultyData.prerequisiteKnowledge.map((prereq, i) => (
                    <span 
                      key={i}
                      className="text-xs px-2 py-1 rounded"
                      style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}
                    >
                      {prereq}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Hardest concepts */}
            {difficultyData.hardestConcepts?.length > 0 && (
              <div>
                <h4 className="font-heading text-sm mb-2" style={{ color: 'var(--error)' }}>
                  ⚠️ Hardest Concepts (Focus Here)
                </h4>
                <div className="flex flex-wrap gap-2">
                  {difficultyData.hardestConcepts.map((concept, i) => (
                    <span 
                      key={i}
                      className="text-xs px-2 py-1 rounded"
                      style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}
                    >
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </motion.div>
    </motion.div>
  );
};

export default DifficultyPanel;
