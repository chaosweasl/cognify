"use client";

import { useUserProfile } from "@/hooks/useUserProfile";
import { useProjectsStore } from "@/hooks/useProjects";
import Image from "next/image";
import { 
  Sparkles, 
  User, 
  BookOpen, 
  TrendingUp, 
  Clock, 
  Target,
  FolderOpen,
  Star,
  Plus,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { projects, loadProjects } = useProjectsStore();
  const router = useRouter();

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Calculate stats
  const totalProjects = projects.length;
  const totalCards = projects.reduce((sum, project) => sum + (project.stats?.totalFlashcards || 0), 0);
  const dueCards = projects.reduce((sum, project) => sum + (project.stats?.dueCards || 0), 0);
  const activeProjects = projects.filter(project => (project.stats?.totalFlashcards || 0) > 0).length;

  return (
    <div className="flex-1 min-h-screen relative overflow-hidden">
      {/* Enhanced animated background elements matching projects page */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-15">
        <div
          className="absolute top-0 right-0 w-96 h-96 bg-gradient-glass rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-r from-brand-secondary/30 to-brand-accent/30 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "12s", animationDelay: "4s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-primary/20 rounded-full blur-2xl animate-pulse"
          style={{ animationDuration: "10s", animationDelay: "2s" }}
        />
      </div>

      {/* Enhanced subtle grid pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-8">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, var(--color-border-subtle) 1px, transparent 0)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <main className="relative z-10 flex-1 px-4 sm:px-6 lg:px-8 py-8 md:py-12 transition-all">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Card */}
          <div className="relative mb-8">
            {/* Animated background elements */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <div
                className="absolute top-0 left-1/4 w-32 h-32 bg-gradient-glass rounded-full blur-3xl animate-pulse"
                style={{ animationDuration: "8s" }}
              />
              <div
                className="absolute bottom-0 right-1/4 w-24 h-24 bg-gradient-to-r from-brand-secondary/30 to-brand-accent/30 rounded-full blur-2xl animate-pulse"
                style={{ animationDuration: "12s", animationDelay: "4s" }}
              />
            </div>

            <div className="relative z-10 surface-elevated glass-surface border border-subtle rounded-3xl p-8 shadow-brand group">
              {/* Card glow effect */}
              <div className="absolute -inset-0.5 bg-gradient-glass rounded-3xl blur opacity-0 group-hover:opacity-100 transition-all transition-slow" />

              <div className="relative flex flex-col lg:flex-row items-center gap-8">
                <div className="text-center lg:text-left flex-1">
                  <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-brand rounded-2xl flex items-center justify-center shadow-brand">
                      <Sparkles className="w-6 h-6 text-white animate-pulse" />
                    </div>
                    <h1 className="text-4xl font-bold text-primary">
                      Welcome to Cognify
                    </h1>
                  </div>
                  
                  <p className="text-secondary text-xl mb-6 leading-relaxed">
                    Ready to supercharge your learning? Let&apos;s see what you&apos;ve been working on.
                  </p>

                  {totalProjects === 0 ? (
                    <Button
                      onClick={() => router.push("/projects/create")}
                      className="bg-gradient-brand hover:bg-gradient-brand-hover text-white shadow-brand hover:shadow-brand-lg transform hover:scale-105 transition-all duration-slower px-8 py-4 rounded-2xl text-lg font-bold group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-white/20 translate-x-full group-hover:translate-x-0 transition-transform duration-slow skew-x-12" />
                      <div className="relative z-10 flex items-center gap-3">
                        <Plus className="w-6 h-6" />
                        <span>Create Your First Project</span>
                        <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Button>
                  ) : (
                    <div className="flex flex-wrap gap-4">
                      <Button
                        onClick={() => router.push("/projects")}
                        className="bg-gradient-brand hover:bg-gradient-brand-hover text-white shadow-brand hover:shadow-brand-lg transform hover:scale-105 transition-all duration-slower px-6 py-3 rounded-xl group"
                      >
                        <div className="flex items-center gap-2">
                          <FolderOpen className="w-5 h-5" />
                          <span>View Projects</span>
                          <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                        </div>
                      </Button>
                      
                      {dueCards > 0 && (
                        <Button
                          onClick={() => router.push("/projects")}
                          variant="outline"
                          className="border-brand text-brand-primary hover:bg-gradient-brand hover:text-white transform hover:scale-105 transition-all duration-slower px-6 py-3 rounded-xl group relative overflow-hidden"
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            <span>Study Now ({dueCards})</span>
                          </div>
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* User Profile Section */}
                <div className="flex-shrink-0">
                  <UserProfileDisplay />
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          {totalProjects > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="relative overflow-hidden rounded-2xl glass-surface border border-subtle shadow-brand backdrop-blur group">
                <div className="absolute -inset-0.5 bg-gradient-glass rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all transition-slow" />
                <div className="relative p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-brand rounded-2xl flex items-center justify-center shadow-brand">
                      <FolderOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-primary">{totalProjects}</div>
                      <div className="text-secondary text-sm">Projects</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl glass-surface border border-subtle shadow-brand backdrop-blur group">
                <div className="absolute -inset-0.5 bg-gradient-glass rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all transition-slow" />
                <div className="relative p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-brand-secondary to-brand-accent rounded-2xl flex items-center justify-center shadow-brand">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-primary">{totalCards}</div>
                      <div className="text-secondary text-sm">Total Cards</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl glass-surface border border-subtle shadow-brand backdrop-blur group">
                <div className="absolute -inset-0.5 bg-gradient-glass rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all transition-slow" />
                <div className="relative p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-brand-tertiary to-green-400 rounded-2xl flex items-center justify-center shadow-brand">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-primary">{activeProjects}</div>
                      <div className="text-secondary text-sm">Active</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl glass-surface border border-subtle shadow-brand backdrop-blur group">
                <div className="absolute -inset-0.5 bg-gradient-glass rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all transition-slow" />
                <div className="relative p-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-brand ${
                      dueCards > 0 ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                    }`}>
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-primary">{dueCards}</div>
                      <div className="text-secondary text-sm">Due Today</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Projects */}
          {projects.length > 0 && (
            <div className="relative overflow-hidden rounded-3xl glass-surface border border-subtle shadow-brand-lg backdrop-blur group">
              <div className="absolute -inset-0.5 bg-gradient-glass rounded-3xl blur opacity-0 group-hover:opacity-100 transition-all transition-slow" />
              
              <div className="relative p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-brand rounded-2xl flex items-center justify-center shadow-brand">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-primary">Recent Projects</h2>
                      <p className="text-secondary">Continue your learning journey</p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => router.push("/projects")}
                    variant="outline"
                    className="border-brand text-brand-primary hover:bg-gradient-brand hover:text-white transform hover:scale-105 transition-all duration-slower"
                  >
                    View All
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.slice(0, 6).map((project, index) => (
                    <div
                      key={project.id}
                      className="relative overflow-hidden rounded-2xl surface-elevated border border-subtle hover:shadow-brand hover:scale-[1.02] transition-all duration-slower cursor-pointer group"
                      onClick={() => router.push(`/projects/${project.id}`)}
                      style={{
                        animation: `slideInUp 0.6s ease-out ${index * 0.1}s both`,
                      }}
                    >
                      <div className="absolute -inset-0.5 bg-gradient-glass rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all transition-slow" />
                      
                      <div className="relative p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-primary group-hover:text-brand-primary transition-colors mb-2">
                              {project.name}
                            </h3>
                            {project.description && (
                              <p className="text-muted text-sm mb-3 overflow-hidden">
                                {project.description.length > 60 
                                  ? project.description.slice(0, 60) + '...' 
                                  : project.description
                                }
                              </p>
                            )}
                          </div>
                          
                          <div className="w-3 h-3 rounded-full bg-gradient-brand animate-pulse" />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1 text-muted">
                              <BookOpen className="w-4 h-4" />
                              <span>{project.stats?.totalFlashcards || 0}</span>
                            </div>
                            
                            {(project.stats?.dueCards || 0) > 0 && (
                              <Badge className="bg-brand-primary/10 text-brand-primary border-brand-primary/30 animate-pulse">
                                {project.stats?.dueCards} due
                              </Badge>
                            )}
                          </div>
                          
                          <ArrowRight className="w-4 h-4 text-muted group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Enhanced User Profile Display
function UserProfileDisplay() {
  const { userProfile, isLoading } = useUserProfile();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center">
        <div className="w-20 h-20 rounded-full surface-secondary animate-pulse mb-4" />
        <div className="h-4 w-24 surface-secondary rounded animate-pulse mb-2" />
        <div className="h-3 w-32 surface-secondary rounded animate-pulse" />
      </div>
    );
  }

  if (!userProfile) return null;

  return (
    <div className="flex flex-col items-center text-center p-6 surface-elevated rounded-2xl border border-subtle shadow-brand">
      <div className="relative mb-4">
        {userProfile.avatar_url ? (
          <Image
            src={userProfile.avatar_url}
            alt="Avatar"
            width={80}
            height={80}
            className="w-20 h-20 rounded-full object-cover border-4 border-brand-primary/40 shadow-brand"
            priority
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gradient-brand flex items-center justify-center border-4 border-brand-primary/40 shadow-brand">
            <User className="w-10 h-10 text-white" />
          </div>
        )}
        
        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-brand rounded-full flex items-center justify-center border-2 border-surface-primary">
          <Star className="w-4 h-4 text-white" />
        </div>
      </div>
      
      <div className="font-bold text-xl text-primary mb-1">
        {userProfile.display_name || "Anonymous User"}
      </div>
      
      {userProfile.bio && (
        <div className="text-secondary text-sm mb-3 max-w-40">
          {userProfile.bio}
        </div>
      )}
      
      <div className="text-muted text-xs">
        {userProfile.email}
      </div>
    </div>
  );
}
