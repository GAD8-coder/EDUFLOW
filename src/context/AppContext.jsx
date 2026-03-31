import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

const loadFromStorage = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
};

const saveToStorage = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
};

export const AppProvider = ({ children }) => {
  // AI Tasks
  const [tasks, setTasks] = useState(() => loadFromStorage('tasks', []));

  // PDF Resources
  const [resources, setResources] = useState(() => loadFromStorage('resources', []));

  // Time-based Reminders: three periods
  const [morningReminders, setMorningReminders]     = useState(() => loadFromStorage('reminders_morning', []));
  const [afternoonReminders, setAfternoonReminders] = useState(() => loadFromStorage('reminders_afternoon', []));
  const [eveningReminders, setEveningReminders]     = useState(() => loadFromStorage('reminders_evening', []));

  // User Profile
  const [userProfile, setUserProfile] = useState(() => loadFromStorage('userProfile', {
    name: '',
    age: '',
    level: 'undergraduate',
    isAuthenticated: false
  }));

  // Persist everything
  useEffect(() => saveToStorage('tasks', tasks), [tasks]);
  useEffect(() => saveToStorage('resources', resources), [resources]);
  useEffect(() => saveToStorage('reminders_morning', morningReminders), [morningReminders]);
  useEffect(() => saveToStorage('reminders_afternoon', afternoonReminders), [afternoonReminders]);
  useEffect(() => saveToStorage('reminders_evening', eveningReminders), [eveningReminders]);
  useEffect(() => saveToStorage('userProfile', userProfile), [userProfile]);

  // Task helpers
  const addTask = (task) => setTasks(prev => [...prev, {
    ...task,
    id: `task_${Date.now()}_${Math.random().toString(36).substr(2,9)}`,
    completed: task.completed || false,
    createdAt: task.createdAt || new Date().toISOString()
  }]);
  const removeTask = (id) => setTasks(prev => prev.filter(t => t.id !== id));
  const updateTask = (id, data) => setTasks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
  const toggleTaskComplete = (id) => setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));

  // Resource helpers
  const addResource = (r) => setResources(prev => [...prev, {
    ...r,
    id: `resource_${Date.now()}_${Math.random().toString(36).substr(2,9)}`,
    uploadedAt: r.uploadedAt || new Date().toISOString(),
    // New fields for upgrade
    difficultyData: r.difficultyData || null,
    conceptMapData: r.conceptMapData || null,
    quizProgress: r.quizProgress || { totalAttempts: 0, bestScore: 0, lastAttemptDate: null },
    studyProgress: r.studyProgress || { flashcardsReviewed: [], conceptsReviewed: [], totalStudyMinutes: 0 },
    chatHistory: r.chatHistory || []
  }]);
  const removeResource = (id) => setResources(prev => prev.filter(r => r.id !== id));
  const updateResource = (id, data) => setResources(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));

  // Reminder helpers (generic, works for all three periods)
  const makeReminderHelpers = (setter) => ({
    add: (reminder) => setter(prev => [...prev, {
      ...reminder,
      id: Date.now() + Math.random(),
      completed: false
    }]),
    toggle: (id) => setter(prev => prev.map(r => r.id === id ? { ...r, completed: !r.completed } : r)),
    remove: (id) => setter(prev => prev.filter(r => r.id !== id))
  });

  const morning   = makeReminderHelpers(setMorningReminders);
  const afternoon = makeReminderHelpers(setAfternoonReminders);
  const evening   = makeReminderHelpers(setEveningReminders);

  const value = {
    tasks, addTask, removeTask, updateTask, toggleTaskComplete, setTasks,
    resources, addResource, removeResource, updateResource, setResources,
    morningReminders, afternoonReminders, eveningReminders,
    addMorningReminder: morning.add,     toggleMorningReminder: morning.toggle,     removeMorningReminder: morning.remove,
    addAfternoonReminder: afternoon.add, toggleAfternoonReminder: afternoon.toggle, removeAfternoonReminder: afternoon.remove,
    addEveningReminder: evening.add,     toggleEveningReminder: evening.toggle,     removeEveningReminder: evening.remove,
    userProfile, setUserProfile
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
