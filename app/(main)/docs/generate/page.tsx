"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Copy,
  Download,
  Upload,
  FileText,
  Book,
  Users,
  CheckCircle2,
  ExternalLink,
  ArrowLeft,
  Zap,
  AlertCircle,
  Code,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const flashcardPrompt = `Please analyze the following content and create flashcards in JSON format. Generate comprehensive question-answer pairs that test understanding, recall, and application of the key concepts.

**Content to analyze:**
[PASTE YOUR CONTENT HERE]

**Output format required:**
Return a JSON object with this exact structure:

\`\`\`json
{
  "flashcards": [
    {
      "id": "1",
      "front": "Question or concept to test",
      "back": "Complete answer with explanation"
    }
  ]
}
\`\`\`

**Guidelines:**
- Create 10-20 flashcards depending on content length
- Mix question types: definitions, examples, applications, comparisons
- Keep questions clear and specific
- Provide complete, educational answers
- Focus on the most important concepts
- Use simple, clear language

Please return ONLY the JSON object, no additional text.`;

const cheatsheetPrompt = `Please analyze the following content and create a comprehensive cheatsheet in JSON format. Organize the information into clear sections with key points, formulas, definitions, and quick references.

**Content to analyze:**
[PASTE YOUR CONTENT HERE]

**Output format required:**
Return a JSON object with this exact structure:

\`\`\`json
{
  "title": "Topic Cheatsheet",
  "sections": [
    {
      "title": "Section Name",
      "items": [
        {
          "type": "definition",
          "title": "Key Term",
          "content": "Definition or explanation"
        },
        {
          "type": "formula",
          "title": "Formula Name",
          "content": "Formula = equation",
          "description": "When and how to use it"
        },
        {
          "type": "list",
          "title": "Key Points",
          "content": ["Point 1", "Point 2", "Point 3"]
        }
      ]
    }
  ]
}
\`\`\`

**Guidelines:**
- Create 3-8 logical sections based on content
- Use appropriate item types: definition, formula, list, example
- Keep content concise and scannable
- Include the most important information only
- Organize from general to specific concepts

Please return ONLY the JSON object, no additional text.`;

const quizPrompt = `Please analyze the following content and create a comprehensive quiz in JSON format. Include multiple-choice questions and short-answer questions that test comprehension and application.

**Content to analyze:**
[PASTE YOUR CONTENT HERE]

**Output format required:**
Return a JSON object with this exact structure:

\`\`\`json
{
  "title": "Quiz Title",
  "questions": [
    {
      "id": "1",
      "type": "multiple-choice",
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Why this answer is correct"
    },
    {
      "id": "2",
      "type": "short-answer",
      "question": "Question requiring explanation",
      "answer": "Sample correct answer",
      "keywords": ["key", "terms", "expected"]
    }
  ]
}
\`\`\`

**Guidelines:**
- Create 8-15 questions total
- Mix 70% multiple-choice, 30% short-answer
- Include questions at different difficulty levels
- Provide clear explanations for correct answers
- Test understanding, not just memorization
- Avoid trick questions or ambiguous wording

Please return ONLY the JSON object, no additional text.`;

const sampleOutputs = {
  flashcards: {
    flashcards: [
      {
        id: "1",
        front: "What is photosynthesis?",
        back: "Photosynthesis is the process by which plants convert light energy into chemical energy (glucose) using carbon dioxide and water, releasing oxygen as a byproduct.",
      },
      {
        id: "2",
        front: "What is the chemical equation for photosynthesis?",
        back: "6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂",
      },
    ],
  },
  cheatsheet: {
    title: "Photosynthesis Cheatsheet",
    sections: [
      {
        title: "Basic Concepts",
        items: [
          {
            type: "definition",
            title: "Photosynthesis",
            content:
              "Process of converting light energy to chemical energy in plants",
          },
          {
            type: "formula",
            title: "Chemical Equation",
            content: "6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂",
            description: "Shows inputs and outputs of photosynthesis",
          },
        ],
      },
    ],
  },
  quiz: {
    title: "Photosynthesis Quiz",
    questions: [
      {
        id: "1",
        type: "multiple-choice",
        question: "What are the main inputs of photosynthesis?",
        options: [
          "CO₂ and H₂O",
          "O₂ and glucose",
          "Light and chlorophyll",
          "Nitrogen and water",
        ],
        correct: 0,
        explanation:
          "Photosynthesis requires carbon dioxide and water as raw materials, plus light energy.",
      },
    ],
  },
};

export default function GeneratePage() {
  const [activeTab, setActiveTab] = useState("flashcards");
  const [customContent, setCustomContent] = useState("");

  const copyToClipboard = (text: string) => {
    const contentWithCustom = customContent.trim()
      ? text.replace("[PASTE YOUR CONTENT HERE]", customContent)
      : text;

    navigator.clipboard.writeText(contentWithCustom);
    toast.success("Prompt copied to clipboard!");
  };

  const downloadJson = (data: object, filename: string) => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Sample JSON downloaded!");
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/docs">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Docs
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-primary">
            Content Generation
          </h1>
          <p className="text-secondary mt-2">
            Copy-paste prompts and manual workflows for generating study content
          </p>
        </div>
      </div>

      {/* How It Works */}
      <Card className="border-brand/30 bg-brand/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-brand-primary" />
            Manual Generation Workflow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-brand-primary font-bold">1</span>
              </div>
              <h4 className="font-medium text-primary">Copy Prompt</h4>
              <p className="text-sm text-secondary">
                Select and copy the template for your content type
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-brand-primary font-bold">2</span>
              </div>
              <h4 className="font-medium text-primary">Add Content</h4>
              <p className="text-sm text-secondary">
                Replace placeholder with your text/PDF content
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-brand-primary font-bold">3</span>
              </div>
              <h4 className="font-medium text-primary">Use AI Service</h4>
              <p className="text-sm text-secondary">
                Paste into ChatGPT, Claude, or any AI tool
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-brand-primary font-bold">4</span>
              </div>
              <h4 className="font-medium text-primary">Import JSON</h4>
              <p className="text-sm text-secondary">
                Copy the JSON response back into Cognify
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Content Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Your Content (Optional)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Paste your text or PDF content here. When you copy a prompt below, this content will automatically replace the placeholder..."
            value={customContent}
            onChange={(e) => setCustomContent(e.target.value)}
            className="min-h-[120px] surface-secondary border-primary"
          />
          <p className="text-xs text-muted mt-2">
            💡 Tip: Add your content here to automatically include it when
            copying prompts
          </p>
        </CardContent>
      </Card>

      {/* Content Type Templates */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="flashcards" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Flashcards
          </TabsTrigger>
          <TabsTrigger value="cheatsheets" className="flex items-center gap-2">
            <Book className="w-4 h-4" />
            Cheatsheets
          </TabsTrigger>
          <TabsTrigger value="quizzes" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Quizzes
          </TabsTrigger>
        </TabsList>

        {/* Flashcards */}
        <TabsContent value="flashcards" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Flashcard Generation Prompt
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={() => copyToClipboard(flashcardPrompt)}
                    className="bg-gradient-brand"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Prompt
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 surface-elevated border border-subtle rounded-lg">
                  <pre className="text-sm text-secondary whitespace-pre-wrap font-mono leading-relaxed">
                    {flashcardPrompt}
                  </pre>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Optimized for comprehension
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    10-20 cards per topic
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Sample Output</CardTitle>
                <Button
                  variant="outline"
                  onClick={() =>
                    downloadJson(
                      sampleOutputs.flashcards,
                      "sample-flashcards.json"
                    )
                  }
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Sample
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-4 surface-primary border border-subtle rounded-lg">
                <pre className="text-sm text-secondary overflow-x-auto">
                  {JSON.stringify(sampleOutputs.flashcards, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cheatsheets */}
        <TabsContent value="cheatsheets" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Book className="w-5 h-5" />
                  Cheatsheet Generation Prompt
                </CardTitle>
                <Button
                  onClick={() => copyToClipboard(cheatsheetPrompt)}
                  className="bg-gradient-brand"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Prompt
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 surface-elevated border border-subtle rounded-lg">
                  <pre className="text-sm text-secondary whitespace-pre-wrap font-mono leading-relaxed">
                    {cheatsheetPrompt}
                  </pre>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Organized sections
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Quick reference format
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Sample Output</CardTitle>
                <Button
                  variant="outline"
                  onClick={() =>
                    downloadJson(
                      sampleOutputs.cheatsheet,
                      "sample-cheatsheet.json"
                    )
                  }
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Sample
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-4 surface-primary border border-subtle rounded-lg">
                <pre className="text-sm text-secondary overflow-x-auto">
                  {JSON.stringify(sampleOutputs.cheatsheet, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quizzes */}
        <TabsContent value="quizzes" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Quiz Generation Prompt
                </CardTitle>
                <Button
                  onClick={() => copyToClipboard(quizPrompt)}
                  className="bg-gradient-brand"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Prompt
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 surface-elevated border border-subtle rounded-lg">
                  <pre className="text-sm text-secondary whitespace-pre-wrap font-mono leading-relaxed">
                    {quizPrompt}
                  </pre>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Mixed question types
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    8-15 questions
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Sample Output</CardTitle>
                <Button
                  variant="outline"
                  onClick={() =>
                    downloadJson(sampleOutputs.quiz, "sample-quiz.json")
                  }
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Sample
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-4 surface-primary border border-subtle rounded-lg">
                <pre className="text-sm text-secondary overflow-x-auto">
                  {JSON.stringify(sampleOutputs.quiz, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* AI Services Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="w-5 h-5" />
            Compatible AI Services
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border border-subtle rounded-lg">
              <h4 className="font-medium text-primary mb-2">ChatGPT</h4>
              <p className="text-sm text-secondary mb-2">
                Free and paid tiers available
              </p>
              <Button variant="outline" size="sm" asChild>
                <a
                  href="https://chat.openai.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  chat.openai.com
                </a>
              </Button>
            </div>

            <div className="p-4 border border-subtle rounded-lg">
              <h4 className="font-medium text-primary mb-2">Claude</h4>
              <p className="text-sm text-secondary mb-2">
                Free and paid tiers available
              </p>
              <Button variant="outline" size="sm" asChild>
                <a
                  href="https://claude.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  claude.ai
                </a>
              </Button>
            </div>

            <div className="p-4 border border-subtle rounded-lg">
              <h4 className="font-medium text-primary mb-2">Gemini</h4>
              <p className="text-sm text-secondary mb-2">
                Google's AI assistant
              </p>
              <Button variant="outline" size="sm" asChild>
                <a
                  href="https://gemini.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  gemini.google.com
                </a>
              </Button>
            </div>

            <div className="p-4 border border-subtle rounded-lg">
              <h4 className="font-medium text-primary mb-2">Other Services</h4>
              <p className="text-sm text-secondary mb-2">
                Any AI that follows prompts
              </p>
              <Badge variant="outline" className="text-xs">
                Universal Prompts
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Import Instructions */}
      <Card className="border-brand/30 bg-brand/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Importing Generated Content
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-secondary">
              After getting your JSON response from an AI service, here's how to
              import it into Cognify:
            </p>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 border border-subtle rounded-lg">
                <h4 className="font-medium text-primary mb-2">
                  1. Copy JSON Response
                </h4>
                <p className="text-sm text-secondary">
                  Select and copy the entire JSON object from the AI service
                  response
                </p>
              </div>

              <div className="p-4 border border-subtle rounded-lg">
                <h4 className="font-medium text-primary mb-2">
                  2. Go to Project
                </h4>
                <p className="text-sm text-secondary">
                  Navigate to your project and look for the "Import JSON" or
                  "Manual Import" button
                </p>
              </div>

              <div className="p-4 border border-subtle rounded-lg">
                <h4 className="font-medium text-primary mb-2">
                  3. Paste & Review
                </h4>
                <p className="text-sm text-secondary">
                  Paste the JSON, review the content, and accept the items you
                  want to keep
                </p>
              </div>
            </div>

            <div className="border-l-4 border-brand-primary pl-4 py-2 bg-brand-primary/5 rounded-r">
              <p className="text-sm text-secondary">
                <strong className="text-brand-primary">Pro Tip:</strong> Always
                review generated content before importing. You can edit or
                remove items that don't meet your needs.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card className="border-status-warning/30 bg-status-warning/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-status-warning">
            <AlertCircle className="w-5 h-5" />
            Common Issues & Solutions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <h5 className="font-medium text-primary">
                ❌ AI returns text instead of JSON
              </h5>
              <p className="text-sm text-secondary">
                → Add "Return ONLY the JSON object, no additional text" to the
                end of your prompt
              </p>
            </div>

            <div>
              <h5 className="font-medium text-primary">
                ❌ JSON format is incorrect
              </h5>
              <p className="text-sm text-secondary">
                → Check the sample outputs above and ask the AI to match the
                exact structure
              </p>
            </div>

            <div>
              <h5 className="font-medium text-primary">
                ❌ Import fails in Cognify
              </h5>
              <p className="text-sm text-secondary">
                → Validate your JSON using a tool like{" "}
                <a
                  href="https://jsonlint.com"
                  target="_blank"
                  className="text-brand-primary hover:underline"
                >
                  jsonlint.com
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="surface-elevated border-subtle">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold text-primary">
              Ready to Generate Content?
            </h3>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/projects">
                <Button className="bg-gradient-brand">
                  <FileText className="w-4 h-4 mr-2" />
                  Start Creating
                </Button>
              </Link>
              <Link href="/docs/api-keys">
                <Button variant="outline">
                  <Code className="w-4 h-4 mr-2" />
                  Setup API Keys
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
