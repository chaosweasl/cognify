"use client";

import { SidebarNav } from "@/app/(main)/components/SidebarNav";
import { useRouter, usePathname } from "next/navigation";

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // Hide sidebar on create page for full immersion
  const isCreatePage = pathname?.includes("/create");

  const handleTab = (tab: "all" | "create") => {
    if (tab === "all") {
      router.push("/projects");
    } else if (tab === "create") {
      router.push("/projects/create");
    }
  };

  return (
    <div className="flex flex-1">
      {!isCreatePage && <SidebarNav activeTab="all" onTab={handleTab} />}
      <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
    </div>
  );
}
