import fs from 'fs';
import { LESSONS, Lesson, Challenge, TestCase } from '../src/constants/lessons';

console.log("Original LESSONS length:", LESSONS.length);
let removedCount = 0;

for (const lesson of LESSONS) {
  const challenges: Challenge[] = lesson.challenges || [];
  if ((lesson as any).challenge) challenges.push((lesson as any).challenge);

  for (const ch of challenges) {
    if (!ch.testCases) continue;
    
    for (const tc of ch.testCases as any[]) {
      if (tc.input !== undefined) {
        delete tc.input;
        removedCount++;
      }
    }
  }
}

console.log(`Removed 'input' from ${removedCount} test cases.`);

const finalCode = `export interface TestCase {
  inputValues?: string[];
  expectedOutput?: string;
  description?: string;
  assertCode?: string;
  isHidden?: boolean;
}

export interface Challenge {
  question: string;
  description: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Professional';
  example?: string;
  initialCode: string;
  testCases: TestCase[];
  answer?: string | string[];
  code?: string;
  hint?: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  icon: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Professional';
  content: string;
  color?: string;
  sections?: {
    id: string;
    title: string;
    content: string[];
    code?: string;
  }[];
  challenge?: Challenge;
  challenges?: Challenge[];
}

export const LESSONS: Lesson[] = ${JSON.stringify(LESSONS, null, 2)};
`;

fs.writeFileSync('src/constants/lessons.ts', finalCode);
console.log("Done rewriting!");

