"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Calendar,
  Tag,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface CheatsheetSection {
  id: string;
  title: string;
  content: string;
  keyPoints: string[];
  examples?: string[];
}

interface Cheatsheet {
  id: string;
  project_id: string;
  title: string;
  content: {
    sections: CheatsheetSection[];
    summary?: string;
    metadata?: {
      sourceFile?: string;
      generatedAt: string;
      style: string;
    };
  };
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface CheatsheetViewerProps {
  projectId: string;
  initialCheatsheets: Cheatsheet[];
}

export default function CheatsheetViewer({
  projectId,
  initialCheatsheets,
}: CheatsheetViewerProps) {
  const [cheatsheets, setCheatsheets] =
    useState<Cheatsheet[]>(initialCheatsheets);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCheatsheet, setSelectedCheatsheet] =
    useState<Cheatsheet | null>(null);

  const filteredCheatsheets = cheatsheets.filter(
    (cheatsheet) =>
      cheatsheet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cheatsheet.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const handleView = (cheatsheet: Cheatsheet) => {
    setSelectedCheatsheet(cheatsheet);
  };

  const handleEdit = (cheatsheet: Cheatsheet) => {
    // TODO: Implement edit functionality
  };

  const handleDelete = async (cheatsheet: Cheatsheet) => {
    // TODO: Implement delete functionality
  };

  if (selectedCheatsheet) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setSelectedCheatsheet(null)}>
            ← Back to Cheatsheets
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(selectedCheatsheet)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDelete(selectedCheatsheet)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <Card className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">
              {selectedCheatsheet.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(selectedCheatsheet.created_at).toLocaleDateString()}
              </span>
              {selectedCheatsheet.content.metadata?.sourceFile && (
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {selectedCheatsheet.content.metadata.sourceFile}
                </span>
              )}
            </div>
            {selectedCheatsheet.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedCheatsheet.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {selectedCheatsheet.content.summary && (
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Summary</h3>
              <p className="text-sm">{selectedCheatsheet.content.summary}</p>
            </div>
          )}

          <div className="space-y-6">
            {selectedCheatsheet.content.sections.map((section, index) => (
              <div
                key={section.id || index}
                className="border-l-4 border-primary pl-4"
              >
                <h3 className="text-xl font-semibold mb-3">{section.title}</h3>
                <div className="prose prose-sm max-w-none mb-4">
                  <div dangerouslySetInnerHTML={{ __html: section.content }} />
                </div>

                {section.keyPoints.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Key Points:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {section.keyPoints.map((point, pointIndex) => (
                        <li key={pointIndex}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {section.examples && section.examples.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Examples:</h4>
                    <div className="space-y-2">
                      {section.examples.map((example, exampleIndex) => (
                        <div
                          key={exampleIndex}
                          className="p-3 bg-muted rounded text-sm"
                        >
                          {example}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search cheatsheets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Generate New Cheatsheet
        </Button>
      </div>

      {filteredCheatsheets.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Cheatsheets Found</h3>
          <p className="text-muted-foreground mb-4">
            {cheatsheets.length === 0
              ? "Get started by generating your first cheatsheet from your project content."
              : "No cheatsheets match your search criteria."}
          </p>
          {cheatsheets.length === 0 && (
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Generate Your First Cheatsheet
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCheatsheets.map((cheatsheet) => (
            <Card
              key={cheatsheet.id}
              className="p-6 hover:shadow-md transition-shadow"
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                  {cheatsheet.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {new Date(cheatsheet.created_at).toLocaleDateString()}
                </div>
              </div>

              {cheatsheet.content.sections.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    {cheatsheet.content.sections.length} section
                    {cheatsheet.content.sections.length !== 1 ? "s" : ""}
                  </p>
                </div>
              )}

              {cheatsheet.tags.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {cheatsheet.tags.slice(0, 3).map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                    {cheatsheet.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{cheatsheet.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleView(cheatsheet)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(cheatsheet)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(cheatsheet)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
