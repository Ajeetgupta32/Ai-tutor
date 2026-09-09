import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';
import {
  QuizGenerationZodSchema,
  MaterialAnalysisZodSchema,
  QuizGenerationAI,
  MaterialAnalysisAI,
} from '../validators/ai.validator.js';

let geminiClient: GoogleGenAI | null = null;
let openaiClient: OpenAI | null = null;

if (config.geminiApiKey && config.geminiApiKey.trim() !== '') {
  geminiClient = new GoogleGenAI({ apiKey: config.geminiApiKey });
}

if (config.openaiApiKey && config.openaiApiKey !== 'your_openai_api_key_here') {
  openaiClient = new OpenAI({ apiKey: config.openaiApiKey });
}

async function callGeminiCascade(contents: string, config?: any): Promise<string | null> {
  if (!geminiClient) return null;
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  for (const model of models) {
    try {
      const response = await geminiClient.models.generateContent({
        model,
        contents,
        ...(config ? { config } : {}),
      });
      if (response && response.text) {
        return response.text;
      }
    } catch (error: any) {
      logger.warn(`Gemini model ${model} request failed (${error.message || String(error)}), trying fallback model...`);
    }
  }
  return null;
}

export class AIService {
  /**
   * Generate AI Tutor Response
   */
  static async generateTutorResponse(params: {
    message: string;
    conversationHistory: Array<{ sender: 'user' | 'assistant'; content: string }>;
    subjectName?: string;
    level?: 'beginner' | 'intermediate' | 'advanced';
    mode?: 'explain' | 'analogy' | 'stepByStep' | 'summarize' | 'quizMe' | 'default';
    language?: 'en' | 'hi';
  }): Promise<string> {
    const {
      message,
      conversationHistory = [],
      subjectName = 'Computer Science',
      level = 'intermediate',
      mode = 'default',
      language = 'en',
    } = params;

    const systemPrompt = `You are EduMentor AI, an expert, empathetic, and encouraging personal AI teacher.
Subject Focus: ${subjectName}
Student Learning Level: ${level.toUpperCase()}
Target Response Language: ${language === 'hi' ? 'Hindi (or Hinglish for technical clarity)' : 'English'}

Teaching Rules:
1. Explain concepts thoroughly with clear structure, bullet points, and code formatting where applicable.
2. Adapt explanations to the ${level} level.
3. Identify potential student misunderstandings and proactively clarify them.
4. Keep the tone encouraging, inspiring, and direct.
5. Mode requirement: ${
      mode === 'explain'
        ? 'Explain the topic simply with clear language and no unnecessary jargon.'
        : (mode as string) === 'eli10'
        ? 'Explain Like I\'m 10: Use an ultra-simple, fun, easy-to-understand analogy that a 10-year old would immediately grasp with zero technical jargon.'
        : mode === 'analogy'
        ? 'Use an intuitive real-world analogy to illustrate the concept.'
        : mode === 'stepByStep'
        ? 'Provide a clear, numbered step-by-step breakdown.'
        : mode === 'summarize'
        ? 'Provide a concise summary with key takeaways.'
        : mode === 'quizMe'
        ? 'Ask 2-3 quick interactive check-for-understanding questions.'
        : (mode as string) === 'examPrep'
        ? 'Provide exam-oriented high-yield points, common exam pitfalls, and 2 memory tricks.'
        : 'Provide a complete, detailed educational response.'
    }`;

    // 1. Try Google Gemini API Cascade
    const historyText = conversationHistory
      .slice(-6)
      .map((h) => `${h.sender === 'user' ? 'Student' : 'Tutor'}: ${h.content}`)
      .join('\n');

    const fullPrompt = `${systemPrompt}\n\nConversation History:\n${historyText}\n\nStudent: ${message}\n\nTutor:`;
    const geminiReply = await callGeminiCascade(fullPrompt);
    if (geminiReply && geminiReply.trim()) {
      return geminiReply.trim();
    }


    // 2. Try OpenAI API if available
    if (openaiClient) {
      try {
        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
          { role: 'system', content: systemPrompt },
          ...conversationHistory.slice(-6).map((h) => ({
            role: (h.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
            content: h.content,
          })),
          { role: 'user', content: message },
        ];

        const response = await openaiClient.chat.completions.create({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.7,
        });

        const reply = response.choices[0]?.message?.content;
        if (reply) return reply;
      } catch (error) {
        logger.warn(
          `OpenAI Tutor API Error, switching to fallback engine: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    // 3. Smart Fallback Tutor Engine
    return AIService.generateFallbackTutorReply(message, subjectName, level, mode, language);
  }

  /**
   * Generate Structured Quiz JSON with Zod validation
   */
  static async generateQuiz(params: {
    subjectName: string;
    topicName: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    questionCount: number;
    questionType: 'mcq' | 'true_false' | 'fill_in_blank' | 'short_answer' | 'mixed';
    language?: 'en' | 'hi';
  }): Promise<QuizGenerationAI> {
    const { subjectName, topicName, difficulty, questionCount, questionType, language = 'en' } = params;

    const prompt = `Generate a high-quality educational quiz in valid JSON format.
Subject: ${subjectName}
Topic: ${topicName}
Difficulty: ${difficulty}
Question Count: ${questionCount}
Question Type: ${questionType}
Language: ${language}

Required JSON Structure (output ONLY the JSON object with no markdown wrappers):
{
  "title": "${subjectName}: ${topicName} Master Quiz",
  "subjectName": "${subjectName}",
  "topicName": "${topicName}",
  "difficulty": "${difficulty}",
  "questionType": "${questionType}",
  "questionCount": ${questionCount},
  "questions": [
    {
      "id": "q1",
      "questionText": "Question text here...",
      "type": "mcq|true_false|fill_in_blank|short_answer",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Exact correct option or answer text",
      "explanation": "Detailed step-by-step explanation of why this answer is correct",
      "topic": "${topicName}"
    }
  ]
}`;

    // 1. Try Google Gemini API Cascade
    const rawJson = await callGeminiCascade(prompt, { responseMimeType: 'application/json' });
    if (rawJson) {
      try {
        const cleaned = rawJson.replace(/^```json\s*/, '').replace(/```$/, '').trim();
        const parsed = JSON.parse(cleaned);
        const validated = QuizGenerationZodSchema.parse(parsed);
        return validated;
      } catch (err: any) {
        logger.warn(`Failed to parse/validate Gemini quiz JSON: ${err.message || String(err)}`);
      }
    }


    // 2. Try OpenAI API if available
    if (openaiClient) {
      try {
        const response = await openaiClient.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'You are an expert AI Assessment Engine. Respond strictly with JSON matching the user prompt structure.',
            },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.6,
        });

        const rawJson = response.choices[0]?.message?.content;
        if (rawJson) {
          const parsed = JSON.parse(rawJson);
          const validated = QuizGenerationZodSchema.parse(parsed);
          return validated;
        }
      } catch (error) {
        logger.warn(
          `OpenAI Quiz Gen Error, using Fallback Engine: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    // 3. Fallback Quiz Generator
    return AIService.generateFallbackQuiz(
      subjectName,
      topicName,
      difficulty,
      questionCount,
      questionType
    );
  }

  /**
   * Summarize Study Material & Extract Concepts
   */
  static async analyzeMaterial(text: string): Promise<MaterialAnalysisAI> {
    const prompt = `Analyze the provided study text. Return a JSON object with: summary (string), keyTopics (array of strings), importantConcepts (array of strings).

Text:
${text.slice(0, 8000)}`;

    // 1. Try Google Gemini API Cascade
    const geminiText = await callGeminiCascade(prompt, { responseMimeType: 'application/json' });
    if (geminiText) {
      try {
        const cleaned = geminiText.replace(/^```json\s*/, '').replace(/```$/, '').trim();
        const parsed = JSON.parse(cleaned);
        return MaterialAnalysisZodSchema.parse(parsed);
      } catch (error: any) {
        logger.warn(`Failed to parse Gemini Material Analysis: ${error.message || String(error)}`);
      }
    }

    // 2. Try OpenAI API if available
    if (openaiClient) {
      try {
        const response = await openaiClient.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'Analyze the provided text. Return a JSON object with: summary (string), keyTopics (array of strings), importantConcepts (array of strings).',
            },
            { role: 'user', content: text.slice(0, 8000) },
          ],
          response_format: { type: 'json_object' },
        });

        const content = response.choices[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          return MaterialAnalysisZodSchema.parse(parsed);
        }
      } catch (error) {
        logger.warn(
          `OpenAI Material Analysis Error: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    // 3. Fallback Material Analysis
    const lines = text.split('\n').filter((l) => l.trim().length > 0);
    const summary =
      text.length > 300
        ? `This study document covers key concepts including: ${lines
            .slice(0, 3)
            .join(' ')}. It details structural definitions, operational mechanisms, and implementation principles necessary for comprehensive revision.`
        : text;

    return {
      summary,
      keyTopics: ['Core Concepts', 'Architectural Overview', 'Key Algorithms', 'Practical Applications'],
      importantConcepts: ['System Design', 'Optimization', 'Data Pipeline', 'Security Best Practices'],
    };
  }

  /**
   * Smart Fallback Tutor Replier
   */
  private static generateFallbackTutorReply(
    message: string,
    subject: string,
    level: string,
    mode: string,
    language: string
  ): string {
    const isHindi = language === 'hi';
    const query = message.trim();

    if (mode === 'analogy') {
      return isHindi
        ? `### 💡 Real-world Analogy (हिंदी): "${query}"
सोचिए कि **${subject}** एक विशाल लाइब्रेरी की तरह है जहाँ हर पुस्तक एक डेटा स्ट्रक्चर या कॉन्सेप्ट है।
जब आप **"${query}"** की बात करते हैं, तो यह लाइब्रेरी कैटलॉग कार्ड की तरह काम करता है जो सही किताब तक पहुँचने का समय कम कर देता है!

* **इनपुट**: आपकी खोज (Query)
* **प्रोसेस**: इंडेक्स आधारित डायरेक्ट लुकअप
* **आउटपुट**: सटीक जानकारी बिना समय गंवाए`
        : `### 💡 Real-World Analogy: "${query}"
Imagine **${subject}** as a high-speed airport fulfillment hub. 
When working with **"${query}"**, think of it as an automated luggage barcode system:

1. **The Item**: The data or command requested.
2. **The Scanner**: The processor evaluating conditions in real-time.
3. **The Destination Gate**: The deterministic output route executed seamlessly.

This eliminates manual searching and guarantees optimal performance!`;
    }

    if (mode === 'stepByStep') {
      return `### 🔢 Step-by-Step Breakdown: ${query}

1. **Core Definition**: Understanding the fundamental objective of ${query} in ${subject}.
2. **Prerequisites & Context**: Ensuring all underlying conditions and state variables are properly configured.
3. **Execution Phase**:
   - **Step A**: Initialize input parameters and check validation rules.
   - **Step B**: Perform transformation logic or mathematical computation.
   - **Step C**: Evaluate output criteria and handle potential edge cases.
4. **Optimization & Best Practice**: Apply caching, lazy evaluation, or efficient algorithmic loops.
5. **Verification**: Confirm correctness through assertions or unit tests.`;
    }

    if (mode === 'summarize') {
      return `### 📝 Key Summary: ${query}

* **Primary Function**: Solves core computational and structural problems within ${subject}.
* **Key Components**: Inputs, logic transformation, modular output handling.
* **Why it Matters**: Increases efficiency, code maintainability, and architectural scalability at the **${level}** level.`;
    }

    if (mode === 'quizMe') {
      return `### 🎯 Quick Knowledge Check: ${query}

Let's test your understanding of **${query}**! Answer these 2 quick questions:

1. **Question 1**: What is the primary purpose of ${query} in ${subject}?
   - A) To increase execution latency
   - B) To provide modular, predictable transformation logic
   - C) To bypass memory allocation

2. **Question 2**: At the ${level} level, what is a crucial edge case to handle for ${query}?

*Reply with your answers to get instant feedback!*`;
    }

    // Default Fallback
    return isHindi
      ? `### 📘 EduMentor AI Tutor (${subject} - ${level.toUpperCase()})

नमस्कार! **"${query}"** एक बहुत महत्वपूर्ण विषय है।

#### 🔑 मुख्य बातें (Key Concepts):
1. **मूल सिद्धांत (Core Concept)**: ${subject} में "${query}" का उपयोग समस्याओं को कुशलता से हल करने के लिए किया जाता है।
2. **व्यावहारिक उदाहरण (Practical Example)**: डेटा को व्यवस्थित रूप से इनपुट करके और तर्क (logic) लागू करके हम सटीक परिणाम प्राप्त करते हैं।
3. **याद रखने योग्य टिप्स**:
   - हमेशा इनपुट डेटा की जांच करें।
   - कोड या लॉजिक को छोटे मॉड्यूल्स में बांटें।

क्या आप चाहेंगे कि मैं इस पर एक **उदाहरण (Example)** दूँ या **Step-by-Step** समझाऊँ?`
      : `### 📘 EduMentor AI Tutor: ${query}

Hello! Let's explore **"${query}"** in **${subject}** tailored to your **${level}** learning level.

#### 💡 Core Conceptual Overview
**${query}** represents a fundamental building block in ${subject}. At the **${level}** level, it is essential to master both its theoretical foundation and practical execution.

#### 🛠️ Key Takeaways & Best Practices
- **Structured Logic**: Ensure clean separation of concerns and clear input/output flow.
- **Edge Case Handling**: Always validate inputs and handle potential null or out-of-bounds conditions.
- **Performance**: Optimize for space and time complexity (O(n) or better where applicable).

Example implementation blueprint for ${query}:
function demonstrateConcept(input: string): { success: boolean; data: string } {
  if (!input) {
    throw new Error("Input parameter is required");
  }
  return { success: true, data: "Processed " + input + " successfully for ${query}" };
}

Feel free to ask me to **Explain Simply**, **Give an Analogy**, or **Quiz You** on this topic!`;
  }

  /**
   * Smart Fallback Quiz Generator
   */
  private static generateFallbackQuiz(
    subjectName: string,
    topicName: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced',
    questionCount: number,
    questionType: 'mcq' | 'true_false' | 'fill_in_blank' | 'short_answer' | 'mixed'
  ): QuizGenerationAI {
    const questions: QuizGenerationAI['questions'] = [];

    for (let i = 1; i <= questionCount; i++) {
      let qType: 'mcq' | 'true_false' | 'fill_in_blank' | 'short_answer' = 'mcq';
      if (questionType !== 'mixed') {
        qType = questionType;
      } else {
        const types: Array<'mcq' | 'true_false' | 'fill_in_blank' | 'short_answer'> = [
          'mcq',
          'true_false',
          'fill_in_blank',
          'short_answer',
        ];
        qType = types[(i - 1) % types.length];
      }

      if (qType === 'mcq') {
        questions.push({
          id: `q_${i}`,
          questionText: `Which statement accurately describes the core mechanism of ${topicName} in ${subjectName}? (Question ${i})`,
          type: 'mcq',
          options: [
            `${topicName} provides deterministic and modular execution rules.`,
            `${topicName} completely bypasses memory allocation.`,
            `${topicName} is only compatible with legacy single-threaded architectures.`,
            `${topicName} eliminates the need for algorithm optimization.`,
          ],
          correctAnswer: `${topicName} provides deterministic and modular execution rules.`,
          explanation: `In ${subjectName}, ${topicName} is engineered to provide modular and deterministic execution rules, ensuring system reliability and maintainability.`,
          topic: topicName,
        });
      } else if (qType === 'true_false') {
        questions.push({
          id: `q_${i}`,
          questionText: `True or False: Mastering ${topicName} is critical for scalable architecture in ${subjectName}. (Question ${i})`,
          type: 'true_false',
          options: ['True', 'False'],
          correctAnswer: 'True',
          explanation: `True. Proper understanding of ${topicName} enables developers and students to build scalable and robust systems.`,
          topic: topicName,
        });
      } else if (qType === 'fill_in_blank') {
        questions.push({
          id: `q_${i}`,
          questionText: `Fill in the blank: The primary objective of ________ in ${subjectName} is to streamline complex workflows.`,
          type: 'fill_in_blank',
          correctAnswer: topicName,
          explanation: `${topicName} is the key subject concept that fills this role in ${subjectName}.`,
          topic: topicName,
        });
      } else {
        questions.push({
          id: `q_${i}`,
          questionText: `Explain in 1-2 sentences how ${topicName} optimizes system execution in ${subjectName}. (Question ${i})`,
          type: 'short_answer',
          correctAnswer: `${topicName} reduces redundancy and optimizes execution efficiency.`,
          explanation: `${topicName} minimizes unnecessary overhead and guarantees predictable runtime performance.`,
          topic: topicName,
        });
      }
    }

    return {
      title: `${subjectName}: ${topicName} Assessment`,
      subjectName,
      topicName,
      difficulty,
      questionType,
      questionCount,
      questions,
    };
  }

  /**
   * Explain Mistakes ("Explain My Mistake")
   * Breaks down: Why it is wrong -> Correct concept -> Simple explanation -> Similar practice question
   */
  static async explainMistake(params: {
    questionText: string;
    userResponse: string;
    correctAnswer: string;
    explanation: string;
    topicName?: string;
    language?: 'en' | 'hi';
  }): Promise<{
    whyWrong: string;
    correctConcept: string;
    simpleExplanation: string;
    similarQuestion: {
      questionText: string;
      options: string[];
      correctAnswer: string;
      explanation: string;
    };
  }> {
    const { questionText, userResponse, correctAnswer, explanation, topicName = 'General', language = 'en' } = params;

    const prompt = `You are EduMentor AI's diagnostic mistake analyst.
A student gave an incorrect answer to a quiz question. Analyze the error and generate a structured JSON breakdown.

Question: ${questionText}
Topic: ${topicName}
Student's Incorrect Answer: ${userResponse}
Correct Answer: ${correctAnswer}
Original Explanation: ${explanation}
Language: ${language}

Required JSON Output format (strictly valid JSON, no markdown wrappers):
{
  "whyWrong": "Specific breakdown of the logical misconception in the student's answer '${userResponse}'.",
  "correctConcept": "The exact core theoretical or mathematical rule that determines the correct answer.",
  "simpleExplanation": "An easy-to-understand explanation of why '${correctAnswer}' is right.",
  "similarQuestion": {
    "questionText": "A similar practice question testing the same concept.",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Correct Option",
    "explanation": "Why this similar question's answer is correct."
  }
}`;

    // 1. Try Google Gemini API Cascade
    const geminiMistake = await callGeminiCascade(prompt, { responseMimeType: 'application/json' });
    if (geminiMistake) {
      try {
        const cleaned = geminiMistake.replace(/^```json\s*/, '').replace(/```$/, '').trim();
        return JSON.parse(cleaned);
      } catch (error: any) {
        logger.warn(`Failed to parse Gemini Explain Mistake: ${error.message || String(error)}`);
      }
    }

    // Fallback response
    return {
      whyWrong: `Your response '${userResponse}' confuses the operational constraints of ${topicName}.`,
      correctConcept: `The principle governing ${topicName} requires ${correctAnswer}.`,
      simpleExplanation: `${correctAnswer} is correct because ${explanation || 'it adheres directly to the defined mechanism.'}`,
      similarQuestion: {
        questionText: `Which factor directly ensures optimal execution when implementing ${topicName}?`,
        options: [
          `Ensuring ${correctAnswer}`,
          `Defaulting to '${userResponse}'`,
          'Bypassing validation checks',
          'Executing without boundary checks',
        ],
        correctAnswer: `Ensuring ${correctAnswer}`,
        explanation: `Adhering to ${correctAnswer} is the standard method to master this topic.`,
      },
    };
  }

  /**
   * Generate AI Study Plan (Study Planner)
   */
  static async generateStudyPlan(params: {
    targetExam: string;
    examDate: string;
    dailyHours: number;
    targetScore: number;
    subjects: string[];
    currentPerformance?: number;
  }): Promise<{
    title: string;
    totalWeeks: number;
    dailySchedule: Array<{
      dayNumber: number;
      dateStr: string;
      subject: string;
      topic: string;
      tasks: string[];
      estimatedMinutes: number;
      isMockDay: boolean;
    }>;
  }> {
    const { targetExam, examDate, dailyHours, targetScore, subjects, currentPerformance = 65 } = params;

    const prompt = `You are EduMentor AI's intelligent study timetable planner.
Create a realistic, structured day-by-day study schedule leading up to an exam.

Target Exam: ${targetExam}
Exam Date: ${examDate}
Daily Available Hours: ${dailyHours}
Target Score: ${targetScore}%
Current Estimated Performance: ${currentPerformance}%
Subjects: ${subjects.join(', ')}

Return strictly a JSON object with this structure:
{
  "title": "Comprehensive Study Plan for ${targetExam}",
  "totalWeeks": 4,
  "dailySchedule": [
    {
      "dayNumber": 1,
      "dateStr": "Day 1",
      "subject": "${subjects[0] || 'Core Subject'}",
      "topic": "Fundamentals & Core Definitions",
      "tasks": ["Review fundamental concepts", "Take a 5-question diagnostic quiz", "Summarize key formulas/rules"],
      "estimatedMinutes": ${Math.round(dailyHours * 60)},
      "isMockDay": false
    }
  ]
}`;

    // 1. Try Google Gemini API Cascade
    const geminiPlan = await callGeminiCascade(prompt, { responseMimeType: 'application/json' });
    if (geminiPlan) {
      try {
        const cleaned = geminiPlan.replace(/^```json\s*/, '').replace(/```$/, '').trim();
        return JSON.parse(cleaned);
      } catch (error: any) {
        logger.warn(`Failed to parse Gemini Study Plan: ${error.message || String(error)}`);
      }
    }

    // Fallback schedule
    const days = [
      {
        dayNumber: 1,
        dateStr: 'Day 1–2',
        subject: subjects[0] || 'Core Fundamentals',
        topic: 'Foundations & Concept Mapping',
        tasks: ['Read core module notes', 'Practice 10 beginner questions', 'Identify weak formulas'],
        estimatedMinutes: Math.round(dailyHours * 60),
        isMockDay: false,
      },
      {
        dayNumber: 3,
        dateStr: 'Day 3–4',
        subject: subjects[1] || subjects[0] || 'Applied Topics',
        topic: 'Problem Solving & Deep Work',
        tasks: ['Solve intermediate problem sets', 'Chat with AI Tutor for edge-cases', 'Note review'],
        estimatedMinutes: Math.round(dailyHours * 60),
        isMockDay: false,
      },
      {
        dayNumber: 5,
        dateStr: 'Day 5',
        subject: 'Comprehensive Review',
        topic: 'Timed Mock Assessment',
        tasks: ['Full-length timed practice quiz', 'Review mistakes using AI Mistake Explainer'],
        estimatedMinutes: Math.round(dailyHours * 60),
        isMockDay: true,
      },
    ];

    return {
      title: `${targetExam} Mastery Schedule`,
      totalWeeks: 2,
      dailySchedule: days,
    };
  }
}

export const aiService = new AIService();

