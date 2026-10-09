import type { ActivityLogEntity } from "#src/api/activity-log/types";
import type { DisplayOptions } from "./index";
import { useQueryClient } from "@tanstack/react-query";
import { Drawer, Typography } from "antd";
import { useImperativeHandle, useState } from "react";
import { ActivityHistory } from "./index";

const { Text } = Typography;

export interface HistoryDrawerTarget {
	id: string
	/** Tên hiển thị trên tiêu đề drawer */
	title: string
	/** Dòng phụ dưới tiêu đề (vd: mã, email) */
	subtitle?: string
}

export interface HistoryDrawerRef {
	show: (target: HistoryDrawerTarget) => void
}

interface HistoryDrawerProps extends DisplayOptions {
	ref: React.Ref<HistoryDrawerRef>
	/** Tiền tố query key, phân biệt giữa các màn (vd: "user", "department") */
	queryKeyPrefix: string
	fetcher: (id: string) => Promise<{ data: ActivityLogEntity[] }>
}

/** Drawer lịch sử thay đổi của một bản ghi, dùng chung cho các màn danh sách */
export function HistoryDrawer({ ref, queryKeyPrefix, fetcher, ...options }: HistoryDrawerProps) {
	const queryClient = useQueryClient();
	const [target, setTarget] = useState<HistoryDrawerTarget | null>(null);

	useImperativeHandle(ref, () => ({
		show: (next) => {
			// Luôn tải lại khi mở, để vừa sửa xong mở lịch sử là thấy ngay
			queryClient.invalidateQueries({ queryKey: [queryKeyPrefix, "history", next.id] });
			setTarget(next);
		},
	}));

	return (
		<Drawer
			open={!!target}
			width={560}
			destroyOnHidden
			// Body không tự cuộn, để ActivityHistory (fillHeight) chỉ cuộn phần timeline
			styles={{ body: { display: "flex", flexDirection: "column", overflow: "hidden", padding: 0 } }}
			onClose={() => setTarget(null)}
			title={target && (
				<div className="flex flex-col">
					<span>{target.title}</span>
					{target.subtitle && <Text type="secondary" className="text-xs font-normal">{target.subtitle}</Text>}
				</div>
			)}
		>
			{target && (
				<ActivityHistory
					queryKey={[queryKeyPrefix, "history", target.id]}
					fetcher={() => fetcher(target.id)}
					fillHeight
					{...options}
				/>
			)}
		</Drawer>
	);
}
