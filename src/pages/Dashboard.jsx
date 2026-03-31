import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { extractTask, auditSchedule, getMotivationalQuote } from '../lib/groq';
import {
  Plus, Calendar, Brain, X, Clock, Award, RotateCcw, Trash2,
  AlertTriangle, Sun, Coffee, Moon, BookOpen, PenTool, Zap
} from 'lucide-react';

// Reminder type metadata
const REMINDER_TYPES = [
  { value: 'class',      label: '📚 Class',      badge: 'badge-class' },
  { value: 'quiz',       label: '📝 Quiz',       badge: 'badge-quiz' },
  { value: 'assignment', label: '📋 Assignment',  badge: 'badge-assignment' },
  { value: 'break',      label: '☕ Break',       badge: 'badge-break' },
];

const TIME_SECTIONS = [
  {
    key: 'morning',
    label: 'Morning',
    range: '6AM – 12PM',
    icon: Sun,
    sectionClass: 'time-section-morning',
    labelClass: 'time-label-morning',
  },
  {
    key: 'afternoon',
    label: 'Afternoon',
    range: '12PM – 6PM',
    icon: Coffee,
    sectionClass: 'time-section-afternoon',
    labelClass: 'time-label-afternoon',
  },
  {
    key: 'evening',
    label: 'Evening',
    range: '6PM – 12AM',
    icon: Moon,
    sectionClass: 'time-section-evening',
    labelClass: 'time-label-evening',
  },
];

// Single time section component
const TimeSectionBlock = ({ config, reminders, onAdd, onToggle, onRemove }) => {
  const [showForm, setShowForm] = useState(false);
  const [newReminder, setNewReminder] = useState({ title: '', type: 'class', time: '' });
  const Icon = config.icon;

  const handleAdd = () => {
    if (!newReminder.title.trim()) return;
    onAdd({ ...newReminder });
    setNewReminder({ title: '', type: 'class', time: '' });
    setShowForm(false);
  };

  return (
    <div className={`time-section ${config.sectionClass}`}>
      <div className={`time-section-label ${config.labelClass}`}>
        <Icon size={18} />
        {config.label}
        <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.8rem', marginLeft: '0.25rem' }}>
          {config.range}
        </span>
      </div>

      {/* Reminder items */}
      {reminders.length === 0 && (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No reminders yet.</p>
      )}
      <AnimatePresence>
        {reminders.map(r => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className={`reminder-item ${r.completed ? 'completed' : ''} ${r.urgent ? 'urgent' : ''}`}
          >
            {/* Checkbox */}
            <input
              type="checkbox"
              className="task-checkbox"
              checked={r.completed}
              onChange={() => onToggle(r.id)}
            />
            {/* Content */}
            <div className="flex-1 min-w-0">
              <span className="reminder-title text-sm" style={{ color: 'var(--text-primary)' }}>
                {r.title}
              </span>
              {r.time && (
                <span className="ml-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                  · {r.time}
                </span>
              )}
            </div>
            {/* Badge */}
            <span className={`reminder-badge ${REMINDER_TYPES.find(t => t.value === r.type)?.badge || 'badge-class'}`}>
              {r.type}
            </span>
            {/* Delete */}
            <button
              onClick={() => onRemove(r.id)}
              className="ml-2 opacity-40 hover:opacity-100 transition-opacity"
              style={{ color: 'var(--error)' }}
            >
              <Trash2 size={12} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Quick-add type buttons */}
      <div className="flex flex-wrap gap-2 mt-3">
        {REMINDER_TYPES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => { setNewReminder(n => ({ ...n, type: value })); setShowForm(true); }}
            className="notion-small-button text-xs py-1 px-2"
            style={{ fontSize: '0.7rem' }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mt-3 flex flex-wrap gap-2 items-end"
          >
            <input
              type="text"
              value={newReminder.title}
              onChange={e => setNewReminder(n => ({ ...n, title: e.target.value }))}
              placeholder="Reminder title..."
              className="flex-1 min-w-0 text-sm py-2 px-3"
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              autoFocus
            />
            <input
              type="time"
              value={newReminder.time}
              onChange={e => setNewReminder(n => ({ ...n, time: e.target.value }))}
              className="text-sm py-2 px-3 w-28"
            />
            <select
              value={newReminder.type}
              onChange={e => setNewReminder(n => ({ ...n, type: e.target.value }))}
              className="text-sm py-2 px-3"
            >
              {REMINDER_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <button className="notion-button text-sm py-2 px-3" onClick={handleAdd}>Add</button>
            <button
              className="notion-small-button text-sm py-2 px-3"
              onClick={() => setShowForm(false)}
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Dashboard main component
const Dashboard = ({ onNavigateToPanicMode }) => {
  const {
    tasks, addTask, removeTask, toggleTaskComplete,
    morningReminders, afternoonReminders, eveningReminders,
    addMorningReminder, toggleMorningReminder, removeMorningReminder,
    addAfternoonReminder, toggleAfternoonReminder, removeAfternoonReminder,
    addEveningReminder, toggleEveningReminder, removeEveningReminder,
  } = useApp();

  const [taskInput, setTaskInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [auditResult, setAuditResult] = useState('');
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [motivationalQuote, setMotivationalQuote] = useState('');
  const [lastError, setLastError] = useState(null);
  const [retryCallback, setRetryCallback] = useState(null);

  useEffect(() => {
    if (tasks.length === 0) {
      getMotivationalQuote()
        .then(setMotivationalQuote)
        .catch(() => setMotivationalQuote('Every expert was once a beginner. Start today!'));
    }
  }, [tasks.length]);

  const handleAddTask = async (e) => {
    e?.preventDefault();
    if (!taskInput.trim()) return;
    const text = taskInput.trim();
    console.log('Adding task:', text);
    setTaskInput('');
    setIsProcessing(true);
    
    // Always add a basic task first
    const fallbackTask = { 
      title: text.slice(0, 50), 
      description: text, 
      dueDate: new Date(Date.now()+86400000).toISOString().split('T')[0], 
      priority: 'medium', 
      gradeWeight: 10 
    };
    
    try {
      const raw = await extractTask(text);
      console.log('Gemini response:', raw);
      const cleaned = raw.replace(/```json|```/g, '').trim();
      let data;
      try { 
        data = JSON.parse(cleaned); 
        console.log('Parsed task:', data);
        addTask(data);
      } catch { 
        console.log('JSON parse failed, using fallback');
        addTask(fallbackTask);
      }
      setLastError(null);
    } catch (err) {
      console.error('AI error, adding basic task:', err);
      // Still add the task even if AI fails
      addTask(fallbackTask);
      setLastError(null); // Don't show error to user
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAuditSchedule = async () => {
    setIsProcessing(true);
    setLastError(null);
    try {
      const result = await auditSchedule(tasks);
      setAuditResult(result);
      setShowAuditModal(true);
    } catch (err) {
      setLastError(err.message);
      setRetryCallback(() => handleAuditSchedule);
    } finally {
      setIsProcessing(false);
    }
  };

  const getPriorityClass = (p) => ({ high: 'priority-high', medium: 'priority-medium', low: 'priority-low' }[p?.toLowerCase()] || 'priority-medium');
  const getPriorityColor = (p) => ({ high: 'text-red-400', medium: 'text-yellow-400', low: 'text-green-400' }[p?.toLowerCase()] || 'text-yellow-400');

  const reminderMap = {
    morning:   { reminders: morningReminders,   add: addMorningReminder,   toggle: toggleMorningReminder,   remove: removeMorningReminder },
    afternoon: { reminders: afternoonReminders, add: addAfternoonReminder, toggle: toggleAfternoonReminder, remove: removeAfternoonReminder },
    evening:   { reminders: eveningReminders,   add: addEveningReminder,   toggle: toggleEveningReminder,   remove: removeEveningReminder },
  };

  return (
    <div>
      {/* Page Header */}
      <div className="notion-section">
        <h1 className="notion-section-header">Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
          Manage your day, set reminders, and stay on top of your academic goals.
        </p>
      </div>

      {/* Time Sections (Reminders) */}
      <div className="notion-section">
        <h2 className="font-heading text-xl mb-4" style={{ color: 'var(--text-primary)' }}>Today's Schedule</h2>
        {TIME_SECTIONS.map(config => (
          <TimeSectionBlock
            key={config.key}
            config={config}
            reminders={reminderMap[config.key].reminders}
            onAdd={reminderMap[config.key].add}
            onToggle={reminderMap[config.key].toggle}
            onRemove={reminderMap[config.key].remove}
          />
        ))}
      </div>

      {/* AI Task Input */}
      <div className="notion-section">
        <h2 className="font-heading text-xl mb-4" style={{ color: 'var(--text-primary)' }}>
          Add a Task (Tasks: {tasks.length})
        </h2>
        <form onSubmit={handleAddTask} className="flex gap-3">
          <input
            type="text"
            value={taskInput}
            onChange={e => setTaskInput(e.target.value)}
            placeholder="e.g. 'Study calculus chapter 5 by Friday'"
            className="flex-1"
            disabled={isProcessing}
          />
          <button type="submit" className="notion-button" disabled={!taskInput.trim() || isProcessing}>
            {isProcessing ? <RotateCcw size={16} className="animate-spin" /> : <Plus size={16} />}
            {isProcessing ? 'Thinking...' : 'Add Task'}
          </button>
        </form>
      </div>

      {/* Motivational Quote (empty state) */}
      {tasks.length === 0 && motivationalQuote && (
        <div className="notion-section">
          <div className="notion-card text-center">
            <Brain size={32} className="mx-auto mb-4" style={{ color: 'var(--accent)' }} />
            <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{motivationalQuote}"</p>
          </div>
        </div>
      )}

      {/* Tasks Grid */}
      {tasks.length > 0 && (
        <div className="notion-section">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-heading text-xl">Your Tasks</h2>
            <div className="flex gap-2">
              <button onClick={handleAuditSchedule} disabled={isProcessing} className="notion-small-button">
                {isProcessing ? <RotateCcw size={14} className="animate-spin" /> : <Calendar size={14} />}
                <span>Audit My Day</span>
              </button>
              <button
                onClick={onNavigateToPanicMode}
                className="notion-small-button"
                style={{ background: '#7f1d1d', borderColor: '#ef4444', color: '#fca5a5' }}
              >
                <AlertTriangle size={14} />
                <span>Panic Mode</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {tasks.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2, delay: i * 0.04 }}
                  className={`task-card ${getPriorityClass(task.priority)} ${task.completed ? 'completed' : ''} relative group`}
                >
                  <div className="flex items-start h-full">
                    <input
                      type="checkbox"
                      className="task-checkbox mr-3 mt-1"
                      checked={task.completed || false}
                      onChange={() => toggleTaskComplete(task.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading text-sm font-semibold task-content mb-1"
                          style={{ color: 'var(--text-primary)' }}>
                        {task.title}
                      </h3>
                      <p className="text-xs task-content mb-2" style={{ color: 'var(--text-secondary)' }}>
                        {task.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs">
                          {task.dueDate && (
                            <span className="flex items-center" style={{ color: 'var(--text-muted)' }}>
                              <Clock size={10} className="mr-1" />{task.dueDate}
                            </span>
                          )}
                          {task.gradeWeight && (
                            <span className="flex items-center" style={{ color: 'var(--text-muted)' }}>
                              <Award size={10} className="mr-1" />{task.gradeWeight}%
                            </span>
                          )}
                          <span className={getPriorityColor(task.priority) + ' font-bold'}>
                            {task.priority?.toUpperCase()}
                          </span>
                        </div>
                        <button
                          onClick={() => removeTask(task.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: 'var(--error)' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
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

      {/* Audit Modal */}
      <AnimatePresence>
        {showAuditModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
            onClick={() => setShowAuditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="notion-card max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-heading text-xl">Schedule Audit</h3>
                <button onClick={() => setShowAuditModal(false)} style={{ color: 'var(--text-muted)' }}>
                  <X size={20} />
                </button>
              </div>
              <pre className="whitespace-pre-wrap text-sm" style={{ color: 'var(--text-primary)' }}>
                {auditResult}
              </pre>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
