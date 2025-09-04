import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import pdf from "pdf-parse";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_TEXT_LENGTH = 500000; // 500k characters to prevent extremely large extractions

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const projectId = formData.get("projectId") as string;

    if (!file || !projectId) {
      return NextResponse.json(
        { error: "File and projectId are required" },
        { status: 400 }
      );
    }

    // Validate file
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are supported" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File size must be less than ${
            MAX_FILE_SIZE / (1024 * 1024)
          }MB`,
        },
        { status: 400 }
      );
    }

    // Verify project ownership
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 }
      );
    }

    // Extract text from PDF
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    let extractedData;
    try {
      extractedData = await pdf(uint8Array, {
        // PDF parsing options
        max: 0, // No page limit
        version: "v1.10.100",
      });
    } catch (pdfError) {
      console.error("PDF parsing error:", pdfError);
      return NextResponse.json(
        {
          error:
            "Failed to parse PDF. The file may be corrupted or password-protected.",
        },
        { status: 400 }
      );
    }

    let text = extractedData.text;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        {
          error:
            "No text could be extracted from the PDF. The file may contain only images or be corrupted.",
        },
        { status: 400 }
      );
    }

    // Clean and preprocess text
    text = cleanExtractedText(text);

    // Limit text length to prevent excessive processing
    if (text.length > MAX_TEXT_LENGTH) {
      text =
        text.substring(0, MAX_TEXT_LENGTH) +
        "\n\n[Text truncated due to length limit]";
    }

    return NextResponse.json({
      text,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        pages: extractedData.numpages,
        textLength: text.length,
        extractedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("PDF extraction error:", error);
    return NextResponse.json(
      { error: "Failed to extract text from PDF" },
      { status: 500 }
    );
  }
}

function cleanExtractedText(text: string): string {
  // Remove excessive whitespace and clean up formatting
  return (
    text
      // Normalize line breaks
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      // Remove excessive blank lines (more than 2 consecutive newlines)
      .replace(/\n{3,}/g, "\n\n")
      // Remove leading/trailing whitespace from lines
      .split("\n")
      .map((line) => line.trim())
      .join("\n")
      // Remove excessive spaces
      .replace(/  +/g, " ")
      // Clean up special characters that might interfere with AI processing
      .replace(/[^\w\s\-.,;:!?()\[\]{}'"@#$%&*+=<>/|\\]/g, " ")
      // Final cleanup
      .trim()
  );
}
