"use client";

import { SidebarNav } from "@/app/(main)/components/SidebarNav";
import { useRouter } from "next/navigation";

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleTab = (tab: "all" | "create") => {
    if (tab === "all") {
      router.push("/projects");
    } else if (tab === "create") {
      router.push("/projects/create");
    }
  };

  return (
    <div className="flex flex-1">
      <SidebarNav activeTab="all" onTab={handleTab} />
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
