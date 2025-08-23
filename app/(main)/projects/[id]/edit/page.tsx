import { getProjectById } from "../../actions";
import { notFound } from "next/navigation";
import { FlashcardEditor } from "@/src/components/flashcards/FlashcardEditor";

export default async function ProjectEditPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  console.log(`[EditPage] Attempting to load project with ID: ${id}`);

  const project = await getProjectById(id);

  console.log(`[EditPage] getProjectById returned:`, project);

  if (!project) {
    console.log(
      `[EditPage] Project not found, calling notFound() for ID: ${id}`
    );
    return notFound();
  }

  // Normalize project for type compatibility
  const { normalizeProject } = await import("@/lib/utils/normalizeProject");
  const normalizedProject = normalizeProject(project);

  console.log(`[EditPage] Normalized project:`, normalizedProject);

  return (
    <main className="flex-1 min-h-screen overflow-auto">
      <FlashcardEditor project={normalizedProject} />
    </main>
  );
}
