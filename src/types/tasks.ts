export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface TestCase {
  input: string;
  expectedOutput: string;
}

export interface Task {
  id: string;
  difficulty: Difficulty;
  condition: string;
  example: string;
  testCases: TestCase[];
}
