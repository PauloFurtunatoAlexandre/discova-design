import type { Metadata } from "next";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
	title: "Create Account — Discova",
};

export default function SignupPage() {
	return (
		<div>
			<div className="text-center mb-10">
				<h1
					className="text-3xl tracking-tight"
					style={{
						fontFamily: "var(--font-display)",
						color: "var(--color-text-primary)",
					}}
				>
					discova
				</h1>
				<p className="mt-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
					Create your account
				</p>
			</div>

			<SignupForm />

			<p className="text-center mt-8 text-sm" style={{ color: "var(--color-text-muted)" }}>
				Already have an account?{" "}
				<a href="/login" className="underline" style={{ color: "var(--color-accent-gold)" }}>
					Sign in
				</a>
			</p>
		</div>
	);
}
