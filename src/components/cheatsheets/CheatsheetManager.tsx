"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  BookOpen,
  Edit3,
  Trash2,
  Plus,
  Search,
  FileText,
  Calendar,
  Eye,
} from "lucide-react";
import {
  getCheatsheetsByProjectId,
  createCheatsheet,
  updateCheatsheet,
  deleteCheatsheet,
} from "@/app/(main)/projects/actions/cheatsheet-actions";
import { toast } from "sonner";

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

interface CreateCheatsheetData {
  title: string;
  content: Cheatsheet["content"];
  tags?: string[];
}

interface CheatsheetManagerProps {
  projectId: string;
}

export function CheatsheetManager({ projectId }: CheatsheetManagerProps) {
  const [cheatsheets, setCheatsheets] = useState<Cheatsheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCheatsheet, setEditingCheatsheet] = useState<Cheatsheet | null>(
    null
  );
  const [viewingCheatsheet, setViewingCheatsheet] = useState<Cheatsheet | null>(
    null
  );

  const loadCheatsheets = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCheatsheetsByProjectId(projectId);
      setCheatsheets(data);
    } catch (error) {
      console.error("Failed to load cheatsheets:", error);
      toast.error("Failed to load cheatsheets");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadCheatsheets();
  }, [loadCheatsheets]);

  const handleCreate = async (cheatsheetData: CreateCheatsheetData) => {
    try {
      await createCheatsheet(projectId, cheatsheetData);
      toast.success("Cheatsheet created successfully");
      loadCheatsheets();
      setShowCreateModal(false);
    } catch (error) {
      console.error("Failed to create cheatsheet:", error);
      toast.error("Failed to create cheatsheet");
    }
  };

  const handleUpdate = async (cheatsheetData: CreateCheatsheetData) => {
    if (!editingCheatsheet) return;

    try {
      await updateCheatsheet({
        id: editingCheatsheet.id,
        ...cheatsheetData,
      });
      toast.success("Cheatsheet updated successfully");
      loadCheatsheets();
      setEditingCheatsheet(null);
    } catch (error) {
      console.error("Failed to update cheatsheet:", error);
      toast.error("Failed to update cheatsheet");
    }
  };

  const handleDelete = async (cheatsheetId: string) => {
    if (!confirm("Are you sure you want to delete this cheatsheet?")) return;

    try {
      await deleteCheatsheet(cheatsheetId);
      toast.success("Cheatsheet deleted successfully");
      loadCheatsheets();
    } catch (error) {
      console.error("Failed to delete cheatsheet:", error);
      toast.error("Failed to delete cheatsheet");
    }
  };

  const filteredCheatsheets = cheatsheets.filter(
    (cheatsheet) =>
      cheatsheet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cheatsheet.tags.some((tag) =>
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
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-primary">Cheatsheets</h2>
            <p className="text-sm text-muted">
              {cheatsheets.length} cheatsheet
              {cheatsheets.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-brand hover:bg-gradient-brand-hover"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Cheatsheet
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
        <Input
          placeholder="Search cheatsheets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Cheatsheets Grid */}
      {filteredCheatsheets.length === 0 ? (
        <Card className="border-dashed border-2 surface-elevated">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="w-12 h-12 text-muted mb-4" />
            <h3 className="text-lg font-medium text-muted mb-2">
              No cheatsheets yet
            </h3>
            <p className="text-sm text-muted text-center mb-4">
              Create your first cheatsheet to organize and reference key
              information
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-brand hover:bg-gradient-brand-hover"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Cheatsheet
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCheatsheets.map((cheatsheet) => (
            <CheatsheetCard
              key={cheatsheet.id}
              cheatsheet={cheatsheet}
              onView={() => setViewingCheatsheet(cheatsheet)}
              onEdit={() => setEditingCheatsheet(cheatsheet)}
              onDelete={() => handleDelete(cheatsheet.id)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <CheatsheetModal
        isOpen={showCreateModal || editingCheatsheet !== null}
        onClose={() => {
          setShowCreateModal(false);
          setEditingCheatsheet(null);
        }}
        onSave={editingCheatsheet ? handleUpdate : handleCreate}
        cheatsheet={editingCheatsheet}
        mode={editingCheatsheet ? "edit" : "create"}
      />

      {/* View Modal */}
      <CheatsheetViewModal
        isOpen={viewingCheatsheet !== null}
        onClose={() => setViewingCheatsheet(null)}
        cheatsheet={viewingCheatsheet}
      />
    </div>
  );
}

interface CheatsheetCardProps {
  cheatsheet: Cheatsheet;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function CheatsheetCard({
  cheatsheet,
  onView,
  onEdit,
  onDelete,
}: CheatsheetCardProps) {
  return (
    <Card className="group surface-elevated border-subtle hover:shadow-brand transition-all duration-300 cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-primary truncate">
              {cheatsheet.title}
            </CardTitle>
            <p className="text-sm text-muted mt-1">
              {cheatsheet.content.sections.length} section
              {cheatsheet.content.sections.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm" onClick={onView}>
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

      <CardContent className="pt-0" onClick={onView}>
        {/* Preview of first section */}
        {cheatsheet.content.sections[0] && (
          <div className="mb-4">
            <h4 className="font-medium text-secondary text-sm mb-1">
              {cheatsheet.content.sections[0].title}
            </h4>
            <p className="text-sm text-muted line-clamp-2">
              {cheatsheet.content.sections[0].content.substring(0, 100)}...
            </p>
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {cheatsheet.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {cheatsheet.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{cheatsheet.tags.length - 3}
            </Badge>
          )}
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-muted">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(cheatsheet.created_at).toLocaleDateString()}
          </div>
          {cheatsheet.content.metadata?.sourceFile && (
            <div className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              <span
                className="truncate max-w-20"
                title={cheatsheet.content.metadata.sourceFile}
              >
                {cheatsheet.content.metadata.sourceFile}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface CheatsheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    content: {
      sections: CheatsheetSection[];
      metadata: {
        generatedAt: string;
        style: string;
      };
    };
    tags: string[];
  }) => void;
  cheatsheet?: Cheatsheet | null;
  mode: "create" | "edit";
}

function CheatsheetModal({
  isOpen,
  onClose,
  onSave,
  cheatsheet,
  mode,
}: CheatsheetModalProps) {
  const [title, setTitle] = useState("");
  const [sections, setSections] = useState<CheatsheetSection[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (cheatsheet && mode === "edit") {
      setTitle(cheatsheet.title);
      setSections(cheatsheet.content.sections);
      setTags(cheatsheet.tags);
    } else {
      setTitle("");
      setSections([{ id: "1", title: "", content: "", keyPoints: [] }]);
      setTags([]);
    }
  }, [cheatsheet, mode, isOpen]);

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    const validSections = sections.filter(
      (s) => s.title.trim() && s.content.trim()
    );
    if (validSections.length === 0) {
      toast.error("Please add at least one section with title and content");
      return;
    }

    onSave({
      title,
      content: {
        sections: validSections,
        metadata: {
          generatedAt: new Date().toISOString(),
          style: "manual",
        },
      },
      tags,
    });
  };

  const addSection = () => {
    setSections([
      ...sections,
      {
        id: Date.now().toString(),
        title: "",
        content: "",
        keyPoints: [],
      },
    ]);
  };

  const removeSection = (id: string) => {
    setSections(sections.filter((s) => s.id !== id));
  };

  const updateSection = (
    id: string,
    field: string,
    value: string | string[]
  ) => {
    setSections(
      sections.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create Cheatsheet" : "Edit Cheatsheet"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new cheatsheet with organized sections and key points"
              : "Update your cheatsheet content and organization"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter cheatsheet title..."
            />
          </div>

          {/* Sections */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium">Sections</label>
              <Button onClick={addSection} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Section
              </Button>
            </div>

            <div className="space-y-4">
              {sections.map((section, index) => (
                <Card key={section.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium">Section {index + 1}</h4>
                    {sections.length > 1 && (
                      <Button
                        onClick={() => removeSection(section.id)}
                        variant="ghost"
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Input
                      placeholder="Section title..."
                      value={section.title}
                      onChange={(e) =>
                        updateSection(section.id, "title", e.target.value)
                      }
                    />
                    <Textarea
                      placeholder="Section content..."
                      value={section.content}
                      onChange={(e) =>
                        updateSection(section.id, "content", e.target.value)
                      }
                      rows={4}
                    />
                    <Input
                      placeholder="Key points (comma-separated)..."
                      value={section.keyPoints.join(", ")}
                      onChange={(e) =>
                        updateSection(
                          section.id,
                          "keyPoints",
                          e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter((s) => s)
                        )
                      }
                    />
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Tags */}
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

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-gradient-brand hover:bg-gradient-brand-hover"
            >
              {mode === "create" ? "Create" : "Update"} Cheatsheet
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface CheatsheetViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  cheatsheet: Cheatsheet | null;
}

function CheatsheetViewModal({
  isOpen,
  onClose,
  cheatsheet,
}: CheatsheetViewModalProps) {
  if (!cheatsheet) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{cheatsheet.title}</DialogTitle>
          <div className="flex items-center gap-4 text-sm text-muted">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(cheatsheet.created_at).toLocaleDateString()}
            </div>
            {cheatsheet.content.metadata?.sourceFile && (
              <div className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                {cheatsheet.content.metadata.sourceFile}
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tags */}
          {cheatsheet.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {cheatsheet.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Sections */}
          <div className="space-y-6">
            {cheatsheet.content.sections.map((section) => (
              <Card key={section.id} className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-brand-primary">
                  {section.title}
                </h3>

                <div className="prose prose-sm max-w-none mb-4">
                  <p className="text-secondary whitespace-pre-wrap">
                    {section.content}
                  </p>
                </div>

                {section.keyPoints.length > 0 && (
                  <div>
                    <h4 className="font-medium text-secondary mb-2">
                      Key Points:
                    </h4>
                    <ul className="list-disc list-inside space-y-1">
                      {section.keyPoints.map((point, idx) => (
                        <li key={idx} className="text-sm text-muted">
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {section.examples && section.examples.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-secondary mb-2">
                      Examples:
                    </h4>
                    <ul className="list-disc list-inside space-y-1">
                      {section.examples.map((example, idx) => (
                        <li key={idx} className="text-sm text-muted">
                          {example}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Summary */}
          {cheatsheet.content.summary && (
            <Card className="p-6 bg-gradient-to-r from-brand-primary/5 to-brand-accent/5 border-brand-primary/20">
              <h3 className="text-lg font-semibold mb-3 text-brand-primary">
                Summary
              </h3>
              <p className="text-secondary">{cheatsheet.content.summary}</p>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
