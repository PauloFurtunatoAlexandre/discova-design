import { logger } from "@/lib/logger";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface SlackChannel {
	id: string;
	name: string;
	isPrivate: boolean;
}

export interface SlackConfig {
	teamId: string;
	teamName: string;
	channelId: string;
	channelName: string;
	webhookUrl: string | null;
}

// ── OAuth ──────────────────────────────────────────────────────────────────────

export function getSlackAuthUrl(state: string): string {
	const params = new URLSearchParams({
		client_id: process.env.SLACK_CLIENT_ID ?? "",
		scope: "channels:read,chat:write,incoming-webhook",
		redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/slack/callback`,
		state,
	});
	return `https://slack.com/oauth/v2/authorize?${params}`;
}

export async function exchangeSlackCode(code: string): Promise<{
	accessToken: string;
	teamId: string;
	teamName: string;
	webhookUrl: string | null;
	channelId: string | null;
	channelName: string | null;
}> {
	const res = await fetch("https://slack.com/api/oauth.v2.access", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			client_id: process.env.SLACK_CLIENT_ID ?? "",
			client_secret: process.env.SLACK_CLIENT_SECRET ?? "",
			code,
			redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/slack/callback`,
		}),
	});

	if (!res.ok) {
		const error = await res.text();
		logger.error({ error }, "Slack token exchange failed");
		throw new Error("Failed to exchange Slack code");
	}

	const data = await res.json();
	if (!data.ok) {
		logger.error({ error: data.error }, "Slack OAuth error");
		throw new Error(`Slack OAuth error: ${data.error}`);
	}

	return {
		accessToken: data.access_token,
		teamId: data.team?.id ?? "",
		teamName: data.team?.name ?? "",
		webhookUrl: data.incoming_webhook?.url ?? null,
		channelId: data.incoming_webhook?.channel_id ?? null,
		channelName: data.incoming_webhook?.channel ?? null,
	};
}

// ── API ────────────────────────────────────────────────────────────────────────

export async function getSlackChannels(accessToken: string): Promise<SlackChannel[]> {
	const res = await fetch(
		"https://slack.com/api/conversations.list?limit=200&types=public_channel",
		{
			headers: { Authorization: `Bearer ${accessToken}` },
		},
	);

	if (!res.ok) return [];
	const data = await res.json();
	if (!data.ok) return [];

	return (data.channels ?? []).map((c: Record<string, unknown>) => ({
		id: c.id as string,
		name: c.name as string,
		isPrivate: c.is_private as boolean,
	}));
}

export async function postSlackMessage(
	accessToken: string,
	channelId: string,
	text: string,
	blocks?: unknown[],
): Promise<boolean> {
	const res = await fetch("https://slack.com/api/chat.postMessage", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			channel: channelId,
			text,
			blocks,
		}),
	});

	if (!res.ok) {
		logger.error({ status: res.status }, "Failed to post Slack message");
		return false;
	}

	const data = await res.json();
	return data.ok === true;
}

export async function sendSlackWebhook(webhookUrl: string, text: string): Promise<boolean> {
	const res = await fetch(webhookUrl, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ text }),
	});

	return res.ok;
}
