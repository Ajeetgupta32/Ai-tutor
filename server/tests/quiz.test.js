import { describe, it, expect } from 'vitest';
import { QuizGenerationZodSchema } from '../src/validators/ai.validator.js';
import { AIService } from '../src/services/openai.service.js';
describe('AI Quiz Generation & Zod Schema Tests', () => {
    it('should validate structured quiz JSON payload with Zod schema', () => {
        const mockQuizJSON = {
            title: 'Computer Science: Data Structures Assessment',
            subjectName: 'Computer Science',
            topicName: 'Data Structures',
            difficulty: 'intermediate',
            questionType: 'mixed',
            questionCount: 2,
            questions: [
                {
                    id: 'q1',
                    questionText: 'What is the worst-case time complexity of Quick Sort?',
                    type: 'mcq',
                    options: ['O(n log n)', 'O(n^2)', 'O(n)', 'O(1)'],
                    correctAnswer: 'O(n^2)',
                    explanation: 'In the worst case when the pivot chosen is always extreme, Quick Sort deteriorates to O(n^2).',
                    topic: 'Algorithms',
                },
                {
                    id: 'q2',
                    questionText: 'True or False: Stacks follow LIFO (Last In First Out) order.',
                    type: 'true_false',
                    options: ['True', 'False'],
                    correctAnswer: 'True',
                    explanation: 'True. Elements added last to a stack are retrieved first.',
                    topic: 'Data Structures',
                },
            ],
        };
        const validated = QuizGenerationZodSchema.parse(mockQuizJSON);
        expect(validated.questionCount).toBe(2);
        expect(validated.questions[0].correctAnswer).toBe('O(n^2)');
    });
    it('should generate fallback quiz when AI key is absent', async () => {
        const quiz = await AIService.generateQuiz({
            subjectName: 'Physics',
            topicName: 'Quantum Mechanics',
            difficulty: 'advanced',
            questionCount: 3,
            questionType: 'mcq',
        });
        expect(quiz).toBeDefined();
        expect(quiz.questions.length).toBe(3);
        expect(quiz.subjectName).toBe('Physics');
    });
});
