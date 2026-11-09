import type { UserBrief } from "#src/api/approval-request";
import { principalService } from "#src/api/system/principal";
import { useEffect, useMemo, useState } from "react";

/** Mỗi nhóm tải tối đa chừng này trang thành viên (khớp trang của thẻ nhóm) để không kéo cả nhóm quá lớn */
const MAX_PAGES = 5;
/** Thành viên nhóm ít đổi: giữ lại giữa các lần mở màn / chuyển tab để không gọi lại API (và gộp 2 lần mount của StrictMode) */
const CACHE_MS = 5 * 60 * 1000;

const cache = new Map<string, { at: number, promise: Promise<UserBrief[]> }>();

function loadGroup(id: string): Promise<UserBrief[]> {
	const hit = cache.get(id);
	if (hit && Date.now() - hit.at < CACHE_MS)
		return hit.promise;
	const promise = (async () => {
		const list: UserBrief[] = [];
		for (let page = 1; page <= MAX_PAGES; page++) {
			const res = await principalService.fetchGroupMembers(id, page);
			list.push(...res.data.map(({ id: userId, fullName, avatar }) => ({ id: userId, fullName, avatar })));
			if (!res.data.length || list.length >= res.total)
				break;
		}
		return list;
	})();
	cache.set(id, { at: Date.now(), promise });
	// Lỗi thì không nhớ để lần sau thử lại
	promise.catch(() => cache.delete(id));
	return promise;
}

/** Thành viên của các nhóm (để @mention được người trong nhóm duyệt / nhóm được chia sẻ); lỗi thì bỏ qua nhóm đó */
export function useGroupMembers(groupIds: string[]): UserBrief[] {
	const key = groupIds.join(",");
	const [members, setMembers] = useState<UserBrief[]>([]);

	useEffect(() => {
		const ids = key ? key.split(",") : [];
		if (!ids.length)
			return;
		let cancelled = false;
		void Promise.all(ids.map(id => loadGroup(id).catch(() => [] as UserBrief[]))).then((groups) => {
			if (!cancelled)
				setMembers(groups.flat());
		});
		return () => {
			cancelled = true;
		};
	}, [key]);

	return useMemo(() => (key ? members : []), [key, members]);
}
