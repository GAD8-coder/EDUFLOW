const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Helper to safely truncate text for token limits (~4 chars per token)
const MAX_CHARS = 3000;
const truncateText = (text, maxLength = MAX_CHARS) => {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '\n\n[Document truncated due to length...]';
};

const retryWithDelay = async (fn, maxRetries = 3, baseDelay = 10000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (error.message.includes('429') && attempt < maxRetries) {
        await new Promise(res => setTimeout(res, baseDelay));
      } else if (error.message.includes('429')) {
        throw new Error('AI is taking a breather — try again in a moment');
      } else if (error.message.includes('413')) {
        throw new Error('This document is too long to analyze. Try uploading a shorter document or a specific chapter.');
      } else {
        throw error;
      }
    }
  }
};

export const callGroq = async (prompt, systemInstruction = '') => {
  const makeRequest = async () => {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) throw new Error('Groq API key not found. Set VITE_GROQ_API_KEY in .env');

    const messages = [];
    if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
    messages.push({ role: 'user', content: prompt });

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.7,
        max_tokens: 8192,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`Groq API error: ${response.status} - ${JSON.stringify(err.error || response.statusText)}`);
    }

    const data = await response.json();
    if (!data.choices?.length) throw new Error('No response from Groq API');
    return data.choices[0].message.content;
  };

  return retryWithDelay(makeRequest);
};

// Feature-specific AI functions

export const extractTask = (taskText) =>
  callGroq(
    `Extract a study task from: "${taskText}". Return JSON only: {title, description, dueDate (YYYY-MM-DD), priority (high/medium/low), gradeWeight (number)}`,
    'You are a task extraction assistant. Return only valid JSON, no extra text.'
  );

export const auditSchedule = (tasks) =>
  callGroq(
    `Here are the student's current tasks:\n\n${tasks.map(t =>
      `- ${t.title}: ${t.description || ''} (Due: ${t.dueDate || 'none'}, Priority: ${t.priority})`
    ).join('\n')}\n\nAnalyze this workload. Tell them exactly what to skip, reschedule, or prioritize to avoid burnout.`,
    'You are a productivity coach. Be direct and practical. Give specific, actionable advice.'
  );

export const generatePanicPlan = (tasks) => {
  const urgent = tasks.filter(t => {
    if (!t.dueDate) return false;
    return (new Date(t.dueDate) - new Date()) <= 48 * 60 * 60 * 1000;
  });
  return callGroq(
    `These tasks are due in the next 48 hours:\n\n${urgent.map(t =>
      `- ${t.title}: ${t.description || ''} (Due: ${t.dueDate}, Priority: ${t.priority})`
    ).join('\n')}\n\nGenerate a detailed, time-blocked battle plan with short breaks. Format clearly with times and tasks.`,
    'You are a military-grade study strategist. Create a minute-by-minute emergency schedule. Be specific with times.'
  );
};

export const getMotivationalQuote = () =>
  callGroq(
    'Generate a short, powerful motivational quote for a student starting their day. Make it inspiring and genuine.',
    'You are an encouraging academic mentor. Keep it under 2 sentences.'
  );

// PDF Analysis
export const analyzePDF = (extractedText) =>
  callGroq(
    `Analyze this document:\n\n${truncateText(extractedText)}\n\nProvide: 1) Category, 2) Top 3 key concepts, 3) Knowledge gaps the student should address.`,
    'You are a world-class tutor. Categorize the document, summarize the top 3 key concepts, and identify knowledge gaps. Be encouraging but honest.'
  );

export const generateFlashcards = async (summary) => {
  const raw = await callGroq(
    `Generate 5–10 flashcard Q&A pairs from:\n\n${summary}\n\nReturn ONLY a JSON array: [{question: string, answer: string}]. No extra text.`,
    'Return strictly valid JSON array only. No markdown, no explanation.'
  );
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const cards = JSON.parse(cleaned);
    return Array.isArray(cards) ? cards : [];
  } catch {
    return [];
  }
};

// Resources Upgrade Functions

// 1. Chat with PDF
export const chatWithPDF = async (extractedText, conversationHistory) => {
  const systemInstruction = `You are a knowledgeable tutor who has deeply read and understood the following document. Answer questions about it accurately, explain concepts clearly, suggest likely exam questions when asked, and simplify complex ideas when the student asks. Always ground your answers in the document content. If asked something not covered in the document, say so honestly.

DOCUMENT CONTENT:
${truncateText(extractedText, 6000)}`;

  const messages = [
    { role: 'system', content: systemInstruction },
    ...conversationHistory
  ];

  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error('Groq API key not found.');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Groq API error: ${response.status} - ${JSON.stringify(err.error || response.statusText)}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

// 2. Quiz Generator
export const generateQuiz = async (extractedText, numQuestions = 10) => {
  const raw = await callGroq(
    `Generate ${numQuestions} practice quiz questions from this document content. Mix the types: include multiple choice, true/false, and short answer questions. For each question return: type, question, options (array of 4 strings, only for multiple_choice), correctAnswer (the exact correct option text or short answer), explanation (why it's correct).

Return ONLY a valid JSON array. No markdown, no extra text. Example format:
[
  { "type": "multiple_choice", "question": "...", "options": ["A","B","C","D"], "correctAnswer": "A", "explanation": "..." },
  { "type": "true_false", "question": "...", "options": ["True","False"], "correctAnswer": "True", "explanation": "..." },
  { "type": "short_answer", "question": "...", "correctAnswer": "...", "explanation": "..." }
]

DOCUMENT:
${truncateText(extractedText, 3000)}`,
    'You are an expert academic examiner. Create challenging but fair questions that test real understanding. Return only valid JSON array.'
  );

  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

// 3. Concept Map Generator
export const generateConceptMap = async (extractedText) => {
  const raw = await callGroq(
    `Analyze this document and extract the key concepts and how they relate to each other. Return a concept map as JSON with this exact structure:
{
  "nodes": [
    { "id": "1", "label": "Concept Name", "description": "One sentence description", "importance": "high|medium|low" }
  ],
  "edges": [
    { "from": "1", "to": "2", "relationship": "leads to" }
  ]
}

Extract 6–12 nodes and their relationships. Importance: "high" for central concepts, "medium" for supporting ones, "low" for peripheral details.
Return ONLY valid JSON. No markdown, no extra text.

DOCUMENT:
${truncateText(extractedText, 3000)}`,
    'You are a knowledge mapping expert. Identify the most important concepts and their relationships. Return only valid JSON.'
  );

  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { nodes: [], edges: [] };
  }
};

// 4. Study Plan Generator
export const generateStudyPlan = async (resource, examDate) => {
  const daysUntilExam = Math.ceil((new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24));

  return callGroq(
    `A student has ${daysUntilExam} day(s) until their exam on the topic covered in this document. Based on the analysis below, create a detailed day-by-day study plan.

DOCUMENT TITLE: ${resource.title}
CATEGORY: ${resource.category}
KEY CONCEPTS: ${resource.keyConcepts?.join(', ') || 'See analysis'}
KNOWLEDGE GAPS: ${resource.knowledgeGaps?.join(', ') || 'None identified'}
FULL ANALYSIS: ${resource.analysis?.slice(0, 2000)}

Create a day-by-day schedule that:
1. Prioritizes fixing the knowledge gaps first
2. Allocates more time to complex concepts
3. Includes review sessions and practice testing
4. Includes specific time blocks (e.g. "9:00–10:30 AM: Study X")
5. Gets progressively harder as the exam approaches
6. Includes a final day review/rest plan

Be specific and realistic. Format clearly with Day 1, Day 2, etc.`,
    'You are an expert academic coach who creates personalized, realistic study schedules. Be specific with times and activities.'
  );
};

// 5. Difficulty Analyzer
export const analyzeDifficulty = async (extractedText) => {
  const raw = await callGroq(
    `Analyze the difficulty level of this academic document. Return JSON only:
{
  "overallScore": 7,
  "overallLabel": "Advanced",
  "summary": "One sentence summary of why it is this difficulty",
  "sections": [
    { "topic": "Topic name", "difficulty": 8, "label": "Hard", "tip": "How to approach this section" }
  ],
  "hardestConcepts": ["concept1", "concept2", "concept3"],
  "prerequisiteKnowledge": ["what student should already know"],
  "estimatedStudyHours": 5
}

Score 1–10 (1=trivial, 10=PhD-level). Include 3–6 sections. Return ONLY valid JSON.

DOCUMENT:
${truncateText(extractedText, 3000)}`,
    'You are an academic difficulty analyst. Be accurate and honest. Return only valid JSON.'
  );

  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { overallScore: 5, overallLabel: 'Moderate', summary: 'Unable to analyze difficulty.', sections: [], hardestConcepts: [], prerequisiteKnowledge: [], estimatedStudyHours: 3 };
  }
};

// 6. Cross-Document Connection Finder
export const findCrossDocumentConnections = async (resources) => {
  if (resources.length < 2) return [];

  const summaries = resources.map((r, i) =>
    `Document ${i + 1} — "${r.title}" (${r.category}): Key concepts: ${r.keyConcepts?.slice(0,3).join(', ')}. Gaps: ${r.knowledgeGaps?.slice(0,2).join(', ')}.`
  ).join('\n');

  const raw = await callGroq(
    `Analyze these ${resources.length} academic documents and find meaningful connections between them. Return JSON only:
[
  {
    "doc1Title": "Document A title",
    "doc2Title": "Document B title",
    "connectionType": "Builds on | Contradicts | Supports | Extends | Requires",
    "description": "Specific explanation of how these documents relate",
    "sharedConcepts": ["concept1", "concept2"],
    "studyTip": "How to study these documents together effectively"
  }
]

DOCUMENTS:
${summaries}

Return ONLY valid JSON array. Find 2–5 meaningful connections.`,
    'You are an interdisciplinary academic analyst. Find deep, meaningful connections between documents. Return only valid JSON.'
  );

  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

// 7. Teach Me Mode — Single Turn
export const teachMeStep = async (extractedText, concept, sessionHistory) => {
  const systemInstruction = `You are a Socratic tutor teaching the concept of "${concept}" from the following document. 

Your method:
1. Start by asking the student what they already know about the concept
2. Based on their answer, either correct misconceptions gently or push deeper
3. Use probing questions — never just give the answer outright
4. When the student answers correctly, affirm it and go one level deeper
5. After 4–6 exchanges, give a clear, definitive summary of the concept
6. Use analogies to make complex ideas concrete
7. Keep responses conversational — max 3 sentences per reply

DOCUMENT EXCERPT:
${truncateText(extractedText, 3000)}`;

  const messages = [
    { role: 'system', content: systemInstruction },
    ...sessionHistory
  ];

  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error('Groq API key not found.');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.8,
      max_tokens: 512,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};
