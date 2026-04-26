import type { MilestoneEntity, MilestonePayload } from "#src/api/milestone/types";
import { milestoneService } from "#src/api/milestone";
import { MilestoneStatus } from "#src/api/milestone/types";
import {
	CheckCircleOutlined,
	ClockCircleOutlined,
	DeleteOutlined,
	EditOutlined,
	ExclamationCircleOutlined,
	FlagOutlined,
	PlusOutlined,
} from "@ant-design/icons";
import {
	Button,
	DatePicker,
	Form,
	Input,
	Modal,
	Popconfirm,
	Select,
	Space,
	Tag,
	Timeline,
	Tooltip,
	Typography,
} from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

interface MilestoneTabProps {
	projectId: string
}

const STATUS_CONFIG: Record<MilestoneStatus, { color: string, icon: React.ReactNode, label: string }> = {
	[MilestoneStatus.PENDING]: { color: "default", icon: <ClockCircleOutlined />, label: "Chưa bắt đầu" },
	[MilestoneStatus.IN_PROGRESS]: { color: "processing", icon: <FlagOutlined />, label: "Đang thực hiện" },
	[MilestoneStatus.COMPLETED]: { color: "success", icon: <CheckCircleOutlined />, label: "Hoàn thành" },
	[MilestoneStatus.MISSED]: { color: "error", icon: <ExclamationCircleOutlined />, label: "Đã bỏ lỡ" },
};

function autoStatus(m: MilestoneEntity): MilestoneStatus {
	if (m.status === MilestoneStatus.COMPLETED)
		return MilestoneStatus.COMPLETED;
	if (dayjs(m.dueDate).isBefore(dayjs()))
		return MilestoneStatus.MISSED;
	return m.status;
}

export function MilestoneTab({ projectId }: MilestoneTabProps) {
	const { t } = useTranslation();
	const [milestones, setMilestones] = useState<MilestoneEntity[]>([]);
	const [loading, setLoading] = useState(false);
	const [modalOpen, setModalOpen] = useState(false);
	const [editingId, setEditingId] = useState<string | undefined>();
	const [form] = Form.useForm<MilestonePayload>();

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const res = await milestoneService.fetchMilestonesByProject(projectId);
			setMilestones(res.data ?? []);
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

	const openEdit = (m: MilestoneEntity) => {
		form.setFieldsValue({
			name: m.name,
			description: m.description,
			dueDate: m.dueDate ? dayjs(m.dueDate) as any : undefined,
			status: m.status,
		});
		setEditingId(m.id);
		setModalOpen(true);
	};

	const handleSave = async () => {
		const raw = await form.validateFields();
		const values: MilestonePayload = {
			...raw,
			dueDate: raw.dueDate ? (raw.dueDate as any).format?.("YYYY-MM-DD") ?? raw.dueDate : undefined,
		};
		if (editingId) {
			await milestoneService.fetchUpdateMilestone(editingId, values);
		}
		else {
			await milestoneService.fetchCreateMilestone({
				...values,
				project: projectId,
				status: MilestoneStatus.PENDING,
			});
		}
		setModalOpen(false);
		load();
	};

	const handleDelete = async (id: string) => {
		await milestoneService.fetchDeleteMilestone(id);
		load();
	};

	const sorted = [...milestones].sort((a, b) =>
		dayjs(a.dueDate).diff(dayjs(b.dueDate)),
	);

	return (
		<div className="py-4">
			<div className="flex items-center justify-between mb-4">
				<Text strong>
					{milestones.length}
					{" "}
					milestone
				</Text>
				<Button icon={<PlusOutlined />} type="primary" size="small" onClick={openCreate}>
					Thêm Milestone
				</Button>
			</div>

			{sorted.length === 0 && !loading
				? (
					<div className="py-12 text-center">
						<FlagOutlined className="text-4xl text-gray-300 mb-3 block" />
						<Text type="secondary">Chưa có milestone nào. Thêm mốc quan trọng cho dự án.</Text>
					</div>
				)
				: (
					<Timeline
						mode="left"
						items={sorted.map((m) => {
							const effectiveStatus = autoStatus(m);
							const cfg = STATUS_CONFIG[effectiveStatus];
							return {
								color: cfg.color as any,
								dot: <span style={{ fontSize: 16 }}>{cfg.icon}</span>,
								label: (
									<Text type="secondary" className="text-xs">
										{dayjs(m.dueDate).format("DD/MM/YYYY")}
									</Text>
								),
								children: (
									<div className="flex items-start justify-between gap-2 pb-2">
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2 flex-wrap">
												<Text strong className="text-sm">{m.name}</Text>
												<Tag color={cfg.color as any} className="text-xs">{cfg.label}</Tag>
											</div>
											{m.description && (
												<Text type="secondary" className="text-xs block mt-0.5 line-clamp-2">
													{m.description}
												</Text>
											)}
											{m.completedAt && (
												<Text type="secondary" className="text-xs block">
													Hoàn thành:
													{" "}
													{dayjs(m.completedAt).format("DD/MM/YYYY")}
												</Text>
											)}
										</div>
										<Space size={4} className="shrink-0">
											<Tooltip title={t("common.edit")}>
												<Button
													type="text"
													size="small"
													icon={<EditOutlined />}
													onClick={() => openEdit(m)}
												/>
											</Tooltip>
											<Popconfirm
												title={t("common.confirmDelete")}
												onConfirm={() => handleDelete(m.id)}
												okText={t("common.confirm")}
												cancelText={t("common.cancel")}
											>
												<Tooltip title={t("common.delete")}>
													<Button type="text" size="small" danger icon={<DeleteOutlined />} />
												</Tooltip>
											</Popconfirm>
										</Space>
									</div>
								),
							};
						})}
					/>
				)}

			<Modal
				title={editingId ? "Chỉnh sửa Milestone" : "Thêm Milestone"}
				open={modalOpen}
				onCancel={() => setModalOpen(false)}
				onOk={handleSave}
				okText={t("common.save")}
				cancelText={t("common.cancel")}
				destroyOnClose
			>
				<Form form={form} layout="vertical" className="mt-4">
					<Form.Item name="name" label="Tên milestone" rules={[{ required: true, message: "Vui lòng nhập tên" }]}>
						<Input placeholder="VD: Ra mắt phiên bản v1.0" />
					</Form.Item>
					<Form.Item name="description" label="Mô tả">
						<Input.TextArea rows={2} placeholder="Mô tả ngắn về milestone này" />
					</Form.Item>
					<Form.Item name="dueDate" label="Ngày đến hạn" rules={[{ required: true, message: "Vui lòng chọn ngày" }]}>
						<DatePicker className="w-full" format="DD/MM/YYYY" />
					</Form.Item>
					{editingId && (
						<Form.Item name="status" label="Trạng thái">
							<Select
								options={Object.entries(STATUS_CONFIG).map(([val, cfg]) => ({
									label: cfg.label,
									value: val,
								}))}
							/>
						</Form.Item>
					)}
				</Form>
			</Modal>
		</div>
	);
}
