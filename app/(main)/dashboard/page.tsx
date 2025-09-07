"use client";

import { useUserProfile } from "@/hooks/useUserProfile";
import { useProjectsStore } from "@/hooks/useProjects";
import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Sparkles,
  User,
  FolderOpen,
  BookOpen,
  TrendingUp,
  Settings,
  Plus,
  Clock,
  Brain,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const { projects, loadProjects } = useProjectsStore();
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalCards: 0,
    todayStudied: 0,
    dueCards: 0,
  });

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (projects && projects.length > 0) {
      const totalCards = projects.reduce(
        (sum, p) => sum + (p.flashcardCount || 0),
        0
      );
      setStats({
        totalProjects: projects.length,
        totalCards,
        todayStudied: 0, // This would come from study sessions in a real implementation
        dueCards: 0, // This would come from SRS calculations
      });
    }
  }, [projects]);

  return (
    <div className="min-h-screen surface-primary relative">
      <div className="container mx-auto p-4 sm:p-8 relative z-10">
        {/* Welcome Section */}
        <div className="glass-surface shadow-brand-lg rounded-xl overflow-hidden mb-8 border border-subtle">
          <div className="surface-elevated border-b border-subtle px-4 py-4 sm:px-6">
            <div className="flex items-center justify-center gap-3">
              <div className="text-primary flex items-center space-x-2">
                <Sparkles className="w-5 h-5 brand-secondary animate-pulse" />
                <span className="text-lg sm:text-xl font-semibold">
                  Welcome to Cognify
                </span>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-6 text-center">
            <div className="max-w-md mx-auto">
              <h1 className="text-2xl sm:text-4xl font-bold text-primary mb-5">
                Dashboard
              </h1>
              <UserProfileInline />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass-surface shadow-brand border border-subtle hover:border-brand transition-all transition-normal">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-secondary">
                Projects
              </CardTitle>
              <FolderOpen className="h-4 w-4 brand-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {stats.totalProjects}
              </div>
              <p className="text-xs text-muted">Total projects created</p>
            </CardContent>
          </Card>

          <Card className="glass-surface shadow-brand border border-subtle hover:border-brand transition-all transition-normal">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-secondary">
                Flashcards
              </CardTitle>
              <BookOpen className="h-4 w-4 brand-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {stats.totalCards}
              </div>
              <p className="text-xs text-muted">Total flashcards</p>
            </CardContent>
          </Card>

          <Card className="glass-surface shadow-brand border border-subtle hover:border-brand transition-all transition-normal">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-secondary">
                Studied Today
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-status-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {stats.todayStudied}
              </div>
              <p className="text-xs text-muted">Cards reviewed today</p>
            </CardContent>
          </Card>

          <Card className="glass-surface shadow-brand border border-subtle hover:border-brand transition-all transition-normal">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-secondary">
                Due Cards
              </CardTitle>
              <Clock className="h-4 w-4 text-status-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {stats.dueCards}
              </div>
              <p className="text-xs text-muted">Cards due for review</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions Card */}
          <Card className="glass-surface shadow-brand border border-subtle">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <Brain className="h-5 w-5 brand-secondary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/projects" className="block">
                <Button className="w-full bg-gradient-brand hover:bg-gradient-brand-hover text-white justify-start shadow-brand transition-all transition-normal">
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Manage Projects
                </Button>
              </Link>

              {projects && projects.length > 0 && (
                <Link
                  href={`/projects/${projects[0].id}/study`}
                  className="block"
                >
                  <Button className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white justify-start shadow-brand transition-all transition-normal">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Start Studying
                  </Button>
                </Link>
              )}

              <Link href="/settings" className="block">
                <Button
                  variant="outline"
                  className="w-full border-subtle text-secondary hover:surface-elevated hover:text-primary hover:border-brand justify-start transition-all transition-normal"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings & AI Config
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Projects */}
          <Card className="glass-surface shadow-brand border border-subtle">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 brand-primary" />
                  Recent Projects
                </div>
                <Link href="/projects">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted hover:text-primary transition-colors transition-normal"
                  >
                    View All
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!projects || projects.length === 0 ? (
                <div className="text-center py-8 text-muted">
                  <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-4">No projects yet</p>
                  <Link href="/projects">
                    <Button className="bg-gradient-brand hover:bg-gradient-brand-hover text-white shadow-brand transition-all transition-normal">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Project
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.slice(0, 5).map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-3 rounded-lg surface-elevated border border-subtle hover:border-brand transition-all transition-normal"
                    >
                      <div>
                        <Link
                          href={`/projects/${project.id}`}
                          className="font-medium text-primary hover:brand-primary transition-colors transition-normal"
                        >
                          {project.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="secondary"
                            className="text-xs surface-secondary text-secondary"
                          >
                            {project.flashcardCount || 0} cards
                          </Badge>
                          <span className="text-xs text-muted">
                            {new Date(project.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Link href={`/projects/${project.id}/study`}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-brand-primary hover:brand-primary hover:surface-elevated transition-all transition-normal"
                        >
                          Study
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Inline UserProfileDisplay logic as a local component
function UserProfileInline() {
  const { userProfile } = useUserProfile();
  if (!userProfile) return null;
  return (
    <div className="flex flex-col items-center">
      {userProfile.avatar_url ? (
        <Image
          src={userProfile.avatar_url}
          alt="Avatar"
          width={64}
          height={64}
          className="w-16 h-16 rounded-full mb-4 object-cover border-2 border-brand-primary/40 shadow-brand transition-all transition-normal hover:border-brand-primary/60"
          priority
        />
      ) : (
        <div className="w-16 h-16 rounded-full mb-4 bg-gradient-brand flex items-center justify-center border-2 border-brand-primary/40 shadow-brand transition-all transition-normal hover:border-brand-primary/60">
          <User className="w-8 h-8 text-white" />
        </div>
      )}
      <div className="font-bold text-lg text-primary">
        {userProfile.display_name || "No name"}
      </div>
      <div className="text-secondary text-sm mb-4">
        {userProfile.bio || "No bio"}
      </div>
      <p className="py-4 text-primary">
        Hello{" "}
        <span className="font-semibold brand-primary">
          {userProfile.email || "No email"}
        </span>
        !
      </p>
    </div>
  );
}
