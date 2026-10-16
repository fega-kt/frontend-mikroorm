import type { PeopleUser } from "#src/components/people-picker";
import { userService } from "#src/api/user";
import { useEffect, useMemo, useState } from "react";

/** API giới hạn số id mỗi lần */
const CHUNK = 200;

/** Thông tin đã tải trong phiên: user hoặc null (đã xóa / không tìm thấy) */
const cache = new Map<string, PeopleUser | null>();
const inflight = new Set<string>();
const queue = new Set<string>();
const listeners = new Set<() => void>();
let scheduled = false;

async function flush() {
	scheduled = false;
	const ids = [...queue];
	queue.clear();
	ids.forEach(id => inflight.add(id));
	for (let start = 0; start < ids.length; start += CHUNK) {
		const chunk = ids.slice(start, start + CHUNK);
		try {
			const users = await userService.fetchBriefs(chunk);
			const found = new Map(users.map(user => [user.id, user]));
			chunk.forEach(id => cache.set(id, found.get(id) ?? null));
		}
		catch {
			// Lỗi mạng / quyền: coi như không có, nơi hiển thị dùng tên đã lưu trong payload
			chunk.forEach(id => cache.set(id, null));
		}
		finally {
			chunk.forEach(id => inflight.delete(id));
		}
	}
	listeners.forEach(listener => listener());
}

/** Xếp id vào hàng đợi; mọi id cần trong cùng một lượt render gom thành một request */
function enqueue(ids: string[]) {
	for (const id of ids) {
		if (!cache.has(id) && !inflight.has(id))
			queue.add(id);
	}
	if (queue.size && !scheduled) {
		scheduled = true;
		setTimeout(flush, 0);
	}
}

/**
 * Tên / email / avatar mới nhất của các user theo id (payload tờ trình chỉ lưu { id, name }).
 * Cache trong phiên; id chưa tải xong hoặc không tìm thấy thì không có trong kết quả — nơi dùng tự dùng tên đã lưu.
 */
export function useUserBriefs(ids: string[]): ReadonlyMap<string, PeopleUser> {
	const key = [...new Set(ids.filter(Boolean))].sort().join(",");
	const [version, setVersion] = useState(0);

	useEffect(() => {
		if (!key)
			return;
		const listener = () => setVersion(v => v + 1);
		listeners.add(listener);
		enqueue(key.split(","));
		return () => {
			listeners.delete(listener);
		};
	}, [key]);

	return useMemo(() => {
		const result = new Map<string, PeopleUser>();
		for (const id of key ? key.split(",") : []) {
			const user = cache.get(id);
			if (user)
				result.set(id, user);
		}
		return result;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [key, version]);
}
