import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { findCrossDocumentConnections } from '../../lib/groq';
import { X, Link2, RotateCcw, ArrowRight, Lightbulb } from 'lucide-react';

const CrossDocumentModal = ({ resources, onClose }) => {
  const [connections, setConnections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    findConnections();
  }, []);

  const findConnections = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await findCrossDocumentConnections(resources);
      setConnections(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="notion-card max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Link2 size={20} style={{ color: 'var(--accent)' }} />
            <h3 className="font-heading text-xl">Cross-Document Connections</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={findConnections} disabled={isLoading} className="notion-small-button">
              <RotateCcw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-12">
            <RotateCcw size={48} className="animate-spin mx-auto mb-4" style={{ color: 'var(--accent)' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Analyzing connections across your documents...</p>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="text-center py-8">
            <p className="text-red-400 mb-4">⚠️ {error}</p>
            <button onClick={findConnections} className="notion-button">
              <RotateCcw size={16} /> Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && connections.length === 0 && (
          <div className="text-center py-8">
            <Link2 size={48} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <h4 className="font-heading text-lg mb-2" style={{ color: 'var(--text-primary)' }}>No connections found</h4>
            <p style={{ color: 'var(--text-muted)' }}>
              Try adding more documents on related topics to discover connections.
            </p>
          </div>
        )}

        {/* Connections */}
        {!isLoading && !error && connections.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              Found {connections.length} meaningful connection{connections.length !== 1 ? 's' : ''} across your documents:
            </p>
            
            {connections.map((conn, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="connection-card"
              >
                {/* Document titles */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="text-sm px-3 py-1 rounded-full" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                    {conn.doc1Title}
                  </span>
                  <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
                  <span className="text-sm px-3 py-1 rounded-full" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                    {conn.doc2Title}
                  </span>
                </div>

                {/* Connection type */}
                <span className="connection-type-badge mb-3 inline-block">
                  {conn.connectionType}
                </span>

                {/* Description */}
                <p className="text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
                  {conn.description}
                </p>

                {/* Shared concepts */}
                {conn.sharedConcepts?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Shared concepts:</p>
                    <div className="flex flex-wrap gap-2">
                      {conn.sharedConcepts.map((concept, j) => (
                        <span 
                          key={j} 
                          className="text-xs px-2 py-1 rounded"
                          style={{ background: 'var(--surface-hover)', color: 'var(--text-secondary)' }}
                        >
                          {concept}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Study tip */}
                <div className="flex items-start gap-2 p-3 rounded" style={{ background: 'var(--surface-hover)' }}>
                  <Lightbulb size={16} style={{ color: 'var(--warning)', marginTop: '2px' }} />
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{conn.studyTip}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default CrossDocumentModal;
