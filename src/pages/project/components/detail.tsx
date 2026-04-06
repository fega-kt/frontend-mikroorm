import type { ProjectEntity } from "#src/api/project/types";
import { projectService } from "#src/api/project";
import { ProjectPriority, ProjectVisibility } from "#src/api/project/types";
import { IconLabel } from "#src/components/icon-label";
import { ProFormPeoplePicker } from "#src/components/people-picker";
import {
	CalendarOutlined,
	CloseOutlined,
	DeploymentUnitOutlined,
	DollarOutlined,
	FileTextOutlined,
	FlagOutlined,
	InfoCircleOutlined,
	ProjectOutlined,
	SaveOutlined,
	TeamOutlined,
} from "@ant-design/icons";
import {
	ModalForm,
	ProFormDatePicker,
	ProFormSelect,
	ProFormText,
	ProFormTextArea,
} from "@ant-design/pro-components";
import { Button, Card, Col, Collapse, Form, Row, Space, Spin, Tabs, theme, Typography } from "antd";
import { useImperativeHandle, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;

/**
 * Helper component for Form Field Labels with Icons
 */
function FieldTitle({ icon, text }: { icon: any, text: string }) {
	const { token } = theme.useToken();
	return (
		<Space size={6}>
			<span style={{ fontSize: 13, display: "flex", alignItems: "center", color: token.colorTextDescription }}>
				{icon}
			</span>
			<span style={{ fontSize: 13 }}>{text}</span>
		</Space>
	);
}

export interface DetailRef {
	show: (id?: string) => Promise<{ isChange: boolean } | undefined>
}

interface DetailProps {
	ref: React.Ref<DetailRef>
}

let resolveGuard: (res?: { isChange: boolean }) => void;

export function Detail({ ref }: DetailProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [form] = Form.useForm<ProjectEntity>();

	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);

	// Centralized Configuration for Project Meta-Data Icons & Colors
	const projectMeta = useMemo(() => ({
		status: {
			PLANNING: { icon: "📍", label: t("project.status.planning"), color: "orange" },
			ACTIVE: { icon: "⚡", label: t("project.status.active"), color: "blue" },
			COMPLETED: { icon: "✅", label: t("project.status.completed"), color: "green" },
			ON_HOLD: { icon: "⏳", label: t("project.status.on_hold"), color: "default" },
		},
		priority: {
			[ProjectPriority.HIGH]: { icon: "🔴", label: t("project.priority.high"), color: "red" },
			[ProjectPriority.MEDIUM]: { icon: "🟡", label: t("project.priority.medium"), color: "gold" },
			[ProjectPriority.LOW]: { icon: "🟢", label: t("project.priority.low"), color: "green" },
			[ProjectPriority.URGENT]: { icon: "🔥", label: t("project.priority.urgent"), color: "volcano" },
		},
		visibility: {
			[ProjectVisibility.PRIVATE]: { icon: "🔒", label: t("project.visibility.private"), color: "default" },
			[ProjectVisibility.PUBLIC]: { icon: "🌐", label: t("project.visibility.public"), color: "blue" },
		},
	}), [t]);

	const statusOptions = useMemo(() =>
		Object.entries(projectMeta.status).map(([val, conf]) => ({
			label: <IconLabel {...conf} />,
			value: val,
		})), [projectMeta]);

	const priorityOptions = useMemo(() =>
		Object.entries(projectMeta.priority).map(([val, conf]) => ({
			label: <IconLabel {...conf} />,
			value: val,
		})), [projectMeta]);

	useImperativeHandle(ref, () => ({
		show: async (id?: string) => {
			form.resetFields();
			setEditingId(id ?? null);
			setOpen(true);
			if (id) {
				setLoading(true);
				try {
					const data = await projectService.fetchProjectDetail(id);
					form.setFieldsValue(data);
				}
				catch (error) {
					console.error("[ProjectDetail] Failed to fetch project info:", error);
				}
				finally {
					setLoading(false);
				}
			}
			return new Promise<{ isChange: boolean } | undefined>((resolve) => {
				resolveGuard = resolve;
			});
		},
	}));

	const onFinish = async (values: any) => {
		const payload = {
			...values,
		};

		if (editingId) {
			await projectService.fetchUpdateProject(editingId, payload);
			window.$message?.success(t("common.updateSuccess"));
		}
		else {
			await projectService.fetchCreateProject(payload);
			window.$message?.success(t("common.addSuccess"));
		}
		resolveGuard?.({ isChange: true });
		return true;
	};

	const onCancel = () => {
		setOpen(false);
		setEditingId(null);
		form.resetFields();
		resolveGuard?.();
	};

	return (
		<ModalForm<ProjectEntity>
			title={null}
			open={open}
			onOpenChange={visible => !visible && onCancel()}
			layout="vertical"
			form={form}
			autoFocusFirstInput
			modalProps={{
				destroyOnClose: true,
				maskClosable: false,
				width: 1200,
				styles: {
					header: { display: "none" },
					body: { height: "80vh", overflow: "hidden", padding: 0 },
				},
				closeIcon: null,
			}}
			submitter={{ render: () => null }}
			onFinish={onFinish}
		>
			{/* Studio Top Navbar */}
			<div
				className="px-8 py-3 flex items-center justify-between z-50 sticky top-0"
				style={{
					backgroundColor: token.colorBgContainer,
					borderBottom: `1px solid ${token.colorBorderSecondary}`,
					boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
				}}
			>
				<div className="flex items-center gap-3">
					<div
						className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner"
						style={{ backgroundColor: token.colorPrimaryBg, color: token.colorPrimary }}
					>
						<ProjectOutlined />
					</div>
					<div>
						<div className="flex items-center gap-2 mb-0.5">
							<Text type="secondary" className="text-[10px] font-bold uppercase tracking-widest leading-none">
								Project Studio
							</Text>
							<IconLabel
								variant="badge"
								{...projectMeta.status.PLANNING}
							/>
						</div>
						<Text strong className="text-sm leading-none">
							{editingId ? t("project.update_info") : t("project.create_new")}
						</Text>
					</div>
				</div>

				<div className="flex items-center gap-4">
					<Space size={12}>
						<Button
							type="text"
							icon={<CloseOutlined />}
							onClick={onCancel}
							className="rounded-lg h-9 w-9 flex items-center justify-center"
						/>
						<div className="w-px h-6 mx-1" style={{ backgroundColor: token.colorBorderSecondary }} />
						<Button
							type="primary"
							icon={<SaveOutlined />}
							size="large"
							onClick={() => form.submit()}
							className="shadow-md font-bold border-none h-10 rounded-lg"
						>
							{t("project.save_btn")}
						</Button>
					</Space>
				</div>
			</div>

			<Spin spinning={loading}>
				<div
					className="overflow-y-auto px-8 py-8 h-[calc(80vh-64px)] scroll-smooth"
					style={{ backgroundColor: token.colorBgLayout }}
				>
					<Row gutter={32} className="max-w-full mx-auto">
						{/* Main Content Area */}
						<Col span={16}>
							<div className="mb-8 px-2">
								<ProFormText
									name="name"
									placeholder={t("project.placeholder.name")}
									noStyle
									rules={[{ required: true, message: t("project.error.name_required") }]}
									fieldProps={{
										variant: "borderless",
										className: "mb-1",
										style: { fontSize: 28, fontWeight: 700, padding: 0, height: "auto" },
									}}
								/>
								<Text strong type="secondary" className="text-sm italic block px-1">
									{t("project.subtitle.headline")}
								</Text>
							</div>

							<Card
								className="mb-6 border-none shadow-sm"
								bodyStyle={{ padding: "24px" }}
								style={{ borderRadius: 12, backgroundColor: token.colorBgContainer }}
							>
								<div className="flex items-center gap-2 mb-6">
									<Title level={5} className="m-0 flex items-center gap-2">
										<FileTextOutlined style={{ color: token.colorPrimary }} />
										{t("project.section.description")}
									</Title>
								</div>
								<ProFormTextArea
									name="description"
									placeholder={t("project.placeholder.description")}
									fieldProps={{
										rows: 8,
										className: "border-none rounded-xl p-4 transition-all",
										style: { backgroundColor: token.colorFillQuaternary },
									}}
								/>
							</Card>

							<Card
								className="border-none shadow-sm"
								bodyStyle={{ padding: 0 }}
								style={{ borderRadius: 12, backgroundColor: token.colorBgContainer }}
							>
								<Tabs
									defaultActiveKey="tasks"
									className="px-6"
									items={[
										{
											key: "tasks",
											label: <IconLabel icon={<CalendarOutlined />} label={t("project.tabs.tasks")} />,
											children: (
												<div className="py-10 text-center">
													<div className="mb-4 text-4xl opacity-20" style={{ color: token.colorTextDescription }}><DeploymentUnitOutlined /></div>
													<Text type="secondary">{t("project.empty.tasks")}</Text>
												</div>
											),
										},
										{
											key: "team",
											label: <IconLabel icon={<TeamOutlined />} label={t("project.tabs.collaboration")} />,
											children: (
												<div className="py-10 text-center">
													<Text type="secondary">{t("project.empty.team")}</Text>
												</div>
											),
										},
									]}
								/>
							</Card>
						</Col>

						{/* Management Sidebar Column (30%) */}
						<Col span={8}>
							<Collapse
								defaultActiveKey={["governance", "admin", "financials"]}
								expandIconPosition="start"
								className="w-full bg-transparent border-none"
							>
								{/* Execution Section */}
								<Collapse.Panel
									key="governance"
									header={<Text strong className="text-[13px] uppercase tracking-wider">{t("project.section.governance")}</Text>}
									className="mb-3 border border-solid rounded-lg overflow-hidden"
									style={{
										borderColor: token.colorBorderSecondary,
										backgroundColor: token.colorBgContainer,
									}}
								>
									<ProFormSelect
										name="status"
										label={<FieldTitle icon={<FlagOutlined />} text={t("project.fields.status")} />}
										options={statusOptions}
										initialValue="PLANNING"
									/>

									<ProFormSelect
										name="priority"
										label={<FieldTitle icon={<FlagOutlined />} text={t("project.fields.priority")} />}
										options={priorityOptions}
										initialValue={ProjectPriority.MEDIUM}
									/>
								</Collapse.Panel>

								{/* Administrative Section */}
								<Collapse.Panel
									key="admin"
									header={<Text strong className="text-[13px] uppercase tracking-wider">Quản trị & Thời gian</Text>}
									className="mb-3 border border-solid rounded-lg overflow-hidden"
									style={{
										borderColor: token.colorBorderSecondary,
										backgroundColor: token.colorBgContainer,
									}}
								>
									<ProFormPeoplePicker
										name="owner"
										label={<FieldTitle icon={<TeamOutlined style={{ fontSize: 13 }} />} text={t("project.fields.owner")} />}
										rules={[{ required: true, message: t("project.error.owner_required") }]}
										placeholder={t("project.placeholder.owner")}
									/>
									<ProFormDatePicker name="startDate" label={<FieldTitle icon={<CalendarOutlined />} text={t("project.fields.start_date")} />} className="w-full" fieldProps={{ className: "w-full rounded-lg" }} />
									<ProFormDatePicker name="dueDate" label={<FieldTitle icon={<CalendarOutlined />} text={t("project.fields.due_date")} />} className="w-full" fieldProps={{ className: "w-full rounded-lg" }} />
								</Collapse.Panel>

								{/* Financials Section */}
								<Collapse.Panel
									key="financials"
									header={<Text strong className="text-[13px] uppercase tracking-wider">{t("project.section.financials")}</Text>}
									className="mb-3 border border-solid rounded-lg overflow-hidden"
									style={{
										borderColor: token.colorBorderSecondary,
										backgroundColor: token.colorBgContainer,
									}}
								>
									<ProFormText name="budget" label={<FieldTitle icon={<DollarOutlined />} text={t("project.fields.budget")} />} placeholder="0.00" fieldProps={{ prefix: "₫", suffix: "VNĐ", className: "rounded-lg" }} />
									<ProFormSelect
										name="visibility"
										label={<FieldTitle icon={<InfoCircleOutlined />} text={t("project.fields.visibility")} />}
										options={Object.entries(projectMeta.visibility).map(([val, conf]) => ({
											label: <IconLabel {...conf} />,
											value: val,
										}))}
										initialValue={ProjectVisibility.PRIVATE}
									/>
									<ProFormSelect name="tags" label={t("project.fields.tags")} mode="tags" placeholder={t("project.placeholder.tags")} fieldProps={{ className: "rounded-lg" }} />
								</Collapse.Panel>
							</Collapse>
						</Col>
					</Row>
				</div>
			</Spin>
		</ModalForm>
	);
}
