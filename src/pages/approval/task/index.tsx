import type { FlowableTask } from "#src/api/approval/task";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import type { CompleteModalRef } from "./components/complete-modal";
import { approvalTaskService } from "#src/api/approval/task";
import { BasicContent } from "#src/components/basic-content";
import { BasicTable } from "#src/components/basic-table";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { Button, Space, Tooltip } from "antd";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { CompleteModal } from "./components/complete-modal";
import { getConstantColumns } from "./constants";

export default function ApprovalTaskPage() {
	const { t } = useTranslation();
	const actionRef = useRef<ActionType>(null);
	const completeRef = useRef<CompleteModalRef>(null);

	const handleApprove = async (taskId: string) => {
		const res = await completeRef.current?.show(taskId, "APPROVE");
		if (res?.isChange) {
			actionRef.current?.reload();
		}
	};

	const handleReject = async (taskId: string) => {
		const res = await completeRef.current?.show(taskId, "REJECT");
		if (res?.isChange) {
			actionRef.current?.reload();
		}
	};

	const columns: ProColumns<FlowableTask>[] = [
		...getConstantColumns(t),
		{
			title: t("common.action"),
			valueType: "option",
			key: "option",
			width: 160,
			fixed: "right",
			render: (_, record) => (
				<Space>
					<Tooltip title={t("approval.task.decisionApprove")}>
						<Button
							type="primary"
							size="small"
							icon={<CheckCircleOutlined />}
							onClick={() => handleApprove(record.id)}
						>
							{t("approval.task.decisionApprove")}
						</Button>
					</Tooltip>
					<Tooltip title={t("approval.task.decisionReject")}>
						<Button
							danger
							size="small"
							icon={<CloseCircleOutlined />}
							onClick={() => handleReject(record.id)}
						>
							{t("approval.task.decisionReject")}
						</Button>
					</Tooltip>
				</Space>
			),
		},
	];

	return (
		<BasicContent className="h-full">
			<BasicTable<FlowableTask>
				columns={columns}
				actionRef={actionRef}
				rowKey="id"
				search={false}
				request={async (params) => {
					const { data, total } = await approvalTaskService.fetchMyTasks({
						page: params.current,
						size: params.pageSize,
					});
					return { data, total, success: true };
				}}
				headerTitle={t("approval.task.title")}
				polling={30000}
			/>
			<CompleteModal ref={completeRef} />
		</BasicContent>
	);
}
