import { logger } from "@/lib/logger";
import { Resend } from "resend";

function getResendClient(): Resend | null {
	const key = process.env.RESEND_API_KEY;
	if (!key) return null;
	return new Resend(key);
}

export async function sendEmail({
	to,
	subject,
	react,
}: {
	to: string | string[];
	subject: string;
	react: React.ReactElement;
}) {
	const resend = getResendClient();
	if (!resend) {
		logger.warn({ to, subject }, "RESEND_API_KEY not set — skipping email");
		return { success: false, error: "Email not configured" };
	}

	try {
		const { data, error } = await resend.emails.send({
			from: "Discova <noreply@discova.app>",
			to: Array.isArray(to) ? to : [to],
			subject,
			react,
		});

		if (error) {
			logger.error({ error, to, subject }, "Failed to send email");
			return { success: false, error };
		}

		logger.info({ messageId: data?.id, to, subject }, "Email sent");
		return { success: true, data };
	} catch (err) {
		logger.error({ err, to, subject }, "Email send threw exception");
		return { success: false, error: err };
	}
}
