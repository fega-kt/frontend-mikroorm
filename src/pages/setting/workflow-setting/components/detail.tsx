import type { WfApprovalDataPayload, WorkflowSettingEntity, WorkflowSettingPayload } from "#src/api/setting/workflow-setting";
import type { FullscreenModalRef } from "#src/components/fullscreen-modal";
import type { BpmnTabRef } from "./bpmn-tab";
import type { Tab } from "./tab-bar";
import { workflowSettingService, WorkflowSettingStatus } from "#src/api/setting/workflow-setting";
import { FullscreenModal } from "#src/components/fullscreen-modal";
import { useAccess } from "#src/hooks/use-access";
import { PermissionType } from "#src/hooks/use-access/permission-type.enum.js";
import { CloudUploadOutlined } from "@ant-design/icons";
import { Button, Form, Spin, Tag } from "antd";
import * as React from "react";
import { useImperativeHandle, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BpmnTab } from "./bpmn-tab";
import { GeneralTab } from "./general-tab";
import { Header } from "./header";
import { TabBar } from "./tab-bar";

export interface DetailRef {
	show: (id?: string) => Promise<{ isChange: boolean } | undefined>
}

interface DetailProps {
	ref: React.Ref<DetailRef>
}

let guard: (res?: { isChange: boolean }) => void;

const statusColorMap: Record<WorkflowSettingStatus, string> = {
	[WorkflowSettingStatus.Draft]: "default",
	[WorkflowSettingStatus.Published]: "success",
	[WorkflowSettingStatus.Cancelled]: "error",
};

function toProcessDefinitionKey(workflowSettingId: string): string {
	return `wf_${workflowSettingId.replace(/[^\w.-]/g, "_")}`;
}

export function Detail({ ref }: DetailProps) {
	const { t } = useTranslation();
	const { canAccess } = useAccess();
	const [form] = Form.useForm<WorkflowSettingEntity>();
	const modalRef = useRef<FullscreenModalRef>(null);
	const bpmnTabRef = useRef<BpmnTabRef>(null);
	const [loading, setLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [deploying, setDeploying] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState("general");
	const mountedTabsRef = useRef(new Set(["general"]));

	const watchedName = Form.useWatch("name", form);
	const watchedStatus = Form.useWatch("status", form);

	// Track which tabs have been rendered so BpmnTab mounts lazily
	// (only after data is loaded), ensuring form values are ready on mount.
	mountedTabsRef.current.add(activeTab);

	useImperativeHandle(ref, () => ({
		show: async (id?: string) => {
			form.resetFields();
			setEditingId(id ?? null);
			setActiveTab("general");
			mountedTabsRef.current = new Set(["general"]);
			modalRef.current?.open();
			if (id) {
				setLoading(true);
				try {
					const data = await workflowSettingService.fetchWorkflowSettingItem(id);
					form.setFieldsValue(data);
				}
				catch {
					window.$message?.error(t("common.fetchError"));
				}
				finally {
					setLoading(false);
				}
			}
			return new Promise<{ isChange: boolean } | undefined>((resolve) => {
				guard = resolve;
			});
		},
	}));

	const onFinish = async () => {
		setSubmitting(true);
		bpmnTabRef.current?.flushConfigToForm();
		const values: WorkflowSettingEntity = form.getFieldsValue(true);

		const approvalConfig = values.approvalConfig
			? Object.fromEntries(
				Object.entries(values.approvalConfig).map(([nodeId, data]): [string, WfApprovalDataPayload] => [
					nodeId,
					{
						...data,
						approvers: data.approvers?.map(cfg => ({
							...cfg,
							approvers: cfg.approvers?.map(p => p.id),
						})),
					},
				]),
			)
			: undefined;

		const payload: WorkflowSettingPayload = { ...values, approvalConfig };

		try {
			if (editingId) {
				await workflowSettingService.fetchUpdateWorkflowSetting(editingId, payload);
				window.$message?.success(t("common.updateSuccess"));
			}
			else {
				await workflowSettingService.fetchAddWorkflowSetting(payload);
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

	const onClose = () => {
		modalRef.current?.close();
		setEditingId(null);
		form.resetFields();
		guard?.();
	};

	const onDeploy = async () => {
		if (!editingId)
			return;
		setDeploying(true);
		try {
			const processDefinitionKey = toProcessDefinitionKey(editingId);
			const xml = await bpmnTabRef.current?.exportXml(processDefinitionKey);
			if (!xml) {
				window.$message?.error(t("setting.workflowSetting.deployMissingDefinition"));
				return;
			}
			const file = new Blob([xml], { type: "application/xml" });
			const updated = await workflowSettingService.fetchDeployWorkflowSetting(editingId, file, processDefinitionKey);
			form.setFieldsValue({ processDefinitionKey: updated.processDefinitionKey });
			window.$message?.success(t("setting.workflowSetting.deploySuccess"));
		}
		catch (error) {
			window.$message?.error(error instanceof Error ? error.message : t("common.updateError"));
		}
		finally {
			setDeploying(false);
		}
	};

	const statusBadge = watchedStatus
		? (
			<Tag color={statusColorMap[watchedStatus as WorkflowSettingStatus]}>
				{t(`setting.workflowSetting.statusOptions.${watchedStatus}`)}
			</Tag>
		)
		: null;

	const extra = (
		<>
			<Button onClick={onClose}>{t("common.cancel")}</Button>
			{editingId && (
				<Button
					icon={<CloudUploadOutlined />}
					loading={deploying}
					disabled={!canAccess(PermissionType.DeployWorkflowSetting)}
					onClick={onDeploy}
				>
					{t("setting.workflowSetting.deploy")}
				</Button>
			)}
			<Button type="primary" loading={submitting} onClick={() => form.submit()}>
				{t("common.save")}
			</Button>
		</>
	);

	const tabs: Tab[] = [
		{ key: "general", label: t("setting.workflowSetting.tabs.general"), children: <GeneralTab form={form} onFinish={onFinish} /> },
		{
			key: "workflow",
			label: t("setting.workflowSetting.tabs.workflow"),
			children: <BpmnTab ref={bpmnTabRef} form={form} workflowSettingId={editingId ?? undefined} />,
		},
	];

	return (
		<FullscreenModal
			ref={modalRef}
			header={(
				<Header
					onClose={onClose}
					title={t("setting.workflowSetting.detailTitle")}
					statusBadge={statusBadge}
					subtitle={watchedName}
					extra={extra}
				/>
			)}
		>
			<div className="h-full flex flex-col">
				<TabBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
				<div className={activeTab === "workflow" ? "flex-1 overflow-hidden relative" : "flex-1 overflow-y-auto p-6 relative"}>
					{loading && (
						<div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
							<Spin size="large" />
						</div>
					)}
					{tabs.map(tab => (
						<div
							key={tab.key}
							className={tab.key === activeTab ? (tab.key === "workflow" ? "h-full" : undefined) : "hidden"}
						>
							{mountedTabsRef.current.has(tab.key) && tab.children}
						</div>
					))}
				</div>
			</div>
		</FullscreenModal>
	);
}
