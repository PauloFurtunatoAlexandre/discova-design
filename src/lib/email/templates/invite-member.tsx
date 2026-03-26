import { Button, Section, Text } from "@react-email/components";
import { EmailLayout, buttonStyle, heading, highlight, mutedText, paragraph } from "./shared";

interface InviteMemberEmailProps {
	inviterName?: string;
	workspaceName?: string;
	role?: string;
}

export function InviteMemberEmail({
	inviterName = "A team member",
	workspaceName = "a workspace",
	role = "member",
}: InviteMemberEmailProps) {
	return (
		<EmailLayout preview={`${inviterName} invited you to join ${workspaceName} on Discova`}>
			<Text style={heading}>You&apos;ve been invited</Text>
			<Text style={paragraph}>
				{inviterName} invited you to join{" "}
				<strong style={{ color: "#f0f0f0" }}>{workspaceName}</strong> on Discova as a{" "}
				<span style={highlight}>{role}</span>.
			</Text>
			<Text style={paragraph}>
				Open Discova to accept the invitation and start collaborating with your team.
			</Text>
			<Section style={{ margin: "24px 0" }}>
				<Button style={buttonStyle} href="https://app.discova.design">
					Accept Invitation
				</Button>
			</Section>
			<Text style={mutedText}>
				If you don&apos;t have an account yet, you&apos;ll need to sign up first.
			</Text>
		</EmailLayout>
	);
}
