import { auth } from "@/lib/auth/config";
import { getJiraAuthUrl } from "@/lib/integrations/jira/client";
import { createOAuthState } from "@/lib/integrations/oauth-state";
import { isMember } from "@/lib/permissions/tier-checks";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.redirect(new URL("/login", req.url));
	}

	const workspaceId = req.nextUrl.searchParams.get("state");
	if (!workspaceId) {
		return NextResponse.redirect(new URL("/?error=missing_state", req.url));
	}

	// Verify user is a member of the workspace they're connecting
	if (!(await isMember(session.user.id, workspaceId))) {
		return NextResponse.redirect(new URL("/?error=forbidden", req.url));
	}

	const signedState = createOAuthState(workspaceId);
	return NextResponse.redirect(getJiraAuthUrl(signedState));
}
