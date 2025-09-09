import { getProjectById } from "../../actions";
import { notFound } from "next/navigation";
import { getCheatsheetsByProjectId } from "../../actions/cheatsheet-actions";
import CheatsheetViewer from "@/src/components/cheatsheets/CheatsheetViewer";

export default async function ProjectCheatsheetsPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  const project = await getProjectById(id);
  if (!project) {
    return notFound();
  }

  // Load cheatsheets for this project
  const cheatsheets = await getCheatsheetsByProjectId(id);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Cheatsheets - {project.name}
        </h1>
        <p className="text-muted-foreground">
          View and manage cheatsheets for this project
        </p>
      </div>

      <CheatsheetViewer projectId={id} initialCheatsheets={cheatsheets} />
    </div>
  );
}
