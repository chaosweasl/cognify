"use client";

import { SidebarNav } from "./components/SidebarNav";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { createProject } from "./components/../actions";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useProjectsStore } from "@/hooks/useProjects";
import { useEffect } from "react";

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { userProfile } = useUserProfile();
  const { loadProjects } = useProjectsStore();

  useEffect(() => {
    // Load projects when user profile is available
    if (userProfile) {
      loadProjects();
    }
  }, [userProfile, loadProjects]);

  const handleTab = async (tab: "all" | "create") => {
    if (tab === "all") {
      router.push("/projects");
    } else if (tab === "create") {
      startTransition(async () => {
        const id = await createProject({
          name: "Untitled Project",
          description: "",
        });
        if (id) router.push(`/projects/${id}/edit`);
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-base-100">
      <SidebarNav activeTab="all" onTab={handleTab} />
      <div className="flex-1 flex flex-col min-h-screen md:ml-64 md:p-0">
        {children}
      </div>
    </div>
  );
}
