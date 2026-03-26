import { Button, Section, Text } from "@react-email/components";
import { EmailLayout, buttonStyle, heading, mutedText, paragraph } from "./shared";

interface CommentReplyEmailProps {
	replierName?: string;
	commentPreview?: string;
	projectName?: string;
}

export function CommentReplyEmail({
	replierName = "Someone",
	commentPreview = "",
	projectName = "your project",
}: CommentReplyEmailProps) {
	return (
		<EmailLayout preview={`${replierName} replied to your comment`}>
			<Text style={heading}>New reply to your comment</Text>
			<Text style={paragraph}>
				<strong style={{ color: "#f0f0f0" }}>{replierName}</strong> replied to your comment in{" "}
				<strong style={{ color: "#f0f0f0" }}>{projectName}</strong>.
			</Text>
			{commentPreview && <Text style={quoteStyle}>&ldquo;{commentPreview}&rdquo;</Text>}
			<Section style={{ margin: "24px 0" }}>
				<Button style={buttonStyle} href="https://app.discova.design">
					View Conversation
				</Button>
			</Section>
			<Text style={mutedText}>You received this because someone replied to your comment.</Text>
		</EmailLayout>
	);
}

const quoteStyle = {
	fontSize: "14px",
	color: "#b0b0b0",
	lineHeight: "22px",
	padding: "12px 16px",
	borderLeft: "3px solid #5b8def",
	backgroundColor: "rgba(91, 141, 239, 0.05)",
	borderRadius: "0 4px 4px 0",
	margin: "16px 0",
	fontStyle: "italic" as const,
};
