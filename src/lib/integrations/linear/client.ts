import { logger } from "@/lib/logger";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface LinearTeam {
	id: string;
	key: string;
	name: string;
}

export interface LinearIssue {
	id: string;
	identifier: string;
	title: string;
	state: string;
	priority: number;
	assignee: string | null;
	url: string;
}

export interface LinearConfig {
	teamId: string;
	teamKey: string;
	teamName: string;
}

// ── OAuth ──────────────────────────────────────────────────────────────────────

export function getLinearAuthUrl(state: string): string {
	const params = new URLSearchParams({
		client_id: process.env.LINEAR_CLIENT_ID ?? "",
		scope: "read,write,issues:create",
		redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/linear/callback`,
		state,
		response_type: "code",
		prompt: "consent",
	});
	return `https://linear.app/oauth/authorize?${params}`;
}

export async function exchangeLinearCode(code: string): Promise<{
	accessToken: string;
	expiresIn: number;
}> {
	const res = await fetch("https://api.linear.app/oauth/token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			grant_type: "authorization_code",
			client_id: process.env.LINEAR_CLIENT_ID ?? "",
			client_secret: process.env.LINEAR_CLIENT_SECRET ?? "",
			code,
			redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/linear/callback`,
		}),
	});

	if (!res.ok) {
		const error = await res.text();
		logger.error({ error }, "Linear token exchange failed");
		throw new Error("Failed to exchange Linear code");
	}

	const data = await res.json();
	return {
		accessToken: data.access_token,
		expiresIn: data.expires_in ?? 315360000, // Linear tokens are long-lived
	};
}

// ── GraphQL API ────────────────────────────────────────────────────────────────

async function linearQuery(
	accessToken: string,
	query: string,
	variables?: Record<string, unknown>,
) {
	const res = await fetch("https://api.linear.app/graphql", {
		method: "POST",
		headers: {
			Authorization: accessToken,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ query, variables }),
	});

	if (!res.ok) {
		logger.error({ status: res.status }, "Linear API request failed");
		return null;
	}

	const data = await res.json();
	return data.data;
}

export async function getLinearTeams(accessToken: string): Promise<LinearTeam[]> {
	const data = await linearQuery(accessToken, "{ teams { nodes { id key name } } }");
	if (!data?.teams?.nodes) return [];
	return data.teams.nodes.map((t: Record<string, string>) => ({
		id: t.id,
		key: t.key,
		name: t.name,
	}));
}

export async function createLinearIssue(
	accessToken: string,
	args: { teamId: string; title: string; description: string; priority?: number },
): Promise<LinearIssue | null> {
	const data = await linearQuery(
		accessToken,
		`mutation CreateIssue($input: IssueCreateInput!) {
			issueCreate(input: $input) {
				success
				issue { id identifier title url state { name } priority assignee { name } }
			}
		}`,
		{
			input: {
				teamId: args.teamId,
				title: args.title,
				description: args.description,
				priority: args.priority ?? 0,
			},
		},
	);

	const issue = data?.issueCreate?.issue;
	if (!issue) return null;

	return {
		id: issue.id,
		identifier: issue.identifier,
		title: issue.title,
		state: issue.state?.name ?? "Backlog",
		priority: issue.priority,
		assignee: issue.assignee?.name ?? null,
		url: issue.url,
	};
}
