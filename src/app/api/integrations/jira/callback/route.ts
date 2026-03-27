import { auth } from "@/lib/auth/config";
import { exchangeJiraCode, getJiraCloudId } from "@/lib/integrations/jira/client";
import { verifyOAuthState } from "@/lib/integrations/oauth-state";
import { encryptToken, upsertIntegration } from "@/lib/integrations/shared";
import { logger } from "@/lib/logger";
import { isMember } from "@/lib/permissions/tier-checks";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.redirect(new URL("/login", req.url));
	}

	const code = req.nextUrl.searchParams.get("code");
	const state = req.nextUrl.searchParams.get("state");

	if (!code || !state) {
		return NextResponse.redirect(new URL("/?error=missing_params", req.url));
	}

	// Verify signed state and extract workspaceId
	const workspaceId = verifyOAuthState(state);
	if (!workspaceId) {
		logger.warn({ userId: session.user.id }, "Invalid OAuth state in Jira callback");
		return NextResponse.redirect(new URL("/?error=invalid_state", req.url));
	}

	// Verify user is still a member of this workspace
	if (!(await isMember(session.user.id, workspaceId))) {
		return NextResponse.redirect(new URL("/?error=forbidden", req.url));
	}

	try {
		const tokens = await exchangeJiraCode(code);
		const cloudId = await getJiraCloudId(tokens.accessToken);

		if (!cloudId) {
			return NextResponse.redirect(new URL(`/${workspaceId}/settings?error=no_jira_site`, req.url));
		}

		await upsertIntegration({
			workspaceId,
			type: "jira",
			config: { cloudId, siteUrl: `https://${cloudId}.atlassian.net` },
			accessTokenEncrypted: encryptToken(tokens.accessToken),
			refreshTokenEncrypted: encryptToken(tokens.refreshToken),
			tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
			connectedBy: session.user.id,
		});

		return NextResponse.redirect(
			new URL(`/${workspaceId}/settings?integration=jira&success=true`, req.url),
		);
	} catch (err) {
		logger.error({ err }, "Jira OAuth callback failed");
		return NextResponse.redirect(new URL(`/${workspaceId}/settings?error=jira_failed`, req.url));
	}
}
