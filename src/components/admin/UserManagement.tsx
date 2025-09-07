/**
 * User Management Component for Admin Dashboard
 * View-only user management interface with search and pagination
 * Fully refactored with semantic variables and design patterns
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
  TrendingUp,
  Eye,
  Sparkles,
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
import { cn } from "@/lib/utils";

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
  const [isSearchFocused, setIsSearchFocused] = useState(false);

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
      {/* Enhanced Header Section with Glass Morphism */}
      <div className="relative">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div
            className="absolute top-0 left-0 w-full h-1/2 bg-gradient-glass animate-pulse"
            style={{ animationDuration: "4s" }}
          />
        </div>
        <div className="relative glass-surface border border-subtle rounded-xl p-6 shadow-brand">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-brand rounded-xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all transition-normal shadow-brand">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -inset-1 bg-gradient-glass rounded-xl blur opacity-0 group-hover:opacity-100 transition-all transition-normal" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary group-hover:brand-primary transition-colors transition-normal">
                  User Management
                </h1>
                <p className="text-muted mt-1">
                  Monitor and analyze user activity across the platform
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="text-xs bg-green-500/10 text-green-400 border-green-500/30 animate-pulse"
            >
              <Eye className="w-3 h-3 mr-1" />
              View Only
            </Badge>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards with Animations */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={Users}
            color="brand-primary"
            index={0}
          />
          <StatCard
            title="Admins"
            value={stats.adminUsers}
            icon={Shield}
            color="brand-secondary"
            index={1}
          />
          <StatCard
            title="Completed Onboarding"
            value={stats.completedOnboarding}
            icon={UserCheck}
            color="text-green-500"
            index={2}
          />
          <StatCard
            title="Recent Signups"
            value={stats.recentSignups}
            icon={UserPlus}
            color="text-orange-500"
            index={3}
          />
          <StatCard
            title="Onboarding Rate"
            value={`${Math.round(stats.onboardingRate * 100)}%`}
            icon={TrendingUp}
            color="brand-tertiary"
            index={4}
          />
        </div>
      )}

      {/* Enhanced Search and Filters with Glass Effects */}
      <div className="glass-surface border border-subtle rounded-xl p-6 shadow-brand-lg">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 brand-primary" />
          <h2 className="text-lg font-semibold text-primary">
            Search & Filter Users
          </h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search
              className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-all transition-normal",
                isSearchFocused ? "brand-primary scale-110" : "text-muted"
              )}
            />
            <Input
              placeholder="Search users by username, name, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className={cn(
                "pl-10 h-12 transition-all transition-normal",
                "surface-secondary border-secondary text-primary placeholder:text-muted",
                "focus:surface-elevated focus:border-brand focus:shadow-brand interactive-focus",
                "interactive-hover"
              )}
            />
          </div>
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px] h-12 surface-secondary border-secondary interactive-hover">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="surface-elevated border-secondary">
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
              <SelectTrigger className="w-[100px] h-12 surface-secondary border-secondary interactive-hover">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="surface-elevated border-secondary">
                <SelectItem value="desc">Newest</SelectItem>
                <SelectItem value="asc">Oldest</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleSearch}
              disabled={loading}
              className={cn(
                "h-12 px-6 relative overflow-hidden group",
                "bg-gradient-brand hover:bg-gradient-brand-hover",
                "transform hover:scale-105 transition-all transition-normal",
                "shadow-brand hover:shadow-brand-lg"
              )}
            >
              <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-slow skew-x-12" />
              <div className="relative z-10 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Search
              </div>
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Users Table with Glass Effects */}
      <div className="glass-surface border border-subtle rounded-xl shadow-brand-lg overflow-hidden">
        <div className="surface-secondary border-b border-subtle px-6 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 brand-secondary animate-pulse" />
            <h2 className="text-lg font-semibold text-primary">
              User Directory
            </h2>
            {pagination.total > 0 && (
              <Badge
                variant="outline"
                className="ml-auto surface-elevated text-secondary border-secondary"
              >
                {pagination.total} {pagination.total === 1 ? "user" : "users"}
              </Badge>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="surface-secondary border-b border-subtle">
              <tr>
                <th className="text-left p-4 font-semibold text-primary text-sm uppercase tracking-wider">
                  User
                </th>
                <th className="text-left p-4 font-semibold text-primary text-sm uppercase tracking-wider">
                  Email
                </th>
                <th className="text-left p-4 font-semibold text-primary text-sm uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left p-4 font-semibold text-primary text-sm uppercase tracking-wider">
                  Created
                </th>
                <th className="text-left p-4 font-semibold text-primary text-sm uppercase tracking-wider">
                  Last Active
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr
                    key={i}
                    className="border-b border-subtle interactive-hover"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-full" />
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
                  <td colSpan={5} className="text-center p-12">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 surface-elevated rounded-2xl flex items-center justify-center mb-4">
                        <Users className="w-8 h-8 text-muted" />
                      </div>
                      <p className="text-primary font-medium text-lg mb-2">
                        No users found
                      </p>
                      <p className="text-muted text-sm">
                        Try adjusting your search criteria
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <tr
                    key={user.id}
                    className={cn(
                      "border-b border-subtle transition-all transition-normal group",
                      "hover:surface-elevated hover:scale-[1.01] hover:shadow-brand"
                    )}
                    style={{
                      animation: `slideInLeft 0.5s ease-out ${
                        index * 0.1
                      }s both`,
                    }}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center transform group-hover:scale-110 transition-transform transition-normal shadow-brand">
                            <span className="text-white font-semibold text-sm">
                              {(user.display_name || user.username || "U")
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          </div>
                          <div className="absolute -inset-0.5 bg-gradient-glass rounded-full blur opacity-0 group-hover:opacity-100 transition-all transition-normal" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-primary group-hover:brand-primary transition-colors transition-normal">
                              {user.display_name || user.username}
                            </span>
                            {user.is_admin && (
                              <Badge className="text-xs bg-gradient-brand text-white border-0">
                                <Shield className="w-3 h-3 mr-1" />
                                Admin
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted">
                            @{user.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-primary font-medium group-hover:brand-primary transition-colors transition-normal">
                        {user.email}
                      </span>
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={
                          user.onboarding_completed ? "default" : "secondary"
                        }
                        className={cn(
                          "text-xs font-medium transition-all transition-normal",
                          user.onboarding_completed
                            ? "bg-green-500/10 text-green-400 border-green-500/30 group-hover:bg-green-500/20"
                            : "surface-elevated text-secondary border-secondary group-hover:surface-glass"
                        )}
                      >
                        {user.onboarding_completed ? "Active" : "Onboarding"}
                      </Badge>
                    </td>
                    <td className="p-4 text-secondary group-hover:text-primary transition-colors transition-normal text-sm">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="p-4 text-secondary group-hover:text-primary transition-colors transition-normal text-sm">
                      {formatDate(user.updated_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Enhanced Pagination with Glass Effects */}
        {pagination.totalPages > 1 && (
          <div className="surface-secondary border-t border-subtle p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-muted">
                <span className="font-medium text-primary">
                  {(pagination.page - 1) * pagination.limit + 1}-
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium text-primary">
                  {pagination.total}
                </span>{" "}
                users
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1 || loading}
                  className={cn(
                    "surface-secondary border-secondary text-secondary interactive-hover",
                    "hover:surface-elevated hover:border-brand hover:text-brand-primary",
                    "transition-all transition-normal"
                  )}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <div className="flex items-center gap-2 px-3 py-2 surface-elevated border border-secondary rounded-md">
                  <span className="text-sm font-medium text-primary">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={
                    pagination.page === pagination.totalPages || loading
                  }
                  className={cn(
                    "surface-secondary border-secondary text-secondary interactive-hover",
                    "hover:surface-elevated hover:border-brand hover:text-brand-primary",
                    "transition-all transition-normal"
                  )}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  index = 0,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  index?: number;
}) {
  return (
    <div
      className={cn(
        "glass-surface border border-subtle rounded-xl p-6 group relative overflow-hidden",
        "hover:surface-elevated hover:shadow-brand hover:scale-[1.02]",
        "transition-all transition-normal transform"
      )}
      style={{
        animation: `slideInLeft 0.5s ease-out ${index * 0.1}s both`,
      }}
    >
      {/* Hover glow effect */}
      <div className="absolute -inset-0.5 bg-gradient-glass rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity transition-normal" />

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex-1">
          <p className="text-muted text-sm font-medium uppercase tracking-wider mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-primary group-hover:brand-primary transition-colors transition-normal">
            {value}
          </p>
        </div>
        <div className="relative ml-4">
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              "surface-elevated border border-secondary",
              "group-hover:bg-gradient-brand group-hover:border-brand",
              "transition-all transition-normal transform group-hover:scale-110"
            )}
          >
            <Icon
              className={cn(
                "w-6 h-6 transition-all transition-normal",
                color,
                "group-hover:text-white"
              )}
            />
          </div>
          {/* Icon glow effect */}
          <div className="absolute -inset-1 bg-gradient-glass rounded-xl blur opacity-0 group-hover:opacity-100 transition-all transition-normal" />
        </div>
      </div>
    </div>
  );
}

function UserManagementSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="glass-surface border border-subtle rounded-xl p-6">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <div>
            <Skeleton className="w-48 h-6 mb-2" />
            <Skeleton className="w-80 h-4" />
          </div>
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="glass-surface border border-subtle rounded-xl p-6"
            style={{
              animation: `slideInLeft 0.5s ease-out ${i * 0.1}s both`,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Skeleton className="w-20 h-4 mb-2" />
                <Skeleton className="w-12 h-8" />
              </div>
              <Skeleton className="w-12 h-12 rounded-xl" />
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filters Skeleton */}
      <div className="glass-surface border border-subtle rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="w-5 h-5" />
          <Skeleton className="w-40 h-5" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="flex-1 h-12" />
          <Skeleton className="w-[140px] h-12" />
          <Skeleton className="w-[100px] h-12" />
          <Skeleton className="w-20 h-12" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="glass-surface border border-subtle rounded-xl overflow-hidden">
        <div className="surface-secondary border-b border-subtle px-6 py-4">
          <div className="flex items-center gap-2">
            <Skeleton className="w-5 h-5" />
            <Skeleton className="w-32 h-5" />
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 surface-elevated rounded-lg"
                style={{
                  animation: `slideInLeft 0.5s ease-out ${i * 0.05}s both`,
                }}
              >
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="w-48 h-4 mb-2" />
                  <Skeleton className="w-32 h-3" />
                </div>
                <Skeleton className="w-48 h-4" />
                <Skeleton className="w-16 h-6 rounded-full" />
                <Skeleton className="w-20 h-4" />
                <Skeleton className="w-20 h-4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
