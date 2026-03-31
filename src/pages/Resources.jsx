import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { analyzePDF, generateFlashcards, analyzeDifficulty } from '../lib/groq';
import * as pdfjsLib from 'pdfjs-dist';
import { Upload, FileText, RotateCcw, X, Sparkles, BookOpen, Trash2, MessageCircle, Target, Map, Calendar, Brain, Zap, Package, BarChart3, ArrowLeft, Link2 } from 'lucide-react';
import UploadZone from '../components/resources/UploadZone';
import ResourceCard from '../components/resources/ResourceCard';
import ChatWithPDF from '../components/resources/ChatWithPDF';
import QuizModal from '../components/resources/QuizModal';
import ConceptMap from '../components/resources/ConceptMap';
import StudyPlanModal from '../components/resources/StudyPlanModal';
import TeachMeMode from '../components/resources/TeachMeMode';
import CrossDocumentModal from '../components/resources/CrossDocumentModal';
import ExportModal from '../components/resources/ExportModal';
import DifficultyPanel from '../components/resources/DifficultyPanel';
import FlashcardModal from '../components/resources/FlashcardModal';

try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
} catch {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.js', import.meta.url).toString();
}

const Resources = () => {
  const { resources, addResource, removeResource, updateResource } = useApp();
  const [activeResource, setActiveResource] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [lastError, setLastError] = useState(null);
  const [retryCallback, setRetryCallback] = useState(null);
  const [pageError, setPageError] = useState(null);

  // Debug logging
  console.log('Resources render:', { resourcesCount: resources?.length, activeResource, pageError });

  const closeModal = () => setActiveModal(null);

  const handleQuickAction = (resource, action) => {
    setActiveResource(resource);
    setActiveModal(action);
  };

  // Library View
  if (!activeResource) {
    return (
      <div>
        <div className="notion-section">
          <h1 className="notion-section-header">Resources</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            Upload your study materials and turn them into an academic weapon.
          </p>
        </div>

        {/* Upload Zone */}
        <div className="notion-section">
          <UploadZone 
            onUploadStart={() => setIsUploading(true)} 
            onUploadEnd={() => setIsUploading(false)}
            onError={(err, retry) => {
              setLastError(err);
              setRetryCallback(retry);
            }}
          />
        </div>

        {/* Cross-Document Analysis button */}
        {resources.length >= 2 && (
          <div className="notion-section">
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setActiveModal('cross')}
              className="notion-small-button flex items-center gap-2 w-full justify-center py-3"
              style={{ borderColor: 'var(--info)', color: 'var(--info)' }}
            >
              <Link2 size={16} />
              Find Connections Across {resources.length} Documents
            </motion.button>
          </div>
        )}

        {/* Resource Cards Grid */}
        {resources.length > 0 && (
          <div className="notion-section">
            <h2 className="font-heading text-xl mb-6" style={{ color: 'var(--text-primary)' }}>
              Your Library ({resources.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {resources.map(resource => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  onOpen={() => setActiveResource(resource)}
                  onQuickAction={(action) => handleQuickAction(resource, action)}
                  onDelete={() => removeResource(resource.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {resources.length === 0 && !isUploading && (
          <div className="notion-section">
            <div className="notion-card text-center py-12">
              <Zap size={48} className="mx-auto mb-4" style={{ color: 'var(--accent)' }} />
              <h3 className="font-heading text-xl mb-2">No resources yet</h3>
              <p style={{ color: 'var(--text-muted)' }}>Upload a PDF to get started</p>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {lastError && (
          <div className="notion-section">
            <div className="notion-card flex items-center justify-between"
                 style={{ borderColor: 'rgba(239,68,68,0.5)', background: 'rgba(69,10,10,0.4)' }}>
              <p className="text-sm text-red-400">⚠️ {lastError}</p>
              {retryCallback && (
                <button onClick={retryCallback} className="notion-small-button"
                        style={{ borderColor: '#ef4444', color: '#f87171' }}>
                  <RotateCcw size={12} /> Retry
                </button>
              )}
            </div>
          </div>
        )}

        {/* Cross-Document Modal */}
        <AnimatePresence>
          {activeModal === 'cross' && (
            <CrossDocumentModal resources={resources} onClose={closeModal} />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Resource Detail View
  return (
    <div>
      {/* Back button + resource title */}
      <div className="notion-section">
        <button
          onClick={() => { setActiveResource(null); setActiveModal(null); }}
          className="flex items-center gap-2 mb-4 notion-small-button"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={14} /> Back to Library
        </button>
        <h1 className="notion-section-header">{activeResource.title}</h1>
        <div className="flex items-center gap-3 mt-1">
          <span className="category-badge">{activeResource.category}</span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Uploaded {new Date(activeResource.uploadedAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Tool Grid — 8 feature tiles */}
      <div className="notion-section">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { id: 'chat',   icon: MessageCircle, label: 'Chat with PDF',       desc: 'Ask anything about this document' },
            { id: 'quiz',   icon: Target, label: 'Practice Quiz',        desc: 'Test your understanding' },
            { id: 'map',    icon: Map, label: 'Concept Map',          desc: 'Visualize how ideas connect' },
            { id: 'plan',   icon: Calendar, label: 'Study Plan',           desc: 'Build an exam-ready schedule' },
            { id: 'teach',  icon: Brain, label: 'Teach Me Mode',        desc: 'Learn Socratic-style' },
            { id: 'flash',  icon: Zap, label: 'Flashcards',           desc: 'Quick-fire Q&A review' },
            { id: 'export', icon: Package, label: 'Export Study Pack',    desc: 'Download everything as PDF' },
            { id: 'diff',   icon: BarChart3, label: 'Difficulty Analysis',  desc: 'Know where to focus' },
          ].map(tool => (
            <motion.button
              key={tool.id}
              whileHover={{ scale: 1.03, borderColor: 'var(--accent)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveModal(tool.id)}
              className="notion-card text-left cursor-pointer p-4"
              style={{ borderColor: 'var(--border)' }}
            >
              <tool.icon size={24} className="mb-2" style={{ color: 'var(--accent)' }} />
              <div className="font-heading text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                {tool.label}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{tool.desc}</div>
            </motion.button>
          ))}
        </div>

        {/* Summary panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Key Concepts */}
          {activeResource.keyConcepts?.length > 0 && (
            <div className="notion-card">
              <h3 className="font-heading text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                Key Concepts
              </h3>
              {activeResource.keyConcepts.map((c, i) => (
                <div key={i} className="concept-bullet text-sm">{c}</div>
              ))}
            </div>
          )}
          {/* Knowledge Gaps */}
          {activeResource.knowledgeGaps?.length > 0 && (
            <div className="knowledge-gaps">
              <h4>Knowledge Gaps</h4>
              {activeResource.knowledgeGaps.map((g, i) => (
                <div key={i} className="text-sm" style={{ color: 'var(--text-secondary)' }}>• {g}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals / Panels */}
      <AnimatePresence>
        {activeModal === 'chat' && (
          <ChatWithPDF resource={activeResource} onClose={closeModal} />
        )}
        {activeModal === 'quiz' && (
          <QuizModal resource={activeResource} onClose={closeModal} />
        )}
        {activeModal === 'map' && (
          <ConceptMap resource={activeResource} onClose={closeModal} />
        )}
        {activeModal === 'plan' && (
          <StudyPlanModal resource={activeResource} onClose={closeModal} />
        )}
        {activeModal === 'teach' && (
          <TeachMeMode resource={activeResource} onClose={closeModal} />
        )}
        {activeModal === 'flash' && (
          <FlashcardModal resource={activeResource} onClose={closeModal} />
        )}
        {activeModal === 'export' && (
          <ExportModal resource={activeResource} onClose={closeModal} />
        )}
        {activeModal === 'diff' && (
          <DifficultyPanel resource={activeResource} onClose={closeModal} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Resources;
