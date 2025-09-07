/**
 * Announcement Management Component for Admin Dashboard
 * Create and manage system-wide announcements and notifications
 * Fully refactored with semantic variables and design patterns
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Megaphone,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  Sparkles,
  Filter,
  Users,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "info" | "warning" | "success" | "error";
  target_audience: "all" | "users" | "admins";
  is_active: boolean;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  created_by: string;
  profiles: {
    username: string;
    display_name: string;
  };
}

interface AnnouncementsResponse {
  announcements: Announcement[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface AnnouncementFormData {
  title: string;
  content: string;
  type: "info" | "warning" | "success" | "error";
  target_audience: "all" | "users" | "admins";
  is_active: boolean;
  expires_at: string;
}

export function AnnouncementManagement() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] =
    useState<Announcement | null>(null);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (activeFilter !== "all") {
        params.append("active", activeFilter === "active" ? "true" : "false");
      }

      const response = await fetch(`/api/admin/announcements?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch announcements");
      }

      const data: AnnouncementsResponse = await response.json();
      setAnnouncements(data.announcements);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      toast.error("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, activeFilter]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleCreateAnnouncement = async (data: AnnouncementFormData) => {
    try {
      const response = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create announcement");
      }

      toast.success("Announcement created successfully");
      setShowCreateForm(false);
      await fetchAnnouncements();
    } catch (error) {
      console.error("Error creating announcement:", error);
      toast.error("Failed to create announcement");
    }
  };

  const handleUpdateAnnouncement = async (
    id: string,
    data: Partial<AnnouncementFormData>
  ) => {
    try {
      const response = await fetch("/api/admin/announcements", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, ...data }),
      });

      if (!response.ok) {
        throw new Error("Failed to update announcement");
      }

      toast.success("Announcement updated successfully");
      setEditingAnnouncement(null);
      await fetchAnnouncements();
    } catch (error) {
      console.error("Error updating announcement:", error);
      toast.error("Failed to update announcement");
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/announcements?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete announcement");
      }

      toast.success("Announcement deleted successfully");
      await fetchAnnouncements();
    } catch (error) {
      console.error("Error deleting announcement:", error);
      toast.error("Failed to delete announcement");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "info":
        return <Info className="w-4 h-4" />;
      case "warning":
        return <AlertCircle className="w-4 h-4" />;
      case "success":
        return <CheckCircle className="w-4 h-4" />;
      case "error":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "info":
        return "text-blue-600 bg-blue-50";
      case "warning":
        return "text-yellow-600 bg-yellow-50";
      case "success":
        return "text-green-600 bg-green-50";
      case "error":
        return "text-red-600 bg-red-50";
      default:
        return "text-blue-600 bg-blue-50";
    }
  };

  if (loading && announcements.length === 0) {
    return <AnnouncementsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header Section with Glass Morphism */}
      <div className="relative">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div
            className="absolute top-0 left-0 w-full h-1/2 bg-gradient-glass animate-pulse"
            style={{ animationDuration: "4s" }}
          />
          <div
            className="absolute bottom-0 right-0 w-full h-1/3 bg-gradient-glass animate-pulse"
            style={{ animationDuration: "6s", animationDelay: "2s" }}
          />
        </div>
        <div className="relative glass-surface border border-subtle rounded-xl p-6 shadow-brand">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-brand rounded-xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all transition-normal shadow-brand">
                  <Megaphone className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -inset-1 bg-gradient-glass rounded-xl blur opacity-0 group-hover:opacity-100 transition-all transition-normal" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary group-hover:brand-primary transition-colors transition-normal">
                  Announcement Management
                </h1>
                <p className="text-muted mt-1">
                  Create and manage system-wide announcements
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/30 animate-pulse"
              >
                <Settings className="w-3 h-3 mr-1" />
                Admin Only
              </Badge>
              <Button
                onClick={() => setShowCreateForm(true)}
                className={cn(
                  "relative overflow-hidden group",
                  "bg-gradient-brand hover:bg-gradient-brand-hover",
                  "transform hover:scale-105 transition-all transition-normal",
                  "shadow-brand hover:shadow-brand-lg"
                )}
              >
                <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-slow skew-x-12" />
                <div className="relative z-10 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  New Announcement
                </div>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters Section */}
      <div className="glass-surface border border-subtle rounded-xl p-6 shadow-brand-lg">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 brand-primary" />
          <h2 className="text-lg font-semibold text-primary">
            Filter Announcements
          </h2>
        </div>
        <div className="flex gap-4">
          <Select
            value={activeFilter}
            onValueChange={(value: "all" | "active" | "inactive") =>
              setActiveFilter(value)
            }
          >
            <SelectTrigger className="w-[180px] surface-secondary border-secondary interactive-hover">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="surface-elevated border-secondary">
              <SelectItem value="all">All Announcements</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 px-4 py-2 surface-elevated border border-secondary rounded-md">
            <Users className="w-4 h-4 text-muted" />
            <span className="text-sm font-medium text-secondary">
              {pagination.total} total announcements
            </span>
          </div>
        </div>
      </div>

      {/* Enhanced Announcements List */}
      <div className="glass-surface border border-subtle rounded-xl shadow-brand-lg overflow-hidden">
        <div className="surface-secondary border-b border-subtle px-6 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 brand-secondary animate-pulse" />
            <h2 className="text-lg font-semibold text-primary">
              Announcements
            </h2>
            {pagination.total > 0 && (
              <Badge
                variant="outline"
                className="ml-auto surface-elevated text-secondary border-secondary"
              >
                {pagination.total}{" "}
                {pagination.total === 1 ? "announcement" : "announcements"}
              </Badge>
            )}
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="p-4 surface-elevated border border-secondary rounded-xl"
                  style={{
                    animation: `slideInLeft 0.5s ease-out ${i * 0.1}s both`,
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <Skeleton className="w-48 h-5 mb-2" />
                      <Skeleton className="w-full h-4 mb-2" />
                    </div>
                    <Skeleton className="w-16 h-6 rounded-full" />
                  </div>
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-20 h-4" />
                    <Skeleton className="w-24 h-4" />
                    <Skeleton className="w-16 h-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 surface-elevated rounded-2xl flex items-center justify-center mb-4 mx-auto">
                <Megaphone className="w-8 h-8 text-muted" />
              </div>
              <p className="text-primary font-medium text-lg mb-2">
                No announcements found
              </p>
              <p className="text-muted text-sm mb-6">
                Create your first announcement to communicate with users
              </p>
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-glass border-brand text-brand-primary hover:bg-gradient-brand hover:border-brand hover:text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Announcement
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement, index) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  onEdit={() => setEditingAnnouncement(announcement)}
                  onDelete={() => handleDeleteAnnouncement(announcement.id)}
                  onToggleActive={async () => {
                    await handleUpdateAnnouncement(announcement.id, {
                      is_active: !announcement.is_active,
                    });
                  }}
                  formatDate={formatDate}
                  getTypeIcon={getTypeIcon}
                  getTypeColor={getTypeColor}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Create Announcement Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-2xl surface-elevated border-secondary">
          <DialogHeader>
            <DialogTitle className="text-primary text-xl font-bold flex items-center gap-2">
              <Plus className="w-5 h-5 brand-primary" />
              Create New Announcement
            </DialogTitle>
          </DialogHeader>
          <AnnouncementForm
            onSubmit={handleCreateAnnouncement}
            onCancel={() => setShowCreateForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Enhanced Edit Announcement Dialog */}
      <Dialog
        open={!!editingAnnouncement}
        onOpenChange={() => setEditingAnnouncement(null)}
      >
        <DialogContent className="max-w-2xl surface-elevated border-secondary">
          <DialogHeader>
            <DialogTitle className="text-primary text-xl font-bold flex items-center gap-2">
              <Edit className="w-5 h-5 brand-primary" />
              Edit Announcement
            </DialogTitle>
          </DialogHeader>
          {editingAnnouncement && (
            <AnnouncementForm
              initialData={{
                title: editingAnnouncement.title,
                content: editingAnnouncement.content,
                type: editingAnnouncement.type,
                target_audience: editingAnnouncement.target_audience,
                is_active: editingAnnouncement.is_active,
                expires_at: editingAnnouncement.expires_at || "",
              }}
              onSubmit={(data) =>
                handleUpdateAnnouncement(editingAnnouncement.id, data)
              }
              onCancel={() => setEditingAnnouncement(null)}
              isEditing
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface AnnouncementCardProps {
  announcement: Announcement;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  formatDate: (dateString: string) => string;
  getTypeIcon: (type: string) => React.ReactNode;
  getTypeColor: (type: string) => string;
  index?: number;
}

function AnnouncementCard({
  announcement,
  onEdit,
  onDelete,
  onToggleActive,
  formatDate,
  getTypeIcon,
  getTypeColor,
  index = 0,
}: AnnouncementCardProps) {
  const isExpired =
    announcement.expires_at && new Date(announcement.expires_at) < new Date();

  const getSemanticTypeColor = (type: string) => {
    switch (type) {
      case "info":
        return "bg-blue-500/10 text-blue-400";
      case "warning":
        return "bg-yellow-500/10 text-yellow-400";
      case "success":
        return "bg-green-500/10 text-green-400";
      case "error":
        return "bg-red-500/10 text-red-400";
      default:
        return "bg-blue-500/10 text-blue-400";
    }
  };

  return (
    <div
      className={cn(
        "glass-surface border border-subtle rounded-xl p-6 group relative overflow-hidden",
        "hover:surface-elevated hover:shadow-brand hover:scale-[1.01]",
        "transition-all transition-normal transform"
      )}
      style={{
        animation: `slideInLeft 0.5s ease-out ${index * 0.1}s both`,
      }}
    >
      {/* Hover glow effect */}
      <div className="absolute -inset-0.5 bg-gradient-glass rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity transition-normal" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-all transition-normal",
                  "group-hover:scale-110 transform",
                  getSemanticTypeColor(announcement.type)
                )}
              >
                {getTypeIcon(announcement.type)}
              </div>
              <h4 className="font-bold text-lg text-primary group-hover:brand-primary transition-colors transition-normal">
                {announcement.title}
              </h4>
            </div>
            <p className="text-secondary group-hover:text-primary transition-colors transition-normal line-clamp-2 leading-relaxed">
              {announcement.content}
            </p>
          </div>

          <div className="flex items-center gap-3 ml-6">
            <Badge
              className={cn(
                "font-medium transition-all transition-normal",
                announcement.is_active && !isExpired
                  ? "bg-green-500/10 text-green-400 border-green-500/30 group-hover:bg-green-500/20"
                  : isExpired
                  ? "bg-red-500/10 text-red-400 border-red-500/30 group-hover:bg-red-500/20"
                  : "surface-elevated text-secondary border-secondary group-hover:surface-glass"
              )}
            >
              {isExpired
                ? "Expired"
                : announcement.is_active
                ? "Active"
                : "Inactive"}
            </Badge>

            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all transition-normal transform scale-95 group-hover:scale-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="surface-secondary border-secondary text-secondary interactive-hover hover:surface-elevated hover:border-brand hover:text-brand-primary h-8 w-8 p-0"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleActive}
                className={cn(
                  "interactive-hover h-8 w-8 p-0",
                  announcement.is_active
                    ? "surface-secondary border-secondary text-yellow-500 hover:surface-elevated hover:border-yellow-500 hover:text-yellow-400"
                    : "surface-secondary border-secondary text-green-500 hover:surface-elevated hover:border-green-500 hover:text-green-400"
                )}
              >
                {announcement.is_active ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="surface-secondary border-secondary text-red-500 interactive-hover hover:surface-elevated hover:border-red-500 hover:text-red-400 h-8 w-8 p-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced metadata section */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse" />
              <span className="text-muted font-medium">
                Target:{" "}
                <span className="text-secondary">
                  {announcement.target_audience}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-brand-secondary rounded-full animate-pulse" />
              <span className="text-muted font-medium">
                Created:{" "}
                <span className="text-secondary">
                  {formatDate(announcement.created_at)}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-brand-tertiary rounded-full animate-pulse" />
              <span className="text-muted font-medium">
                By:{" "}
                <span className="text-secondary">
                  {announcement.profiles.display_name ||
                    announcement.profiles.username}
                </span>
              </span>
            </div>
            {announcement.expires_at && (
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full animate-pulse",
                    isExpired ? "bg-red-500" : "bg-orange-500"
                  )}
                />
                <span className="text-muted font-medium">
                  Expires:{" "}
                  <span
                    className={cn(
                      "font-medium",
                      isExpired ? "text-red-400" : "text-secondary"
                    )}
                  >
                    {formatDate(announcement.expires_at)}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface AnnouncementFormProps {
  initialData?: Partial<AnnouncementFormData>;
  onSubmit: (data: AnnouncementFormData) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

function AnnouncementForm({
  initialData,
  onSubmit,
  onCancel,
  isEditing,
}: AnnouncementFormProps) {
  const [formData, setFormData] = useState<AnnouncementFormData>({
    title: initialData?.title || "",
    content: initialData?.content || "",
    type: initialData?.type || "info",
    target_audience: initialData?.target_audience || "all",
    is_active: initialData?.is_active ?? true,
    expires_at: initialData?.expires_at || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Title *
        </label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Announcement title"
          maxLength={200}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Content *
        </label>
        <Textarea
          value={formData.content}
          onChange={(e) =>
            setFormData({ ...formData, content: e.target.value })
          }
          placeholder="Announcement content"
          rows={4}
          maxLength={2000}
        />
        <p className="text-xs text-text-muted mt-1">
          {formData.content.length}/2000 characters
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Type
          </label>
          <Select
            value={formData.type}
            onValueChange={(value: "info" | "warning" | "success" | "error") =>
              setFormData({ ...formData, type: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Target Audience
          </label>
          <Select
            value={formData.target_audience}
            onValueChange={(value: "all" | "users" | "admins") =>
              setFormData({ ...formData, target_audience: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="users">Regular Users</SelectItem>
              <SelectItem value="admins">Admins Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Expiration Date (Optional)
        </label>
        <Input
          type="datetime-local"
          value={formData.expires_at}
          onChange={(e) =>
            setFormData({ ...formData, expires_at: e.target.value })
          }
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.is_active}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, is_active: checked })
          }
        />
        <label className="text-sm font-medium text-text-primary">Active</label>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit">
          {isEditing ? "Update Announcement" : "Create Announcement"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function AnnouncementsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="w-64 h-8 mb-2" />
          <Skeleton className="w-48 h-4" />
        </div>
        <Skeleton className="w-36 h-10" />
      </div>

      <Card className="p-6 glass-surface border border-subtle">
        <Skeleton className="w-48 h-10" />
      </Card>

      <Card className="p-6 glass-surface border border-subtle">
        <Skeleton className="w-32 h-6 mb-4" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 border border-subtle rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <Skeleton className="w-48 h-5" />
                <Skeleton className="w-16 h-6 rounded-full" />
              </div>
              <Skeleton className="w-full h-4 mb-2" />
              <div className="flex items-center gap-4">
                <Skeleton className="w-20 h-4" />
                <Skeleton className="w-24 h-4" />
                <Skeleton className="w-16 h-4" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
