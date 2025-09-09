import { getProjectById } from "../../../actions";
import { notFound } from "next/navigation";
import { getQuizById } from "../../../actions/quiz-actions";
import QuizTaking from "@/src/components/quizzes/QuizTaking";

export default async function TakeQuizPage(props: {
  params: Promise<{ id: string; quizId: string }>;
}) {
  const { id, quizId } = await props.params;

  const [project, quiz] = await Promise.all([
    getProjectById(id),
    getQuizById(quizId),
  ]);

  if (!project) {
    return notFound();
  }

  if (!quiz) {
    return notFound();
  }

  // Verify that the quiz belongs to this project
  if (quiz.project_id !== id) {
    return notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {quiz.title}
        </h1>
        <p className="text-muted-foreground">Project: {project.name}</p>
      </div>

      <QuizTaking quiz={quiz} projectId={id} />
    </div>
  );
}
