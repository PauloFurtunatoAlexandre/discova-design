import { auth } from "@/lib/auth/config";
import { verifyOAuthState } from "@/lib/integrations/oauth-state";
import { encryptToken, upsertIntegration } from "@/lib/integrations/shared";
import { exchangeSlackCode } from "@/lib/integrations/slack/client";
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

	const workspaceId = verifyOAuthState(state);
	if (!workspaceId) {
		logger.warn({ userId: session.user.id }, "Invalid OAuth state in Slack callback");
		return NextResponse.redirect(new URL("/?error=invalid_state", req.url));
	}

	if (!(await isMember(session.user.id, workspaceId))) {
		return NextResponse.redirect(new URL("/?error=forbidden", req.url));
	}

	try {
		const result = await exchangeSlackCode(code);

		await upsertIntegration({
			workspaceId,
			type: "slack",
			config: {
				teamId: result.teamId,
				teamName: result.teamName,
				channelId: result.channelId,
				channelName: result.channelName,
				webhookUrl: result.webhookUrl,
			},
			accessTokenEncrypted: encryptToken(result.accessToken),
			refreshTokenEncrypted: null,
			tokenExpiresAt: null,
			connectedBy: session.user.id,
		});

		return NextResponse.redirect(
			new URL(`/${workspaceId}/settings?integration=slack&success=true`, req.url),
		);
	} catch (err) {
		logger.error({ err }, "Slack OAuth callback failed");
		return NextResponse.redirect(new URL(`/${workspaceId}/settings?error=slack_failed`, req.url));
	}
}
