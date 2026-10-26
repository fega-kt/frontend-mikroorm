import type { ReportRangeParams } from "#src/api/approval-report";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";

export type ReportRangePreset = "7d" | "30d" | "quarter" | "year" | "custom";

export interface ReportFilterState {
	preset: ReportRangePreset
	/** Ngày bắt đầu (YYYY-MM-DD, tính cả ngày đó) */
	from: string
	/** Ngày kết thúc loại trừ (YYYY-MM-DD, ngày sau ngày cuối) */
	to: string
	/** Giữ cả tên để ô chọn phòng ban hiện đúng nhãn khi quay lại */
	department?: { id: string, name: string }
	requestTypeId?: string
}

const DATE = "YYYY-MM-DD";

/** Khoảng của các mốc có sẵn, theo giờ máy người dùng (VN) */
function presetRange(preset: Exclude<ReportRangePreset, "custom">) {
	const today = dayjs().startOf("day");
	const from = {
		"7d": today.subtract(6, "day"),
		"30d": today.subtract(29, "day"),
		"quarter": today.month(Math.floor(today.month() / 3) * 3).startOf("month"),
		"year": today.startOf("year"),
	}[preset];
	return { from: from.format(DATE), to: today.add(1, "day").format(DATE) };
}

/** Bộ lọc dùng chung cho 4 màn báo cáo: chuyển menu vẫn giữ, không đưa lên URL để đổi lọc không tải lại trang */
let lastState: ReportFilterState | undefined;

export function useReportFilters() {
	const [state, setState] = useState<ReportFilterState>(() => lastState ?? { preset: "30d", ...presetRange("30d") });

	useEffect(() => {
		lastState = state;
	}, [state]);

	const update = useCallback((patch: Partial<ReportFilterState>) => {
		setState((prev) => {
			const next = { ...prev, ...patch };
			// Chọn mốc có sẵn thì tính lại khoảng ngày; "custom" dùng from / to truyền vào
			return patch.preset && patch.preset !== "custom" ? { ...next, ...presetRange(patch.preset) } : next;
		});
	}, []);

	/** Tham số gửi API: ngày → mốc thời gian đầu ngày theo giờ máy */
	const query = useMemo<ReportRangeParams>(() => ({
		from: dayjs(state.from).toISOString(),
		to: dayjs(state.to).toISOString(),
		departmentId: state.department?.id,
		requestTypeId: state.requestTypeId,
	}), [state]);

	return { state, update, query };
}

/** Tải dữ liệu một báo cáo theo tham số; tham số đổi thì tải lại, bỏ kết quả của lần tải cũ */
export function useReportData<T, P>(fetcher: (params: P) => Promise<T>, params: P) {
	const [data, setData] = useState<T>();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<unknown>();
	const key = JSON.stringify(params);

	useEffect(() => {
		let stale = false;
		setLoading(true);
		setError(undefined);
		fetcher(params)
			.then(result => !stale && setData(result))
			.catch(err => !stale && setError(err))
			.finally(() => !stale && setLoading(false));
		return () => {
			stale = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps -- params so sánh theo giá trị qua key
	}, [key]);

	return { data, loading, error };
}
