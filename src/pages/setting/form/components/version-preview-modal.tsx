import type { FormVersionBrief } from "#src/api/setting/form";
import type { FormField } from "#src/api/setting/request-type";
import { formService } from "#src/api/setting/form";
import { FormModal } from "#src/components/form-modal";
import { PayloadFormItems } from "#src/pages/approval/components/form-fields";
import { HistoryOutlined } from "@ant-design/icons";
import { useRequest } from "ahooks";
import { Button, Descriptions, Empty, Form, Skeleton, Tag } from "antd";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

interface VersionPreviewModalProps {
	formId: string
	version: FormVersionBrief | null
	canRestore: boolean
	onClose: () => void
	/** Nạp trường của phiên bản này vào trình soạn (chưa lưu — lưu mới sinh phiên bản mới) */
	onRestore: (fields: FormField[], version: number) => void
}

/** Xem chỉ đọc một phiên bản của biểu mẫu + khôi phục làm nội dung đang soạn */
export function VersionPreviewModal({ formId, version, canRestore, onClose, onRestore }: VersionPreviewModalProps) {
	const { t } = useTranslation();
	const { data, loading } = useRequest(
		() => formService.fetchVersion(formId, version!.id),
		{ ready: !!version, refreshDeps: [version?.id] },
	);

	const confirmRestore = () => {
		if (!data || !version)
			return;
		window.$modal?.confirm({
			title: t("setting.form.versions.restoreConfirmTitle", { version: version.version }),
			content: t("setting.form.versions.restoreConfirmContent"),
			okText: t("setting.form.versions.restore"),
			onOk: () => {
				onRestore(data.formSchema, version.version);
				onClose();
			},
		});
	};

	return (
		<FormModal
			open={!!version}
			onCancel={onClose}
			width={720}
			title={version ? t("setting.form.versions.preview", { version: version.version }) : ""}
			footer={[
				<Button key="close" onClick={onClose}>{t("setting.form.versions.close")}</Button>,
				// Bản hiện hành đã là nội dung đang soạn nên không cần khôi phục
				canRestore && version && !version.isCurrent && (
					<Button key="restore" type="primary" icon={<HistoryOutlined />} disabled={!data} onClick={confirmRestore}>
						{t("setting.form.versions.restore")}
					</Button>
				),
			]}
		>
			{version && (
				<Descriptions size="small" column={3} className="mb-3">
					<Descriptions.Item label={t("setting.form.versions.createdBy")}>{version.createdBy?.fullName ?? "—"}</Descriptions.Item>
					<Descriptions.Item label={t("setting.form.versions.createdAt")}>{dayjs(version.createdAt).format("DD/MM/YYYY HH:mm")}</Descriptions.Item>
					<Descriptions.Item label={t("setting.form.versions.status")}>
						{version.isCurrent ? <Tag color="success" bordered={false} className="m-0">{t("setting.form.versions.current")}</Tag> : "—"}
					</Descriptions.Item>
				</Descriptions>
			)}
			{loading || !data
				? <Skeleton active paragraph={{ rows: 6 }} />
				: data.formSchema.length
					? (
						// Form xem trước chỉ đọc: người xem thấy đúng các ô nhập mà phiếu tạo ở phiên bản này sẽ có
						<Form layout="vertical" disabled className="grid grid-cols-1 gap-x-4 md:grid-cols-2 [&>.ant-form-item:has(textarea)]:md:col-span-2">
							<PayloadFormItems fields={data.formSchema} disabled />
						</Form>
					)
					: <Empty description={t("setting.form.versions.noFields")} />}
		</FormModal>
	);
}
