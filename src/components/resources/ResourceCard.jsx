import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Trash2, MessageCircle, Target, Brain, Zap, ChevronRight } from 'lucide-react';

const ResourceCard = ({ resource, onOpen, onQuickAction, onDelete }) => {
  const getDifficultyColor = (score) => {
    if (score <= 4) return '#22c55e'; // green
    if (score <= 7) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const totalConcepts = (resource.keyConcepts?.length || 0) + (resource.knowledgeGaps?.length || 0);
  const masteredCount = resource.studyProgress?.conceptsReviewed?.length || 0;
  const progressPercent = totalConcepts > 0 ? (masteredCount / totalConcepts) * 100 : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="resource-card relative group"
    >
      {/* Delete button */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        style={{ color: 'var(--error)' }}
      >
        <Trash2 size={14} />
      </button>

      <div className="flex justify-between items-start mb-4 pr-6">
        <div>
          <h3 className="font-heading text-lg mb-1" style={{ color: 'var(--text-primary)' }}>{resource.title}</h3>
          <div className="flex items-center gap-2">
            <FileText size={12} style={{ color: 'var(--text-muted)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{resource.fileName}</span>
          </div>
        </div>
        <span className="category-badge">{resource.category}</span>
      </div>

      {/* Difficulty badge */}
      {resource.difficultyData && (
        <div className="flex items-center gap-2 mb-3">
          <span 
            className="text-xs font-bold px-2 py-1 rounded"
            style={{ 
              background: `${getDifficultyColor(resource.difficultyData.overallScore)}20`,
              color: getDifficultyColor(resource.difficultyData.overallScore)
            }}
          >
            {resource.difficultyData.overallLabel} · {resource.difficultyData.overallScore}/10
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            ~{resource.difficultyData.estimatedStudyHours}h study
          </span>
        </div>
      )}

      {/* Progress bar */}
      {totalConcepts > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
            <span>Progress</span>
            <span>{masteredCount}/{totalConcepts} mastered</span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      )}

      {/* Quiz score */}
      {resource.quizProgress?.totalAttempts > 0 && (
        <div className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
          Best quiz score: {resource.quizProgress.bestScore}%
        </div>
      )}

      {resource.keyConcepts?.length > 0 && (
        <div className="mb-4">
          <h4 className="font-heading text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Key Concepts</h4>
          {resource.keyConcepts.slice(0, 3).map((c, i) => (
            <div key={i} className="concept-bullet text-xs">{c}</div>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={(e) => { e.stopPropagation(); onQuickAction('chat'); }}
          className="p-2 rounded-lg transition-colors"
          style={{ background: 'var(--surface-hover)', color: 'var(--accent)' }}
          title="Chat"
        >
          <MessageCircle size={16} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onQuickAction('quiz'); }}
          className="p-2 rounded-lg transition-colors"
          style={{ background: 'var(--surface-hover)', color: 'var(--accent)' }}
          title="Quiz"
        >
          <Target size={16} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onQuickAction('teach'); }}
          className="p-2 rounded-lg transition-colors"
          style={{ background: 'var(--surface-hover)', color: 'var(--accent)' }}
          title="Teach Me"
        >
          <Brain size={16} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onQuickAction('flash'); }}
          className="p-2 rounded-lg transition-colors"
          style={{ background: 'var(--surface-hover)', color: 'var(--accent)' }}
          title="Flashcards"
        >
          <Zap size={16} />
        </button>
      </div>

      {/* Open button */}
      <button
        onClick={onOpen}
        className="w-full notion-button justify-center"
      >
        Open <ChevronRight size={16} />
      </button>
    </motion.div>
  );
};

export default ResourceCard;
