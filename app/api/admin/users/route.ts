/**
 * Admin User Management API
 * GET - Get all users with pagination and filtering
 * Provides read-only access to user information for admin dashboard
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

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

    // Build query
    let query = supabase
      .from("profiles")
      .select(
        `
        id,
        username,
        display_name,
        email,
        age,
        is_admin,
        created_at,
        updated_at,
        onboarding_completed
      `
      )
      .range(from, to);

    // Add search filter
    if (search) {
      query = query.or(
        `username.ilike.%${search}%,display_name.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    // Add sorting
    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    const { data: users, error } = await query;

    if (error) {
      console.error("Error fetching users:", error);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // Get additional statistics
    const stats = await getUserStats(supabase);

    return NextResponse.json({
      users: users || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
      },
      stats,
    });
  } catch (error) {
    console.error("User management API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function getUserStats(supabase: SupabaseClient) {
  try {
    // Get user counts
    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { count: adminUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_admin", true);

    const { count: completedOnboarding } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("onboarding_completed", true);

    // Get recent signups (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: recentSignups } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo.toISOString());

    return {
      totalUsers: totalUsers || 0,
      adminUsers: adminUsers || 0,
      completedOnboarding: completedOnboarding || 0,
      recentSignups: recentSignups || 0,
      onboardingRate: totalUsers ? (completedOnboarding || 0) / totalUsers : 0,
    };
  } catch (error) {
    console.error("Error getting user stats:", error);
    return {
      totalUsers: 0,
      adminUsers: 0,
      completedOnboarding: 0,
      recentSignups: 0,
      onboardingRate: 0,
    };
  }
}
