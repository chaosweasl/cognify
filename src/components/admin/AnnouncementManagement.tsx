/**
 * Announcement Management Component for Admin Dashboard
 * Create and manage system-wide announcements and notifications
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">
            Announcement Management
          </h2>
          <p className="text-text-muted">
            Create and manage system-wide announcements
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Announcement
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-6 glass-surface border border-subtle">
        <div className="flex gap-4">
          <Select
            value={activeFilter}
            onValueChange={(value: "all" | "active" | "inactive") =>
              setActiveFilter(value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Announcements</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Announcements List */}
      <Card className="glass-surface border border-subtle">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Announcements ({pagination.total})
          </h3>

          {loading ? (
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
          ) : announcements.length === 0 ? (
            <div className="text-center py-8">
              <Megaphone className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-muted">No announcements found</p>
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => setShowCreateForm(true)}
              >
                Create First Announcement
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
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
                />
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Create Announcement Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Announcement</DialogTitle>
          </DialogHeader>
          <AnnouncementForm
            onSubmit={handleCreateAnnouncement}
            onCancel={() => setShowCreateForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Announcement Dialog */}
      <Dialog
        open={!!editingAnnouncement}
        onOpenChange={() => setEditingAnnouncement(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Announcement</DialogTitle>
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
}

function AnnouncementCard({
  announcement,
  onEdit,
  onDelete,
  onToggleActive,
  formatDate,
  getTypeIcon,
  getTypeColor,
}: AnnouncementCardProps) {
  const isExpired =
    announcement.expires_at && new Date(announcement.expires_at) < new Date();

  return (
    <div className="p-4 border border-subtle rounded-lg hover:bg-surface-muted/50 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-text-primary">
              {announcement.title}
            </h4>
            <div
              className={`p-1 rounded-full ${getTypeColor(announcement.type)}`}
            >
              {getTypeIcon(announcement.type)}
            </div>
          </div>
          <p className="text-text-muted text-sm line-clamp-2">
            {announcement.content}
          </p>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <Badge
            variant={
              announcement.is_active && !isExpired ? "default" : "secondary"
            }
            className="text-xs"
          >
            {isExpired
              ? "Expired"
              : announcement.is_active
              ? "Active"
              : "Inactive"}
          </Badge>

          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleActive}
              className={
                announcement.is_active ? "text-yellow-600" : "text-green-600"
              }
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
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-text-muted">
        <span>Target: {announcement.target_audience}</span>
        <span>Created: {formatDate(announcement.created_at)}</span>
        <span>
          By:{" "}
          {announcement.profiles.display_name || announcement.profiles.username}
        </span>
        {announcement.expires_at && (
          <span>Expires: {formatDate(announcement.expires_at)}</span>
        )}
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
