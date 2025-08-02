"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "../actions";

export default function CreateProjectPage() {
  const router = useRouter();
  useEffect(() => {
    async function createAndRedirect() {
      const id = await createProject({
        name: "Untitled Project",
        description: "",
      });
      if (id) router.push(`/projects/${id}/edit`);
    }
    createAndRedirect();
  }, [router]);
  return null;
}
