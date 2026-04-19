import type { SectionEntity } from "#src/api/section/types";
import type { TaskEntity } from "#src/api/task/types";
import { sectionService } from "#src/api/section";
import { taskService } from "#src/api/task";
import { CheckCircleOutlined, CloseOutlined, SaveOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { ModalForm } from "@ant-design/pro-components";
import { Button, Col, Form, Row, Space, Spin, theme, Typography } from "antd";
import dayjs from "dayjs";
import * as React from "react";
import { useImperativeHandle, useRef, useState } from "react";
import { TaskDetailMain } from "./task-detail-main";
import { TaskDetailSidebar } from "./task-detail-sidebar";

const { Text } = Typography;

export interface TaskDetailRef {
	show: (
		id?: string,
		defaults?: { projectId?: string, sectionId?: string },
	) => Promise<{ isChange: boolean } | undefined>
}

interface TaskDetailProps {
	ref: React.Ref<TaskDetailRef>
}

let resolveGuard: (res?: { isChange: boolean }) => void;

export function TaskDetail({ ref }: TaskDetailProps) {
	const { token } = theme.useToken();
	const [form] = Form.useForm<TaskEntity>();
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [sections, setSections] = useState<SectionEntity[]>([]);
	const editingIdRef = useRef<string>("");
	const defaultsRef = useRef<{ projectId?: string, sectionId?: string }>({});
	// true khi mở từ trang task global (không có projectId mặc định)
	const [showProjectPicker, setShowProjectPicker] = useState(false);

	useImperativeHandle(ref, () => ({
		show: async (id?, defaults = {}) => {
			form.resetFields();
			setSections([]);
			editingIdRef.current = id ?? "";
			defaultsRef.current = defaults;
			// Hiện project picker khi không có projectId mặc định (mở từ trang task global)
			setShowProjectPicker(!id && !defaults.projectId);
			setOpen(true);

			if (id) {
				setLoading(true);
				try {
					const data = await taskService.fetchTaskDetail(id);
					form.setFieldsValue({
						...data,
						project: data.project?.id as any,
						section: data.section?.id as any,
						assignee: data.assignee,
						parentTask: data.parentTask?.id as any,
					} as any);

					if (data.project?.id) {
						const res = await sectionService.fetchSectionsByProject(data.project.id);
						setSections(res.data ?? []);
					}
				}
				catch (err) {
					console.error("[TaskDetail] fetch error:", err);
				}
				finally {
					setLoading(false);
				}
			}
			else if (defaults.projectId) {
				const res = await sectionService.fetchSectionsByProject(defaults.projectId);
				setSections(res.data ?? []);
				if (defaults.sectionId) {
					form.setFieldValue("section", defaults.sectionId);
				}
			}

			return new Promise<{ isChange: boolean } | undefined>((resolve) => {
				resolveGuard = resolve;
			});
		},
	}));

	const handleProjectChange = async (projectId: string) => {
		form.setFieldValue("section", undefined);
		setSections([]);
		if (projectId) {
			const res = await sectionService.fetchSectionsByProject(projectId);
			setSections(res.data ?? []);
		}
	};

	const onFinish = async (values: any) => {
		if (editingIdRef.current && values.dueDate) {
			const subtasksRes = await taskService.fetchSubtasks(editingIdRef.current);
			const violating = (subtasksRes.data ?? []).filter(
				st => st.dueDate && dayjs(st.dueDate).isAfter(dayjs(values.dueDate), "day"),
			);
			if (violating.length > 0) {
				window.$message?.error(`${violating.length} sub-task có hạn chót sau task cha. Vui lòng điều chỉnh trước khi lưu.`);
				return false;
			}
		}

		const payload = {
			...values,
			project: defaultsRef.current.projectId ?? (values.project?.id || values.project),
		};

		if (editingIdRef.current) {
			await taskService.fetchUpdateTask(editingIdRef.current, payload);
			window.$message?.success("Cập nhật task thành công");
		}
		else {
			const created = await taskService.fetchCreateTask(payload);
			editingIdRef.current = created.id;
			window.$message?.success("Tạo task thành công");
		}
		resolveGuard?.({ isChange: true });
		return true;
	};

	const onCancel = () => {
		setOpen(false);
		form.resetFields();
		resolveGuard?.();
	};

	return (
		<ModalForm<TaskEntity>
			title={null}
			open={open}
			onOpenChange={visible => !visible && onCancel()}
			layout="vertical"
			form={form}
			autoFocusFirstInput
			modalProps={{
				destroyOnClose: true,
				maskClosable: false,
				width: 1000,
				styles: {
					header: { display: "none" },
					body: { height: "80vh", overflow: "hidden", padding: 0 },
				},
				closeIcon: null,
			}}
			submitter={{ render: () => null }}
			onFinish={onFinish}
		>
			{/* Navbar */}
			<div
				className="px-6 py-3 flex items-center justify-between sticky top-0 z-50"
				style={{
					backgroundColor: token.colorBgContainer,
					borderBottom: `1px solid ${token.colorBorderSecondary}`,
				}}
			>
				<div className="flex items-center gap-3">
					<div
						className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-inner"
						style={{ backgroundColor: token.colorInfoBg, color: token.colorInfo }}
					>
						<ThunderboltOutlined />
					</div>
					<div>
						<Text type="secondary" className="text-[10px] font-bold uppercase tracking-widest block leading-none">
							Task Studio
						</Text>
						<Text strong className="text-sm leading-none">
							{editingIdRef.current ? "Chỉnh sửa task" : "Tạo task mới"}
						</Text>
					</div>
				</div>

				<Space size={12}>
					<Button
						type="text"
						icon={<CloseOutlined />}
						onClick={onCancel}
						className="rounded-lg h-9 w-9"
					/>
					<div className="w-px h-6 mx-1" style={{ backgroundColor: token.colorBorderSecondary }} />
					<Button
						type="primary"
						icon={editingIdRef.current ? <SaveOutlined /> : <CheckCircleOutlined />}
						size="large"
						onClick={() => form.submit()}
						className="shadow-md font-bold border-none h-10 rounded-lg"
					>
						{editingIdRef.current ? "Lưu thay đổi" : "Tạo task"}
					</Button>
				</Space>
			</div>

			{/* Body */}
			<Spin spinning={loading}>
				<div
					className="overflow-y-auto px-6 py-6 h-[calc(80vh-64px)] scroll-smooth"
					style={{ background: "var(--ant-color-bg-layout)" }}
				>
					<Row gutter={24} className="max-w-full mx-auto">
						<Col span={15}>
							<TaskDetailMain
								taskId={editingIdRef.current}
								isEditing={!!editingIdRef.current}
							/>
						</Col>
						<Col span={9}>
							<TaskDetailSidebar
								sections={sections}
								showProjectPicker={showProjectPicker}
								onProjectChange={handleProjectChange}
							/>
						</Col>
					</Row>
				</div>
			</Spin>
		</ModalForm>
	);
}
