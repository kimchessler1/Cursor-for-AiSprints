import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDatabase } from "@/lib/d1-client";
import { UserService } from "@/lib/services/user-service";
import { hashPassword, setSessionCookie } from "@/lib/auth";

/**
 * POST /api/auth/signup
 * User registration endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
    };
    const { firstName, lastName, email, password } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Get database connection
    const { env } = getCloudflareContext();
    const db = getDatabase(env);
    const userService = new UserService(db);

    // Check if email already exists
    if (await userService.emailExists(email)) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await userService.createUser(
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        password,
      },
      passwordHash
    );

    // Set session cookie
    await setSessionCookie(user.id, user.email);

    // Return user data (without password hash)
    return NextResponse.json(
      {
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          createdAt: user.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
