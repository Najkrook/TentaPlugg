import { questions } from './data.js';
import { vocabularyQuestions } from './vocabulary-practice.js';

// Full lookup for persisted sessions; legacy practice/exam selection stays unchanged.
export const allQuestions = [...questions, ...vocabularyQuestions];
