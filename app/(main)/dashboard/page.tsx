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
    <div className="min-h-screen relative">
      <div className="container mx-auto p-4 sm:p-8 relative z-10">
        {/* Welcome Section */}
        <div className="bg-slate-800/40 border border-slate-600 backdrop-blur-sm hover:bg-slate-800/50 transition-all duration-500 shadow-2xl rounded-lg overflow-hidden mb-8">
          <div className="bg-slate-700/30 border-b border-slate-600 px-4 py-4 sm:px-6">
            <div className="flex items-center justify-center gap-3">
              <div className="text-slate-100 flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-violet-400 animate-pulse" />
                <span className="text-lg sm:text-xl font-semibold">
                  Welcome to Cognify
                </span>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-6 text-center">
            <div className="max-w-md mx-auto">
              <h1 className="text-2xl sm:text-4xl font-bold text-white mb-5">
                Dashboard
              </h1>
              <UserProfileInline />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/40 border-slate-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                Projects
              </CardTitle>
              <FolderOpen className="h-4 w-4 text-violet-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.totalProjects}
              </div>
              <p className="text-xs text-slate-400">Total projects created</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/40 border-slate-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                Flashcards
              </CardTitle>
              <BookOpen className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.totalCards}
              </div>
              <p className="text-xs text-slate-400">Total flashcards</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/40 border-slate-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                Studied Today
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.todayStudied}
              </div>
              <p className="text-xs text-slate-400">Cards reviewed today</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/40 border-slate-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                Due Cards
              </CardTitle>
              <Clock className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.dueCards}
              </div>
              <p className="text-xs text-slate-400">Cards due for review</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions Card */}
          <Card className="bg-slate-800/40 border-slate-600">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Brain className="h-5 w-5 text-violet-400" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/projects" className="block">
                <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white justify-start">
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Manage Projects
                </Button>
              </Link>

              {projects && projects.length > 0 && (
                <Link
                  href={`/projects/${projects[0].id}/study`}
                  className="block"
                >
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white justify-start">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Start Studying
                  </Button>
                </Link>
              )}

              <Link href="/settings" className="block">
                <Button
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 justify-start"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings & AI Config
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Projects */}
          <Card className="bg-slate-800/40 border-slate-600">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-400" />
                  Recent Projects
                </div>
                <Link href="/projects">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-white"
                  >
                    View All
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!projects || projects.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-4">No projects yet</p>
                  <Link href="/projects">
                    <Button className="bg-violet-600 hover:bg-violet-700 text-white">
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
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30 border border-slate-600"
                    >
                      <div>
                        <Link
                          href={`/projects/${project.id}`}
                          className="font-medium text-white hover:text-violet-300 transition-colors"
                        >
                          {project.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {project.flashcardCount || 0} cards
                          </Badge>
                          <span className="text-xs text-slate-400">
                            {new Date(project.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Link href={`/projects/${project.id}/study`}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-blue-400 hover:text-blue-300"
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
          className="w-16 h-16 rounded-full mb-4 object-cover border-2 border-blue-400/40"
          priority
        />
      ) : (
        <div className="w-16 h-16 rounded-full mb-4 bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center border-2 border-blue-400/40">
          <User className="w-8 h-8 text-white" />
        </div>
      )}
      <div className="font-bold text-lg text-blue-300">
        {userProfile.display_name || "No name"}
      </div>
      <div className="text-slate-300 text-sm mb-4">
        {userProfile.bio || "No bio"}
      </div>
      <p className="py-4 text-slate-200">
        Hello{" "}
        <span className="font-semibold text-violet-300">
          {userProfile.email || "No email"}
        </span>
        !
      </p>
    </div>
  );
}
