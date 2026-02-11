import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  // Only block in real production deployments
  if (process.env.NODE_ENV === "production") {
    const p = req.nextUrl.pathname;

    if (p === "/inbox" || p.startsWith("/inbox/")) {
      return new NextResponse("Not Found", { status: 404 });
    }

    if (p.startsWith("/api/dev/")) {
      return new NextResponse("Not Found", { status: 404 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/inbox/:path*", "/api/dev/:path*"],
};
