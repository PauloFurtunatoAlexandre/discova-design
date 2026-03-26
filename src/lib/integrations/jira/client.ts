import { logger } from "@/lib/logger";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface JiraProject {
	id: string;
	key: string;
	name: string;
}

export interface JiraIssue {
	id: string;
	key: string;
	summary: string;
	status: string;
	priority: string | null;
	assignee: string | null;
	url: string;
}

export interface JiraConfig {
	cloudId: string;
	siteUrl: string;
	projectKey: string;
	projectName: string;
}

// ── OAuth ──────────────────────────────────────────────────────────────────────

export function getJiraAuthUrl(state: string): string {
	const params = new URLSearchParams({
		audience: "api.atlassian.com",
		client_id: process.env.JIRA_CLIENT_ID ?? "",
		scope: "read:jira-work write:jira-work offline_access",
		redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/jira/callback`,
		state,
		response_type: "code",
		prompt: "consent",
	});
	return `https://auth.atlassian.com/authorize?${params}`;
}

export async function exchangeJiraCode(code: string): Promise<{
	accessToken: string;
	refreshToken: string;
	expiresIn: number;
}> {
	const res = await fetch("https://auth.atlassian.com/oauth/token", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			grant_type: "authorization_code",
			client_id: process.env.JIRA_CLIENT_ID,
			client_secret: process.env.JIRA_CLIENT_SECRET,
			code,
			redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/jira/callback`,
		}),
	});

	if (!res.ok) {
		const error = await res.text();
		logger.error({ error }, "Jira token exchange failed");
		throw new Error("Failed to exchange Jira code");
	}

	const data = await res.json();
	return {
		accessToken: data.access_token,
		refreshToken: data.refresh_token,
		expiresIn: data.expires_in,
	};
}

// ── API ────────────────────────────────────────────────────────────────────────

export async function getJiraProjects(
	accessToken: string,
	cloudId: string,
): Promise<JiraProject[]> {
	const res = await fetch(
		`https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/project/search`,
		{ headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" } },
	);

	if (!res.ok) return [];
	const data = await res.json();
	return (data.values ?? []).map((p: Record<string, string>) => ({
		id: p.id,
		key: p.key,
		name: p.name,
	}));
}

export async function createJiraIssue(
	accessToken: string,
	cloudId: string,
	args: { projectKey: string; summary: string; description: string; issueType?: string },
): Promise<JiraIssue | null> {
	const res = await fetch(`https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"Content-Type": "application/json",
			Accept: "application/json",
		},
		body: JSON.stringify({
			fields: {
				project: { key: args.projectKey },
				summary: args.summary,
				description: {
					type: "doc",
					version: 1,
					content: [{ type: "paragraph", content: [{ type: "text", text: args.description }] }],
				},
				issuetype: { name: args.issueType ?? "Task" },
			},
		}),
	});

	if (!res.ok) {
		logger.error({ status: res.status }, "Failed to create Jira issue");
		return null;
	}

	const data = await res.json();
	return {
		id: data.id,
		key: data.key,
		summary: args.summary,
		status: "To Do",
		priority: null,
		assignee: null,
		url: `https://${cloudId}.atlassian.net/browse/${data.key}`,
	};
}

export async function getJiraCloudId(accessToken: string): Promise<string | null> {
	const res = await fetch("https://api.atlassian.com/oauth/token/accessible-resources", {
		headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
	});

	if (!res.ok) return null;
	const sites = await res.json();
	return sites[0]?.id ?? null;
}
