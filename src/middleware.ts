import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/", "/login", "/signup"];
const PUBLIC_PREFIXES = ["/api/auth", "/share/"];

function isPublicRoute(pathname: string): boolean {
	if (PUBLIC_ROUTES.includes(pathname)) return true;
	return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export default auth((req) => {
	const { pathname } = req.nextUrl;
	const isAuthenticated = !!req.auth?.user;

	if (isPublicRoute(pathname)) {
		if (isAuthenticated && (pathname === "/login" || pathname === "/signup")) {
			return NextResponse.redirect(new URL("/onboarding", req.url));
		}
		return NextResponse.next();
	}

	if (!isAuthenticated) {
		const loginUrl = new URL("/login", req.url);
		loginUrl.searchParams.set("callbackUrl", pathname);
		return NextResponse.redirect(loginUrl);
	}

	return NextResponse.next();
});

export const config = {
	matcher: [
		"/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)",
	],
};
