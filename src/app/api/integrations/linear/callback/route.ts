import { auth } from "@/lib/auth/config";
import { exchangeLinearCode } from "@/lib/integrations/linear/client";
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

	const workspaceId = verifyOAuthState(state);
	if (!workspaceId) {
		logger.warn({ userId: session.user.id }, "Invalid OAuth state in Linear callback");
		return NextResponse.redirect(new URL("/?error=invalid_state", req.url));
	}

	if (!(await isMember(session.user.id, workspaceId))) {
		return NextResponse.redirect(new URL("/?error=forbidden", req.url));
	}

	try {
		const tokens = await exchangeLinearCode(code);

		await upsertIntegration({
			workspaceId,
			type: "linear",
			config: {},
			accessTokenEncrypted: encryptToken(tokens.accessToken),
			refreshTokenEncrypted: null,
			tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
			connectedBy: session.user.id,
		});

		return NextResponse.redirect(
			new URL(`/${workspaceId}/settings?integration=linear&success=true`, req.url),
		);
	} catch (err) {
		logger.error({ err }, "Linear OAuth callback failed");
		return NextResponse.redirect(new URL(`/${workspaceId}/settings?error=linear_failed`, req.url));
	}
}
