import type { AttachmentConfig, RequestTypeEntity } from "#src/api/setting/request-type";
import type { FullscreenModalRef } from "#src/components/fullscreen-modal";
import type { Tab } from "./tab-bar";
import { DEFAULT_ATTACHMENT_CONFIG, requestTypeService, RequestTypeStatus } from "#src/api/setting/request-type";
import { FullscreenModal } from "#src/components/fullscreen-modal";
import { useAccess } from "#src/hooks/use-access";
import { PermissionType } from "#src/hooks/use-access/permission-type.enum.js";
import { Button, Form, Spin, Tag } from "antd";
import * as React from "react";
import { useImperativeHandle, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AttachmentConfigTab } from "./attachment-config-tab";
import { GeneralTab } from "./general-tab";
import { Header } from "./header";
import { IntegrationTab } from "./integration-tab";
import { PermissionTab } from "./permission-tab";
import { TabBar } from "./tab-bar";
import { VersionTab } from "./version-tab";
import { WorkflowTab } from "./workflow-tab";

export interface DetailRef {
	show: (id?: string) => Promise<{ isChange: boolean } | undefined>
}

interface DetailProps {
	ref: React.Ref<DetailRef>
}

let guard: (res?: { isChange: boolean }) => void;

const statusColorMap: Record<RequestTypeStatus, string> = {
	[RequestTypeStatus.Draft]: "default",
	[RequestTypeStatus.Published]: "success",
	[RequestTypeStatus.Cancelled]: "error",
};

export function Detail({ ref }: DetailProps) {
	const { t } = useTranslation();
	const { canAccess } = useAccess();
	const [form] = Form.useForm<RequestTypeEntity>();
	const modalRef = useRef<FullscreenModalRef>(null);
	const [loading, setLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState("general");
	const [attachmentConfig, setAttachmentConfig] = useState<AttachmentConfig>(DEFAULT_ATTACHMENT_CONFIG);
	const [versionsToken, setVersionsToken] = useState(0);
	// Đã khôi phục phiên bản (backend đã lưu) trong lúc mở màn này → khi đóng báo bảng tải lại
	const changedRef = useRef(false);

	const watchedName = Form.useWatch("name", form);
	const watchedStatus = Form.useWatch("status", form);

	const loadItem = async (id: string) => {
		setLoading(true);
		try {
			const data = await requestTypeService.fetchRequestTypeItem(id);
			form.setFieldsValue(data);
			setAttachmentConfig({
				documents: { ...DEFAULT_ATTACHMENT_CONFIG.documents, ...data.attachmentConfig?.documents },
				attachments: { ...DEFAULT_ATTACHMENT_CONFIG.attachments, ...data.attachmentConfig?.attachments },
			});
		}
		catch {
			window.$message?.error(t("common.fetchError"));
		}
		finally {
			setLoading(false);
		}
	};

	useImperativeHandle(ref, () => ({
		show: async (id?: string) => {
			changedRef.current = false;
			form.resetFields();
			setEditingId(id ?? null);
			setActiveTab("general");
			setAttachmentConfig(DEFAULT_ATTACHMENT_CONFIG);
			setVersionsToken(token => token + 1);
			modalRef.current?.open();
			if (id)
				await loadItem(id);
			return new Promise<{ isChange: boolean } | undefined>((resolve) => {
				guard = resolve;
			});
		},
	}));

	const onFinish = async (formValues: RequestTypeEntity) => {
		// ProForm bỏ hẳn trường rỗng khỏi dữ liệu gửi đi → phải gửi null tường minh thì backend mới xóa mô tả
		const values = { ...formValues, description: formValues.description || null, attachmentConfig };
		setSubmitting(true);
		try {
			if (editingId) {
				await requestTypeService.fetchUpdateRequestType(editingId, values);
				window.$message?.success(t("common.updateSuccess"));
			}
			else {
				await requestTypeService.fetchAddRequestType(values);
				window.$message?.success(t("common.addSuccess"));
			}
			guard?.({ isChange: true });
			modalRef.current?.close();
		}
		catch {
			// error handled by global interceptor
		}
		finally {
			setSubmitting(false);
		}
	};

	/** Sau khi khôi phục (backend đã lưu toàn bộ, gồm cả mã): nạp lại dữ liệu loại + danh sách phiên bản, và báo bảng tải lại khi đóng */
	const reloadAfterRestore = async () => {
		changedRef.current = true;
		setActiveTab("general");
		setVersionsToken(token => token + 1);
		if (editingId)
			await loadItem(editingId);
	};

	const onClose = () => {
		modalRef.current?.close();
		setEditingId(null);
		form.resetFields();
		guard?.(changedRef.current ? { isChange: true } : undefined);
	};

	const statusBadge = watchedStatus
		? (
			<Tag color={statusColorMap[watchedStatus as RequestTypeStatus]}>
				{t(`setting.requestType.statusOptions.${watchedStatus}`)}
			</Tag>
		)
		: null;

	const extra = (
		<>
			<Button onClick={onClose}>{t("common.cancel")}</Button>
			<Button type="primary" loading={submitting} onClick={() => form.submit()}>
				{t("common.save")}
			</Button>
		</>
	);

	const tabs: Tab[] = [
		{ key: "general", label: t("setting.requestType.tabs.general"), children: <GeneralTab form={form} onFinish={onFinish} /> },
		{ key: "attachments", label: t("approval.attachmentConfig.tab"), children: <AttachmentConfigTab value={attachmentConfig} onChange={setAttachmentConfig} /> },
		{ key: "permission", label: t("setting.requestType.tabs.permission"), children: <PermissionTab /> },
		{ key: "workflow", label: t("setting.requestType.tabs.workflow"), children: <WorkflowTab /> },
		{ key: "integration", label: t("setting.requestType.tabs.integration"), children: <IntegrationTab /> },
		// Cuối cùng; không có khi tạo mới (chưa có phiên bản) và không có khi đang xem một phiên bản cũ
		...(editingId
			? [{
				key: "versions",
				label: t("setting.requestType.versions.title"),
				children: <VersionTab requestTypeId={editingId} refreshToken={versionsToken} canRestore={canAccess(PermissionType.UpdateRequestType)} onRestored={reloadAfterRestore} />,
			}]
			: []),
	];

	return (
		<FullscreenModal
			ref={modalRef}
			header={(
				<Header
					onClose={onClose}
					title={t("setting.requestType.detailTitle")}
					statusBadge={statusBadge}
					subtitle={watchedName}
					extra={extra}
				/>
			)}
		>
			<TabBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
			<div className="relative min-h-0 flex-1 overflow-y-auto p-6">
				{loading && (
					<div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
						<Spin size="large" />
					</div>
				)}
				{tabs.map(tab => (
					<div key={tab.key} className={tab.key === activeTab ? undefined : "hidden"}>
						{tab.children}
					</div>
				))}
			</div>
		</FullscreenModal>
	);
}
