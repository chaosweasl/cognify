/**
 * Admin Content Moderation API
 * GET - Get projects and flashcards for content moderation
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin access
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const url = new URL(request.url);
    const contentType = url.searchParams.get("type") || "projects";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || "20"),
      100
    );
    const search = url.searchParams.get("search") || "";
    const sortBy = url.searchParams.get("sortBy") || "created_at";
    const sortOrder = url.searchParams.get("sortOrder") || "desc";

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    if (contentType === "projects") {
      // Get projects with user information
      let query = supabase
        .from("projects")
        .select(
          `
          id,
          name,
          description,
          created_at,
          updated_at,
          user_id,
          profiles (
            username,
            display_name,
            email
          )
        `
        )
        .range(from, to);

      // Add search filter
      if (search) {
        query = query.or(
          `name.ilike.%${search}%,description.ilike.%${search}%`
        );
      }

      // Add sorting
      query = query.order(sortBy, { ascending: sortOrder === "asc" });

      const { data: projects, error } = await query;

      if (error) {
        console.error("Error fetching projects:", error);
        return NextResponse.json(
          { error: "Failed to fetch projects" },
          { status: 500 }
        );
      }

      // Get total count
      const { count: totalCount } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true });

      return NextResponse.json({
        content: projects || [],
        type: "projects",
        pagination: {
          page,
          limit,
          total: totalCount || 0,
          totalPages: Math.ceil((totalCount || 0) / limit),
        },
      });
    } else if (contentType === "flashcards") {
      // Get flashcards with project and user information
      let query = supabase
        .from("flashcards")
        .select(
          `
          id,
          front,
          back,
          created_at,
          updated_at,
          project_id,
          projects (
            name,
            user_id,
            profiles (
              username,
              display_name,
              email
            )
          )
        `
        )
        .range(from, to);

      // Add search filter
      if (search) {
        query = query.or(`front.ilike.%${search}%,back.ilike.%${search}%`);
      }

      // Add sorting
      query = query.order(sortBy, { ascending: sortOrder === "asc" });

      const { data: flashcards, error } = await query;

      if (error) {
        console.error("Error fetching flashcards:", error);
        return NextResponse.json(
          { error: "Failed to fetch flashcards" },
          { status: 500 }
        );
      }

      // Get total count
      const { count: totalCount } = await supabase
        .from("flashcards")
        .select("*", { count: "exact", head: true });

      return NextResponse.json({
        content: flashcards || [],
        type: "flashcards",
        pagination: {
          page,
          limit,
          total: totalCount || 0,
          totalPages: Math.ceil((totalCount || 0) / limit),
        },
      });
    }

    return NextResponse.json(
      { error: "Invalid content type" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Content moderation API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
