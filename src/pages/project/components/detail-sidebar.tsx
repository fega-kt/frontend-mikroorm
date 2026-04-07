import type { Dayjs } from "dayjs";
import { ProjectPriority, ProjectVisibility } from "#src/api/project/types";
import { IconLabel } from "#src/components/icon-label";
import { ProFormPeoplePicker } from "#src/components/people-picker";
import {
	CalendarOutlined,
	DollarOutlined,
	FlagOutlined,
	InfoCircleOutlined,
	TeamOutlined,
} from "@ant-design/icons";
import {
	ProFormDatePicker,
	ProFormSelect,
	ProFormText,
} from "@ant-design/pro-components";
import { Collapse, Form, Space, theme, Typography } from "antd";
import dayjs from "dayjs";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

function FieldTitle({ icon, text }: { icon: React.ReactNode, text: string }) {
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

export function DetailSidebar() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const form = Form.useFormInstance();

	const statusOptions = useMemo(() => [
		{ label: <IconLabel icon="📍" label={t("project.status.planning")} color="orange" />, value: "PLANNING" },
		{ label: <IconLabel icon="⚡" label={t("project.status.active")} color="blue" />, value: "ACTIVE" },
		{ label: <IconLabel icon="✅" label={t("project.status.completed")} color="green" />, value: "COMPLETED" },
		{ label: <IconLabel icon="⏳" label={t("project.status.on_hold")} color="default" />, value: "ON_HOLD" },
	], [t]);

	const priorityOptions = useMemo(() => [
		{ label: <IconLabel icon="🔥" label={t("project.priority.urgent")} color="volcano" />, value: ProjectPriority.URGENT },
		{ label: <IconLabel icon="🔴" label={t("project.priority.high")} color="red" />, value: ProjectPriority.HIGH },
		{ label: <IconLabel icon="🟡" label={t("project.priority.medium")} color="gold" />, value: ProjectPriority.MEDIUM },
		{ label: <IconLabel icon="🟢" label={t("project.priority.low")} color="green" />, value: ProjectPriority.LOW },
	], [t]);

	const visibilityOptions = useMemo(() => [
		{ label: <IconLabel icon="🔒" label={t("project.visibility.private")} color="default" />, value: ProjectVisibility.PRIVATE },
		{ label: <IconLabel icon="🌐" label={t("project.visibility.public")} color="blue" />, value: ProjectVisibility.PUBLIC },
	], [t]);

	const panelStyle = {
		borderColor: token.colorBorderSecondary,
		backgroundColor: token.colorBgContainer,
	};

	return (
		<Collapse
			defaultActiveKey={["governance", "admin", "financials"]}
			expandIconPosition="start"
			className="w-full bg-transparent border-none"
		>
			<Collapse.Panel
				key="governance"
				header={<Text strong className="text-[13px] uppercase tracking-wider">{t("project.section.governance")}</Text>}
				className="mb-3 border border-solid rounded-lg overflow-hidden"
				style={panelStyle}
			>
				<ProFormSelect
					name="status"
					label={<FieldTitle icon={<FlagOutlined />} text={t("project.fields.status")} />}
					options={statusOptions}
					initialValue="PLANNING"
					rules={[{ required: true, message: t("project.error.status_required") }]}
					disabled
				/>
				<ProFormSelect
					name="priority"
					label={<FieldTitle icon={<FlagOutlined />} text={t("project.fields.priority")} />}
					options={priorityOptions}
					initialValue={ProjectPriority.MEDIUM}
					rules={[{ required: true, message: t("project.error.priority_required") }]}
				/>
			</Collapse.Panel>

			<Collapse.Panel
				key="admin"
				header={<Text strong className="text-[13px] uppercase tracking-wider">Quản trị & Thời gian</Text>}
				className="mb-3 border border-solid rounded-lg overflow-hidden"
				style={panelStyle}
			>
				<ProFormPeoplePicker
					name="owner"
					label={<FieldTitle icon={<TeamOutlined style={{ fontSize: 13 }} />} text={t("project.fields.owner")} />}
					rules={[{ required: true, message: t("project.error.owner_required") }]}
					placeholder={t("project.placeholder.owner")}
				/>
				<ProFormDatePicker
					name="startDate"
					label={<FieldTitle icon={<CalendarOutlined />} text={t("project.fields.start_date")} />}
					className="w-full"
					fieldProps={{ className: "w-full rounded-lg" }}
					rules={[
						{ required: true, message: t("project.error.start_date_required") },
						{
							validator: (_: unknown, value: Dayjs | string | null) => {
								const dueDate = form.getFieldValue("dueDate");
								if (value && dueDate) {
									const startDateStr = dayjs(value).format("YYYY-MM-DD");
									const dueDateStr = dayjs(dueDate).format("YYYY-MM-DD");
									if (startDateStr > dueDateStr)
										return Promise.reject(t("project.error.start_after_due"));
								}
								return Promise.resolve();
							},
						},
					]}
				/>
				<ProFormDatePicker
					name="dueDate"
					label={<FieldTitle icon={<CalendarOutlined />} text={t("project.fields.due_date")} />}
					className="w-full"
					fieldProps={{
						className: "w-full rounded-lg",
						onChange: () => form.validateFields(["startDate"]),
					}}
					rules={[
						{ required: true, message: t("project.error.due_date_required") },
						{
							validator: (_: unknown, value: Dayjs | string | null) => {
								const startDate = form.getFieldValue("startDate");
								if (value && startDate) {
									const dueDateStr = dayjs(value).format("YYYY-MM-DD");
									const startDateStr = dayjs(startDate).format("YYYY-MM-DD");
									if (dueDateStr < startDateStr)
										return Promise.reject(t("project.error.due_before_start"));
								}
								return Promise.resolve();
							},
						},
					]}
				/>
			</Collapse.Panel>

			<Collapse.Panel
				key="financials"
				header={<Text strong className="text-[13px] uppercase tracking-wider">{t("project.section.financials")}</Text>}
				className="mb-3 border border-solid rounded-lg overflow-hidden"
				style={panelStyle}
			>
				<ProFormText
					name="budget"
					label={<FieldTitle icon={<DollarOutlined />} text={t("project.fields.budget")} />}
					placeholder="0.00"
					fieldProps={{ prefix: "₫", suffix: "VNĐ", className: "rounded-lg" }}
				/>
				<ProFormSelect
					name="visibility"
					label={<FieldTitle icon={<InfoCircleOutlined />} text={t("project.fields.visibility")} />}
					options={visibilityOptions}
					initialValue={ProjectVisibility.PRIVATE}
					rules={[{ required: true, message: t("project.error.visibility_required") }]}
				/>
				<ProFormSelect
					name="tags"
					label={t("project.fields.tags")}
					mode="tags"
					placeholder={t("project.placeholder.tags")}
					fieldProps={{ className: "rounded-lg" }}
				/>
			</Collapse.Panel>
		</Collapse>
	);
}
