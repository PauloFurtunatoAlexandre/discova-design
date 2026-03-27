"use client";

import { PhaseError } from "@/components/errors/phase-error";

export default function StackError({
	error,
	reset,
}: { error: Error & { digest?: string }; reset: () => void }) {
	return <PhaseError error={error} reset={reset} phase="stack" />;
}
