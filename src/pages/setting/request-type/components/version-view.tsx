import type { AttachmentConfig, RequestTypeEntity, RequestTypeVersionBrief } from "#src/api/setting/request-type";
import type { FullscreenModalRef } from "#src/components/fullscreen-modal";
import type { Tab } from "./tab-bar";
import { DEFAULT_ATTACHMENT_CONFIG, requestTypeService } from "#src/api/setting/request-type";
import { FullscreenModal } from "#src/components/fullscreen-modal";
import { HistoryOutlined } from "@ant-design/icons";
import { useRequest } from "ahooks";
import { Button, ConfigProvider, Form, Spin, Tag } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AttachmentConfigTab } from "./attachment-config-tab";
import { GeneralTab } from "./general-tab";
import { Header } from "./header";
import { IntegrationTab } from "./integration-tab";
import { PermissionTab } from "./permission-tab";
import { TabBar } from "./tab-bar";
import { WorkflowTab } from "./workflow-tab";

interface VersionViewProps {
	requestTypeId: string
	/** null = đóng */
	version: RequestTypeVersionBrief | null
	canRestore: boolean
	onClose: () => void
	/** Đã khôi phục xong (backend đã lưu và sinh phiên bản mới): màn cha nạp lại dữ liệu */
	onRestored: () => void
}

async function noop() {}

/**
 * Xem một phiên bản của loại tờ trình như màn chi tiết nhưng CHỈ ĐỌC: cùng các tab, không có tab "Phiên bản",
 * mọi ô nhập bị khóa. (Trạng thái xuất bản không thuộc phiên bản nên không hiển thị.)
 */
export function VersionView({ requestTypeId, version, canRestore, onClose, onRestored }: VersionViewProps) {
	const { t } = useTranslation();
	const [form] = Form.useForm<RequestTypeEntity>();
	const modalRef = useRef<FullscreenModalRef>(null);
	// Tab đang xem gắn với phiên bản đang mở: mở phiên bản khác thì tự về tab đầu, không cần reset trong effect
	const [tabState, setTabState] = useState({ versionId: "", tab: "general" });
	const activeTab = tabState.versionId === version?.id ? tabState.tab : "general";

	const { data: detail, loading } = useRequest(
		() => requestTypeService.fetchVersion(requestTypeId, version!.id),
		{ ready: !!version, refreshDeps: [version?.id] },
	);

	useEffect(() => {
		if (version) {
			modalRef.current?.open();
		}
		else {
			modalRef.current?.close();
		}
	}, [version]);

	useEffect(() => {
		if (!detail)
			return;
		form.setFieldsValue({
			status: detail.status,
			code: detail.code,
			name: detail.name,
			prefix: detail.prefix,
			description: detail.description ?? undefined,
			category: detail.category as RequestTypeEntity["category"],
			form: detail.form,
		});
	}, [detail, form]);

	const attachmentConfig: AttachmentConfig = useMemo(() => ({
		documents: { ...DEFAULT_ATTACHMENT_CONFIG.documents, ...detail?.attachmentConfig?.documents },
		attachments: { ...DEFAULT_ATTACHMENT_CONFIG.attachments, ...detail?.attachmentConfig?.attachments },
	}), [detail]);

	const confirmRestore = () => {
		if (!detail || !version)
			return;
		window.$modal?.confirm({
			title: t("setting.requestType.versions.restoreConfirmTitle", { version: version.version }),
			content: t("setting.requestType.versions.restoreConfirmContent"),
			okText: t("setting.requestType.versions.restore"),
			// Trả về promise để nút OK hiện trạng thái đang xử lý; lỗi (vd: mã đã bị loại khác dùng) do interceptor báo và giữ hộp xác nhận mở
			onOk: async () => {
				await requestTypeService.fetchRestoreVersion(requestTypeId, version.id);
				window.$message?.success(t("setting.requestType.versions.restored", { version: version.version }));
				onRestored();
				onClose();
			},
		});
	};

	const tabs: Tab[] = [
		{ key: "general", label: t("setting.requestType.tabs.general"), children: <GeneralTab form={form} onFinish={noop} /> },
		{ key: "attachments", label: t("approval.attachmentConfig.tab"), children: <AttachmentConfigTab value={attachmentConfig} onChange={noop} readOnly /> },
		{ key: "permission", label: t("setting.requestType.tabs.permission"), children: <PermissionTab /> },
		{ key: "workflow", label: t("setting.requestType.tabs.workflow"), children: <WorkflowTab /> },
		{ key: "integration", label: t("setting.requestType.tabs.integration"), children: <IntegrationTab /> },
	];

	return (
		<FullscreenModal
			ref={modalRef}
			header={(
				<Header
					onClose={onClose}
					title={t("setting.requestType.detailTitle")}
					statusBadge={version && (
						<>
							<Tag color="processing">{t("setting.requestType.versions.label", { version: version.version })}</Tag>
							{version.isCurrent && <Tag color="success">{t("setting.requestType.versions.current")}</Tag>}
						</>
					)}
					subtitle={detail?.name ?? version?.name}
					extra={(
						<>
							<Button onClick={onClose}>{t("setting.requestType.versions.close")}</Button>
							{canRestore && version && !version.isCurrent && (
								<Button type="primary" icon={<HistoryOutlined />} disabled={!detail} onClick={confirmRestore}>
									{t("setting.requestType.versions.restore")}
								</Button>
							)}
						</>
					)}
				/>
			)}
		>
			<TabBar tabs={tabs} activeTab={activeTab} onChange={tab => setTabState({ versionId: version?.id ?? "", tab })} />
			<div className="relative min-h-0 flex-1 overflow-y-auto p-6">
				{loading && (
					<div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
						<Spin size="large" />
					</div>
				)}
				{/* Chỉ xem: khóa toàn bộ ô nhập bên trong */}
				<ConfigProvider componentDisabled>
					{tabs.map(tab => (
						<div key={tab.key} className={tab.key === activeTab ? undefined : "hidden"}>
							{tab.children}
						</div>
					))}
				</ConfigProvider>
			</div>
		</FullscreenModal>
	);
}
