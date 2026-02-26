import { cookies } from "next/headers";

/**
 * Authentication utilities for QuizMaker
 * Handles password hashing, session management, and cookie operations
 */

const SESSION_SECRET =
  process.env.SESSION_SECRET || "fallback-secret-key-change-in-production";
const SESSION_COOKIE_NAME = "quizmaker-session";
const SESSION_EXPIRY_DAYS = 7;

/**
 * Hash a password using Web Crypto API
 * Uses PBKDF2 with SHA-256 for secure password hashing
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  // Generate a random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Import the password as a key
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    data,
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  // Derive the key using PBKDF2
  const key = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  // Combine salt and key for storage
  const combined = new Uint8Array(salt.length + key.byteLength);
  combined.set(salt);
  combined.set(new Uint8Array(key), salt.length);

  // Convert to base64 for storage
  return btoa(String.fromCharCode(...combined));
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);

    // Decode the stored hash
    const combined = new Uint8Array(
      atob(hash)
        .split("")
        .map((char) => char.charCodeAt(0))
    );

    // Extract salt and key
    const salt = combined.slice(0, 16);
    const storedKey = combined.slice(16);

    // Import the password as a key
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      data,
      "PBKDF2",
      false,
      ["deriveBits"]
    );

    // Derive the key using the same parameters
    const derivedKey = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      256
    );

    // Compare the derived key with the stored key
    const derivedKeyArray = new Uint8Array(derivedKey);
    return (
      derivedKeyArray.length === storedKey.length &&
      derivedKeyArray.every((byte, index) => byte === storedKey[index])
    );
  } catch (error) {
    console.error("Password verification error:", error);
    return false;
  }
}

/**
 * Sign a session token with HMAC-SHA256
 */
export async function signSession(
  payload: Record<string, unknown>
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const data = encoder.encode(JSON.stringify(payload));
  const signature = await crypto.subtle.sign("HMAC", key, data);

  // Combine payload and signature
  const combined = new Uint8Array(data.length + signature.byteLength);
  combined.set(data);
  combined.set(new Uint8Array(signature), data.length);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Verify and decode a session token
 */
export async function verifySession(
  token: string
): Promise<Record<string, unknown> | null> {
  try {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Decode the token
    const combined = new Uint8Array(
      atob(token)
        .split("")
        .map((char) => char.charCodeAt(0))
    );

    // Extract payload and signature
    const payloadLength = combined.length - 32; // HMAC-SHA256 signature is 32 bytes
    const payload = combined.slice(0, payloadLength);
    const signature = combined.slice(payloadLength);

    // Verify the signature
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(SESSION_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const isValid = await crypto.subtle.verify("HMAC", key, signature, payload);
    if (!isValid) {
      return null;
    }

    // Parse and return the payload
    return JSON.parse(decoder.decode(payload));
  } catch (error) {
    console.error("Session verification error:", error);
    return null;
  }
}

/**
 * Set a session cookie
 */
export async function setSessionCookie(
  userId: string,
  userEmail: string
): Promise<void> {
  const sessionData = {
    userId,
    userEmail,
    issuedAt: Date.now(),
    expiresAt: Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  };

  const token = await signSession(sessionData);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
    path: "/",
  });
}

/**
 * Clear the session cookie
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Get the current session from cookies
 */
export async function getCurrentSession(): Promise<Record<
  string,
  unknown
> | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionToken) {
      return null;
    }

    const session = await verifySession(sessionToken);
    if (!session) {
      return null;
    }

    // Check if session is expired
    if (Date.now() > (session.expiresAt as number)) {
      await clearSessionCookie();
      return null;
    }

    return session;
  } catch (error) {
    console.error("Get session error:", error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getCurrentSession();
  return session !== null;
}

/**
 * Get current user ID from session
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getCurrentSession();
  return (session?.userId as string) || null;
}
