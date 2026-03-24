import { type NextRequest, NextResponse } from "next/server";

const PUBLIC_PREFIXES = ["/login", "/signup", "/api/auth", "/share/"];

function isPublicRoute(pathname: string): boolean {
	return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export default function middleware(req: NextRequest) {
	const { pathname } = req.nextUrl;

	if (isPublicRoute(pathname)) {
		return NextResponse.next();
	}

	// Auth.js stores the session token in one of these cookies depending on env
	const sessionToken =
		req.cookies.get("authjs.session-token")?.value ??
		req.cookies.get("__Secure-authjs.session-token")?.value;

	if (!sessionToken) {
		const loginUrl = new URL("/login", req.url);
		loginUrl.searchParams.set("callbackUrl", pathname);
		return NextResponse.redirect(loginUrl);
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		"/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)",
	],
};
