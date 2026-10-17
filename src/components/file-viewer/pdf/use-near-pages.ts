import { useEffect, useState } from "react";

/**
 * Các trang (phần tử có `data-page`) đang ở trong hoặc gần vùng nhìn của `root`.
 * `margin` nới vùng nhìn để vẽ trước trang sắp cuộn tới, ví dụ "1200px 0px".
 */
export function useNearPages(root: HTMLElement | null, count: number, margin: string) {
	const [near, setNear] = useState<Set<number>>(() => new Set());

	useEffect(() => {
		if (!root)
			return;
		const observer = new IntersectionObserver((entries) => {
			setNear((prev) => {
				const next = new Set(prev);
				for (const entry of entries) {
					const page = Number((entry.target as HTMLElement).dataset.page);
					if (entry.isIntersecting)
						next.add(page);
					else
						next.delete(page);
				}
				return next;
			});
		}, { root, rootMargin: margin });
		root.querySelectorAll("[data-page]").forEach(el => observer.observe(el));
		return () => observer.disconnect();
	}, [root, count, margin]);

	return near;
}
