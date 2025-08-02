import "dotenv/config";
import { createSuperClient } from "@/utils/supabase/superClient";
import fs from "fs";
import path from "path";

const supabase = createSuperClient();
const userId = process.env.TEST_USER_ID;
if (!userId) throw new Error("Please set TEST_USER_ID in your .env file.");

const flashcardsPath = path.resolve(
  __dirname,
  "../app/(main)/projects/components/testflashcards.json"
);
const flashcards: Array<{ question: string; answer: string }> = JSON.parse(
  fs.readFileSync(flashcardsPath, "utf8")
);

async function main() {
  if (!supabase)
    throw new Error(
      "SuperClient could not be created. Check your env variables."
    );

  // Create the project
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      user_id: userId,
      name: "Test Project",
      description: "A test project created by script with sample flashcards.",
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (projectError || !project) {
    console.error("Error creating project:", projectError);
    return;
  }
  console.log("Created project:", project);

  // Insert flashcards using new schema
  // Schema: flashcards (id, project_id, front, back, extra, created_at, updated_at)
  const now = new Date().toISOString();
  const flashcardRows = flashcards.map((fc) => ({
    project_id: project.id,
    front: fc.question,
    back: fc.answer,
    extra: {}, // empty object for extra field (jsonb)
    created_at: now,
    updated_at: now,
  }));

  const { error: flashcardError } = await supabase
    .from("flashcards")
    .insert(flashcardRows, { count: "exact" });

  if (flashcardError) {
    console.error("Error inserting flashcards:", flashcardError);
    return;
  }
  console.log(`Inserted ${flashcardRows.length} flashcards for project.`);
}

main();

// To run this script:
// pnpm exec tsx scripts/createTestProject.ts
