export async function getSRSStates(userId: string, projectId: string) {
  console.log(
    `[API] getSRSStates for userId: ${userId}, projectId: ${projectId}`
  );
  const res = await fetch(
    `/api/srs/states?userId=${encodeURIComponent(
      userId
    )}&projectId=${encodeURIComponent(projectId)}`,
    { cache: "no-store" }
  );
  if (!res.ok) {
    throw new Error("Failed to fetch SRS states");
  }
  return res.json();
}

export async function upsertSRSState(state: {
  user_id: string;
  project_id: string;
  card_id: string;
  card_interval: number;
  ease: number;
  due: string;
  last_reviewed: string;
  repetitions: number;
}) {
  console.log(
    `[API] upsertSRSState for userId: ${state.user_id}, projectId: ${state.project_id}, cardId: ${state.card_id}`
  );
  const res = await fetch(`/api/srs/upsert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state }),
  });
  if (!res.ok) {
    throw new Error("Failed to upsert SRS state");
  }
  return res.json();
}

export async function getDueSRSProjects(userId: string) {
  console.log(`[API] getDueSRSProjects for userId: ${userId}`);
  const res = await fetch(
    `/api/srs/due-projects?userId=${encodeURIComponent(userId)}`,
    { cache: "no-store" }
  );
  if (!res.ok) {
    throw new Error("Failed to fetch due SRS projects");
  }
  return res.json();
}
