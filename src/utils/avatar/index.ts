/** Helper to generate a vivid, theme-safe color from a string (e.g., user id) */
export function getAvatarColor(id: string = ""): string {
	const colors = [
		"#4f46e5",
		"#7c3aed",
		"#2563eb",
		"#0891b2",
		"#059669",
		"#db2777",
		"#e11d48",
		"#ea580c",
		"#d97706",
		"#65a30d",
	];
	let hash = 0;
	if (!id) {
		return colors[0];
	}
	for (let i = 0; i < id.length; i++) {
		hash = id.charCodeAt(i) + ((hash << 5) - hash);
	}
	const index = Math.abs(hash) % colors.length;
	return colors[index];
}

/** Helper to generate a full color style (HSL) from a string for more complex UI needs */
export function getAvatarColorStyle(id: string = "") {
	let hash = 0;
	if (!id) {
		return { color: "#666", backgroundColor: "#f0f0f0", borderColor: "#ddd" };
	}
	for (let i = 0; i < id.length; i++) {
		hash = id.charCodeAt(i) + ((hash << 5) - hash);
	}
	const h = Math.abs(hash % 360);
	return {
		color: `hsl(${h}, 70%, 45%)`,
		backgroundColor: `hsla(${h}, 70%, 45%, 0.12)`,
		borderColor: `hsla(${h}, 70%, 45%, 0.25)`,
	};
}
