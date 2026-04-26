import type { SprintEntity, SprintPayload } from "#src/api/sprint/types";
import { sprintService } from "#src/api/sprint";
import { SprintStatus } from "#src/api/sprint/types";
import { taskService } from "#src/api/task";
import { TaskStatus } from "#src/api/task/types";
import {
	DeleteOutlined,
	EditOutlined,
	PlayCircleOutlined,
	PlusOutlined,
	StopOutlined,
} from "@ant-design/icons";
import {
	Badge,
	Button,
	Card,
	Col,
	DatePicker,
	Form,
	Input,
	Modal,
	Popconfirm,
	Progress,
	Row,
	Select,
	Space,
	Statistic,
	Tag,
	Tooltip,
	Typography,
} from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

const STATUS_CONFIG: Record<SprintStatus, { color: string, label: string }> = {
	[SprintStatus.PLANNING]: { color: "default", label: "Lên kế hoạch" },
	[SprintStatus.ACTIVE]: { color: "processing", label: "Đang chạy" },
	[SprintStatus.COMPLETED]: { color: "success", label: "Hoàn thành" },
	[SprintStatus.CANCELLED]: { color: "error", label: "Đã hủy" },
};

interface SprintTabProps {
	projectId: string
}

export function SprintTab({ projectId }: SprintTabProps) {
	const { t } = useTranslation();
	const [sprints, setSprints] = useState<SprintEntity[]>([]);
	const [taskCounts, setTaskCounts] = useState<Record<string, { total: number, done: number }>>({});
	const [loading, setLoading] = useState(false);
	const [modalOpen, setModalOpen] = useState(false);
	const [editingId, setEditingId] = useState<string | undefined>();
	const [form] = Form.useForm<SprintPayload & { dateRange?: [dayjs.Dayjs, dayjs.Dayjs] }>();

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const res = await sprintService.fetchSprintsByProject(projectId);
			const list = res.data ?? [];
			setSprints(list);

			const counts: Record<string, { total: number, done: number }> = {};
			await Promise.all(list.map(async (sprint) => {
				try {
					const taskRes = await taskService.fetchTaskList({ sprintId: sprint.id, pageSize: 200 });
					const tasks = taskRes.data ?? [];
					counts[sprint.id] = {
						total: tasks.length,
						done: tasks.filter(t => t.status === TaskStatus.DONE).length,
					};
				}
				catch {
					counts[sprint.id] = { total: 0, done: 0 };
				}
			}));
			setTaskCounts(counts);
		}
		finally {
			setLoading(false);
		}
	}, [projectId]);

	useEffect(() => {
		load();
	}, [load]);

	const openCreate = () => {
		form.resetFields();
		setEditingId(undefined);
		setModalOpen(true);
	};

	const openEdit = (sprint: SprintEntity) => {
		form.setFieldsValue({
			name: sprint.name,
			goal: sprint.goal,
			status: sprint.status,
			dateRange: [dayjs(sprint.startDate), dayjs(sprint.endDate)] as any,
		});
		setEditingId(sprint.id);
		setModalOpen(true);
	};

	const handleSave = async () => {
		const values = await form.validateFields();
		const { dateRange, ...rest } = values as any;
		const payload: SprintPayload = {
			...rest,
			project: projectId,
			startDate: dateRange?.[0]?.format("YYYY-MM-DD"),
			endDate: dateRange?.[1]?.format("YYYY-MM-DD"),
		};

		if (editingId) {
			await sprintService.fetchUpdateSprint(editingId, payload);
		}
		else {
			await sprintService.fetchCreateSprint(payload);
		}
		setModalOpen(false);
		load();
	};

	const handleDelete = async (id: string) => {
		await sprintService.fetchDeleteSprint(id);
		load();
	};

	const handleChangeStatus = async (sprint: SprintEntity, status: SprintStatus) => {
		await sprintService.fetchUpdateSprint(sprint.id, { status });
		load();
	};

	const activeSprint = sprints.find(s => s.status === SprintStatus.ACTIVE);
	const otherSprints = sprints.filter(s => s.status !== SprintStatus.ACTIVE);

	return (
		<div className="py-4">
			<div className="flex items-center justify-between mb-4">
				<Text strong>
					{sprints.length}
					{" "}
					sprint
				</Text>
				<Button icon={<PlusOutlined />} type="primary" size="small" onClick={openCreate}>
					Tạo Sprint
				</Button>
			</div>

			{sprints.length === 0 && !loading && (
				<div className="py-12 text-center">
					<PlayCircleOutlined className="text-4xl text-gray-300 mb-3 block" />
					<Text type="secondary">Chưa có sprint nào. Bắt đầu bằng cách tạo sprint đầu tiên.</Text>
				</div>
			)}

			{activeSprint && (
				<div className="mb-4">
					<Text type="secondary" className="text-xs uppercase tracking-wide mb-2 block">Sprint đang chạy</Text>
					<SprintCard
						sprint={activeSprint}
						counts={taskCounts[activeSprint.id] ?? { total: 0, done: 0 }}
						onEdit={openEdit}
						onDelete={handleDelete}
						onChangeStatus={handleChangeStatus}
						t={t}
					/>
				</div>
			)}

			{otherSprints.length > 0 && (
				<div>
					<Text type="secondary" className="text-xs uppercase tracking-wide mb-2 block">Các sprint khác</Text>
					<Row gutter={[12, 12]}>
						{otherSprints.map(sprint => (
							<Col key={sprint.id} xs={24} md={12}>
								<SprintCard
									sprint={sprint}
									counts={taskCounts[sprint.id] ?? { total: 0, done: 0 }}
									onEdit={openEdit}
									onDelete={handleDelete}
									onChangeStatus={handleChangeStatus}
									t={t}
								/>
							</Col>
						))}
					</Row>
				</div>
			)}

			<Modal
				title={editingId ? "Chỉnh sửa Sprint" : "Tạo Sprint mới"}
				open={modalOpen}
				onCancel={() => setModalOpen(false)}
				onOk={handleSave}
				okText={t("common.save")}
				cancelText={t("common.cancel")}
				destroyOnClose
			>
				<Form form={form} layout="vertical" className="mt-4">
					<Form.Item name="name" label="Tên Sprint" rules={[{ required: true }]}>
						<Input placeholder="VD: Sprint 1 - Thiết lập nền tảng" />
					</Form.Item>
					<Form.Item name="goal" label="Mục tiêu Sprint">
						<Input.TextArea rows={2} placeholder="Mục tiêu cần đạt được trong sprint này" />
					</Form.Item>
					<Form.Item name="dateRange" label="Thời gian" rules={[{ required: true }]}>
						<RangePicker className="w-full" format="DD/MM/YYYY" />
					</Form.Item>
					<Form.Item name="status" label="Trạng thái" initialValue={SprintStatus.PLANNING}>
						<Select options={Object.entries(STATUS_CONFIG).map(([val, cfg]) => ({ label: cfg.label, value: val }))} />
					</Form.Item>
				</Form>
			</Modal>
		</div>
	);
}

interface SprintCardProps {
	sprint: SprintEntity
	counts: { total: number, done: number }
	onEdit: (s: SprintEntity) => void
	onDelete: (id: string) => void
	onChangeStatus: (s: SprintEntity, status: SprintStatus) => void
	t: (key: string) => string
}

function SprintCard({ sprint, counts, onEdit, onDelete, onChangeStatus, t }: SprintCardProps) {
	const cfg = STATUS_CONFIG[sprint.status];
	const progress = counts.total > 0 ? Math.round((counts.done / counts.total) * 100) : 0;
	const daysLeft = dayjs(sprint.endDate).diff(dayjs(), "day");
	const isActive = sprint.status === SprintStatus.ACTIVE;

	return (
		<Card
			size="small"
			bordered
			className={isActive ? "border-blue-400" : ""}
			styles={{ body: { padding: 14 } }}
		>
			<div className="flex items-start justify-between gap-2">
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 flex-wrap mb-1">
						<Title level={5} className="mb-0! text-sm! truncate">{sprint.name}</Title>
						<Badge status={cfg.color as any} text={<span className="text-xs">{cfg.label}</span>} />
					</div>
					{sprint.goal && <Text type="secondary" className="text-xs block mb-2 line-clamp-1">{sprint.goal}</Text>}
					<div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
						<span>
							{dayjs(sprint.startDate).format("DD/MM")}
							{" "}
							→
							{" "}
							{dayjs(sprint.endDate).format("DD/MM/YYYY")}
						</span>
						{sprint.status === SprintStatus.ACTIVE && (
							<Tag color={daysLeft < 0 ? "red" : daysLeft <= 2 ? "orange" : "blue"} className="text-xs m-0!">
								{daysLeft < 0 ? `Trễ ${Math.abs(daysLeft)} ngày` : `Còn ${daysLeft} ngày`}
							</Tag>
						)}
					</div>
					<div className="flex items-center gap-2">
						<Progress percent={progress} size="small" className="flex-1 m-0!" showInfo={false} />
						<Text type="secondary" className="text-xs whitespace-nowrap">
							{counts.done}
							/
							{counts.total}
						</Text>
					</div>
				</div>
				<Space size={4} className="shrink-0 mt-0.5">
					{sprint.status === SprintStatus.PLANNING && (
						<Tooltip title="Bắt đầu Sprint">
							<Button
								type="text"
								size="small"
								icon={<PlayCircleOutlined />}
								className="text-blue-500"
								onClick={() => onChangeStatus(sprint, SprintStatus.ACTIVE)}
							/>
						</Tooltip>
					)}
					{sprint.status === SprintStatus.ACTIVE && (
						<Tooltip title="Kết thúc Sprint">
							<Button
								type="text"
								size="small"
								icon={<StopOutlined />}
								className="text-green-500"
								onClick={() => onChangeStatus(sprint, SprintStatus.COMPLETED)}
							/>
						</Tooltip>
					)}
					<Tooltip title={t("common.edit")}>
						<Button type="text" size="small" icon={<EditOutlined />} onClick={() => onEdit(sprint)} />
					</Tooltip>
					<Popconfirm
						title={t("common.confirmDelete")}
						onConfirm={() => onDelete(sprint.id)}
						okText={t("common.confirm")}
						cancelText={t("common.cancel")}
					>
						<Tooltip title={t("common.delete")}>
							<Button type="text" size="small" danger icon={<DeleteOutlined />} />
						</Tooltip>
					</Popconfirm>
				</Space>
			</div>

			{counts.total > 0 && (
				<Row gutter={8} className="mt-3">
					<Col span={8}>
						<Statistic title={<span className="text-xs">Total</span>} value={counts.total} valueStyle={{ fontSize: 16 }} />
					</Col>
					<Col span={8}>
						<Statistic title={<span className="text-xs">Done</span>} value={counts.done} valueStyle={{ fontSize: 16, color: "#52c41a" }} />
					</Col>
					<Col span={8}>
						<Statistic title={<span className="text-xs">Progress</span>} value={progress} suffix="%" valueStyle={{ fontSize: 16 }} />
					</Col>
				</Row>
			)}
		</Card>
	);
}
