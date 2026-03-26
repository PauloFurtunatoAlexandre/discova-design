import { auth } from "@/lib/auth/config";
import { getLinearAuthUrl } from "@/lib/integrations/linear/client";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.redirect(new URL("/login", req.url));
	}

	const state = req.nextUrl.searchParams.get("state");
	if (!state) {
		return NextResponse.redirect(new URL("/?error=missing_state", req.url));
	}

	return NextResponse.redirect(getLinearAuthUrl(state));
}
