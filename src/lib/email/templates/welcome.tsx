import { Button, Section, Text } from "@react-email/components";
import { EmailLayout, buttonStyle, heading, mutedText, paragraph } from "./shared";

interface WelcomeEmailProps {
	userName: string;
}

export function WelcomeEmail({ userName = "there" }: WelcomeEmailProps) {
	return (
		<EmailLayout preview={`Welcome to Discova, ${userName}!`}>
			<Text style={heading}>Welcome to Discova</Text>
			<Text style={paragraph}>
				Hi {userName}, thanks for signing up! Discova is your product discovery platform — from
				research notes to prioritized solutions.
			</Text>
			<Text style={paragraph}>
				Get started by creating a workspace and inviting your team. Here&apos;s what you can do:
			</Text>
			<Text style={paragraph}>
				<strong style={{ color: "#f0f0f0" }}>Vault</strong> — Capture research notes, quotes, and
				tag themes
				<br />
				<strong style={{ color: "#f0f0f0" }}>Engine</strong> — Synthesize insights from your
				evidence
				<br />
				<strong style={{ color: "#f0f0f0" }}>Map</strong> — Visualize problems, insights, and
				solutions
				<br />
				<strong style={{ color: "#f0f0f0" }}>Stack</strong> — RICE-score and prioritize your
				solutions
			</Text>
			<Section style={{ margin: "24px 0" }}>
				<Button style={buttonStyle} href="https://app.discova.design">
					Open Discova
				</Button>
			</Section>
			<Text style={mutedText}>
				If you have questions, reply to this email — we read every message.
			</Text>
		</EmailLayout>
	);
}
