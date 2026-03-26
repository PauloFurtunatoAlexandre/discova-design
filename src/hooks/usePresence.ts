"use client";

import { heartbeatAction } from "@/actions/presence";
import type { PresenceUser } from "@/lib/queries/presence";
import { useCallback, useEffect, useRef, useState } from "react";

const HEARTBEAT_INTERVAL_MS = 30_000; // 30 seconds

type Phase = "vault" | "engine" | "map" | "stack" | "team";

export function usePresence(projectId: string, phase: Phase | null) {
	const [users, setUsers] = useState<PresenceUser[]>([]);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const heartbeat = useCallback(async () => {
		const result = await heartbeatAction({ projectId, phase });
		if ("users" in result) {
			setUsers(result.users);
		}
	}, [projectId, phase]);

	useEffect(() => {
		// Initial heartbeat
		heartbeat();

		// Set up polling
		intervalRef.current = setInterval(heartbeat, HEARTBEAT_INTERVAL_MS);

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, [heartbeat]);

	return users;
}
