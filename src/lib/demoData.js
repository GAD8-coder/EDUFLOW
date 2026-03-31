export const loadHackathonDemo = () => {
  const now = Date.now();

  const demoTasks = [
    { id: `task_demo_1`, title: "Calculus III Problem Set", description: "Complete problems 1–15, Chapter 7", dueDate: new Date(now + 2*86400000).toISOString().split('T')[0], priority: "high", gradeWeight: 20, completed: false, createdAt: new Date().toISOString() },
    { id: `task_demo_2`, title: "Physics Lab Report", description: "Pendulum motion analysis with graphs", dueDate: new Date(now + 86400000).toISOString().split('T')[0], priority: "high", gradeWeight: 15, completed: false, createdAt: new Date().toISOString() },
    { id: `task_demo_3`, title: "English Essay Draft", description: "2000-word essay on modern literature", dueDate: new Date(now + 3*86400000).toISOString().split('T')[0], priority: "medium", gradeWeight: 25, completed: false, createdAt: new Date().toISOString() },
    { id: `task_demo_4`, title: "Chemistry Quiz Study", description: "Review organic chemistry reactions", dueDate: new Date(now + 0.5*86400000).toISOString().split('T')[0], priority: "high", gradeWeight: 10, completed: false, createdAt: new Date().toISOString() },
    { id: `task_demo_5`, title: "Computer Science Project", description: "Complete React component library", dueDate: new Date(now + 5*86400000).toISOString().split('T')[0], priority: "low", gradeWeight: 30, completed: false, createdAt: new Date().toISOString() },
  ];

  const demoMorning = [
    { id: 1, title: "Intro to CS Lecture", type: "class", time: "8:00 AM", completed: false, urgent: false },
    { id: 2, title: "Calculus Quiz", type: "quiz", time: "10:30 AM", completed: false, urgent: true },
  ];
  const demoAfternoon = [
    { id: 3, title: "Physics Lab Assignment", type: "assignment", time: "1:00 PM", completed: false, urgent: true },
    { id: 4, title: "Lunch Break", type: "break", time: "3:00 PM", completed: false, urgent: false },
  ];
  const demoEvening = [
    { id: 5, title: "Review Lecture Notes", type: "class", time: "6:30 PM", completed: false, urgent: false },
    { id: 6, title: "Evening Break", type: "break", time: "9:00 PM", completed: false, urgent: false },
  ];

  const demoResources = [
    {
      id: "resource_demo_1",
      title: "Quantum Mechanics Lecture Notes",
      fileName: "quantum_mechanics.pdf",
      extractedText: "Quantum mechanics describes nature at atomic and subatomic scales...",
      analysis: "Category: Physics\n\nKey Concepts:\n1. Quantum mechanics fundamentals\n2. Discrete energy levels\n3. Wave-particle duality\n\nKnowledge Gaps:\n- Schrödinger equation\n- Applications in quantum computing",
      category: "Physics",
      keyConcepts: ["Quantum mechanics fundamentals", "Discrete energy levels", "Wave-particle duality"],
      knowledgeGaps: ["Schrödinger equation", "Applications in quantum computing"],
      uploadedAt: new Date(now - 2*86400000).toISOString(),
      difficultyData: { overallScore: 8, overallLabel: 'Advanced', summary: 'Complex mathematical concepts', sections: [{ topic: 'Wave functions', difficulty: 9, label: 'Hard', tip: 'Review linear algebra first' }], hardestConcepts: ['Hilbert spaces', 'Operators'], prerequisiteKnowledge: ['Linear algebra', 'Complex numbers'], estimatedStudyHours: 12 },
      conceptMapData: null,
      quizProgress: { totalAttempts: 0, bestScore: 0, lastAttemptDate: null },
      studyProgress: { flashcardsReviewed: [], conceptsReviewed: [], totalStudyMinutes: 0 },
      chatHistory: []
    }
  ];

  localStorage.setItem('tasks', JSON.stringify(demoTasks));
  localStorage.setItem('reminders_morning', JSON.stringify(demoMorning));
  localStorage.setItem('reminders_afternoon', JSON.stringify(demoAfternoon));
  localStorage.setItem('reminders_evening', JSON.stringify(demoEvening));
  localStorage.setItem('resources', JSON.stringify(demoResources));
  window.location.reload();
};

if (typeof window !== 'undefined') {
  window.loadHackathonDemo = loadHackathonDemo;
}
