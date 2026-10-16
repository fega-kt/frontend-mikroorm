import type { ApprovalWorkflowVersion } from "#src/api/approval-workflow/types";
import type { FormField } from "#src/api/setting/request-type/types";
import { approvalWorkflowService } from "#src/api/approval-workflow";
import { ApprovalWorkflowVersionStatus } from "#src/api/approval-workflow/types";
import { ApprovalFlowGraph } from "#src/components/approval-flow-graph";
import { FormModal } from "#src/components/form-modal";
import { HistoryOutlined } from "@ant-design/icons";
import { useRequest } from "ahooks";
import { Button, Descriptions, Skeleton } from "antd";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

interface VersionPreviewModalProps {
	workflowId: string
	version: ApprovalWorkflowVersion | null
	fields: FormField[]
	userNames: Record<string, string>
	canRestore: boolean
	/** Đang có thay đổi chưa lưu → hỏi trước khi ghi đè bản nháp */
	dirty: boolean
	onClose: () => void
	onRestored: () => void
}

/** Xem trước một phiên bản (chỉ đọc) + khôi phục làm bản nháp */
export function VersionPreviewModal({ workflowId, version, fields, userNames, canRestore, dirty, onClose, onRestored }: VersionPreviewModalProps) {
	const { t } = useTranslation();

	const { data, loading } = useRequest(
		() => approvalWorkflowService.fetchVersion(workflowId, version!.id),
		{ ready: !!version, refreshDeps: [version?.id] },
	);

	const { run: restore, loading: restoring } = useRequest(
		async () => {
			const res = await approvalWorkflowService.fetchRestoreVersion(workflowId, version!.id);
			window.$message?.success(t("workflowDesigner.messages.restored", { version: version!.version }));
			return res;
		},
		{ manual: true, onSuccess: () => onRestored() },
	);

	const confirmRestore = () => {
		window.$modal?.confirm({
			title: t("workflowDesigner.messages.restoreConfirmTitle", { version: version?.version }),
			content: dirty ? t("workflowDesigner.messages.restoreConfirmDirty") : t("workflowDesigner.messages.restoreConfirmContent"),
			okText: t("workflowDesigner.actions.restore"),
			onOk: () => restore(),
		});
	};

	const isDraft = version?.status === ApprovalWorkflowVersionStatus.Draft;

	return (
		<FormModal
			open={!!version}
			onCancel={onClose}
			width={960}
			title={version
				? t("workflowDesigner.versions.preview", {
					version: version.version,
					status: t(`workflowDesigner.version.${version.status}`),
				})
				: ""}
			footer={[
				<Button key="close" onClick={onClose}>{t("workflowDesigner.actions.close")}</Button>,
				canRestore && !isDraft && (
					<Button key="restore" type="primary" icon={<HistoryOutlined />} loading={restoring} onClick={confirmRestore}>
						{t("workflowDesigner.actions.restore")}
					</Button>
				),
			]}
		>
			{version && (
				<Descriptions size="small" column={3} className="mb-3">
					<Descriptions.Item label={t("workflowDesigner.versions.publishedAt")}>
						{version.publishedAt ? dayjs(version.publishedAt).format("DD/MM/YYYY HH:mm") : "—"}
					</Descriptions.Item>
					<Descriptions.Item label={t("workflowDesigner.versions.publishedBy")}>
						{version.publishedBy?.fullName ?? "—"}
					</Descriptions.Item>
					<Descriptions.Item label={t("workflowDesigner.versions.updatedAt")}>
						{dayjs(version.updatedAt).format("DD/MM/YYYY HH:mm")}
					</Descriptions.Item>
				</Descriptions>
			)}
			{loading || !data?.definition
				? <Skeleton active paragraph={{ rows: 8 }} />
				: <ApprovalFlowGraph definition={data.definition} height="60vh" fields={fields} userNames={userNames} />}
		</FormModal>
	);
}
