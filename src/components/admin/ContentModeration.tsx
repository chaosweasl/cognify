/**
 * Content Moderation Component for Admin Dashboard
 * View user-generated content including projects and flashcards
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FolderOpen,
  CreditCard,
  Search,
  Filter,
  User,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  profiles: {
    username: string;
    display_name: string;
    email: string;
  };
}

interface Flashcard {
  id: string;
  front: string;
  back: string;
  created_at: string;
  updated_at: string;
  project_id: string;
  projects: {
    name: string;
    user_id: string;
    profiles: {
      username: string;
      display_name: string;
      email: string;
    };
  };
}

interface ContentResponse {
  content: (Project | Flashcard)[];
  type: "projects" | "flashcards";
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function ContentModeration() {
  const [activeTab, setActiveTab] = useState<"projects" | "flashcards">(
    "projects"
  );
  const [content, setContent] = useState<(Project | Flashcard)[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const fetchContent = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        type: activeTab,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: search.trim(),
        sortBy,
        sortOrder,
      });

      const response = await fetch(`/api/admin/content?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch content");
      }

      const data: ContentResponse = await response.json();
      setContent(data.content);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching content:", error);
      toast.error("Failed to load content");
    } finally {
      setLoading(false);
    }
  }, [activeTab, pagination.page, search, sortBy, sortOrder]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const handleSearch = async () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    await fetchContent();
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as "projects" | "flashcards");
    setPagination((prev) => ({ ...prev, page: 1 }));
    setSearch("");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const isProject = (item: Project | Flashcard): item is Project => {
    return "user_id" in item;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">
            Content Moderation
          </h2>
          <p className="text-text-muted">
            Review user-generated content and manage platform safety
          </p>
        </div>
      </div>

      {/* Content Type Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="flashcards" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Flashcards
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          <ContentTable
            content={content as Project[]}
            type="projects"
            loading={loading}
            search={search}
            setSearch={setSearch}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            onSearch={handleSearch}
            pagination={pagination}
            onPageChange={handlePageChange}
            formatDate={formatDate}
            truncateText={truncateText}
            isProject={isProject}
          />
        </TabsContent>

        <TabsContent value="flashcards" className="space-y-4">
          <ContentTable
            content={content as Flashcard[]}
            type="flashcards"
            loading={loading}
            search={search}
            setSearch={setSearch}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            onSearch={handleSearch}
            pagination={pagination}
            onPageChange={handlePageChange}
            formatDate={formatDate}
            truncateText={truncateText}
            isProject={isProject}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ContentTableProps {
  content: (Project | Flashcard)[];
  type: "projects" | "flashcards";
  loading: boolean;
  search: string;
  setSearch: (value: string) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  sortOrder: "asc" | "desc";
  setSortOrder: (value: "asc" | "desc") => void;
  onSearch: () => void;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  formatDate: (dateString: string) => string;
  truncateText: (text: string, maxLength?: number) => string;
  isProject: (item: Project | Flashcard) => item is Project;
}

function ContentTable({
  content,
  type,
  loading,
  search,
  setSearch,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  onSearch,
  pagination,
  onPageChange,
  formatDate,
  truncateText,
  isProject,
}: ContentTableProps) {
  const [selectedItem, setSelectedItem] = useState<Project | Flashcard | null>(
    null
  );

  return (
    <>
      {/* Search and Filters */}
      <Card className="p-6 glass-surface border border-subtle">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-4 h-4" />
              <Input
                placeholder={`Search ${type}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && onSearch()}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Created Date</SelectItem>
                <SelectItem value="updated_at">Last Updated</SelectItem>
                {type === "projects" && (
                  <SelectItem value="name">Name</SelectItem>
                )}
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Newest</SelectItem>
                <SelectItem value="asc">Oldest</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={onSearch} disabled={loading}>
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>
      </Card>

      {/* Content Table */}
      <Card className="glass-surface border border-subtle">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-muted">
              <tr>
                <th className="text-left p-4 font-medium text-text-primary">
                  {type === "projects" ? "Project" : "Flashcard"}
                </th>
                <th className="text-left p-4 font-medium text-text-primary">
                  Owner
                </th>
                <th className="text-left p-4 font-medium text-text-primary">
                  Created
                </th>
                <th className="text-left p-4 font-medium text-text-primary">
                  Updated
                </th>
                <th className="text-left p-4 font-medium text-text-primary">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-subtle">
                    <td className="p-4">
                      <Skeleton className="w-48 h-4 mb-2" />
                      <Skeleton className="w-32 h-3" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="w-24 h-4" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="w-20 h-4" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="w-20 h-4" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="w-16 h-8" />
                    </td>
                  </tr>
                ))
              ) : content.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-8 text-text-muted">
                    No {type} found
                  </td>
                </tr>
              ) : (
                content.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-subtle hover:bg-surface-muted/50"
                  >
                    <td className="p-4">
                      <div>
                        <div className="font-medium text-text-primary">
                          {isProject(item)
                            ? item.name
                            : truncateText(item.front, 50)}
                        </div>
                        <div className="text-sm text-text-muted">
                          {isProject(item)
                            ? item.description
                              ? truncateText(item.description, 60)
                              : "No description"
                            : `Project: ${item.projects.name}`}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-text-muted" />
                        <div>
                          <div className="text-sm font-medium text-text-primary">
                            {isProject(item)
                              ? item.profiles.display_name ||
                                item.profiles.username
                              : item.projects.profiles.display_name ||
                                item.projects.profiles.username}
                          </div>
                          <div className="text-xs text-text-muted">
                            @
                            {isProject(item)
                              ? item.profiles.username
                              : item.projects.profiles.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-text-muted text-sm">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="p-4 text-text-muted text-sm">
                      {formatDate(item.updated_at)}
                    </td>
                    <td className="p-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedItem(item)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>
                              {type === "projects"
                                ? "Project Details"
                                : "Flashcard Details"}
                            </DialogTitle>
                          </DialogHeader>
                          {selectedItem && (
                            <ItemDetails
                              item={selectedItem}
                              isProject={isProject}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-subtle">
            <div className="text-sm text-text-muted">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total} {type}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1 || loading}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <span className="text-sm text-text-muted px-2">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages || loading}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}

function ItemDetails({
  item,
  isProject,
}: {
  item: Project | Flashcard;
  isProject: (item: Project | Flashcard) => item is Project;
}) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      {isProject(item) ? (
        <div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium text-text-muted">
                Name
              </label>
              <p className="text-text-primary">{item.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-text-muted">
                Owner
              </label>
              <p className="text-text-primary">
                {item.profiles.display_name || item.profiles.username} (@
                {item.profiles.username})
              </p>
            </div>
          </div>

          {item.description && (
            <div className="mb-4">
              <label className="text-sm font-medium text-text-muted">
                Description
              </label>
              <p className="text-text-primary whitespace-pre-wrap">
                {item.description}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-text-muted">
                Created
              </label>
              <p className="text-text-primary text-sm">
                {formatDate(item.created_at)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-text-muted">
                Last Updated
              </label>
              <p className="text-text-primary text-sm">
                {formatDate(item.updated_at)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium text-text-muted">
                Project
              </label>
              <p className="text-text-primary">{item.projects.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-text-muted">
                Owner
              </label>
              <p className="text-text-primary">
                {item.projects.profiles.display_name ||
                  item.projects.profiles.username}
                (@{item.projects.profiles.username})
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium text-text-muted">
                Front
              </label>
              <div className="p-3 bg-surface-muted rounded-md">
                <p className="text-text-primary whitespace-pre-wrap">
                  {item.front}
                </p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-text-muted">
                Back
              </label>
              <div className="p-3 bg-surface-muted rounded-md">
                <p className="text-text-primary whitespace-pre-wrap">
                  {item.back}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-text-muted">
                Created
              </label>
              <p className="text-text-primary text-sm">
                {formatDate(item.created_at)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-text-muted">
                Last Updated
              </label>
              <p className="text-text-primary text-sm">
                {formatDate(item.updated_at)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
