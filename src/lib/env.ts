import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL connection string"),
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL"),
  NEXTAUTH_SECRET: z.string().min(32, "NEXTAUTH_SECRET must be at least 32 characters"),
  ANTHROPIC_API_KEY: z.string().startsWith("sk-", "ANTHROPIC_API_KEY must start with sk-"),
  RESEND_API_KEY: z.string().startsWith("re_", "RESEND_API_KEY must start with re_"),
  SENTRY_DSN: z
    .string()
    .url()
    .optional()
    .refine(
      (val) => process.env.NODE_ENV !== "production" || val !== undefined,
      "SENTRY_DSN is required in production"
    ),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  JIRA_CLIENT_ID: z.string().optional(),
  JIRA_CLIENT_SECRET: z.string().optional(),
  LINEAR_API_KEY: z.string().optional(),
  SLACK_BOT_TOKEN: z.string().optional(),
  SLACK_SIGNING_SECRET: z.string().optional(),
  FIGMA_ACCESS_TOKEN: z.string().optional(),
  REDIS_URL: z.string().url().optional(),
  INTEGRATION_ENCRYPTION_KEY: z.string().min(32).optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

function validateEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const formatted = parsed.error.format();
    console.error("❌ Invalid environment variables:");
    console.error(JSON.stringify(formatted, null, 2));
    throw new Error("Invalid environment variables. See above for details.");
  }

  const integrationVars = [
    "JIRA_CLIENT_ID",
    "LINEAR_API_KEY",
    "SLACK_BOT_TOKEN",
    "FIGMA_ACCESS_TOKEN",
  ] as const;

  for (const varName of integrationVars) {
    const value: string | undefined = process.env[varName];
    if (!value) {
      console.warn(
        `⚠ ${varName} not set — ${(varName.split("_")[0] ?? varName).toLowerCase()} integration will be disabled`
      );
    }
  }

  return parsed.data;
}

export const env = validateEnv();
export type Env = z.infer<typeof envSchema>;
