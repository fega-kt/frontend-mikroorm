import type { ApprovalWorkflowDetail, ApprovalWorkflowVersion } from "#src/api/approval-workflow/types";
import { ApprovalWorkflowVersionStatus } from "#src/api/approval-workflow/types";
import { Tag, theme, Typography } from "antd";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

interface VersionListProps {
	detail: ApprovalWorkflowDetail
	onPreview: (version: ApprovalWorkflowVersion) => void
}

/** "Phiên bản": bấm để xem trước (chỉ đọc) */
export function VersionList({ detail, onPreview }: VersionListProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const versions = [...(detail.versions ?? [])].sort((a, b) => b.version - a.version);

	const statusTag = (v: ApprovalWorkflowVersion) => {
		switch (v.status) {
			case ApprovalWorkflowVersionStatus.Draft:
				return <Tag color="processing" bordered={false} className="m-0">{t("workflowDesigner.version.editingTag")}</Tag>;
			case ApprovalWorkflowVersionStatus.Published:
				return <Tag color="success" bordered={false} className="m-0">{t("workflowDesigner.version.live")}</Tag>;
			default:
				return (
					<Typography.Text type="secondary" className="text-xs">
						{dayjs(v.publishedAt ?? v.updatedAt).format("MM/YYYY")}
					</Typography.Text>
				);
		}
	};

	return (
		<section>
			<Typography.Text strong className="mb-2 block text-[13px]">{t("workflowDesigner.versions.title")}</Typography.Text>
			{!versions.length && <Typography.Text type="secondary" className="text-xs">{t("workflowDesigner.versions.empty")}</Typography.Text>}
			<div className="flex flex-col gap-1">
				{versions.map(v => (
					<button
						type="button"
						key={v.id}
						onClick={() => onPreview(v)}
						className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-md border-none px-2.5 py-2 text-left transition-colors"
						style={{ background: v.status === ApprovalWorkflowVersionStatus.Draft ? token.colorPrimaryBg : "transparent", color: token.colorText }}
						onMouseEnter={e => (e.currentTarget.style.background = token.colorFillTertiary)}
						onMouseLeave={e => (e.currentTarget.style.background = v.status === ApprovalWorkflowVersionStatus.Draft ? token.colorPrimaryBg : "transparent")}
					>
						<span className="truncate text-[13px]">
							{t("workflowDesigner.version.label", { version: v.version, status: t(`workflowDesigner.version.${v.status}`) })}
						</span>
						{statusTag(v)}
					</button>
				))}
			</div>
		</section>
	);
}
