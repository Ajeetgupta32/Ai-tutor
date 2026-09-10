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

async function callGeminiCascade(contents: string, customConfig?: any): Promise<string | null> {
  if (!geminiClient) return null;
  // Prioritize gemini-2.0-flash for lowest latency & fastest token generation
  const models = ['gemini-2.0-flash', 'gemini-2.5-flash-lite', 'gemini-1.5-flash', 'gemini-2.5-flash'];
  for (const model of models) {
    try {
      const mergedConfig: any = {
        // Disable unnecessary thinking tokens for models that support it to eliminate latency
        ...(model.includes('2.5') ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
        ...(customConfig || {}),
      };

      // Wrap in a 10-second timeout so slow/lagging endpoints fail-over immediately
      const generatePromise = geminiClient.models.generateContent({
        model,
        contents,
        ...(Object.keys(mergedConfig).length > 0 ? { config: mergedConfig } : {}),
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Model ${model} request timed out after 10s`)), 10000)
      );

      const response = await Promise.race([generatePromise, timeoutPromise]);
      if (response && response.text) {
        return response.text;
      }
    } catch (error: any) {
      logger.warn(`Gemini model ${model} request failed (${error.message || String(error)}), trying next model...`);
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

    const systemPrompt = `You are EduMentor AI, a helpful, brilliant, and friendly AI tutor inspired by the natural clarity and simplicity of Google Gemini and ChatGPT.

Your mission:
- Explain things simply, conversationally, and directly without fluff or repetitive robotic templates.
- Start with a direct, crystal-clear explanation in the very first 1-2 sentences.
- Use intuitive, real-world analogies (e.g. Lego bricks, restaurant kitchens, library books) that make complex concepts click immediately.
- When code or technical examples are helpful, provide a clean, concise snippet (in Python, JavaScript, or C++) with a 1-line explanation of what it does.
- Avoid repeating the same headers ("Core Conceptual Overview", "Demonstrate Concept") on every message. Treat this like an authentic 1-on-1 chat conversation with a student.
- Student Level: ${level.toUpperCase()} | Subject: ${subjectName}
- Language: ${language === 'hi' ? 'Natural conversational Hindi / Hinglish for clarity and ease.' : 'Natural, clear English.'}
- Mode Guidance: ${
      mode === 'explain'
        ? 'Explain clearly in plain everyday language with zero unnecessary jargon.'
        : (mode as string) === 'eli10'
        ? 'Explain Like I\'m 10: Use an ultra-simple, fun, easy analogy that a 10-year-old would instantly understand and love.'
        : mode === 'analogy'
        ? 'Give an intuitive, real-world comparison that makes the topic effortless to visualize.'
        : mode === 'stepByStep'
        ? 'Provide a clear, practical numbered breakdown.'
        : mode === 'summarize'
        ? 'Give 3-4 high-impact key takeaways.'
        : mode === 'quizMe'
        ? 'Briefly recap the core point and ask 2 fun, interactive check-for-understanding questions.'
        : (mode as string) === 'examPrep'
        ? 'Highlight exam high-yield facts, common student traps, and a fast memory trick.'
        : 'Give a direct, simple, and friendly explanation with a quick practical example.'
    }`;

    // 1. Try Google Gemini API Cascade
    const historyText = conversationHistory
      .slice(-6)
      .map((h) => `${h.sender === 'user' ? 'Student' : 'Tutor'}: ${h.content}`)
      .join('\n');

    const fullPrompt = `${systemPrompt}\n\nConversation History:\n${historyText}\n\nStudent: ${message}\n\nTutor:`;
    const geminiReply = await callGeminiCascade(fullPrompt, { temperature: 0.75 });
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
          temperature: 0.75,
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
    const lower = message.toLowerCase().trim();
    const query = message.trim();

    // 1. Conversational Greetings & Small Talk
    if (/^(hi|hello|hey|greetings|namaste|hola|good\s*(morning|afternoon|evening)|who are you|what can you do)/i.test(lower)) {
      if (isHindi) {
        return `नमस्ते! 🙏 मैं आपका **EduMentor AI ट्यूटर** हूँ। 

आप मुझसे किसी भी विषय पर प्रश्न पूछ सकते हैं, जैसे:
* **"Explain recursion like I'm 10"** 🍭
* **"Binary search का real-world analogy क्या है?"** ⚡
* **"Step-by-step SQL queries कैसे काम करती हैं?"** 📊

आज आप क्या सीखना चाहते हैं?`;
      }
      return `Hey there! 👋 I'm your **EduMentor AI Tutor**.

I'm here to break down complex topics into simple, intuitive concepts — just like chatting with a mentor. You can ask me anything, or try one of these:
* 🍭 *"Explain how Recursion works like I'm 10"*
* 🔌 *"Give me a real-world analogy for APIs"*
* 🔢 *"Break down Binary Search step-by-step"*
* 🎯 *"Quiz me on JavaScript basics"*

What would you like to explore today?`;
    }

    // 2. Topic-Specific Rich Synthesizers
    if (lower.includes('recursion')) {
      if (mode === 'eli10') {
        return isHindi
          ? `🍭 **Recursion सरल शब्दों में (Like you're 10):**
सोचिए आपके पास एक **रूसी गुड़िया (Russian Nesting Doll)** है। आप सबसे बड़ी गुड़िया खोलते हैं, तो अंदर एक और छोटी गुड़िया मिलती है। आप तब तक गुड़िया खोलते रहते हैं जब तक सबसे छोटी गुड़िया (Base Case) नहीं आ जाती जिसे और नहीं खोला जा सकता!

कंप्यूटर में Recursion का मतलब है कि एक फंक्शन खुद को बार-बार तब तक कॉल करता है जब तक उसका काम पूरा नहीं हो जाता।`
          : `🍭 **Recursion Explained Like You're 10:**
Imagine a set of **Russian Nesting Dolls**. You open the big doll, and inside is a smaller doll. You open that one, and find an even smaller doll — until you hit the tiniest solid doll (the **Base Case**) that cannot be opened!

In programming, recursion is when a function solves a problem by calling a smaller copy of itself until it hits the stopping point.

\`\`\`python
def countdown(n):
    if n <= 0:          # 🛑 Base Case: Stop when we hit 0
        print("Blastoff! 🚀")
        return
    print(n)
    countdown(n - 1)   # 🔁 Recursive Call: Call itself with a smaller number
\`\`\``;
      }
      return isHindi
        ? `### 🔁 Recursion क्या है?
Recursion एक ऐसी प्रोग्रामिंग तकनीक है जहाँ कोई फ़ंक्शन किसी बड़ी समस्या को हल करने के लिए **खुद को ही बार-बार कॉल करता है**।

**2 सबसे ज़रूरी नियम:**
1. **Base Case (रुकने की शर्त)**: ताकि कोड अनंत लूप (Infinite Loop) में न फंसे।
2. **Recursive Step**: समस्या को हर बार थोड़ा छोटा करना।

\`\`\`javascript
// Factorial Example: 5! = 5 * 4 * 3 * 2 * 1
function factorial(n) {
  if (n <= 1) return 1; // Base case
  return n * factorial(n - 1); // Recursive step
}
\`\`\``
        : `### 🔁 Understanding Recursion
Recursion is when a function **calls itself** to break a large, complex task into smaller, identical sub-tasks.

Every recursive function needs two fundamental parts:
1. **Base Case (The Stop Sign 🛑)**: The condition that ends the recursion and prevents an infinite loop.
2. **Recursive Case (The Step 🔁)**: The part where the function calls itself with a smaller input.

\`\`\`python
# Factorial calculation: 5! = 5 * 4 * 3 * 2 * 1 = 120
def factorial(n):
    if n <= 1:           # Base Case
        return 1
    return n * factorial(n - 1)  # Recursive Step
\`\`\`

**Why use it?** It makes tree traversals, graph searches (DFS), and divide-and-conquer algorithms (Merge Sort) much cleaner to write.`;
    }

    if (lower.includes('binary search')) {
      return isHindi
        ? `### 🔍 Binary Search (सरल व्याख्या)
Binary Search एक बहुत तेज़ सर्चिंग एल्गोरिथ्म है जो केवल **सॉर्टेड (क्रमबद्ध)** एरे पर काम करता है।

**💡 रियल-लाइफ उदाहरण:**
जब आप एक 1000 पन्नों की डिक्शनरी में शब्द ढूंढते हैं, तो आप पहले पन्ने से शुरू नहीं करते। आप डिक्शनरी को **ठीक बीच से खोलते हैं**, देखते हैं कि शब्द आगे है या पीछे, और आधे पन्ने सीधे छोड़ देते हैं!

* **Time Complexity**: **O(log n)** — 1,000,000 आइटम्स में से सही आइटम ढूंढने में अधिकतम सिर्फ 20 स्टेप्स लगते हैं!`
        : `### 🔍 Binary Search: Divide and Conquer
Binary search is an ultra-fast algorithm to find an item in a **sorted list**.

**💡 The Phonebook Analogy:**
If you're looking for "Smith" in a 1,000-page physical phone directory:
1. You open to page 500 (the exact middle).
2. "Smith" comes after "M", so you instantly throw away the entire first 500 pages!
3. You repeat the same middle-split on pages 501–1000 until you find it.

\`\`\`javascript
function binarySearch(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;     // Found!
    if (arr[mid] < target) left = mid + 1;  // Search right half
    else right = mid - 1;                   // Search left half
  }
  return -1; // Not found
}
\`\`\`

**Efficiency**: **O(log n)** time — searching through 1,000,000 elements takes at most **20 checks**!`;
    }

    if (lower.includes('api') || lower.includes('rest')) {
      return isHindi
        ? `### 🔌 API क्या है? (Application Programming Interface)
API दो अलग-अलग सॉफ्टवेयर या ऐप्स के बीच बातचीत करने का एक माध्यम है।

**💡 वेटर (Waiter) एनालॉजी:**
1. **आप (Client)**: टेबल पर बैठते हैं और मेनू से खाना ऑर्डर करते हैं।
2. **वेटर (API)**: आपका ऑर्डर लेकर किचन (Server) जाता है।
3. **किचन (Server/Database)**: खाना तैयार करता है।
4. **वेटर (API)**: तैयार खाना आपकी टेबल तक पहुँचाता है!`
        : `### 🔌 What is an API? (Application Programming Interface)
An API is a messenger that lets two different software applications talk to each other and exchange data securely.

**💡 The Restaurant Waiter Analogy:**
1. **You (The Client/Frontend)**: You look at the menu and tell the waiter what dish you want.
2. **The Waiter (The API)**: Takes your order and delivers the request to the kitchen.
3. **The Kitchen (The Server/Database)**: Prepares the food or queries the database.
4. **The Waiter (The API)**: Brings the response (your meal / JSON data) back to your table.

**Example REST Request:**
\`\`\`http
GET https://api.example.com/v1/students/123
Response: { "id": 123, "name": "Ajeet", "score": 95 }
\`\`\``;
    }

    if (lower.includes('database') || lower.includes('sql')) {
      return isHindi
        ? `### 🗄️ Database और SQL क्या है?
* **Database**: डेटा को व्यवस्थित रूप से स्टोर करने का डिजिटल कमरा या तिजोरी।
* **SQL (Structured Query Language)**: डेटाबेस से सवाल पूछने और डेटा मैनेज करने की भाषा।

**4 बुनियादी SQL ऑपरेशन्स (CRUD):**
\`\`\`sql
-- 1. Create (डेटा डालना)
INSERT INTO students (name, grade) VALUES ('Rohit', 90);

-- 2. Read (डेटा देखना)
SELECT * FROM students WHERE grade >= 80;

-- 3. Update (बदलना)
UPDATE students SET grade = 95 WHERE name = 'Rohit';

-- 4. Delete (हटाना)
DELETE FROM students WHERE grade < 40;
\`\`\``
        : `### 🗄️ Databases & SQL Made Simple
A **Database** is an organized electronic system designed to store, query, and protect structured data.

**SQL** (*Structured Query Language*) is the universal language used to communicate with relational databases (like PostgreSQL and MySQL).

**The 4 Core CRUD Operations:**
\`\`\`sql
-- 1. CREATE: Add new record
INSERT INTO students (name, score) VALUES ('Alex', 92);

-- 2. READ: Query data with conditions
SELECT name, score FROM students WHERE score >= 80 ORDER BY score DESC;

-- 3. UPDATE: Modify existing records
UPDATE students SET score = 95 WHERE name = 'Alex';

-- 4. DELETE: Remove records
DELETE FROM students WHERE score < 40;
\`\`\`

Think of tables like super-fast spreadsheets linked together with relationships (Foreign Keys)!`;
    }

    if (lower.includes('async') || lower.includes('promise') || lower.includes('await')) {
      return `### ⚡ Async / Await & Promises in JavaScript
Asynchronous code lets your application handle time-consuming tasks (like fetching data from a server or loading a file) in the background without freezing the user interface!

**💡 The Coffee Shop Buzzer Analogy:**
When you order coffee at a busy cafe, the barista gives you a **vibrating buzzer (a Promise)**. You don't freeze and stare at them; you can sit down, chat with friends, and check your phone. When the coffee is ready, the buzzer rings (\`resolve\`) and you pick up your order (\`await\`).

\`\`\`javascript
// Fetching student data asynchronously
async function loadStudentProfile(studentId) {
  try {
    const response = await fetch(\`/api/students/\${studentId}\`);
    const data = await response.json();
    console.log("Student loaded:", data.name);
  } catch (error) {
    console.error("Failed to load:", error);
  }
}
\`\`\``;
    }

    if (lower.includes('oop') || lower.includes('object') || lower.includes('class')) {
      return `### 🧱 Object-Oriented Programming (OOP)
OOP is a way of organizing code around real-world entities (objects) that combine **data (properties)** and **actions (methods)**.

**The 4 Core Pillars of OOP:**
1. **Encapsulation**: Keeping data and methods bundled together in a capsule (Class), hiding internal details.
2. **Abstraction**: Hiding complex background logic and exposing only simple interfaces (e.g. you press a car's gas pedal without knowing engine mechanics).
3. **Inheritance**: Creating child classes that reuse code from parent classes (e.g. \`ElectricCar\` inherits from \`Car\`).
4. **Polymorphism**: The same method name behaves differently depending on the object (e.g. \`dog.speak()\` says "Woof", \`cat.speak()\` says "Meow").

\`\`\`typescript
class User {
  constructor(public name: string, public xp: number) {}

  addXP(points: number) {
    this.xp += points;
    console.log(\`\${this.name} now has \${this.xp} XP! 🚀\`);
  }
}

const student = new User("Alex", 100);
student.addXP(50); // Alex now has 150 XP!
\`\`\``;
    }

    // 3. Dynamic Knowledge Synthesizer for Any Other Question
    if (mode === 'analogy') {
      return isHindi
        ? `💡 **Real-World Analogy for "${query}":**
सोचिए **${query}** एक स्मार्ट ऑटोमेटेड सिस्टम की तरह है। जब कोई इनपुट आता है, तो यह पूर्व-निर्धारित नियमों के आधार पर सही प्रक्रिया चुनता है और बिना किसी रुकावट के सही परिणाम तैयार करता है!

क्या आप इसका एक कोड उदाहरण देखना चाहते हैं?`
        : `💡 **Real-World Analogy for "${query}":**
Think of **${query}** like an automated smart traffic intersection.
Instead of every car guessing when to go (which causes chaos), the system applies clear, deterministic rules to direct traffic smoothly, preventing bottlenecks and ensuring everyone reaches their destination safely!

Would you like a step-by-step breakdown or a practical code snippet on this?`;
    }

    if (mode === 'eli10') {
      return `🍭 **"${query}" Explained Like You're 10:**
Imagine you are building a castle with **Lego blocks**.
**${query}** is like a special pre-made Lego piece that already has doors and windows built in. Instead of building every tiny piece from scratch every time, you snap this piece in, and your castle is ready to play with much faster!`;
    }

    if (mode === 'stepByStep') {
      return `🔢 **Step-by-Step Guide: ${query}**

1. **The Foundation**: Understand what problem ${query} solves in ${subject}.
2. **Setup & Inputs**: Identify the parameters or initial state needed to start.
3. **Core Execution**:
   - Process the inputs using clear logic.
   - Handle edge cases (empty inputs, zero, null values).
4. **Verify Output**: Test that the result matches expectations.
5. **Optimization**: Review if time or memory can be improved.

Feel free to ask me to write the exact code for any of these steps!`;
    }

    if (mode === 'summarize') {
      return `📝 **Summary: ${query}**

* **Core Purpose**: Provides a clean, reliable way to solve key problems in ${subject}.
* **Key Benefit**: Makes code or systems modular, predictable, and easier to debug.
* **Pro Tip**: Always handle boundary conditions and test with both small and large inputs.`;
    }

    if (mode === 'quizMe') {
      return `🎯 **Quick Quiz on "${query}":**

Let's see if you've got this down!

1. **Question 1**: What is the main advantage of using **${query}** in ${subject}?
   - A) It makes execution deterministic and organized
   - B) It skips all memory allocation
   - C) It is only used for legacy systems

2. **Question 2**: What is an important edge case to consider when working with ${query}?

*Reply with your answers and I'll score them right away!*`;
    }

    // Natural Default Conversation
    if (isHindi) {
      return `### 📘 ${query}

**"${query}"** ${subject} का एक महत्वपूर्ण और व्यावहारिक कॉन्सेप्ट है।

#### 💡 सरल व्याख्या:
जब आप ${query} का उपयोग करते हैं, तो इसका मुख्य उद्देश्य काम को व्यवस्थित करना, गलतियों को रोकना और परफॉरमेंस को बेहतर बनाना होता है।

* **सरल उदाहरण**: जैसे किसी लाइब्रेरी में किताबों को श्रेणी अनुसार रखा जाता है ताकि ढूंढना आसान हो।
* **याद रखने की टिप**: हमेशा बेस केस और इनपुट की जांच करें।

क्या आप चाहते हैं कि मैं इस पर एक **Python / JavaScript कोड उदाहरण** दिखाऊँ या **Explain Like I'm 10** में समझाऊँ?`;
    }

    return `### 📘 ${query}

**${query}** is a fundamental concept in **${subject}** designed to make problem-solving clean, predictable, and scalable.

#### 💡 The Core Idea
At its heart, **${query}** allows you to take an input, apply structured logic, and get an efficient, reliable result without unnecessary complexity.

* **Key Benefit**: Keeps your logic modular and easy to test or debug.
* **Best Practice**: Always check for edge cases (like empty inputs or boundaries) before executing main operations.

Would you like me to show a **code example (Python/JavaScript)**, give a **real-world analogy**, or **break it down step-by-step**?`;
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

