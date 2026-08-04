import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { hasSupabaseEnv } from "@/lib/env";

export async function middleware(request: NextRequest) {
  // Demo mode: no Supabase project configured yet, so there's no session
  // to check — every route is open and served from seed data.
  if (!hasSupabaseEnv) return NextResponse.next();
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
