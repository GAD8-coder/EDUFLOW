import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { generateFlashcards } from '../../lib/groq';
import { X, Zap, Shuffle, CheckCircle, ChevronLeft, ChevronRight, BookOpen, Filter } from 'lucide-react';

const FlashcardModal = ({ resource, onClose }) => {
  const { updateResource } = useApp();
  const [flashcards, setFlashcards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [error, setError] = useState(null);
  const [shuffled, setShuffled] = useState(false);
  const [showUnmasteredOnly, setShowUnmasteredOnly] = useState(false);
  const [masteredCards, setMasteredCards] = useState(resource.studyProgress?.flashcardsReviewed || []);

  useEffect(() => {
    generateCards();
  }, []);

  const generateCards = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const cards = await generateFlashcards(resource.analysis);
      if (cards.length === 0) throw new Error('Failed to generate flashcards');
      setFlashcards(cards);
      setCurrentIndex(0);
      setIsFlipped(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsMastered = () => {
    if (masteredCards.includes(currentIndex)) return;
    
    const newMastered = [...masteredCards, currentIndex];
    setMasteredCards(newMastered);
    
    const currentProgress = resource.studyProgress || { flashcardsReviewed: [], conceptsReviewed: [], totalStudyMinutes: 0 };
    updateResource(resource.id, {
      studyProgress: {
        ...currentProgress,
        flashcardsReviewed: newMastered
      }
    });
  };

  const shuffleCards = () => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setFlashcards(shuffled);
    setShuffled(true);
    setCurrentIndex(0);
    setIsFlipped(false);
    setMasteredCards([]); // Reset mastered when shuffled
  };

  const filteredCards = showUnmasteredOnly
    ? flashcards.filter((_, i) => !masteredCards.includes(i))
    : flashcards;

  const currentCard = filteredCards[currentIndex];
  const isMastered = currentCard && masteredCards.includes(flashcards.indexOf(currentCard));
  const progress = flashcards.length > 0 ? (masteredCards.length / flashcards.length) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="notion-card max-w-lg w-full"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Zap size={20} style={{ color: 'var(--accent)' }} />
            <h3 className="font-heading text-lg">Flashcards</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={shuffleCards} className="notion-small-button" title="Shuffle">
              <Shuffle size={14} />
            </button>
            <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
            <span>Progress</span>
            <span>{masteredCards.length} / {flashcards.length} mastered</span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Filter toggle */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => { setShowUnmasteredOnly(!showUnmasteredOnly); setCurrentIndex(0); setIsFlipped(false); }}
            className="text-sm flex items-center gap-1"
            style={{ color: showUnmasteredOnly ? 'var(--accent)' : 'var(--text-muted)' }}
          >
            <Filter size={14} />
            {showUnmasteredOnly ? 'Unmastered Only' : 'All Cards'}
          </button>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {currentIndex + 1} / {filteredCards.length}
          </span>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-12">
            <Zap size={32} className="animate-pulse mx-auto mb-4" style={{ color: 'var(--accent)' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Generating flashcards...</p>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="text-center py-8">
            <p className="text-red-400 mb-4">⚠️ {error}</p>
            <button onClick={generateCards} className="notion-button">
              <Zap size={16} /> Retry
            </button>
          </div>
        )}

        {/* Card */}
        {!isLoading && !error && currentCard && (
          <div>
            {/* Flip Card */}
            <div 
              className="relative h-64 cursor-pointer mb-6 perspective-1000"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <motion.div
                className="absolute inset-0"
                style={{ transformStyle: 'preserve-3d' }}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6 }}
              >
                {/* Front */}
                <div 
                  className="absolute inset-0 notion-card flex items-center justify-center p-6"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <div className="text-center">
                    <BookOpen size={32} className="mx-auto mb-4" style={{ color: 'var(--accent)' }} />
                    <p style={{ color: 'var(--text-primary)' }}>{currentCard.question}</p>
                    <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
                      Click to reveal answer
                    </p>
                    {isMastered && (
                      <span className="absolute top-2 right-2 text-xs px-2 py-1 rounded" style={{ background: 'var(--accent)', color: 'var(--background)' }}>
                        ✓ Mastered
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Back */}
                <div 
                  className="absolute inset-0 notion-card flex items-center justify-center p-6"
                  style={{ 
                    backfaceVisibility: 'hidden', 
                    transform: 'rotateY(180deg)',
                    background: 'var(--accent-bg)',
                    borderColor: 'var(--accent-border)'
                  }}
                >
                  <div className="text-center">
                    <Zap size={32} className="mx-auto mb-4" style={{ color: 'var(--accent)' }} />
                    <p style={{ color: 'var(--text-primary)' }}>{currentCard.answer}</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Controls */}
            <div className="flex justify-between items-center">
              <button 
                onClick={() => { setCurrentIndex(i => Math.max(0, i-1)); setIsFlipped(false); }}
                disabled={currentIndex === 0}
                className="notion-small-button disabled:opacity-40"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              
              {isFlipped && !isMastered && (
                <button 
                  onClick={markAsMastered}
                  className="notion-button"
                  style={{ background: 'var(--success)' }}
                >
                  <CheckCircle size={16} /> Mark Mastered
                </button>
              )}
              
              <button 
                onClick={() => { setCurrentIndex(i => Math.min(filteredCards.length-1, i+1)); setIsFlipped(false); }}
                disabled={currentIndex === filteredCards.length - 1}
                className="notion-small-button disabled:opacity-40"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Empty state when filtering */}
        {!isLoading && !error && filteredCards.length === 0 && (
          <div className="text-center py-8">
            <CheckCircle size={48} className="mx-auto mb-4" style={{ color: 'var(--success)' }} />
            <p style={{ color: 'var(--text-primary)' }}>All cards mastered!</p>
            <button 
              onClick={() => setShowUnmasteredOnly(false)} 
              className="notion-small-button mt-4"
            >
              Show All Cards
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default FlashcardModal;
