import { getProjectById } from "../../actions";
import { getFlashcardsByProjectId } from "../../actions/flashcard-actions";
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

  // Fetch flashcards for this project
  const flashcards = await getFlashcardsByProjectId(id);

  return (
    <main className="flex-1 min-h-screen overflow-auto">
      <FlashcardEditor project={project} initialFlashcards={flashcards} />
    </main>
  );
}
