import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { generateQuiz } from '../../lib/groq';
import { X, Target, RotateCcw, CheckCircle, XCircle } from 'lucide-react';

const QuizModal = ({ resource, onClose }) => {
  const { updateResource } = useApp();
  const [quizState, setQuizState] = useState('setup'); // setup, loading, quiz, results
  const [numQuestions, setNumQuestions] = useState(10);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [shortAnswer, setShortAnswer] = useState('');
  const [error, setError] = useState(null);

  const generateQuizQuestions = async () => {
    setQuizState('loading');
    setError(null);
    
    try {
      const quiz = await generateQuiz(resource.extractedText, numQuestions);
      if (quiz.length === 0) throw new Error('Failed to generate quiz');
      setQuestions(quiz);
      setAnswers([]);
      setCurrentQuestion(0);
      setQuizState('quiz');
    } catch (err) {
      setError(err.message);
      setQuizState('setup');
    }
  };

  const handleAnswer = (option) => {
    if (showFeedback) return;
    setSelectedOption(option);
    setShowFeedback(true);
    
    const isCorrect = option === questions[currentQuestion].correctAnswer;
    setAnswers([...answers, { questionIndex: currentQuestion, isCorrect, selected: option }]);
  };

  const handleShortAnswerSubmit = () => {
    if (!shortAnswer.trim()) return;
    setShowFeedback(true);
    setAnswers([...answers, { 
      questionIndex: currentQuestion, 
      isCorrect: null, // Self-graded
      selected: shortAnswer 
    }]);
  };

  const handleSelfGrade = (isCorrect) => {
    const updatedAnswers = [...answers];
    updatedAnswers[updatedAnswers.length - 1].isCorrect = isCorrect;
    setAnswers(updatedAnswers);
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedOption(null);
      setShowFeedback(false);
      setShortAnswer('');
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    const correctCount = answers.filter(a => a.isCorrect).length;
    const score = Math.round((correctCount / questions.length) * 100);
    
    // Update quiz progress
    const currentProgress = resource.quizProgress || { totalAttempts: 0, bestScore: 0, lastAttemptDate: null };
    updateResource(resource.id, {
      quizProgress: {
        totalAttempts: currentProgress.totalAttempts + 1,
        bestScore: Math.max(currentProgress.bestScore, score),
        lastAttemptDate: new Date().toISOString()
      }
    });
    
    setQuizState('results');
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const currentQ = questions[currentQuestion];
  const progress = questions.length > 0 ? ((currentQuestion + (showFeedback ? 1 : 0)) / questions.length) * 100 : 0;

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
            <Target size={20} style={{ color: 'var(--accent)' }} />
            <h3 className="font-heading text-xl">Practice Quiz</h3>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Setup State */}
        {quizState === 'setup' && (
          <div className="text-center py-8">
            <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>How many questions would you like?</p>
            <div className="flex justify-center gap-3 mb-6">
              {[5, 10, 15].map(n => (
                <button
                  key={n}
                  onClick={() => setNumQuestions(n)}
                  className="notion-small-button"
                  style={numQuestions === n ? { background: 'var(--accent)', color: 'var(--background)' } : {}}
                >
                  {n}
                </button>
              ))}
            </div>
            {error && (
              <div className="mb-4 p-3 rounded" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--error)' }}>
                <p className="text-sm text-red-400">⚠️ {error}</p>
              </div>
            )}
            <button onClick={generateQuizQuestions} className="notion-button">
              <RotateCcw size={16} /> Generate Quiz
            </button>
          </div>
        )}

        {/* Loading State */}
        {quizState === 'loading' && (
          <div className="text-center py-12">
            <RotateCcw size={48} className="animate-spin mx-auto mb-4" style={{ color: 'var(--accent)' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Generating quiz questions...</p>
          </div>
        )}

        {/* Quiz State */}
        {quizState === 'quiz' && currentQ && (
          <div>
            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
                <span>Question {currentQuestion + 1} of {questions.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {/* Question */}
            <div className="mb-6">
              <span className="text-xs uppercase tracking-wider mb-2 block" style={{ color: 'var(--accent)' }}>
                {currentQ.type.replace('_', ' ')}
              </span>
              <p className="text-lg" style={{ color: 'var(--text-primary)' }}>{currentQ.question}</p>
            </div>

            {/* Options */}
            {currentQ.type === 'multiple_choice' && (
              <div className="space-y-3">
                {currentQ.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(opt)}
                    disabled={showFeedback}
                    className={`quiz-option ${
                      showFeedback
                        ? opt === currentQ.correctAnswer
                          ? 'correct'
                          : opt === selectedOption
                            ? 'wrong'
                            : ''
                        : ''
                    }`}
                  >
                    {opt}
                    {showFeedback && opt === currentQ.correctAnswer && (
                      <CheckCircle size={16} className="ml-auto" style={{ color: 'var(--success)' }} />
                    )}
                    {showFeedback && opt === selectedOption && opt !== currentQ.correctAnswer && (
                      <XCircle size={16} className="ml-auto" style={{ color: 'var(--error)' }} />
                    )}
                  </button>
                ))}
              </div>
            )}

            {currentQ.type === 'true_false' && (
              <div className="space-y-3">
                {['True', 'False'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleAnswer(opt)}
                    disabled={showFeedback}
                    className={`quiz-option ${
                      showFeedback
                        ? opt === currentQ.correctAnswer
                          ? 'correct'
                          : opt === selectedOption
                            ? 'wrong'
                            : ''
                        : ''
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {currentQ.type === 'short_answer' && (
              <div>
                <input
                  type="text"
                  value={shortAnswer}
                  onChange={e => setShortAnswer(e.target.value)}
                  placeholder="Type your answer..."
                  className="w-full mb-4"
                  disabled={showFeedback}
                />
                {!showFeedback && (
                  <button onClick={handleShortAnswerSubmit} className="notion-button">
                    Submit Answer
                  </button>
                )}
              </div>
            )}

            {/* Feedback */}
            {showFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 rounded-lg"
                style={{ 
                  background: selectedOption === currentQ.correctAnswer || (currentQ.type === 'short_answer' && answers[answers.length - 1]?.isCorrect !== false)
                    ? 'rgba(34,197,94,0.1)' 
                    : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${selectedOption === currentQ.correctAnswer || (currentQ.type === 'short_answer' && answers[answers.length - 1]?.isCorrect !== false) ? 'var(--success)' : 'var(--error)'}`
                }}
              >
                <p className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {currentQ.type === 'short_answer' ? 'Self-grade your answer:' : selectedOption === currentQ.correctAnswer ? 'Correct!' : 'Incorrect'}
                </p>
                
                {currentQ.type === 'short_answer' && !answers[answers.length - 1]?.hasOwnProperty('isCorrect') && (
                  <div className="flex gap-2 mb-4">
                    <button onClick={() => handleSelfGrade(true)} className="notion-small-button" style={{ borderColor: 'var(--success)', color: 'var(--success)' }}>
                      I got it right
                    </button>
                    <button onClick={() => handleSelfGrade(false)} className="notion-small-button" style={{ borderColor: 'var(--error)', color: 'var(--error)' }}>
                      I got it wrong
                    </button>
                  </div>
                )}
                
                <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                  <strong>Correct Answer:</strong> {currentQ.correctAnswer}
                </p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {currentQ.explanation}
                </p>
                
                <button onClick={nextQuestion} className="notion-button mt-4">
                  {currentQuestion < questions.length - 1 ? 'Next Question →' : 'See Results'}
                </button>
              </motion.div>
            )}
          </div>
        )}

        {/* Results State */}
        {quizState === 'results' && (
          <div className="text-center py-8">
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10 }}
              className="mb-6"
            >
              <span className="text-6xl font-bold" style={{ color: getScoreColor(Math.round((answers.filter(a => a.isCorrect).length / questions.length) * 100)) }}>
                {answers.filter(a => a.isCorrect).length}
              </span>
              <span className="text-2xl" style={{ color: 'var(--text-secondary)' }}> / {questions.length}</span>
            </motion.div>
            
            <p className="text-xl mb-6" style={{ color: 'var(--text-primary)' }}>
              Score: {Math.round((answers.filter(a => a.isCorrect).length / questions.length) * 100)}%
            </p>

            {/* Topics to review */}
            {answers.some(a => !a.isCorrect) && (
              <div className="text-left mb-6">
                <h4 className="font-heading text-lg mb-3" style={{ color: 'var(--error)' }}>Topics to Review</h4>
                <div className="space-y-2">
                  {answers.filter(a => !a.isCorrect).map((a, i) => (
                    <div key={i} className="p-3 rounded" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--error)' }}>
                      <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{questions[a.questionIndex].question}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button onClick={() => setQuizState('setup')} className="notion-button">
                Retake Quiz
              </button>
              <button onClick={onClose} className="notion-small-button">
                Close
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default QuizModal;
