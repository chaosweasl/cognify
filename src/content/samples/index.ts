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

export const sampleFlashcards = {
  programming: flashcardsProgramming,
  history: flashcardsHistory,
  science: flashcardsScience,
};

export const sampleCheatsheets = {
  python: cheatsheetPython,
  react: cheatsheetReact,
};

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
    flashcards: Object.keys(sampleFlashcards).map((key) => ({
      key,
      title: (sampleFlashcards as any)[key].title,
      description: (sampleFlashcards as any)[key].description,
      subject: (sampleFlashcards as any)[key].subject,
      difficulty: (sampleFlashcards as any)[key].difficulty,
      count: (sampleFlashcards as any)[key].flashcards.length,
    })),
    cheatsheets: Object.keys(sampleCheatsheets).map((key) => ({
      key,
      title: (sampleCheatsheets as any)[key].title,
      description: (sampleCheatsheets as any)[key].description,
      subject: (sampleCheatsheets as any)[key].subject,
      difficulty: (sampleCheatsheets as any)[key].difficulty,
      sections: (sampleCheatsheets as any)[key].sections.length,
    })),
    quizzes: Object.keys(sampleQuizzes).map((key) => ({
      key,
      title: (sampleQuizzes as any)[key].title,
      description: (sampleQuizzes as any)[key].description,
      subject: (sampleQuizzes as any)[key].subject,
      difficulty: (sampleQuizzes as any)[key].difficulty,
      questions: (sampleQuizzes as any)[key].questions.length,
      timeLimit: (sampleQuizzes as any)[key].timeLimit,
    })),
  };
}

export default sampleContent;
