import "dotenv/config";
import { createSuperClient } from "@/lib/supabase/superClient";
import fs from "fs";
import path from "path";

const supabase = createSuperClient();
const userId = process.env.TEST_USER_ID;
if (!userId) throw new Error("Please set TEST_USER_ID in your .env file.");

const flashcardsPath = path.resolve(
  __dirname,
  "../app/(main)/projects/components/testflashcards.json"
);
const flashcards: Array<{ front: string; back: string }> = JSON.parse(
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
    front: fc.front,
    back: fc.back,
    extra: {}, // empty object for extra field (jsonb)
    created_at: now,
    updated_at: now,
  }));

  const { data: insertedFlashcards, error: flashcardError } = await supabase
    .from("flashcards")
    .insert(flashcardRows)
    .select();

  if (flashcardError || !insertedFlashcards) {
    console.error("Error inserting flashcards:", flashcardError);
    return;
  }
  console.log(`Inserted ${flashcardRows.length} flashcards for project.`);

  // Create SRS states for all new flashcards (this was missing!)
  console.log("Creating SRS states for flashcards...");
  const srsStatesToInsert = insertedFlashcards.map((flashcard) => ({
    user_id: userId,
    project_id: project.id,
    card_id: flashcard.id,
    interval: 1, // Ensure constraint compliance
    ease: 2.5,
    due: now, // New cards are immediately available
    last_reviewed: now,
    repetitions: 0,
    state: "new",
    lapses: 0,
    learning_step: 0,
    is_leech: false,
    is_suspended: false,
  }));

  const { error: srsError } = await supabase
    .from("srs_states")
    .insert(srsStatesToInsert);

  if (srsError) {
    console.error("Error creating SRS states:", srsError);
    return;
  }
  console.log(`Created SRS states for ${insertedFlashcards.length} flashcards.`);
}

main();

// To run this script:
// pnpm exec tsx scripts/createTestProject.ts
