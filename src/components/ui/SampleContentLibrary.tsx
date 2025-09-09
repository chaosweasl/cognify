"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Download,
  Copy,
  BookOpen,
  HelpCircle,
  Code,
  Globe,
  Microscope,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { getSampleMetadata, getSample } from "@/src/content/samples";

interface SampleContentLibraryProps {
  onImport?: (content: any, type: string) => void;
  showImportButton?: boolean;
}

export function SampleContentLibrary({
  onImport,
  showImportButton = false,
}: SampleContentLibraryProps) {
  const [expandedSample, setExpandedSample] = useState<string | null>(null);
  const metadata = getSampleMetadata();

  const handleCopySample = (type: string, key: string) => {
    const sample = getSample(type as any, key);
    if (sample) {
      navigator.clipboard.writeText(JSON.stringify(sample, null, 2));
      toast.success(`${type} sample copied to clipboard`);
    }
  };

  const handleDownloadSample = (type: string, key: string) => {
    const sample = getSample(type as any, key);
    if (sample) {
      const blob = new Blob([JSON.stringify(sample, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-${key}-sample.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`${type} sample downloaded`);
    }
  };

  const handleImportSample = (type: string, key: string) => {
    const sample = getSample(type as any, key);
    if (sample && onImport) {
      onImport(sample, type);
      toast.success(`${type} sample imported`);
    }
  };

  const getSubjectIcon = (subject: string) => {
    switch (subject) {
      case "programming":
        return <Code className="w-4 h-4" />;
      case "history":
      case "geography":
        return <Globe className="w-4 h-4" />;
      case "science":
        return <Microscope className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-status-success/10 text-status-success";
      case "intermediate":
        return "bg-status-warning/10 text-status-warning";
      case "advanced":
        return "bg-status-error/10 text-status-error";
      default:
        return "bg-muted/10 text-muted";
    }
  };

  const renderSampleList = (
    samples: any[],
    type: string,
    itemLabel: string
  ) => (
    <div className="space-y-3">
      {samples.map((sample) => (
        <Card
          key={sample.key}
          className="surface-secondary border-subtle hover:surface-elevated transition-all duration-200"
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-brand rounded-xl flex items-center justify-center">
                  {getSubjectIcon(sample.subject)}
                </div>
                <div>
                  <CardTitle className="text-lg text-primary">
                    {sample.title}
                  </CardTitle>
                  <p className="text-sm text-secondary mt-1">
                    {sample.description}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setExpandedSample(
                    expandedSample === sample.key ? null : sample.key
                  )
                }
              >
                {expandedSample === sample.key ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="flex items-center gap-2 mb-3">
              <Badge
                variant="outline"
                className={getDifficultyColor(sample.difficulty)}
              >
                {sample.difficulty}
              </Badge>
              <Badge variant="outline" className="text-muted">
                {sample.subject}
              </Badge>
              <Badge variant="outline" className="text-muted">
                {sample.count || sample.sections || sample.questions}{" "}
                {itemLabel}
              </Badge>
              {sample.timeLimit && (
                <Badge variant="outline" className="text-muted">
                  {Math.floor(sample.timeLimit / 60)}min
                </Badge>
              )}
            </div>

            {expandedSample === sample.key && (
              <div className="mt-4 p-3 bg-surface-primary rounded-lg border border-subtle">
                <pre className="text-xs text-secondary overflow-x-auto max-h-32">
                  {JSON.stringify(
                    getSample(type as any, sample.key),
                    null,
                    2
                  ).substring(0, 300)}
                  ...
                </pre>
              </div>
            )}

            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopySample(type, sample.key)}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadSample(type, sample.key)}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              {showImportButton && onImport && (
                <Button
                  size="sm"
                  onClick={() => handleImportSample(type, sample.key)}
                  className="bg-brand text-white"
                >
                  Import
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <Card className="surface-elevated border-subtle">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Sample Content Library
        </CardTitle>
        <p className="text-secondary">
          Test the import functionality with these pre-made examples
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="flashcards" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="flashcards">
              Flashcards ({metadata.flashcards.length})
            </TabsTrigger>
            <TabsTrigger value="cheatsheets">
              Cheatsheets ({metadata.cheatsheets.length})
            </TabsTrigger>
            <TabsTrigger value="quizzes">
              Quizzes ({metadata.quizzes.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="flashcards" className="mt-6">
            {renderSampleList(metadata.flashcards, "flashcards", "cards")}
          </TabsContent>

          <TabsContent value="cheatsheets" className="mt-6">
            {renderSampleList(metadata.cheatsheets, "cheatsheets", "sections")}
          </TabsContent>

          <TabsContent value="quizzes" className="mt-6">
            {renderSampleList(metadata.quizzes, "quizzes", "questions")}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default SampleContentLibrary;
