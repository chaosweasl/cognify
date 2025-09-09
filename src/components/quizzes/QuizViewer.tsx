"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileQuestion,
  Calendar,
  Tag,
  Play,
  Edit,
  Trash2,
  Plus,
  Search,
  Clock,
  Trophy,
  BarChart3,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

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

interface QuizViewerProps {
  projectId: string;
  initialQuizzes: Quiz[];
}

export default function QuizViewer({
  projectId,
  initialQuizzes,
}: QuizViewerProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>(initialQuizzes);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const filteredQuizzes = quizzes.filter(
    (quiz) =>
      quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quiz.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const handleTakeQuiz = (quiz: Quiz) => {
    router.push(`/projects/${projectId}/take-quiz/${quiz.id}`);
  };

  const handleEdit = (quiz: Quiz) => {
    // TODO: Implement edit functionality
  };

  const handleDelete = async (quiz: Quiz) => {
    // TODO: Implement delete functionality
  };

  const handleViewResults = (quiz: Quiz) => {
    // TODO: Implement results viewing
  };

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case "multiple-choice":
        return "MC";
      case "true-false":
        return "T/F";
      case "short-answer":
        return "SA";
      case "fill-blank":
        return "FB";
      default:
        return "Q";
    }
  };

  const formatTime = (minutes?: number) => {
    if (!minutes) return "No limit";
    if (minutes < 60) return `${minutes}m`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search quizzes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Generate New Quiz
        </Button>
      </div>

      {filteredQuizzes.length === 0 ? (
        <Card className="p-8 text-center">
          <FileQuestion className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Quizzes Found</h3>
          <p className="text-muted-foreground mb-4">
            {quizzes.length === 0
              ? "Get started by generating your first quiz from your project content."
              : "No quizzes match your search criteria."}
          </p>
          {quizzes.length === 0 && (
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Generate Your First Quiz
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz) => (
            <Card
              key={quiz.id}
              className="p-6 hover:shadow-md transition-shadow"
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                  {quiz.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(quiz.created_at).toLocaleDateString()}
                </div>
                {quiz.settings.metadata?.sourceFile && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileQuestion className="w-4 h-4" />
                    {quiz.settings.metadata.sourceFile}
                  </div>
                )}
              </div>

              <div className="mb-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Questions:</span>
                  <span className="font-medium">{quiz.questions.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Points:</span>
                  <span className="font-medium">
                    {quiz.settings.metadata.totalPoints}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Time Limit:</span>
                  <span className="font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(quiz.settings.timeLimit)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Passing Score:</span>
                  <span className="font-medium">
                    {quiz.settings.passingScore}%
                  </span>
                </div>
              </div>

              {quiz.settings.metadata.questionTypes.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {quiz.settings.metadata.questionTypes
                      .slice(0, 4)
                      .map((type, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          {getQuestionTypeIcon(type)}
                        </Badge>
                      ))}
                    {quiz.settings.metadata.questionTypes.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{quiz.settings.metadata.questionTypes.length - 4}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {quiz.tags.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {quiz.tags.slice(0, 3).map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                    {quiz.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{quiz.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Button className="w-full" onClick={() => handleTakeQuiz(quiz)}>
                  <Play className="w-4 h-4 mr-2" />
                  Take Quiz
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewResults(quiz)}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Results
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(quiz)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(quiz)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
