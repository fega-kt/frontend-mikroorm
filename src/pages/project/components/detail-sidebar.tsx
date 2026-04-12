import type { Dayjs } from "dayjs";
import { ProjectPriority } from "#src/api/project/types";
import { FieldTitle } from "#src/components/field-title";
import { IconLabel } from "#src/components/icon-label";
import { ProFormPeoplePicker } from "#src/components/people-picker";
import { SectionCard } from "#src/components/section-card";
import {
	CalendarOutlined,
	FlagOutlined,
	HeartOutlined,
	SettingOutlined,
	TeamOutlined,
	UserOutlined,
} from "@ant-design/icons";
import {
	ProFormDatePicker,
	ProFormSelect,
} from "@ant-design/pro-components";
import { Form } from "antd";
import dayjs from "dayjs";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export function DetailSidebar() {
	const { t } = useTranslation();
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

	return (
		<div className="flex flex-col gap-4 w-full">
			{/* ── Quản trị & Thiết lập ── */}
			<SectionCard icon={<SettingOutlined />} title={t("project.section.governance")}>

				<ProFormSelect
					name="status"
					label={<FieldTitle icon={<FlagOutlined />} title={t("project.fields.status")} />}
					options={statusOptions}
					initialValue="PLANNING"
					rules={[{ required: true, message: t("project.error.status_required") }]}
					disabled
				/>
				<ProFormSelect
					name="priority"
					label={<FieldTitle icon={<FlagOutlined />} title={t("project.fields.priority")} />}
					options={priorityOptions}
					initialValue={ProjectPriority.MEDIUM}
					rules={[{ required: true, message: t("project.error.priority_required") }]}
					formItemProps={{ className: "mb-0" }}
				/>
			</SectionCard>

			{/* ── Thành viên ── */}
			<SectionCard icon={<TeamOutlined />} title="Thành viên">

				<ProFormPeoplePicker
					name="owner"
					label={<FieldTitle icon={<UserOutlined />} title={t("project.fields.owner")} />}
					rules={[{ required: true, message: t("project.error.owner_required") }]}
					placeholder={t("project.placeholder.owner")}
				/>

				<ProFormDatePicker
					name="startDate"
					label={<FieldTitle icon={<CalendarOutlined />} title={t("project.fields.start_date")} />}
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
					label={<FieldTitle icon={<CalendarOutlined />} title={t("project.fields.due_date")} />}
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
					formItemProps={{ className: "mb-0" }}
				/>
			</SectionCard>

			{/* ── Tag ── */}
			<SectionCard icon={<HeartOutlined />} title={t("project.fields.tags")}>

				<ProFormSelect
					name="tags"
					mode="tags"
					placeholder={t("project.placeholder.tags")}
					fieldProps={{ className: "rounded-lg" }}
					formItemProps={{ className: "mb-0" }}
				/>
			</SectionCard>
		</div>
	);
}
