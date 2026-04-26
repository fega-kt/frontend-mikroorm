import type { TimeLogEntity } from "#src/api/time-log/types";
import { timeLogService } from "#src/api/time-log";
import { useUserStore } from "#src/store/user";
import {
	ClockCircleOutlined,
	DeleteOutlined,
	PlusOutlined,
} from "@ant-design/icons";
import {
	Button,
	DatePicker,
	Form,
	Input,
	InputNumber,
	List,
	Modal,
	Popconfirm,
	Progress,
	theme,
	Typography,
} from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";

const { Text } = Typography;

interface TimeLogPanelProps {
	taskId: string
	estimatedHours?: number
}

export function TimeLogPanel({ taskId, estimatedHours }: TimeLogPanelProps) {
	const { token } = theme.useToken();
	const userInfo = useUserStore();
	const [logs, setLogs] = useState<TimeLogEntity[]>([]);
	const [loading, setLoading] = useState(false);
	const [modalOpen, setModalOpen] = useState(false);
	const [form] = Form.useForm();

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const res = await timeLogService.fetchLogsByTask(taskId);
			setLogs(res.data ?? []);
		}
		finally {
			setLoading(false);
		}
	}, [taskId]);

	useEffect(() => {
		load();
	}, [load]);

	const totalLogged = logs.reduce((s, l) => s + l.hours, 0);
	const percent = estimatedHours && estimatedHours > 0
		? Math.min(Math.round((totalLogged / estimatedHours) * 100), 999)
		: 0;

	const handleSave = async () => {
		const values = await form.validateFields();
		await timeLogService.fetchCreateTimeLog({
			task: taskId,
			user: userInfo?.id,
			date: values.date?.format("YYYY-MM-DD"),
			hours: values.hours,
			note: values.note,
		});
		form.resetFields();
		setModalOpen(false);
		load();
	};

	const handleDelete = async (id: string) => {
		await timeLogService.fetchDeleteTimeLog(id);
		load();
	};

	return (
		<div>
			<div className="flex items-center justify-between mb-3">
				<div className="flex items-center gap-2">
					<ClockCircleOutlined style={{ color: token.colorPrimary }} />
					<Text strong className="text-sm">Time Log</Text>
					<Text type="secondary" className="text-xs">
						(
						{totalLogged}
						h logged
						{estimatedHours ? ` / ${estimatedHours}h est.` : ""}
						)
					</Text>
				</div>
				<Button
					type="text"
					size="small"
					icon={<PlusOutlined />}
					onClick={() => setModalOpen(true)}
				>
					Log time
				</Button>
			</div>

			{estimatedHours && estimatedHours > 0 && (
				<Progress
					percent={percent}
					size="small"
					strokeColor={percent > 100 ? token.colorError : token.colorPrimary}
					format={p => `${p}%`}
					className="mb-3"
				/>
			)}

			{logs.length === 0 && !loading
				? (
					<Text type="secondary" className="text-xs italic">Chưa có bản ghi nào.</Text>
				)
				: (
					<List
						size="small"
						loading={loading}
						dataSource={logs}
						renderItem={log => (
							<List.Item
								key={log.id}
								className="px-0! py-1.5!"
								actions={[
									<Popconfirm
										key="del"
										title="Xóa bản ghi này?"
										onConfirm={() => handleDelete(log.id)}
										okText="Xóa"
										cancelText="Hủy"
									>
										<Button type="text" size="small" danger icon={<DeleteOutlined />} className="h-5 w-5" />
									</Popconfirm>,
								]}
							>
								<div className="flex flex-col">
									<div className="flex items-center gap-2">
										<Text strong className="text-xs">
											{log.hours}
											h
										</Text>
										<Text type="secondary" className="text-xs">{dayjs(log.date).format("DD/MM/YYYY")}</Text>
										<Text className="text-xs">{log.user?.fullName || log.user?.loginName}</Text>
									</div>
									{log.note && (
										<Text type="secondary" className="text-xs">{log.note}</Text>
									)}
								</div>
							</List.Item>
						)}
					/>
				)}

			<Modal
				title="Log thời gian làm việc"
				open={modalOpen}
				onCancel={() => {
					setModalOpen(false);
					form.resetFields();
				}}
				onOk={handleSave}
				okText="Lưu"
				cancelText="Hủy"
				destroyOnClose
			>
				<Form form={form} layout="vertical" className="mt-4">
					<Form.Item name="date" label="Ngày" rules={[{ required: true }]} initialValue={dayjs()}>
						<DatePicker className="w-full" format="DD/MM/YYYY" />
					</Form.Item>
					<Form.Item name="hours" label="Số giờ" rules={[{ required: true }]}>
						<InputNumber min={0.25} step={0.25} addonAfter="h" className="w-full" placeholder="VD: 2.5" />
					</Form.Item>
					<Form.Item name="note" label="Ghi chú">
						<Input.TextArea rows={2} placeholder="Mô tả công việc đã làm..." />
					</Form.Item>
				</Form>
			</Modal>
		</div>
	);
}
