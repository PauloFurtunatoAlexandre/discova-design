import { logger } from "@/lib/logger";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface FigmaFile {
	key: string;
	name: string;
	thumbnailUrl: string | null;
	lastModified: string;
}

export interface FigmaConfig {
	teamId: string;
	teamName: string;
	linkedFiles: Array<{ key: string; name: string }>;
}

// ── OAuth ──────────────────────────────────────────────────────────────────────

export function getFigmaAuthUrl(state: string): string {
	const params = new URLSearchParams({
		client_id: process.env.FIGMA_CLIENT_ID ?? "",
		redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/figma/callback`,
		scope: "files:read",
		state,
		response_type: "code",
	});
	return `https://www.figma.com/oauth?${params}`;
}

export async function exchangeFigmaCode(code: string): Promise<{
	accessToken: string;
	refreshToken: string;
	expiresIn: number;
}> {
	const res = await fetch("https://api.figma.com/v1/oauth/token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			client_id: process.env.FIGMA_CLIENT_ID ?? "",
			client_secret: process.env.FIGMA_CLIENT_SECRET ?? "",
			redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/figma/callback`,
			code,
			grant_type: "authorization_code",
		}),
	});

	if (!res.ok) {
		const error = await res.text();
		logger.error({ error }, "Figma token exchange failed");
		throw new Error("Failed to exchange Figma code");
	}

	const data = await res.json();
	return {
		accessToken: data.access_token,
		refreshToken: data.refresh_token,
		expiresIn: data.expires_in,
	};
}

// ── API ────────────────────────────────────────────────────────────────────────

export async function getFigmaFile(
	accessToken: string,
	fileKey: string,
): Promise<FigmaFile | null> {
	const res = await fetch(`https://api.figma.com/v1/files/${fileKey}?depth=1`, {
		headers: { "X-FIGMA-TOKEN": accessToken },
	});

	if (!res.ok) {
		logger.error({ status: res.status, fileKey }, "Failed to fetch Figma file");
		return null;
	}

	const data = await res.json();
	return {
		key: fileKey,
		name: data.name,
		thumbnailUrl: data.thumbnailUrl ?? null,
		lastModified: data.lastModified,
	};
}

export async function getFigmaFileImages(
	accessToken: string,
	fileKey: string,
	nodeIds: string[],
): Promise<Record<string, string>> {
	if (nodeIds.length === 0) return {};

	const ids = nodeIds.join(",");
	const res = await fetch(
		`https://api.figma.com/v1/images/${fileKey}?ids=${ids}&format=png&scale=2`,
		{
			headers: { "X-FIGMA-TOKEN": accessToken },
		},
	);

	if (!res.ok) return {};
	const data = await res.json();
	return data.images ?? {};
}

export async function getFigmaTeamProjects(
	accessToken: string,
	teamId: string,
): Promise<Array<{ id: string; name: string }>> {
	const res = await fetch(`https://api.figma.com/v1/teams/${teamId}/projects`, {
		headers: { "X-FIGMA-TOKEN": accessToken },
	});

	if (!res.ok) return [];
	const data = await res.json();
	return (data.projects ?? []).map((p: Record<string, string>) => ({
		id: p.id,
		name: p.name,
	}));
}
