import { Skeleton } from "@/components/ui/skeleton";

export function ProjectCardSkeleton() {
  return (
    <div
      className="glass-surface rounded-xl card-padding-md space-y-4 animate-pulse"
      role="status"
      aria-label="Loading project card"
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-8 rounded touch-target" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
      <div className="pt-2">
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
      <div className="flex gap-2 pt-4">
        <Skeleton className="btn-md w-20 rounded-md" />
        <Skeleton className="btn-md w-24 rounded-md" />
      </div>
      <span className="sr-only">Loading project information...</span>
    </div>
  );
}

export function ProjectGridSkeleton({ count = 6 }: { count?: number } = {}) {
  return (
    <div className="project-grid" role="status" aria-label="Loading projects">
      {Array.from({ length: count }, (_, i) => (
        <ProjectCardSkeleton key={i} />
      ))}
      <span className="sr-only">Loading {count} project cards...</span>
    </div>
  );
}

export function StudyCardSkeleton() {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>

      {/* Progress Bar */}
      <Skeleton className="h-2 w-full rounded-full" />

      {/* Main Card */}
      <div className="glass-surface rounded-2xl p-8 space-y-4">
        <Skeleton className="h-4 w-20 mx-auto" />
        <div className="space-y-3 min-h-[200px] flex flex-col justify-center">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-5/6" />
          <Skeleton className="h-6 w-4/5" />
          <Skeleton className="h-6 w-3/4" />
        </div>
      </div>

      {/* Rating Buttons */}
      <div className="flex justify-center space-x-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-col items-center space-y-2">
            <Skeleton className="h-12 w-20 rounded-lg" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="container mx-auto p-4 space-y-8">
      {/* Welcome Card */}
      <div className="glass-surface rounded-2xl p-8 space-y-4">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
        <Skeleton className="h-12 w-64 mx-auto mb-4" />
        <Skeleton className="h-6 w-48 mx-auto" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-surface rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>

      {/* Recent Projects */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
        <ProjectGridSkeleton />
      </div>
    </div>
  );
}

export function SettingsPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-14 w-14 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-5 w-64" />
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="surface-elevated rounded-2xl p-4 space-y-3">
            <Skeleton className="h-12 w-12 rounded-xl mx-auto" />
            <Skeleton className="h-5 w-20 mx-auto" />
          </div>
        ))}
      </div>

      {/* Content Area */}
      <div className="glass-surface rounded-3xl p-6 lg:p-8 space-y-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Skeleton className="h-32 w-32 rounded-xl mx-auto" />
              <div className="space-y-4">
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <div className="grid grid-cols-3 gap-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-20 rounded-lg" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FlashcardEditorSkeleton() {
  return (
    <div className="container mx-auto p-4 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-16 rounded-md" />
        </div>
      </div>

      {/* Project Info */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>

      {/* Flashcards List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>

        {[...Array(5)].map((_, i) => (
          <div key={i} className="glass-surface rounded-xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                <div>
                  <Skeleton className="h-4 w-12 mb-2" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-3/4" />
                </div>
                <div>
                  <Skeleton className="h-4 w-12 mb-2" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-5/6" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function NavigationSkeleton() {
  return (
    <div className="w-64 border-r border-subtle surface-secondary p-4 space-y-6">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-6 w-24" />
      </div>

      {/* Search */}
      <Skeleton className="h-10 w-full rounded-lg" />

      {/* Navigation Items */}
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>

      {/* Projects Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-4 w-4" />
        </div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
