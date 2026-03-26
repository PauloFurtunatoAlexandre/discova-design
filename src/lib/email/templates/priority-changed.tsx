import { Button, Section, Text } from "@react-email/components";
import { EmailLayout, buttonStyle, heading, highlight, mutedText, paragraph } from "./shared";

interface PriorityChangedEmailProps {
	itemName?: string;
	newTier?: string;
	changedByName?: string;
	projectName?: string;
}

export function PriorityChangedEmail({
	itemName = "A solution",
	newTier = "now",
	changedByName = "Someone",
	projectName = "your project",
}: PriorityChangedEmailProps) {
	return (
		<EmailLayout preview={`${itemName} was moved to ${newTier} tier`}>
			<Text style={heading}>Priority updated</Text>
			<Text style={paragraph}>
				<strong style={{ color: "#f0f0f0" }}>{changedByName}</strong> changed the priority of{" "}
				<strong style={{ color: "#f0f0f0" }}>{itemName}</strong> to{" "}
				<span style={highlight}>{newTier.toUpperCase()}</span> in{" "}
				<strong style={{ color: "#f0f0f0" }}>{projectName}</strong>.
			</Text>
			<Section style={{ margin: "24px 0" }}>
				<Button style={buttonStyle} href="https://app.discova.design">
					View Stack
				</Button>
			</Section>
			<Text style={mutedText}>You received this because you&apos;re a member of this project.</Text>
		</EmailLayout>
	);
}
