import type { WorkflowTaskEntity } from "#src/api/workflow-task";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { workflowActionsService } from "#src/api/workflow-actions";
import { workflowTaskService, WorkflowTaskStatus } from "#src/api/workflow-task";
import { BasicContent } from "#src/components/basic-content";
import { BasicTable } from "#src/components/basic-table";
import { useAccess } from "#src/hooks/use-access";
import { PermissionType } from "#src/hooks/use-access/permission-type.enum.js";
import { CheckOutlined, CloseOutlined, RollbackOutlined } from "@ant-design/icons";
import { Button, Input, Modal, Tooltip } from "antd";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { getConstantColumns } from "./constants";

type WorkflowActionKind = "approve" | "reject" | "return";

const actionMethodMap = {
	approve: (payload: { workflowTaskId: string, comment?: string }) => workflowActionsService.approveTask(payload),
	reject: (payload: { workflowTaskId: string, comment?: string }) => workflowActionsService.rejectTask(payload),
	return: (payload: { workflowTaskId: string, comment?: string }) => workflowActionsService.returnTask(payload),
};

export default function MyTasks() {
	const { t } = useTranslation();
	const { canAccess } = useAccess();
	const actionRef = useRef<ActionType>(null);
	const [actionState, setActionState] = useState<{ kind: WorkflowActionKind, task: WorkflowTaskEntity } | null>(null);
	const [comment, setComment] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const openAction = (kind: WorkflowActionKind, task: WorkflowTaskEntity) => {
		setActionState({ kind, task });
		setComment("");
	};

	const closeAction = () => setActionState(null);

	const handleConfirm = async () => {
		if (!actionState)
			return;
		setSubmitting(true);
		try {
			await actionMethodMap[actionState.kind]({ workflowTaskId: actionState.task.id, comment: comment || undefined });
			window.$message?.success(t(`setting.workflowTask.${actionState.kind}Success`));
			closeAction();
			actionRef.current?.reload();
		}
		finally {
			setSubmitting(false);
		}
	};

	const columns: ProColumns<WorkflowTaskEntity>[] = [
		...getConstantColumns(t),
		{
			title: t("common.action"),
			valueType: "option",
			key: "option",
			width: 140,
			fixed: "right",
			render: (_, record) => record.status !== WorkflowTaskStatus.Pending
				? []
				: [
					<Tooltip key="approve" title={t("setting.workflowTask.approve")}>
						<Button
							type="text"
							size="small"
							icon={<CheckOutlined />}
							disabled={!canAccess(PermissionType.ApproveWorkflowTask)}
							onClick={() => openAction("approve", record)}
						/>
					</Tooltip>,
					<Tooltip key="return" title={t("setting.workflowTask.return")}>
						<Button
							type="text"
							size="small"
							icon={<RollbackOutlined />}
							disabled={!canAccess(PermissionType.ReturnWorkflowTask)}
							onClick={() => openAction("return", record)}
						/>
					</Tooltip>,
					<Tooltip key="reject" title={t("setting.workflowTask.reject")}>
						<Button
							type="text"
							size="small"
							danger
							icon={<CloseOutlined />}
							disabled={!canAccess(PermissionType.RejectWorkflowTask)}
							onClick={() => openAction("reject", record)}
						/>
					</Tooltip>,
				],
		},
	];

	return (
		<BasicContent className="h-full">
			<BasicTable<WorkflowTaskEntity>
				columns={columns}
				actionRef={actionRef}
				request={async (params) => {
					const { data, total } = await workflowTaskService.fetchMyTasks(params);
					return { data, total, success: true };
				}}
				headerTitle={t("common.menu.myTasks")}
			/>
			<Modal
				title={actionState ? t(`setting.workflowTask.confirm${actionState.kind[0].toUpperCase()}${actionState.kind.slice(1)}`) : ""}
				open={!!actionState}
				onOk={handleConfirm}
				onCancel={closeAction}
				confirmLoading={submitting}
				okText={t("common.confirm")}
				cancelText={t("common.cancel")}
				destroyOnHidden
			>
				<Input.TextArea
					rows={3}
					value={comment}
					onChange={e => setComment(e.target.value)}
					placeholder={t("setting.workflowTask.commentPlaceholder")}
				/>
			</Modal>
		</BasicContent>
	);
}
