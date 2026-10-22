import type { ApprovalWorkflowDetail, ApprovalWorkflowVersion } from "#src/api/approval-workflow/types";
import { approvalWorkflowService } from "#src/api/approval-workflow";
import { resolveApproverNames } from "#src/components/approval-flow-graph/user-names";
import { BasicContent } from "#src/components/basic-content";
import { useAccess } from "#src/hooks/use-access";
import { PermissionType } from "#src/hooks/use-access/permission-type.enum";
import { ArrowLeftOutlined, CloudUploadOutlined, PlayCircleOutlined, SaveOutlined } from "@ant-design/icons";
import { ReactFlowProvider } from "@xyflow/react";
import { useRequest } from "ahooks";
import { Badge, Button, Result, Space, Tag, theme, Tooltip, Typography } from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { DesignerCanvas } from "./canvas/DesignerCanvas";
import { DesignerSkeleton } from "./designer-skeleton";
import { NodeInspector } from "./inspector/NodeInspector";
import { emptyDefinition, toDefinition } from "./lib/to-definition";
import { NodePalette } from "./palette/NodePalette";
import { VersionPreviewModal } from "./palette/VersionPreviewModal";
import { SimulateModal } from "./simulate/SimulateModal";
import { createDesignerStore, DesignerStoreContext, useDesigner, useDesignerStoreApi } from "./store/designer.store";

/** Màn thiết kế quy trình phê duyệt — /setting/approval-workflow/:id */
export default function WorkflowDesignerPage() {
	// Mỗi trang có store riêng (keep-alive nhiều tab không dùng chung trạng thái)
	const [store] = useState(createDesignerStore);
	return (
		<DesignerStoreContext value={store}>
			<ReactFlowProvider>
				<WorkflowDesigner />
			</ReactFlowProvider>
		</DesignerStoreContext>
	);
}

/** Phần tử còn hiển thị không (trang keep-alive bị ẩn thì bỏ qua phím tắt) */
const isVisible = (el: HTMLElement | null) => !!el && el.offsetParent !== null;

function WorkflowDesigner() {
	const { id = "" } = useParams();
	const navigate = useNavigate();
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const { canAccess } = useAccess();
	const canEdit = canAccess(PermissionType.UpdateApprovalWorkflow);
	const canPublish = canAccess(PermissionType.PublishApprovalWorkflow);

	const store = useDesignerStoreApi();
	const dirty = useDesigner(s => s.dirty);
	const userNames = useDesigner(s => s.userNames);
	const rootRef = useRef<HTMLDivElement>(null);

	const [detail, setDetail] = useState<ApprovalWorkflowDetail | null>(null);
	const [savedAt, setSavedAt] = useState<string>();
	const [saving, setSaving] = useState(false);
	const [publishing, setPublishing] = useState(false);
	const [simulateOpen, setSimulateOpen] = useState(false);
	const [previewVersion, setPreviewVersion] = useState<ApprovalWorkflowVersion | null>(null);

	const fields = useMemo(() => detail?.requestType?.formSchema ?? [], [detail]);

	/** Tải chi tiết; withGraph = nạp lại cả đồ thị vào store (bỏ thay đổi chưa lưu) */
	const loadDetail = useCallback(async (withGraph: boolean) => {
		const d = await approvalWorkflowService.fetchDetail(id);
		setDetail(d);
		if (withGraph) {
			// Không có bản nháp → bắt đầu từ bản đang áp dụng; lưu sẽ tạo bản nháp mới
			const definition = d.draftVersion?.definition ?? d.publishedVersion?.definition ?? emptyDefinition();
			store.getState().load(definition);
			setSavedAt(d.draftVersion?.updatedAt);
			resolveApproverNames(definition, store.getState().userNames).then((names) => {
				if (Object.keys(names).length)
					store.getState().setUserNames(names);
			});
		}
		return d;
	}, [id, store]);

	const { error: loadError } = useRequest(() => loadDetail(true), { ready: !!id, refreshDeps: [id] });

	const save = useCallback(async (silent = false): Promise<boolean> => {
		const snapshot = store.getState();
		setSaving(true);
		try {
			const res = await approvalWorkflowService.fetchSaveDraft(id, toDefinition(snapshot.nodes, snapshot.edges));
			// Chỉ đánh dấu đã lưu nếu không có thay đổi mới trong lúc gửi
			const now = store.getState();
			if (now.nodes === snapshot.nodes && now.edges === snapshot.edges)
				now.markSaved();
			setSavedAt(res.updatedAt);
			if (detail?.draftVersion?.id !== res.id)
				await loadDetail(false);
			if (!silent)
				window.$message?.success(t("workflowDesigner.messages.saved"));
			return true;
		}
		catch {
			return false;
		}
		finally {
			setSaving(false);
		}
	}, [id, store, detail, loadDetail, t]);

	const publish = async () => {
		if (!detail)
			return;
		if (!dirty && !detail.draftVersion) {
			window.$message?.info(t("workflowDesigner.messages.noDraft"));
			return;
		}
		setPublishing(true);
		try {
			if (dirty && !(await save(true)))
				return;
			const { valid, errors } = await approvalWorkflowService.fetchValidate(id);
			if (!valid || errors.length) {
				store.getState().setErrors(errors);
				window.$message?.error(t("workflowDesigner.messages.invalid", { count: errors.length }));
				return;
			}
			const draftVersion = (await approvalWorkflowService.fetchDetail(id)).draftVersion?.version;
			window.$modal?.confirm({
				title: t("workflowDesigner.messages.publishConfirmTitle"),
				content: t("workflowDesigner.messages.publishConfirmContent", { version: draftVersion ?? "" }),
				okText: t("workflowDesigner.actions.publish"),
				onOk: async () => {
					const res = await approvalWorkflowService.fetchPublish(id);
					window.$message?.success(t("workflowDesigner.messages.published", { version: res.version }));
					await loadDetail(true);
				},
			});
		}
		catch {
			// lỗi HTTP đã được request interceptor thông báo
		}
		finally {
			setPublishing(false);
		}
	};

	// Ctrl/Cmd + S → lưu nháp
	const saveRef = useRef(save);
	saveRef.current = save;
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "s" || !isVisible(rootRef.current))
				return;
			e.preventDefault();
			if (canEdit)
				saveRef.current();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [canEdit]);

	// Cảnh báo khi đóng / tải lại trình duyệt lúc còn thay đổi chưa lưu
	useEffect(() => {
		if (!dirty)
			return;
		const onBeforeUnload = (e: BeforeUnloadEvent) => {
			e.preventDefault();
			e.returnValue = "";
		};
		window.addEventListener("beforeunload", onBeforeUnload);
		return () => window.removeEventListener("beforeunload", onBeforeUnload);
	}, [dirty]);

	const goBack = () => {
		if (!dirty) {
			navigate("/setting/approval-workflow");
			return;
		}
		window.$modal?.confirm({
			title: t("workflowDesigner.messages.leaveConfirmTitle"),
			content: t("workflowDesigner.messages.leaveConfirmContent"),
			okButtonProps: { danger: true },
			okText: t("workflowDesigner.actions.leave"),
			onOk: () => navigate("/setting/approval-workflow"),
		});
	};

	const getDefinition = useCallback(() => {
		const s = store.getState();
		return toDefinition(s.nodes, s.edges);
	}, [store]);

	if (!detail && !loadError)
		return <DesignerSkeleton />;

	if (loadError || !detail) {
		return (
			<BasicContent className="h-full">
				<Result
					status="warning"
					title={t("workflowDesigner.messages.loadFailed")}
					extra={<Button onClick={() => navigate("/setting/approval-workflow")}>{t("workflowDesigner.actions.back")}</Button>}
				/>
			</BasicContent>
		);
	}

	const editing = detail.draftVersion
		? { version: detail.draftVersion.version, status: "draft" as const, color: "processing" }
		: detail.publishedVersion
			? { version: detail.publishedVersion.version, status: "published" as const, color: "success" }
			: null;

	const border = `1px solid ${token.colorBorderSecondary}`;

	return (
		<BasicContent className="h-full">
			<div
				ref={rootRef}
				className="flex h-full min-h-[600px] flex-col overflow-hidden"
				style={{ background: token.colorBgContainer, borderRadius: token.borderRadiusLG, border }}
			>
				{/* Header */}
				<div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5" style={{ borderBottom: border }}>
					<div className="flex min-w-0 items-center gap-2">
						<Button type="text" icon={<ArrowLeftOutlined />} onClick={goBack} />
						<div className="min-w-0">
							<Typography.Text type="secondary" className="block text-xs">
								{t("workflowDesigner.title")}
								{" · "}
								{detail.requestType?.name}
							</Typography.Text>
							<div className="flex min-w-0 items-center gap-2">
								<Typography.Text strong className="truncate text-[15px]">{detail.name}</Typography.Text>
								{editing && (
									<Tooltip title={editing.status === "published" ? t("workflowDesigner.version.editingPublishedHint") : undefined}>
										<Tag color={editing.color} bordered={false} className="m-0">
											{t("workflowDesigner.version.label", { version: editing.version, status: t(`workflowDesigner.version.${editing.status}`) })}
										</Tag>
									</Tooltip>
								)}
								{dirty
									? <Badge status="warning" text={<span className="text-xs">{t("workflowDesigner.unsaved")}</span>} />
									: savedAt && (
										<Typography.Text type="secondary" className="text-xs">
											{t("workflowDesigner.savedAt", { time: dayjs(savedAt).format("HH:mm") })}
										</Typography.Text>
									)}
							</div>
						</div>
					</div>
					<Space>
						<Button icon={<PlayCircleOutlined />} onClick={() => setSimulateOpen(true)}>
							{t("workflowDesigner.actions.simulate")}
						</Button>
						<Tooltip title="Ctrl + S">
							<Button icon={<SaveOutlined />} loading={saving} disabled={!canEdit} onClick={() => save()}>
								{t("workflowDesigner.actions.saveDraft")}
							</Button>
						</Tooltip>
						{canPublish && (
							<Button type="primary" icon={<CloudUploadOutlined />} loading={publishing} onClick={publish}>
								{t("workflowDesigner.actions.publish")}
							</Button>
						)}
					</Space>
				</div>

				{/* 3 cột */}
				<div className="flex min-h-0 flex-1">
					<aside className="w-[260px] shrink-0 overflow-auto" style={{ borderRight: border, background: token.colorBgLayout }}>
						<NodePalette
							detail={detail}
							readOnly={!canEdit}
							canEdit={canEdit}
							onMetaSaved={() => loadDetail(false)}
							onPreviewVersion={setPreviewVersion}
						/>
					</aside>
					<main className="relative min-w-0 flex-1">
						<DesignerCanvas readOnly={!canEdit} fields={fields} />
					</main>
					<aside className="w-[340px] shrink-0 overflow-hidden" style={{ borderLeft: border }}>
						<NodeInspector fields={fields} disabled={!canEdit} />
					</aside>
				</div>
			</div>

			<SimulateModal
				open={simulateOpen}
				onClose={() => setSimulateOpen(false)}
				workflowId={id}
				fields={fields}
				getDefinition={getDefinition}
			/>
			<VersionPreviewModal
				workflowId={id}
				version={previewVersion}
				fields={fields}
				userNames={userNames}
				canRestore={canEdit}
				dirty={dirty}
				onClose={() => setPreviewVersion(null)}
				onRestored={() => {
					setPreviewVersion(null);
					loadDetail(true);
				}}
			/>
		</BasicContent>
	);
}
