"use client";

import { PhaseError } from "@/components/errors/phase-error";

export default function VaultError({
	error,
	reset,
}: { error: Error & { digest?: string }; reset: () => void }) {
	return <PhaseError error={error} reset={reset} phase="vault" />;
}
