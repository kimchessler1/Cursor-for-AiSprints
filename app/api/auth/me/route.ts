import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getCurrentSession, getCurrentUserId } from "@/lib/auth";
import { getDatabase } from "@/lib/d1-client";
import { UserService } from "@/lib/services/user-service";

/**
 * GET /api/auth/me
 * Get current user information
 */
export async function GET() {
  try {
    // Check if user is authenticated
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user ID from session
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Get database connection
    const { env } = getCloudflareContext();
    const db = getDatabase(env);
    const userService = new UserService(db);

    // Get user data
    const user = await userService.getUserById(userId);

    // Return user data (without password hash)
    return NextResponse.json({
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
