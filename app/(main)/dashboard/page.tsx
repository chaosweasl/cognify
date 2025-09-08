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
import { DashboardSkeleton } from "@/src/components/ui/skeleton-layouts";
import { Suspense } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const { projects, loadProjects, isLoadingProjects } = useProjectsStore();
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalCards: 0,
    todayStudied: 0,
    dueCards: 0,
  });
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    const init = async () => {
      await loadProjects();
      setIsInitialLoad(false);
    };
    init();
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

  // Show loading state on initial load
  if (isInitialLoad || isLoadingProjects) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen surface-primary relative">
      {/* Enhanced background elements */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-glass rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-br from-brand-secondary/20 to-brand-accent/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s", animationDuration: "6s" }}
        />
      </div>

      <div className="container mx-auto p-4 sm:p-8 relative z-10">
        {/* Enhanced Welcome Section */}
        <div
          className="glass-surface shadow-brand-lg rounded-2xl overflow-hidden mb-8 border border-subtle/50 backdrop-blur-xl relative group"
          style={{ animation: "slideInUp 0.6s ease-out" }}
        >
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-brand opacity-0 group-hover:opacity-5 transition-opacity duration-500"></div>

          <div className="bg-gradient-to-r from-surface-elevated/80 to-surface-secondary/60 backdrop-blur-sm border-b border-subtle px-6 py-5">
            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-brand rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div>
                  <span className="text-xl font-bold text-primary">
                    Welcome to Cognify
                  </span>
                  <div className="text-sm text-secondary">
                    Your AI-powered learning companion
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 text-center relative z-10">
            <div className="max-w-2xl mx-auto">
              <h1 className="text-3xl lg:text-4xl font-bold text-primary mb-4 leading-tight">
                Welcome to Your Learning Dashboard
              </h1>
              <p className="text-lg text-secondary mb-6">
                Track your progress and continue your learning journey
              </p>
              <UserProfileInline />
            </div>
          </div>
        </div>

        {/* Primary Action for New Users */}
        {stats.totalProjects === 0 && (
          <div className="mb-8">
            <Card className="glass-surface shadow-brand-lg border border-brand/20 bg-gradient-to-br from-brand-primary/5 to-brand-secondary/5">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-brand rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-primary mb-3">
                  Create Your First Project
                </h3>
                <p className="text-secondary mb-6 max-w-md mx-auto">
                  Start your learning journey by creating a project and adding
                  flashcards or uploading a PDF.
                </p>
                <Link href="/projects/create">
                  <Button
                    size="lg"
                    className="bg-gradient-brand hover:bg-gradient-brand-hover text-white text-lg px-8 py-4 h-auto"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Create Project
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Enhanced Stats Cards with staggered animation */}
        {stats.totalProjects > 0 && (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 card-grid"
            style={{ animation: "slideInUp 0.6s ease-out 0.2s both" }}
          >
            {[
              {
                title: "Projects",
                value: stats.totalProjects,
                description: "Total projects created",
                icon: FolderOpen,
                color: "brand-secondary",
                bgColor: "from-brand-secondary/10 to-brand-secondary/5",
              },
              {
                title: "Flashcards",
                value: stats.totalCards,
                description: "Total flashcards",
                icon: BookOpen,
                color: "brand-primary",
                bgColor: "from-brand-primary/10 to-brand-primary/5",
              },
              {
                title: "Studied Today",
                value: stats.todayStudied,
                description: "Cards reviewed today",
                icon: TrendingUp,
                color: "text-green-500",
                bgColor: "from-green-500/10 to-green-500/5",
              },
              {
                title: "Due Cards",
                value: stats.dueCards,
                description: "Cards due for review",
                icon: Clock,
                color: "text-amber-500",
                bgColor: "from-amber-500/10 to-amber-500/5",
              },
            ].map((stat, index) => (
              <Card
                key={stat.title}
                className="glass-surface shadow-brand border border-subtle hover:border-brand hover:shadow-brand-lg transition-all duration-300 group transform hover:scale-105 hover:-translate-y-2 relative overflow-hidden"
                style={{
                  animation: `slideInUp 0.6s ease-out ${
                    0.3 + index * 0.1
                  }s both`,
                }}
              >
                {/* Card gradient background */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                ></div>

                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                  <CardTitle className="text-sm font-semibold text-secondary group-hover:text-primary transition-colors duration-300">
                    {stat.title}
                  </CardTitle>
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.bgColor} flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}
                  >
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>

                <CardContent className="relative z-10">
                  <div className="text-3xl font-bold text-primary mb-2 group-hover:scale-105 transition-transform duration-300">
                    {stat.value.toLocaleString()}
                  </div>
                  <p className="text-sm text-muted group-hover:text-secondary transition-colors duration-300">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

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
                <Button className="w-full bg-gradient-brand hover:bg-gradient-brand-hover text-white justify-start shadow-brand transition-all transition-normal text-base py-3 h-auto">
                  <FolderOpen className="mr-3 h-5 w-5" />
                  View All Projects
                </Button>
              </Link>
              <Link href="/projects/create" className="block">
                <Button
                  className="w-full justify-start text-base py-3 h-auto"
                  variant="outline"
                >
                  <Plus className="mr-3 h-5 w-5" />
                  Create New Project
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
