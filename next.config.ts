import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default withSentryConfig(nextConfig, {
	org: "discova",
	project: "discova-app",
	silent: !process.env.CI,
	widenClientFileUpload: true,
	disableLogger: true,
	automaticVercelMonitors: true,
});
