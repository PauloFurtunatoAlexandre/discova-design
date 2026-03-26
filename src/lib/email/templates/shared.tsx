import { Body, Container, Head, Hr, Html, Preview, Section, Text } from "@react-email/components";
import type { ReactNode } from "react";

const main = {
	backgroundColor: "#0f0f11",
	fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
	margin: "0 auto",
	padding: "40px 24px",
	maxWidth: "520px",
};

const logo = {
	fontFamily: '"Lora", Georgia, serif',
	fontSize: "20px",
	fontWeight: 700,
	color: "#d4a843",
	letterSpacing: "-0.02em",
};

const hr = {
	borderColor: "#2a2a2e",
	margin: "24px 0",
};

const footer = {
	fontSize: "12px",
	color: "#6b6b6b",
	lineHeight: "20px",
};

interface EmailLayoutProps {
	preview: string;
	children: ReactNode;
}

export function EmailLayout({ preview, children }: EmailLayoutProps) {
	return (
		<Html>
			<Head />
			<Preview>{preview}</Preview>
			<Body style={main}>
				<Container style={container}>
					<Text style={logo}>Discova</Text>
					<Hr style={hr} />
					{children}
					<Hr style={hr} />
					<Section>
						<Text style={footer}>
							This email was sent by Discova. If you didn&apos;t expect this email, you can safely
							ignore it.
						</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	);
}

// Shared styles for templates
export const heading = {
	fontFamily: '"Lora", Georgia, serif',
	fontSize: "22px",
	fontWeight: 600,
	color: "#f0f0f0",
	lineHeight: "32px",
	margin: "0 0 16px",
};

export const paragraph = {
	fontSize: "14px",
	color: "#b0b0b0",
	lineHeight: "24px",
	margin: "0 0 12px",
};

export const buttonStyle = {
	display: "inline-block",
	padding: "12px 24px",
	fontSize: "14px",
	fontWeight: 600,
	color: "#0f0f11",
	backgroundColor: "#d4a843",
	borderRadius: "8px",
	textDecoration: "none",
};

export const mutedText = {
	fontSize: "12px",
	color: "#6b6b6b",
	lineHeight: "20px",
};

export const highlight = {
	display: "inline-block",
	padding: "2px 8px",
	fontSize: "12px",
	fontFamily: '"JetBrains Mono", monospace',
	color: "#d4a843",
	backgroundColor: "rgba(212, 168, 67, 0.1)",
	borderRadius: "4px",
	border: "1px solid rgba(212, 168, 67, 0.2)",
};
