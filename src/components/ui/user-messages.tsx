/* =========================== 
   USER-FRIENDLY CONTENT & MICROCOPY
   Consistent, helpful messaging throughout the app
   =========================== */

// User-friendly error messages (replacing technical jargon)
export const USER_MESSAGES = {
  // Authentication & Access
  AUTH: {
    WELCOME_BACK: "Welcome back! Ready to continue learning?",
    SIGN_IN_TO_CONTINUE: "Sign in to access your learning materials",
    SIGN_UP_GET_STARTED: "Create your account and start learning smarter",
    LOGOUT_SUCCESS: "You've been signed out. See you soon!",
    SESSION_EXPIRED:
      "Your session has expired. Please sign in again to continue.",
    INVALID_CREDENTIALS:
      "That email and password combination doesn't match our records. Please try again.",
    ACCOUNT_LOCKED:
      "Too many unsuccessful attempts. Please wait a few minutes before trying again.",
    PASSWORD_RESET_SENT: "Check your email for password reset instructions.",
    VERIFICATION_REQUIRED:
      "Please check your email and click the verification link to continue.",
  },

  // Network & Connectivity
  NETWORK: {
    CONNECTION_ERROR:
      "Oops! It seems you're offline. Check your internet connection and try again.",
    SLOW_CONNECTION:
      "Your connection seems slow. This might take a moment longer.",
    SERVER_BUSY:
      "Our servers are experiencing high traffic. Please try again in a moment.",
    TIMEOUT_ERROR: "That took longer than expected. Please try again.",
    NETWORK_RESTORED: "Connection restored! You're back online.",
  },

  // File Operations
  FILES: {
    UPLOAD_SUCCESS: "Your file has been uploaded successfully!",
    UPLOAD_ERROR:
      "We couldn't upload your file. Please check it's a PDF under 10MB and try again.",
    UPLOAD_IN_PROGRESS: "Uploading your file... This may take a moment.",
    FILE_TOO_LARGE: "That file is too large. Please choose a PDF under 10MB.",
    INVALID_FILE_TYPE:
      "Please select a PDF file. Other formats aren't supported yet.",
    UPLOAD_CANCELLED: "Upload cancelled. Your file wasn't saved.",
    PROCESSING_FILE:
      "We're processing your PDF to extract the text. Almost ready!",
  },

  // AI & Generation
  AI: {
    GENERATING: "Our AI is working its magic... Creating your flashcards now.",
    GENERATION_SUCCESS: "Success! We've created flashcards from your content.",
    GENERATION_ERROR:
      "Our AI is taking a brief rest. Please try generating flashcards again.",
    NO_CONTENT_FOUND:
      "We couldn't find enough text content in this file to create flashcards.",
    RATE_LIMIT:
      "You've been busy! Please wait a moment before generating more flashcards.",
    API_KEY_MISSING: "To use AI features, please add your API key in Settings.",
    API_KEY_INVALID:
      "Your API key isn't working. Please check it in Settings and try again.",
    QUOTA_EXCEEDED:
      "You've reached your daily AI usage limit. Reset tomorrow or upgrade your plan.",
  },

  // Data Operations
  DATA: {
    SAVE_SUCCESS: "Your changes have been saved!",
    SAVE_ERROR:
      "We couldn't save your changes right now. Please try again in a moment.",
    DELETE_SUCCESS: "Successfully deleted.",
    DELETE_ERROR: "Something went wrong while deleting. Please try again.",
    UPDATE_SUCCESS: "Updated successfully!",
    UPDATE_ERROR:
      "We couldn't update that right now. Please check your connection and try again.",
    IMPORT_SUCCESS: "Your data has been imported successfully!",
    EXPORT_SUCCESS: "Your data has been exported. Check your downloads folder.",
    BACKUP_SUCCESS: "Backup created successfully! Your data is safe.",
  },

  // Study & Learning
  STUDY: {
    SESSION_STARTED: "Study session started! Let's learn something new.",
    SESSION_COMPLETED: "Great work! You've completed this study session.",
    NO_CARDS_READY:
      "No cards are ready for review right now. Check back later or add more content!",
    PROGRESS_SAVED: "Your progress has been saved automatically.",
    STREAK_MILESTONE: "Fantastic! You're on a learning streak!",
    MASTERY_ACHIEVED:
      "You've mastered this card! It won't appear again for a while.",
    DIFFICULTY_ADJUSTED:
      "We've adjusted the difficulty based on your performance.",
    REVIEW_REMINDER:
      "You have cards ready for review. Perfect timing to reinforce your learning!",
  },

  // Projects & Organization
  PROJECTS: {
    CREATED: "Project created! Time to add some learning materials.",
    UPDATED: "Your project has been updated.",
    DELETED: "Project deleted successfully.",
    EMPTY_STATE: "No projects yet? Create your first one to get started!",
    SEARCH_NO_RESULTS:
      "No projects match your search. Try different keywords or create a new project.",
    IMPORT_PROJECT: "Import your existing flashcards to get started quickly.",
  },

  // Settings & Configuration
  SETTINGS: {
    SAVED: "Your settings have been updated!",
    RESET_CONFIRMATION:
      "Are you sure you want to reset all settings to defaults?",
    THEME_CHANGED: "Theme updated! Your preference has been saved.",
    NOTIFICATIONS_ENABLED:
      "Notifications enabled. We'll remind you when it's time to study.",
    NOTIFICATIONS_DISABLED:
      "Notifications turned off. You can re-enable them anytime.",
    PRIVACY_UPDATED: "Your privacy settings have been updated.",
  },

  // General Actions
  ACTIONS: {
    COPY_SUCCESS: "Copied to clipboard!",
    SHARE_SUCCESS: "Sharing options opened.",
    FEEDBACK_SENT:
      "Thank you for your feedback! We'll use it to improve Cognify.",
    REPORT_SENT: "Thank you for reporting this issue. We'll look into it.",
    SUBSCRIPTION_UPDATED: "Your subscription has been updated.",
  },

  // Validation & Form Errors
  VALIDATION: {
    REQUIRED_FIELD: "This field is required.",
    EMAIL_INVALID: "Please enter a valid email address.",
    PASSWORD_TOO_SHORT: "Password must be at least 8 characters long.",
    PASSWORDS_DONT_MATCH: "Passwords don't match. Please try again.",
    NAME_TOO_SHORT: "Please enter at least 2 characters.",
    SPECIAL_CHARACTERS: "Only letters, numbers, and spaces are allowed.",
  },
} as const;

// Helpful placeholders and hints
export const PLACEHOLDERS = {
  // Project-related
  PROJECT_NAME: "e.g., Biology Midterm, Spanish Vocabulary, History Notes",
  PROJECT_DESCRIPTION:
    "Brief description to help you remember what this project covers...",
  PROJECT_TAGS: "Add tags like 'exam', 'vocabulary', 'important'...",

  // Flashcard-related
  FLASHCARD_FRONT: "What question do you want to ask yourself?",
  FLASHCARD_BACK: "What's the answer or explanation?",
  FLASHCARD_HINT: "Optional: Add a helpful hint or memory aid...",

  // Search and filters
  SEARCH_PROJECTS: "Search your projects and flashcards...",
  SEARCH_FLASHCARDS: "Search by question, answer, or tags...",
  FILTER_BY_DIFFICULTY: "Filter by how challenging the cards are...",

  // Settings
  AI_API_KEY: "Paste your API key here (stored securely on your device)",
  STUDY_GOAL: "How many cards do you want to review daily?",
  REMINDER_TIME: "When would you like to be reminded to study?",

  // Import/Export
  IMPORT_FILE: "Choose a JSON file with your flashcards...",
  EXPORT_NAME: "What should we call your export file?",

  // Contact & Support
  FEEDBACK_MESSAGE: "Tell us what you think! What can we improve?",
  BUG_REPORT: "Describe what happened and what you expected...",
} as const;

// Helpful tips and guidance
export const TIPS = {
  STUDY_SESSION: [
    "Take your time - there's no rush! Quality over speed.",
    "If you're stuck, use the hint or mark the card for review.",
    "Regular short sessions work better than cramming.",
    "Trust the spaced repetition - it knows when you need to review!",
  ],

  PROJECT_CREATION: [
    "Start with a clear name that describes your topic.",
    "Add tags to organize related projects together.",
    "Upload PDFs to automatically generate flashcards with AI.",
    "You can always add more content later!",
  ],

  FLASHCARD_CREATION: [
    "Keep questions clear and specific.",
    "Make answers concise but complete.",
    "Use hints for extra context or memory aids.",
    "Test yourself - would you understand this card in a week?",
  ],

  AI_FEATURES: [
    "AI works best with well-formatted PDFs.",
    "Review generated cards - AI is helpful but not perfect.",
    "Your API key is stored securely on your device only.",
    "Different AI models have different strengths - experiment!",
  ],

  SPACED_REPETITION: [
    "Cards you find easy will appear less frequently.",
    "Difficult cards will be shown more often until you master them.",
    "Be honest with your ratings - it helps the algorithm learn.",
    "Consistency beats intensity - study a little every day.",
  ],
} as const;

// Progress and motivation messages
export const MOTIVATION = {
  STREAKS: {
    DAY_1: "Great start! You're building a learning habit.",
    DAY_3: "Three days in a row! You're doing amazing.",
    DAY_7: "A full week! Your dedication is paying off.",
    DAY_30: "30 days of learning! You're truly committed to growth.",
    DAY_100: "100 days! You're a learning champion! 🏆",
  },

  MILESTONES: {
    FIRST_CARD:
      "You've created your first flashcard! The learning journey begins.",
    CARDS_10: "10 flashcards completed! You're getting the hang of this.",
    CARDS_50: "50 cards mastered! Your knowledge is growing.",
    CARDS_100: "100 cards conquered! You're becoming a learning machine!",
    CARDS_500: "500 cards mastered! Your dedication is incredible! 🌟",
  },

  ENCOURAGEMENT: [
    "Every expert was once a beginner. Keep going!",
    "Learning isn't about being perfect - it's about being consistent.",
    "You're investing in yourself. That's always worth it.",
    "Small steps every day lead to big achievements.",
    "Your future self will thank you for studying today!",
  ],
} as const;

// Empty state messages
export const EMPTY_STATES = {
  NO_PROJECTS: {
    title: "Ready to start learning?",
    description:
      "Create your first project and begin building your knowledge base.",
    hints: [
      "Upload a PDF to automatically generate flashcards",
      "Create flashcards manually for any topic",
      "Import existing flashcards from other apps",
      "Use tags to organize your projects by subject",
    ],
  },

  NO_FLASHCARDS: {
    title: "This project is ready for content",
    description: "Add your first flashcard to start studying this topic.",
    hints: [
      "Upload a PDF and let AI create flashcards for you",
      "Create cards manually for full control",
      "Keep questions clear and answers concise",
      "Add hints for extra context when needed",
    ],
  },

  NO_STUDY_CARDS: {
    title: "All caught up!",
    description:
      "You don't have any cards ready for review right now. Great job staying on top of your studies!",
    hints: [
      "Add more flashcards to your projects",
      "Review completed sessions in your progress",
      "Explore settings to adjust your study schedule",
      "Check back later - cards will be ready based on spaced repetition",
    ],
  },

  NO_SEARCH_RESULTS: {
    title: "No matches found",
    description:
      "We couldn't find anything matching your search. Try different keywords or explore all your content.",
    hints: [
      "Check spelling and try different terms",
      "Search by topic, question, or answer content",
      "Use tags to find related content",
      "Browse all projects to discover content",
    ],
  },
} as const;

// Time and date formatting helpers
export const TIME_MESSAGES = {
  RELATIVE: {
    JUST_NOW: "just now",
    MINUTES_AGO: (mins: number) => `${mins} minute${mins === 1 ? "" : "s"} ago`,
    HOURS_AGO: (hours: number) => `${hours} hour${hours === 1 ? "" : "s"} ago`,
    DAYS_AGO: (days: number) => `${days} day${days === 1 ? "" : "s"} ago`,
    WEEKS_AGO: (weeks: number) => `${weeks} week${weeks === 1 ? "" : "s"} ago`,
  },

  STUDY_SCHEDULE: {
    NOW: "Ready to study now",
    MINUTES: (mins: number) =>
      `Ready in ${mins} minute${mins === 1 ? "" : "s"}`,
    HOURS: (hours: number) => `Ready in ${hours} hour${hours === 1 ? "" : "s"}`,
    DAYS: (days: number) => `Ready in ${days} day${days === 1 ? "" : "s"}`,
    OVERDUE: (days: number) => `Overdue by ${days} day${days === 1 ? "" : "s"}`,
  },
} as const;

// Contextual help text
export const HELP_TEXT = {
  SPACED_REPETITION:
    "Cards are scheduled based on how well you know them. Easy cards appear less often, while difficult ones show up more frequently until you master them.",

  AI_GENERATION:
    "Our AI reads your PDFs and creates flashcards automatically. You can edit or delete any generated cards that don't fit your needs.",

  DIFFICULTY_RATING:
    "Be honest with your ratings! 'Easy' means you knew it instantly, 'Hard' means you struggled or got it wrong. This helps optimize your learning schedule.",

  PROJECT_ORGANIZATION:
    "Use projects to group related flashcards by subject, class, or topic. Tags help you find content across different projects.",

  DATA_PRIVACY:
    "Your API keys are stored locally on your device and never sent to our servers. Your study data is encrypted and only accessible by you.",
} as const;
