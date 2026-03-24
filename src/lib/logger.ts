import pino from "pino";

export const logger = pino({
	level: process.env.NODE_ENV === "production" ? "info" : "debug",
	redact: {
		paths: [
			"password",
			"passwordHash",
			"token",
			"accessToken",
			"refreshToken",
			"secret",
			"apiKey",
			"authorization",
			"cookie",
		],
		censor: "[REDACTED]",
	},
});

export type Logger = typeof logger;
