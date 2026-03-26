"use client";

import { IMPACT_OPTIONS } from "@/lib/utils/rice";
import { useCallback, useEffect, useRef, useState } from "react";

// ── Editable Number Cell ──────────────────────────────────────────────────────

interface EditableNumberCellProps {
	value: number | null;
	autoValue: number | null;
	onSave: (value: number | null) => void;
	disabled?: boolean;
	min?: number;
	max?: number;
	step?: number;
	placeholder?: string;
}

export function EditableNumberCell({
	value,
	autoValue,
	onSave,
	disabled,
	min = 0,
	max,
	step = 1,
	placeholder,
}: EditableNumberCellProps) {
	const displayValue = value ?? autoValue;
	const isOverridden = value !== null;
	const [editing, setEditing] = useState(false);
	const [inputValue, setInputValue] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (editing) {
			inputRef.current?.focus();
			inputRef.current?.select();
		}
	}, [editing]);

	const handleStartEdit = useCallback(() => {
		if (disabled) return;
		setInputValue(displayValue?.toString() ?? "");
		setEditing(true);
	}, [disabled, displayValue]);

	const handleSave = useCallback(() => {
		setEditing(false);
		const trimmed = inputValue.trim();
		if (trimmed === "") {
			onSave(null);
			return;
		}
		const num = Number(trimmed);
		if (Number.isNaN(num) || !Number.isFinite(num)) return;
		if (min !== undefined && num < min) return;
		if (max !== undefined && num > max) return;
		onSave(num);
	}, [inputValue, onSave, min, max]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter") handleSave();
			if (e.key === "Escape") setEditing(false);
		},
		[handleSave],
	);

	if (editing) {
		return (
			<input
				ref={inputRef}
				type="number"
				value={inputValue}
				onChange={(e) => setInputValue(e.target.value)}
				onBlur={handleSave}
				onKeyDown={handleKeyDown}
				min={min}
				max={max}
				step={step}
				style={{
					width: "100%",
					padding: "4px 6px",
					fontFamily: "var(--font-mono)",
					fontSize: "var(--text-xs)",
					background: "var(--color-bg-sunken)",
					border: "1px solid var(--color-accent-green)",
					borderRadius: "var(--radius-sm)",
					color: "var(--color-text-primary)",
					outline: "none",
				}}
			/>
		);
	}

	return (
		<button
			type="button"
			onClick={handleStartEdit}
			disabled={disabled}
			title={
				isOverridden
					? `Override: ${value} (auto: ${autoValue ?? "—"})`
					: `Auto: ${displayValue ?? "—"} (click to override)`
			}
			style={{
				width: "100%",
				padding: "4px 6px",
				fontFamily: "var(--font-mono)",
				fontSize: "var(--text-xs)",
				background: "transparent",
				border: "1px solid transparent",
				borderRadius: "var(--radius-sm)",
				color: isOverridden ? "var(--color-text-primary)" : "var(--color-text-muted)",
				cursor: disabled ? "default" : "pointer",
				textAlign: "right",
				fontStyle: isOverridden ? "normal" : "italic",
			}}
		>
			{displayValue != null ? displayValue : (placeholder ?? "—")}
		</button>
	);
}

// ── Impact Dropdown Cell ──────────────────────────────────────────────────────

interface ImpactCellProps {
	value: number | null;
	autoValue: number | null;
	onSave: (value: number | null) => void;
	disabled?: boolean;
}

export function ImpactCell({ value, autoValue, onSave, disabled }: ImpactCellProps) {
	const displayValue = value ?? autoValue;
	const isOverridden = value !== null;

	const matchedOption = IMPACT_OPTIONS.find((o) => o.value === displayValue);

	return (
		<select
			value={displayValue?.toString() ?? ""}
			onChange={(e) => {
				const v = e.target.value;
				onSave(v === "" ? null : Number(v));
			}}
			disabled={disabled}
			style={{
				width: "100%",
				padding: "4px 6px",
				fontFamily: "var(--font-mono)",
				fontSize: "var(--text-xs)",
				background: "transparent",
				border: "1px solid transparent",
				borderRadius: "var(--radius-sm)",
				color: isOverridden ? "var(--color-text-primary)" : "var(--color-text-muted)",
				cursor: disabled ? "default" : "pointer",
				fontStyle: isOverridden ? "normal" : "italic",
				appearance: "none",
			}}
		>
			<option value="">—</option>
			{IMPACT_OPTIONS.map((opt) => (
				<option key={opt.value} value={opt.value}>
					{opt.label} ({opt.value})
				</option>
			))}
		</select>
	);
}
