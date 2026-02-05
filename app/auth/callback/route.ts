import { NextResponse } from "next/server";

// This route is kept for backward compatibility
// Better Auth handles its own callbacks through /api/auth/*
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") ?? "/groups";

  return NextResponse.redirect(`${origin}${next}`);
}
