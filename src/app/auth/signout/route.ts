import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  for (const cookie of cookieStore.getAll()) {
    if (cookie.name.includes("authjs")) {
      cookieStore.delete(cookie.name);
    }
  }
  const url = new URL("/", request.url);
  return NextResponse.redirect(url);
}
