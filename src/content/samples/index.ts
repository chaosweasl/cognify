// Sample Content for Testing Import Flows
// These files demonstrate the expected JSON format for different content types

// Flashcard samples
import flashcardsProgramming from "./flashcards-programming.json";
import flashcardsHistory from "./flashcards-history.json";
import flashcardsScience from "./flashcards-science.json";

// Cheatsheet samples
import cheatsheetPython from "./cheatsheet-python.json";
import cheatsheetReact from "./cheatsheet-react.json";

// Quiz samples
import quizJavaScript from "./quiz-javascript.json";
import quizGeography from "./quiz-geography.json";

// Type definitions for sample data
export interface SampleFlashcardSet {
  title: string;
  description: string;
  subject: string;
  difficulty: string;
  flashcards: Array<{ front: string; back: string; tags?: string[] }>;
}

export interface SampleCheatsheet {
  title: string;
  description: string;
  subject: string;
  difficulty: string;
  sections: Array<{ title: string; content: string; keyPoints: string[] }>;
}

export interface SampleQuiz {
  title: string;
  description: string;
  subject: string;
  difficulty: string;
  questions: Array<{
    question: string;
    type: string;
    options?: string[];
    correctAnswer: string | number;
  }>;
  timeLimit: number;
}

export const sampleFlashcards = {
  programming: flashcardsProgramming,
  history: flashcardsHistory,
  science: flashcardsScience,
} as const;

export const sampleCheatsheets = {
  python: cheatsheetPython,
  react: cheatsheetReact,
} as const;

export const sampleQuizzes = {
  javascript: quizJavaScript,
  geography: quizGeography,
};

// Combined export for easy access
export const sampleContent = {
  flashcards: sampleFlashcards,
  cheatsheets: sampleCheatsheets,
  quizzes: sampleQuizzes,
};

// Helper function to get sample by type and subject
export function getSample(
  type: "flashcards" | "cheatsheets" | "quizzes",
  subject: string
) {
  return sampleContent[type]?.[
    subject as keyof (typeof sampleContent)[typeof type]
  ];
}

// Helper function to get all samples of a type
export function getAllSamples(type: "flashcards" | "cheatsheets" | "quizzes") {
  return Object.entries(sampleContent[type]);
}

// Helper function to get sample metadata
export function getSampleMetadata() {
  return {
    flashcards: Object.keys(sampleFlashcards).map((key) => {
      const sample = sampleFlashcards[
        key as keyof typeof sampleFlashcards
      ] as Record<string, unknown>;
      return {
        key,
        title: sample.title as string,
        description: sample.description as string,
        subject: sample.subject as string,
        difficulty: sample.difficulty as string,
        count: (sample.flashcards as unknown[]).length,
      };
    }),
    cheatsheets: Object.keys(sampleCheatsheets).map((key) => {
      const sample = sampleCheatsheets[
        key as keyof typeof sampleCheatsheets
      ] as Record<string, unknown>;
      return {
        key,
        title: sample.title as string,
        description: sample.description as string,
        subject: sample.subject as string,
        difficulty: sample.difficulty as string,
        sections: (sample.sections as unknown[]).length,
      };
    }),
    quizzes: Object.keys(sampleQuizzes).map((key) => {
      const sample = sampleQuizzes[key as keyof typeof sampleQuizzes] as Record<
        string,
        unknown
      >;
      return {
        key,
        title: sample.title as string,
        description: sample.description as string,
        subject: sample.subject as string,
        difficulty: sample.difficulty as string,
        questions: (sample.questions as unknown[]).length,
        timeLimit: sample.timeLimit as number,
      };
    }),
  };
}

export default sampleContent;
