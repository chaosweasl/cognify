/**
 * User Management Component for Admin Dashboard
 * View-only user management interface with search and pagination
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  Filter,
  UserCheck,
  UserPlus,
  Clock,
  Shield,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface User {
  id: string;
  username: string;
  display_name: string;
  email: string;
  age: number | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
  onboarding_completed: boolean;
}

interface UserStats {
  totalUsers: number;
  adminUsers: number;
  completedOnboarding: number;
  recentSignups: number;
  onboardingRate: number;
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: UserStats;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
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

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: search.trim(),
        sortBy,
        sortOrder,
      });

      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data: UsersResponse = await response.json();
      setUsers(data.users);
      setStats(data.stats);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, search, sortBy, sortOrder]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = async () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    await fetchUsers();
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading && users.length === 0) {
    return <UserManagementSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={Users}
            color="text-blue-600"
          />
          <StatCard
            title="Admins"
            value={stats.adminUsers}
            icon={Shield}
            color="text-purple-600"
          />
          <StatCard
            title="Completed Onboarding"
            value={stats.completedOnboarding}
            icon={UserCheck}
            color="text-green-600"
          />
          <StatCard
            title="Recent Signups"
            value={stats.recentSignups}
            icon={UserPlus}
            color="text-orange-600"
          />
          <StatCard
            title="Onboarding Rate"
            value={`${Math.round(stats.onboardingRate * 100)}%`}
            icon={Clock}
            color="text-cyan-600"
          />
        </div>
      )}

      {/* Search and Filters */}
      <Card className="p-6 glass-surface border border-subtle">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-4 h-4" />
              <Input
                placeholder="Search users by username, name, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
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
                <SelectItem value="username">Username</SelectItem>
                <SelectItem value="display_name">Display Name</SelectItem>
                <SelectItem value="updated_at">Last Updated</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={sortOrder}
              onValueChange={(value: "asc" | "desc") => setSortOrder(value)}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Newest</SelectItem>
                <SelectItem value="asc">Oldest</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} disabled={loading}>
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="glass-surface border border-subtle">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-muted">
              <tr>
                <th className="text-left p-4 font-medium text-text-primary">
                  User
                </th>
                <th className="text-left p-4 font-medium text-text-primary">
                  Email
                </th>
                <th className="text-left p-4 font-medium text-text-primary">
                  Status
                </th>
                <th className="text-left p-4 font-medium text-text-primary">
                  Created
                </th>
                <th className="text-left p-4 font-medium text-text-primary">
                  Last Active
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-subtle">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <div>
                          <Skeleton className="w-24 h-4 mb-1" />
                          <Skeleton className="w-16 h-3" />
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Skeleton className="w-32 h-4" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="w-16 h-6 rounded-full" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="w-20 h-4" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="w-20 h-4" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-8 text-text-muted">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-subtle hover:bg-surface-muted/50"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center">
                          <span className="text-brand-primary font-medium text-sm">
                            {(user.display_name || user.username || "U")
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-text-primary">
                            {user.display_name || user.username}
                            {user.is_admin && (
                              <Badge
                                className="ml-2 text-xs"
                                variant="secondary"
                              >
                                <Shield className="w-3 h-3 mr-1" />
                                Admin
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-text-muted">
                            @{user.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-text-primary">{user.email}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Badge
                          variant={
                            user.onboarding_completed ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {user.onboarding_completed ? "Active" : "Onboarding"}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-4 text-text-muted text-sm">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="p-4 text-text-muted text-sm">
                      {formatDate(user.updated_at)}
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
              of {pagination.total} users
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
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
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages || loading}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card className="p-4 glass-surface border border-subtle">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-text-muted text-sm font-medium">{title}</p>
          <p className="text-lg font-bold text-text-primary mt-1">{value}</p>
        </div>
        <div className={`p-2 rounded-lg bg-surface-muted`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
    </Card>
  );
}

function UserManagementSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="p-4 glass-surface border border-subtle">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="w-20 h-4 mb-2" />
                <Skeleton className="w-12 h-6" />
              </div>
              <Skeleton className="w-8 h-8 rounded-lg" />
            </div>
          </Card>
        ))}
      </div>

      {/* Search and Filters */}
      <Card className="p-6 glass-surface border border-subtle">
        <div className="flex gap-4">
          <Skeleton className="flex-1 h-10" />
          <Skeleton className="w-[140px] h-10" />
          <Skeleton className="w-[100px] h-10" />
          <Skeleton className="w-20 h-10" />
        </div>
      </Card>

      {/* Table */}
      <Card className="glass-surface border border-subtle">
        <div className="p-4">
          <Skeleton className="w-full h-80" />
        </div>
      </Card>
    </div>
  );
}
