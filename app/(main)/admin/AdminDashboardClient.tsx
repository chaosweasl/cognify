/**
 * Admin Dashboard Client Component
 * Client-side admin dashboard with analytics and monitoring
 */

"use client";

import React, { useState } from "react";
import {
  Shield,
  BarChart3,
  AlertTriangle,
  Activity,
  Users,
  Settings,
  Database,
  Megaphone,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalyticsDashboard } from "@/src/components/analytics/AnalyticsDashboard";
import { SystemMonitoringDashboard } from "@/src/components/analytics/SystemMonitoringDashboard";
import { ErrorTrackingDashboard } from "@/src/components/analytics/ErrorTrackingDashboard";
import { UserManagement } from "@/src/components/admin/UserManagement";
import { ContentModeration } from "@/src/components/admin/ContentModeration";
import { AnnouncementManagement } from "@/src/components/admin/AnnouncementManagement";

export function AdminDashboardClient() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-brand-primary/10">
              <Shield className="w-8 h-8 text-brand-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-text-primary">
                Admin Dashboard
              </h1>
              <p className="text-text-muted">
                System monitoring, analytics, and management
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7 mb-8">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              Content
            </TabsTrigger>
            <TabsTrigger
              value="announcements"
              className="flex items-center gap-2"
            >
              <Megaphone className="w-4 h-4" />
              Announcements
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Monitoring
            </TabsTrigger>
            <TabsTrigger value="errors" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Errors
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <AdminOverview />
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          {/* Content Moderation Tab */}
          <TabsContent value="content">
            <ContentModeration />
          </TabsContent>

          {/* Announcement Management Tab */}
          <TabsContent value="announcements">
            <AnnouncementManagement />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring">
            <SystemMonitoringDashboard />
          </TabsContent>

          {/* Error Tracking Tab */}
          <TabsContent value="errors">
            <ErrorTrackingDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function AdminOverview() {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickStatCard
          title="System Status"
          value="Healthy"
          icon={Activity}
          color="text-success"
          bgColor="bg-green-50"
        />
        <QuickStatCard
          title="Active Users"
          value="Loading..."
          icon={Users}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <QuickStatCard
          title="Recent Errors"
          value="Loading..."
          icon={AlertTriangle}
          color="text-warning"
          bgColor="bg-yellow-50"
        />
        <QuickStatCard
          title="Performance"
          value="Good"
          icon={BarChart3}
          color="text-success"
          bgColor="bg-green-50"
        />
      </div>

      {/* Quick Actions */}
      <Card className="p-6 glass-surface border border-subtle">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="outline" className="h-16 flex-col">
            <Users className="w-5 h-5 mb-1" />
            User Management
          </Button>
          <Button variant="outline" className="h-16 flex-col">
            <Database className="w-5 h-5 mb-1" />
            Database Health
          </Button>
          <Button variant="outline" className="h-16 flex-col">
            <Settings className="w-5 h-5 mb-1" />
            System Settings
          </Button>
          <Button variant="outline" className="h-16 flex-col">
            <AlertTriangle className="w-5 h-5 mb-1" />
            View Errors
          </Button>
        </div>
      </Card>

      {/* System Information */}
      <Card className="p-6 glass-surface border border-subtle">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          System Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-text-primary mb-3">Application</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Version</span>
                <span className="text-text-primary">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Environment</span>
                <span className="text-text-primary">
                  {process.env.NODE_ENV === "development"
                    ? "Development"
                    : "Production"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Uptime</span>
                <span className="text-text-primary">
                  {typeof window !== "undefined"
                    ? Math.floor(performance.now() / 1000 / 60) + "m"
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-text-primary mb-3">Database</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Status</span>
                <span className="text-success">Connected</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Provider</span>
                <span className="text-text-primary">Supabase</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Last Backup</span>
                <span className="text-text-primary">Automated</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="p-6 glass-surface border border-subtle">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Recent Activity
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-muted">
            <div className="w-2 h-2 rounded-full bg-success"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">
                System health check completed
              </p>
              <p className="text-xs text-text-muted">2 minutes ago</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-muted">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">
                Analytics data updated
              </p>
              <p className="text-xs text-text-muted">5 minutes ago</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-muted">
            <div className="w-2 h-2 rounded-full bg-warning"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">
                Database cleanup task started
              </p>
              <p className="text-xs text-text-muted">1 hour ago</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function QuickStatCard({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}) {
  return (
    <Card className="p-6 glass-surface border border-subtle hover-lift transition-all duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-text-muted text-sm font-medium">{title}</p>
          <p className="text-xl font-bold text-text-primary mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
    </Card>
  );
}
