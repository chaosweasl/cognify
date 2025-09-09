import { getProjectById } from "../../actions";
import { notFound } from "next/navigation";
import { getQuizzesByProjectId } from "../../actions/quiz-actions";
import QuizViewer from "@/src/components/quizzes/QuizViewer";

export default async function ProjectQuizzesPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  const project = await getProjectById(id);
  if (!project) {
    return notFound();
  }

  // Load quizzes for this project
  const quizzes = await getQuizzesByProjectId(id);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Quizzes - {project.name}
        </h1>
        <p className="text-muted-foreground">
          View and manage quizzes for this project
        </p>
      </div>

      <QuizViewer projectId={id} initialQuizzes={quizzes} />
    </div>
  );
}
