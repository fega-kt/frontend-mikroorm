import type { WfApprovalData, WorkflowSettingEntity } from "#src/api/setting/workflow-setting";
import type { FullscreenModalRef } from "#src/components/fullscreen-modal";
import type { Tab } from "./tab-bar";
import { workflowSettingService, WorkflowSettingStatus } from "#src/api/setting/workflow-setting";
import { FullscreenModal } from "#src/components/fullscreen-modal";
import { Button, Form, Spin, Tag } from "antd";
import * as React from "react";
import { useImperativeHandle, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { GeneralTab } from "./general-tab";
import { Header } from "./header";
import { TabBar } from "./tab-bar";
import { WorkflowTab } from "./workflow-tab";

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

export function Detail({ ref }: DetailProps) {
	const { t } = useTranslation();
	const [form] = Form.useForm<WorkflowSettingEntity>();
	const modalRef = useRef<FullscreenModalRef>(null);
	const [loading, setLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState("general");
	const mountedTabsRef = useRef(new Set(["general"]));

	const watchedName = Form.useWatch("name", form);
	const watchedStatus = Form.useWatch("status", form);

	// Track which tabs have been rendered so WorkflowTab mounts lazily
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
		const values: WorkflowSettingEntity = form.getFieldsValue(true);
		values.workflowDefinition?.nodes.forEach((node) => {
			if (node.type === "approval") {
				const data = node.data as WfApprovalData;
				data.approvers = data.approvers?.map(cfg => ({
					...cfg,
					approvers: cfg.approvers?.map((p: unknown) => (typeof p === "object" ? p.id : p)),
				}));
			}
		});
		try {
			if (editingId) {
				await workflowSettingService.fetchUpdateWorkflowSetting(editingId, values);
				window.$message?.success(t("common.updateSuccess"));
			}
			else {
				await workflowSettingService.fetchAddWorkflowSetting(values);
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
			<Button type="primary" loading={submitting} onClick={() => form.submit()}>
				{t("common.save")}
			</Button>
		</>
	);

	const tabs: Tab[] = [
		{ key: "general", label: t("setting.workflowSetting.tabs.general"), children: <GeneralTab form={form} onFinish={onFinish} /> },
		{ key: "workflow", label: t("setting.workflowSetting.tabs.workflow"), children: <WorkflowTab form={form} /> },
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
