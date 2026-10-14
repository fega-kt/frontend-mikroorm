import type { RequestTypeVersionBrief } from "#src/api/setting/request-type";
import { requestTypeService } from "#src/api/setting/request-type";
import { SectionCard } from "#src/components/section-card";
import { HistoryOutlined } from "@ant-design/icons";
import { useRequest } from "ahooks";
import { Skeleton, Tag, theme, Typography } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { VersionView } from "./version-view";

interface VersionTabProps {
	requestTypeId: string
	/** Tăng mỗi lần mở màn sửa để tải lại danh sách (sau khi lưu có thể đã có phiên bản mới) */
	refreshToken: number
	canRestore: boolean
	/** Đã khôi phục xong (backend đã lưu và sinh phiên bản mới): màn cha nạp lại dữ liệu */
	onRestored: () => void
}

/** Danh sách phiên bản cấu hình của loại tờ trình; bấm một dòng để xem chỉ đọc cả màn chi tiết của phiên bản đó */
export function VersionTab({ requestTypeId, refreshToken, canRestore, onRestored }: VersionTabProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [selected, setSelected] = useState<RequestTypeVersionBrief | null>(null);

	const { data: versions, loading } = useRequest(
		() => requestTypeService.fetchVersions(requestTypeId),
		{ refreshDeps: [requestTypeId, refreshToken] },
	);

	return (
		<SectionCard icon={<HistoryOutlined />} title={t("setting.requestType.versions.title")}>
			{loading && !versions && <Skeleton active paragraph={{ rows: 3 }} title={false} />}
			{versions && !versions.length && <Typography.Text type="secondary">{t("setting.requestType.versions.empty")}</Typography.Text>}
			<div className="flex flex-col gap-1">
				{versions?.map(v => (
					<button
						type="button"
						key={v.id}
						onClick={() => setSelected(v)}
						className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-md border-none px-2.5 py-2 text-left transition-colors"
						style={{ background: v.isCurrent ? token.colorPrimaryBg : "transparent", color: token.colorText }}
						onMouseEnter={e => (e.currentTarget.style.background = token.colorFillTertiary)}
						onMouseLeave={e => (e.currentTarget.style.background = v.isCurrent ? token.colorPrimaryBg : "transparent")}
					>
						<span className="flex items-center gap-2 text-[13px]">
							{t("setting.requestType.versions.label", { version: v.version })}
							{v.isCurrent && <Tag color="success" bordered={false} className="m-0">{t("setting.requestType.versions.current")}</Tag>}
						</span>
						<Typography.Text type="secondary" className="text-xs">
							{[v.name, v.form.name, v.createdBy?.fullName, dayjs(v.createdAt).format("DD/MM/YYYY HH:mm")].filter(Boolean).join(" · ")}
						</Typography.Text>
					</button>
				))}
			</div>

			<VersionView
				requestTypeId={requestTypeId}
				version={selected}
				canRestore={canRestore}
				onClose={() => setSelected(null)}
				onRestored={onRestored}
			/>
		</SectionCard>
	);
}
