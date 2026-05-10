import type { RequestTypeEntity } from "#src/api/setting/request-type";
import type { FullscreenModalRef } from "#src/components/fullscreen-modal";
import type { Tab } from "./tab-bar";
import { requestTypeService, RequestTypeStatus } from "#src/api/setting/request-type";
import { FullscreenModal } from "#src/components/fullscreen-modal";
import { Button, Form, Spin, Tag } from "antd";
import * as React from "react";
import { useImperativeHandle, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FormDocTab } from "./form-doc-tab";
import { GeneralTab } from "./general-tab";
import { Header } from "./header";
import { IntegrationTab } from "./integration-tab";
import { PermissionTab } from "./permission-tab";
import { TabBar } from "./tab-bar";
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
	const [form] = Form.useForm<RequestTypeEntity>();
	const modalRef = useRef<FullscreenModalRef>(null);
	const [loading, setLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState("general");

	const watchedName = Form.useWatch("name", form);
	const watchedStatus = Form.useWatch("status", form);

	useImperativeHandle(ref, () => ({
		show: async (id?: string) => {
			form.resetFields();
			setEditingId(id ?? null);
			setActiveTab("general");
			modalRef.current?.open();
			if (id) {
				setLoading(true);
				try {
					const data = await requestTypeService.fetchRequestTypeItem(id);
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

	const onFinish = async (values: RequestTypeEntity) => {
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

	const onClose = () => {
		modalRef.current?.close();
		setEditingId(null);
		form.resetFields();
		guard?.();
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
		{ key: "formDoc", label: t("setting.requestType.tabs.formDoc"), children: <FormDocTab /> },
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
					statusBadge={statusBadge}
					subtitle={watchedName}
					extra={extra}
				/>
			)}
		>
			<TabBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
			<div className="flex-1 overflow-y-auto p-6 relative">
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
