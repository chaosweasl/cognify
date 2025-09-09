"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PuzzleIcon as Quiz,
  Play,
  Edit3,
  Trash2,
  Plus,
  Search,
  Clock,
  Trophy,
  Target,
  Calendar,
  Eye,
} from "lucide-react";
import {
  getQuizzesByProjectId,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  submitQuizAttempt,
  getQuizAttemptsByUserId,
} from "@/app/(main)/projects/actions/quiz-actions";
import { toast } from "sonner";

interface CreateQuizData {
  title: string;
  questions: QuizQuestion[];
  settings: Quiz["settings"];
  tags?: string[];
}

interface UpdateQuizData extends CreateQuizData {
  id: string;
}

interface QuizQuestion {
  id: string;
  type: "multiple-choice" | "true-false" | "short-answer" | "fill-blank";
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
  difficulty: string;
}

interface Quiz {
  id: string;
  project_id: string;
  title: string;
  questions: QuizQuestion[];
  settings: {
    timeLimit?: number;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    passingScore: number;
    allowRetakes: boolean;
    showCorrectAnswers: boolean;
    metadata: {
      sourceFile: string;
      generatedAt: string;
      totalPoints: number;
      questionTypes: string[];
    };
  };
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  answers: Record<string, any>;
  score: number;
  total_questions: number;
  time_spent_seconds?: number;
  completed_at: string;
}

interface QuizManagerProps {
  projectId: string;
}

export function QuizManager({ projectId }: QuizManagerProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [takingQuiz, setTakingQuiz] = useState<Quiz | null>(null);
  const [viewingResults, setViewingResults] = useState<Quiz | null>(null);

  useEffect(() => {
    loadQuizzes();
  }, [projectId]); // loadQuizzes is recreated on every render, so we only depend on projectId

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const data = await getQuizzesByProjectId(projectId);
      setQuizzes(data);
    } catch (error) {
      console.error("Failed to load quizzes:", error);
      toast.error("Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (quizData: CreateQuizData) => {
    try {
      await createQuiz(projectId, quizData);
      toast.success("Quiz created successfully");
      loadQuizzes();
      setShowCreateModal(false);
    } catch (error) {
      console.error("Failed to create quiz:", error);
      toast.error("Failed to create quiz");
    }
  };

  const handleUpdate = async (quizData: UpdateQuizData) => {
    if (!editingQuiz) return;

    try {
      await updateQuiz(quizData);
      toast.success("Quiz updated successfully");
      loadQuizzes();
      setEditingQuiz(null);
    } catch (error) {
      console.error("Failed to update quiz:", error);
      toast.error("Failed to update quiz");
    }
  };

  const handleDelete = async (quizId: string) => {
    if (!confirm("Are you sure you want to delete this quiz?")) return;

    try {
      await deleteQuiz(quizId);
      toast.success("Quiz deleted successfully");
      loadQuizzes();
    } catch (error) {
      console.error("Failed to delete quiz:", error);
      toast.error("Failed to delete quiz");
    }
  };

  const handleSave = async (data: CreateQuizData | UpdateQuizData) => {
    if (editingQuiz) {
      // Ensure we have the id for update
      const updateData: UpdateQuizData = {
        ...data,
        id: editingQuiz.id,
      };
      await handleUpdate(updateData);
    } else {
      await handleCreate(data as CreateQuizData);
    }
  };

  const filteredQuizzes = quizzes.filter(
    (quiz) =>
      quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quiz.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 surface-elevated rounded-xl animate-pulse" />
        <div className="h-32 surface-elevated rounded-xl animate-pulse" />
        <div className="h-32 surface-elevated rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-brand rounded-lg">
            <Quiz className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-primary">Quizzes</h2>
            <p className="text-sm text-muted">
              {quizzes.length} quiz{quizzes.length !== 1 ? "zes" : ""}
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-brand hover:bg-gradient-brand-hover"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Quiz
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
        <Input
          placeholder="Search quizzes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Quizzes Grid */}
      {filteredQuizzes.length === 0 ? (
        <Card className="border-dashed border-2 surface-elevated">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Quiz className="w-12 h-12 text-muted mb-4" />
            <h3 className="text-lg font-medium text-muted mb-2">
              No quizzes yet
            </h3>
            <p className="text-sm text-muted text-center mb-4">
              Create your first quiz to test knowledge and track progress
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-brand hover:bg-gradient-brand-hover"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Quiz
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredQuizzes.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              onTake={() => setTakingQuiz(quiz)}
              onEdit={() => setEditingQuiz(quiz)}
              onDelete={() => handleDelete(quiz.id)}
              onViewResults={() => setViewingResults(quiz)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <QuizModal
        isOpen={showCreateModal || editingQuiz !== null}
        onClose={() => {
          setShowCreateModal(false);
          setEditingQuiz(null);
        }}
        onSave={handleSave}
        quiz={editingQuiz}
        mode={editingQuiz ? "edit" : "create"}
      />

      {/* Take Quiz Modal */}
      <QuizTakingModal
        isOpen={takingQuiz !== null}
        onClose={() => setTakingQuiz(null)}
        quiz={takingQuiz}
        onComplete={() => {
          setTakingQuiz(null);
          loadQuizzes(); // Refresh to update attempt counts
        }}
      />

      {/* Results Modal */}
      <QuizResultsModal
        isOpen={viewingResults !== null}
        onClose={() => setViewingResults(null)}
        quiz={viewingResults}
      />
    </div>
  );
}

interface QuizCardProps {
  quiz: Quiz;
  onTake: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onViewResults: () => void;
}

function QuizCard({
  quiz,
  onTake,
  onEdit,
  onDelete,
  onViewResults,
}: QuizCardProps) {
  const totalPoints = quiz.settings.metadata.totalPoints;

  return (
    <Card className="group surface-elevated border-subtle hover:shadow-brand transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-primary truncate">
              {quiz.title}
            </CardTitle>
            <p className="text-sm text-muted mt-1">
              {quiz.questions.length} questions • {totalPoints} points
            </p>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm" onClick={onViewResults}>
              <Eye className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Edit3 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Quiz Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 surface-secondary rounded-lg">
            <div className="text-lg font-semibold text-brand-primary">
              {quiz.questions.length}
            </div>
            <div className="text-xs text-muted">Questions</div>
          </div>
          <div className="text-center p-3 surface-secondary rounded-lg">
            <div className="text-lg font-semibold text-brand-accent">
              {quiz.settings.passingScore}%
            </div>
            <div className="text-xs text-muted">Pass Score</div>
          </div>
        </div>

        {/* Time Limit */}
        {quiz.settings.timeLimit && (
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-muted" />
            <span className="text-sm text-muted">
              {quiz.settings.timeLimit} minute
              {quiz.settings.timeLimit !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {quiz.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {quiz.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{quiz.tags.length - 3}
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={onTake}
            className="flex-1 bg-gradient-brand hover:bg-gradient-brand-hover"
            size="sm"
          >
            <Play className="w-4 h-4 mr-2" />
            Take Quiz
          </Button>
          <Button onClick={onViewResults} variant="outline" size="sm">
            <Trophy className="w-4 h-4" />
          </Button>
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-muted mt-3 pt-3 border-t border-subtle">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(quiz.created_at).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-1">
            <Target className="w-3 h-3" />
            {quiz.settings.metadata.questionTypes.join(", ")}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateQuizData | UpdateQuizData) => void;
  quiz?: Quiz | null;
  mode: "create" | "edit";
}

function QuizModal({ isOpen, onClose, onSave, quiz, mode }: QuizModalProps) {
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [timeLimit, setTimeLimit] = useState<number | undefined>();
  const [passingScore, setPassingScore] = useState(70);

  useEffect(() => {
    if (quiz && mode === "edit") {
      setTitle(quiz.title);
      setQuestions(quiz.questions);
      setTags(quiz.tags);
      setTimeLimit(quiz.settings.timeLimit);
      setPassingScore(quiz.settings.passingScore);
    } else {
      setTitle("");
      setQuestions([createEmptyQuestion()]);
      setTags([]);
      setTimeLimit(undefined);
      setPassingScore(70);
    }
  }, [quiz, mode, isOpen]);

  const createEmptyQuestion = (): QuizQuestion => ({
    id: Date.now().toString(),
    type: "multiple-choice",
    question: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    explanation: "",
    points: 1,
    difficulty: "intermediate",
  });

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    const validQuestions = questions.filter(
      (q) =>
        q.question.trim() &&
        q.correctAnswer &&
        q.correctAnswer.toString().trim()
    );

    if (validQuestions.length === 0) {
      toast.error("Please add at least one complete question");
      return;
    }

    const totalPoints = validQuestions.reduce((sum, q) => sum + q.points, 0);
    const questionTypes = [...new Set(validQuestions.map((q) => q.type))];

    onSave({
      title,
      questions: validQuestions,
      settings: {
        timeLimit,
        shuffleQuestions: true,
        shuffleOptions: true,
        passingScore,
        allowRetakes: true,
        showCorrectAnswers: true,
        metadata: {
          sourceFile: "manual",
          generatedAt: new Date().toISOString(),
          totalPoints,
          questionTypes,
        },
      },
      tags,
    });
  };

  const addQuestion = () => {
    setQuestions([...questions, createEmptyQuestion()]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const updateQuestion = (
    id: string,
    field: string,
    value: string | number | string[]
  ) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create Quiz" : "Edit Quiz"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new quiz with questions and scoring settings"
              : "Update your quiz questions and settings"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter quiz title..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Time Limit (minutes)
              </label>
              <Input
                type="number"
                value={timeLimit || ""}
                onChange={(e) =>
                  setTimeLimit(
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                placeholder="No limit"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Passing Score (%)
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                value={passingScore}
                onChange={(e) =>
                  setPassingScore(parseInt(e.target.value) || 70)
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tags</label>
              <Input
                placeholder="Enter tags (comma-separated)..."
                value={tags.join(", ")}
                onChange={(e) =>
                  setTags(
                    e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter((s) => s)
                  )
                }
              />
            </div>
          </div>

          {/* Questions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium">Questions</label>
              <Button onClick={addQuestion} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </div>

            <div className="space-y-4">
              {questions.map((question, index) => (
                <QuestionEditor
                  key={question.id}
                  question={question}
                  index={index}
                  onUpdate={(field, value) =>
                    updateQuestion(question.id, field, value)
                  }
                  onRemove={() => removeQuestion(question.id)}
                  canRemove={questions.length > 1}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-gradient-brand hover:bg-gradient-brand-hover"
            >
              {mode === "create" ? "Create" : "Update"} Quiz
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface QuestionEditorProps {
  question: QuizQuestion;
  index: number;
  onUpdate: (field: string, value: string | number | string[]) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function QuestionEditor({
  question,
  index,
  onUpdate,
  onRemove,
  canRemove,
}: QuestionEditorProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium">Question {index + 1}</h4>
        <div className="flex items-center gap-2">
          <Select
            value={question.type}
            onValueChange={(value) => onUpdate("type", value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
              <SelectItem value="true-false">True/False</SelectItem>
              <SelectItem value="short-answer">Short Answer</SelectItem>
              <SelectItem value="fill-blank">Fill in Blank</SelectItem>
            </SelectContent>
          </Select>
          {canRemove && (
            <Button onClick={onRemove} variant="ghost" size="sm">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <Textarea
          placeholder="Enter your question..."
          value={question.question}
          onChange={(e) => onUpdate("question", e.target.value)}
          rows={2}
        />

        {question.type === "multiple-choice" && (
          <div className="space-y-2">
            <label className="block text-sm font-medium">Options</label>
            {question.options?.map((option, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  placeholder={`Option ${idx + 1}...`}
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...(question.options || [])];
                    newOptions[idx] = e.target.value;
                    onUpdate("options", newOptions);
                  }}
                />
                <Checkbox
                  checked={question.correctAnswer === option}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onUpdate("correctAnswer", option);
                    }
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {question.type === "true-false" && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Correct Answer
            </label>
            <RadioGroup
              value={question.correctAnswer as string}
              onValueChange={(value) => onUpdate("correctAnswer", value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="true" />
                <label htmlFor="true">True</label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="false" />
                <label htmlFor="false">False</label>
              </div>
            </RadioGroup>
          </div>
        )}

        {(question.type === "short-answer" ||
          question.type === "fill-blank") && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Correct Answer
            </label>
            <Input
              placeholder="Enter the correct answer..."
              value={question.correctAnswer as string}
              onChange={(e) => onUpdate("correctAnswer", e.target.value)}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-2">Points</label>
            <Input
              type="number"
              min="1"
              max="10"
              value={question.points}
              onChange={(e) =>
                onUpdate("points", parseInt(e.target.value) || 1)
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Difficulty</label>
            <Select
              value={question.difficulty}
              onValueChange={(value) => onUpdate("difficulty", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Explanation (optional)
          </label>
          <Textarea
            placeholder="Explain why this is the correct answer..."
            value={question.explanation || ""}
            onChange={(e) => onUpdate("explanation", e.target.value)}
            rows={2}
          />
        </div>
      </div>
    </Card>
  );
}

interface QuizTakingModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: Quiz | null;
  onComplete: () => void;
}

function QuizTakingModal({
  isOpen,
  onClose,
  quiz,
  onComplete,
}: QuizTakingModalProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (!quiz || !isOpen) return;

    // Initialize timer
    if (quiz.settings.timeLimit) {
      setTimeRemaining(quiz.settings.timeLimit * 60); // Convert to seconds
    }

    // Reset state
    setCurrentQuestion(0);
    setAnswers({});
    setIsSubmitting(false);
  }, [quiz, isOpen]);

  const handleSubmit = useCallback(async () => {
    if (!quiz || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      await submitQuizAttempt(quiz.id, answers, timeSpent);
      toast.success("Quiz submitted successfully!");
      onComplete();
    } catch (error) {
      console.error("Failed to submit quiz:", error);
      toast.error("Failed to submit quiz");
    } finally {
      setIsSubmitting(false);
    }
  }, [quiz, isSubmitting, startTime, answers, onComplete]);

  useEffect(() => {
    if (!timeRemaining || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev && prev <= 1) {
          handleSubmit(); // Auto-submit when time runs out
          return 0;
        }
        return prev ? prev - 1 : null;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, handleSubmit]);

  const handleAnswer = (questionId: string, answer: string | string[]) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  if (!quiz) return null;

  const currentQ = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{quiz.title}</span>
            {timeRemaining && (
              <div className="flex items-center gap-2 text-brand-primary">
                <Clock className="w-4 h-4" />
                <span className="font-mono">
                  {Math.floor(timeRemaining / 60)}:
                  {(timeRemaining % 60).toString().padStart(2, "0")}
                </span>
              </div>
            )}
          </DialogTitle>
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted">
              Question {currentQuestion + 1} of {quiz.questions.length}
            </p>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">{currentQ.question}</h3>

            {currentQ.type === "multiple-choice" && (
              <RadioGroup
                value={answers[currentQ.id] || ""}
                onValueChange={(value) => handleAnswer(currentQ.id, value)}
              >
                {currentQ.options?.map((option, idx) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-2 p-3 surface-secondary rounded-lg"
                  >
                    <RadioGroupItem value={option} id={`option-${idx}`} />
                    <label
                      htmlFor={`option-${idx}`}
                      className="flex-1 cursor-pointer"
                    >
                      {option}
                    </label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {currentQ.type === "true-false" && (
              <RadioGroup
                value={answers[currentQ.id] || ""}
                onValueChange={(value) => handleAnswer(currentQ.id, value)}
              >
                <div className="flex items-center space-x-2 p-3 surface-secondary rounded-lg">
                  <RadioGroupItem value="true" id="true" />
                  <label htmlFor="true" className="flex-1 cursor-pointer">
                    True
                  </label>
                </div>
                <div className="flex items-center space-x-2 p-3 surface-secondary rounded-lg">
                  <RadioGroupItem value="false" id="false" />
                  <label htmlFor="false" className="flex-1 cursor-pointer">
                    False
                  </label>
                </div>
              </RadioGroup>
            )}

            {(currentQ.type === "short-answer" ||
              currentQ.type === "fill-blank") && (
              <Input
                placeholder="Enter your answer..."
                value={answers[currentQ.id] || ""}
                onChange={(e) => handleAnswer(currentQ.id, e.target.value)}
                className="text-lg p-4"
              />
            )}

            <div className="mt-4 flex items-center justify-between text-sm text-muted">
              <span>
                {currentQ.points} point{currentQ.points !== 1 ? "s" : ""}
              </span>
              <span>Difficulty: {currentQ.difficulty}</span>
            </div>
          </Card>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() =>
                setCurrentQuestion(Math.max(0, currentQuestion - 1))
              }
              disabled={currentQuestion === 0}
            >
              Previous
            </Button>

            <div className="flex gap-2">
              {currentQuestion < quiz.questions.length - 1 ? (
                <Button
                  onClick={() => setCurrentQuestion(currentQuestion + 1)}
                  className="bg-gradient-brand hover:bg-gradient-brand-hover"
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-gradient-brand hover:bg-gradient-brand-hover"
                >
                  {isSubmitting ? "Submitting..." : "Submit Quiz"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface QuizResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: Quiz | null;
}

function QuizResultsModal({ isOpen, onClose, quiz }: QuizResultsModalProps) {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!quiz || !isOpen) return;

    const loadAttempts = async () => {
      try {
        setLoading(true);
        const data = await getQuizAttemptsByUserId(quiz.id);
        setAttempts(data);
      } catch (error) {
        console.error("Failed to load attempts:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAttempts();
  }, [quiz, isOpen]);

  if (!quiz) return null;

  const bestAttempt = attempts.reduce(
    (best, current) => (!best || current.score > best.score ? current : best),
    null as QuizAttempt | null
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-brand-primary" />
            Quiz Results: {quiz.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted">Loading results...</p>
            </div>
          ) : attempts.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="w-12 h-12 text-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted mb-2">
                No attempts yet
              </h3>
              <p className="text-sm text-muted">
                Take the quiz to see your results here
              </p>
            </div>
          ) : (
            <>
              {/* Best Score */}
              {bestAttempt && (
                <Card className="p-6 bg-gradient-to-r from-brand-primary/10 to-brand-accent/10 border-brand-primary/20">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-brand-primary mb-2">
                      {bestAttempt.score} / {quiz.settings.metadata.totalPoints}
                    </div>
                    <div className="text-lg text-secondary mb-1">
                      Best Score
                    </div>
                    <div className="text-sm text-muted">
                      {Math.round(
                        (bestAttempt.score /
                          quiz.settings.metadata.totalPoints) *
                          100
                      )}
                      %
                      {bestAttempt.score >=
                      (quiz.settings.metadata.totalPoints *
                        quiz.settings.passingScore) /
                        100 ? (
                        <Badge className="ml-2 bg-green-500">Passed</Badge>
                      ) : (
                        <Badge className="ml-2 bg-red-500">Failed</Badge>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              {/* Attempts History */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Attempt History</h3>
                <div className="space-y-3">
                  {attempts.map((attempt, index) => (
                    <Card key={attempt.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">
                            Attempt {attempts.length - index}
                          </div>
                          <div className="text-sm text-muted">
                            {new Date(attempt.completed_at).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-brand-primary">
                            {attempt.score} /{" "}
                            {quiz.settings.metadata.totalPoints}
                          </div>
                          <div className="text-sm text-muted">
                            {Math.round(
                              (attempt.score /
                                quiz.settings.metadata.totalPoints) *
                                100
                            )}
                            %
                            {attempt.time_spent_seconds && (
                              <span className="ml-2">
                                • {Math.floor(attempt.time_spent_seconds / 60)}:
                                {(attempt.time_spent_seconds % 60)
                                  .toString()
                                  .padStart(2, "0")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Quiz Stats */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Quiz Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-brand-primary">
                      {attempts.length}
                    </div>
                    <div className="text-sm text-muted">Attempts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-brand-accent">
                      {Math.round(
                        attempts.reduce((sum, a) => sum + a.score, 0) /
                          attempts.length
                      )}
                    </div>
                    <div className="text-sm text-muted">Avg Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">
                      {
                        attempts.filter(
                          (a) =>
                            a.score >=
                            (quiz.settings.metadata.totalPoints *
                              quiz.settings.passingScore) /
                              100
                        ).length
                      }
                    </div>
                    <div className="text-sm text-muted">Passed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-secondary">
                      {quiz.settings.passingScore}%
                    </div>
                    <div className="text-sm text-muted">Pass Rate</div>
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
