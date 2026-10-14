import type { FormVersionBrief } from "#src/api/setting/form";
import { formService } from "#src/api/setting/form";
import { SectionCard } from "#src/components/section-card";
import { HistoryOutlined } from "@ant-design/icons";
import { useRequest } from "ahooks";
import { Skeleton, Tag, theme, Typography } from "antd";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

interface VersionListProps {
	formId: string
	/** Tăng mỗi lần mở màn sửa để tải lại danh sách (sau khi lưu có thể đã có phiên bản mới) */
	refreshToken: number
	onPreview: (version: FormVersionBrief) => void
}

/** "Phiên bản" của biểu mẫu: bấm để xem chỉ đọc, từ đó khôi phục làm nội dung đang soạn */
export function VersionList({ formId, refreshToken, onPreview }: VersionListProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const { data: versions, loading } = useRequest(() => formService.fetchVersions(formId), { refreshDeps: [formId, refreshToken] });

	return (
		<SectionCard icon={<HistoryOutlined />} title={t("setting.form.versions.title")}>
			{loading && !versions && <Skeleton active paragraph={{ rows: 2 }} title={false} />}
			{versions && !versions.length && <Typography.Text type="secondary">{t("setting.form.versions.empty")}</Typography.Text>}
			<div className="flex flex-col gap-1">
				{versions?.map(v => (
					<button
						type="button"
						key={v.id}
						onClick={() => onPreview(v)}
						className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-md border-none px-2.5 py-2 text-left transition-colors"
						style={{ background: v.isCurrent ? token.colorPrimaryBg : "transparent", color: token.colorText }}
						onMouseEnter={e => (e.currentTarget.style.background = token.colorFillTertiary)}
						onMouseLeave={e => (e.currentTarget.style.background = v.isCurrent ? token.colorPrimaryBg : "transparent")}
					>
						<span className="flex items-center gap-2 text-[13px]">
							{t("setting.form.versions.label", { version: v.version })}
							{v.isCurrent && <Tag color="success" bordered={false} className="m-0">{t("setting.form.versions.current")}</Tag>}
						</span>
						<Typography.Text type="secondary" className="text-xs">
							{[
								v.createdBy?.fullName,
								dayjs(v.createdAt).format("DD/MM/YYYY HH:mm"),
								t("setting.form.versions.fieldCount", { count: v.fieldCount }),
							].filter(Boolean).join(" · ")}
						</Typography.Text>
					</button>
				))}
			</div>
		</SectionCard>
	);
}
