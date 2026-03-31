import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { generatePanicPlan } from '../lib/groq';
import { X, Clock, AlertTriangle, Target, Zap, RotateCcw } from 'lucide-react';

const PanicMode = ({ onExit }) => {
  const { tasks } = useApp();
  const [isGenerating, setIsGenerating] = useState(false);
  const [panicPlan, setPanicPlan] = useState('');
  const [error, setError] = useState('');
  const [retryCallback, setRetryCallback] = useState(null);

  const urgentTasks = tasks.filter(task => {
    if (!task.dueDate) return false;
    return (new Date(task.dueDate) - new Date()) <= 48 * 60 * 60 * 1000;
  });

  useEffect(() => {
    if (tasks.length > 0) generatePlan();
  }, []);

  const generatePlan = async () => {
    setIsGenerating(true);
    setError('');
    setRetryCallback(null);
    try {
      const plan = await generatePanicPlan(tasks);
      setPanicPlan(plan);
    } catch (err) {
      setError(err.message);
      setRetryCallback(() => generatePlan);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="panic-mode">
      {/* Fixed Header */}
      <div className="panic-header">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
              <AlertTriangle style={{ color: 'var(--panic-accent)' }} size={28} />
            </motion.div>
            <h1 className="font-heading text-2xl font-bold" style={{ color: 'var(--panic-text)' }}>
              ⚡ PANIC MODE
            </h1>
            <span className="text-sm" style={{ color: '#fca5a5' }}>
              {urgentTasks.length} urgent task{urgentTasks.length !== 1 ? 's' : ''} in the next 48h
            </span>
          </div>
          <button onClick={onExit} style={{ color: '#fca5a5' }} className="hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="panic-content max-w-4xl mx-auto">

        {/* Urgent Task Count */}
        <div className="notion-section">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10 }}
              className="inline-block"
            >
              <span className="text-6xl font-bold" style={{ color: 'white' }}>{urgentTasks.length}</span>
              <span className="text-xl ml-2" style={{ color: '#fecaca' }}> URGENT TASKS</span>
            </motion.div>
          </div>

          {/* Urgent Task Cards */}
          {urgentTasks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {urgentTasks.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="urgent-task-card"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Target style={{ color: 'var(--panic-accent)' }} size={16} />
                    <span className={`text-xs font-bold ${
                      task.priority === 'high' ? 'text-red-400' :
                      task.priority === 'medium' ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                      {task.priority?.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-heading text-sm font-semibold mb-1" style={{ color: 'white' }}>
                    {task.title}
                  </h3>
                  <p className="text-xs mb-2" style={{ color: '#fecaca' }}>{task.description}</p>
                  <div className="flex items-center text-xs" style={{ color: '#fca5a5' }}>
                    <Clock size={10} className="mr-1" />
                    Due: {task.dueDate}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle size={48} className="mx-auto mb-4" style={{ color: 'var(--panic-accent)' }} />
              <p className="text-lg" style={{ color: '#fecaca' }}>No tasks due in the next 48 hours!</p>
              <p className="text-sm mt-2" style={{ color: '#fca5a5' }}>You're safe — for now. Add tasks with due dates to use Panic Mode.</p>
            </div>
          )}
        </div>

        {/* Battle Plan */}
        <div className="notion-section">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-heading text-2xl" style={{ color: 'var(--panic-text)' }}>⚔️ Battle Plan</h2>
            <button
              onClick={generatePlan}
              disabled={isGenerating}
              className="notion-small-button"
              style={{ background: '#7f1d1d', borderColor: '#ef4444', color: '#fca5a5' }}
            >
              {isGenerating ? <RotateCcw size={12} className="animate-spin" /> : <Zap size={12} />}
              <span>{isGenerating ? 'Generating...' : 'Regenerate'}</span>
            </button>
          </div>

          {isGenerating && (
            <div className="text-center py-12">
              <RotateCcw size={48} className="animate-spin mx-auto mb-4" style={{ color: 'var(--panic-accent)' }} />
              <p style={{ color: '#fecaca' }}>AI is crafting your battle plan...</p>
            </div>
          )}

          {panicPlan && !isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="notion-card"
              style={{ background: 'rgba(127,29,29,0.3)', borderColor: 'rgba(239,68,68,0.3)' }}
            >
              <pre className="whitespace-pre-wrap text-sm font-mono" style={{ color: '#fecaca' }}>
                {panicPlan}
              </pre>
            </motion.div>
          )}

          {error && !isGenerating && (
            <div className="notion-card flex items-center justify-between"
                 style={{ borderColor: 'rgba(239,68,68,0.5)', background: 'rgba(69,10,10,0.4)' }}>
              <p className="text-red-400 text-sm">⚠️ {error}</p>
              {retryCallback && (
                <button onClick={retryCallback} className="notion-small-button"
                        style={{ borderColor: '#ef4444', color: '#f87171' }}>
                  <RotateCcw size={12} /> Retry
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PanicMode;
