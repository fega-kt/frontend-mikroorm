import type { WorkDayOverride, WorkShift } from "#src/api/work-calendar";
import type { PickerValueType } from "#src/components/people-picker";
import type { Dayjs } from "dayjs";
import { workDayOverrideService, WorkDayType, WorkTargetType } from "#src/api/work-calendar";
import { DepartmentPicker } from "#src/components/department-picker";
import { PeoplePicker } from "#src/components/people-picker";
import { DatePicker, Form, Input, Modal, Radio, Select } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DATE_FORMAT, targetName } from "../utils";

interface FormValues {
	targetType: WorkTargetType
	/** DepartmentPicker trả về { id, name } (labelInValue) */
	department?: { id: string, name: string }
	userId?: string
	range: [Dayjs, Dayjs]
	type: WorkDayType
	shiftId?: string
	name: string
}

interface OverrideModalProps {
	/** undefined = đóng, null = thêm mới */
	override: WorkDayOverride | null | undefined
	shifts: WorkShift[]
	onClose: (changed: boolean) => void
}

/** Thêm ngày đặc biệt cho cả khoảng ngày (ngày đã có của cùng đối tượng bị ghi đè) / sửa một ngày */
export function OverrideModal({ override, shifts, onClose }: OverrideModalProps) {
	const { t } = useTranslation();
	const [form] = Form.useForm<FormValues>();
	const [saving, setSaving] = useState(false);
	const targetType = Form.useWatch("targetType", form);
	const type = Form.useWatch("type", form);

	const submit = async () => {
		const values = await form.validateFields();
		const day = { type: values.type, shiftId: values.type === WorkDayType.Work ? values.shiftId : null, name: values.name };
		setSaving(true);
		try {
			if (override) {
				await workDayOverrideService.fetchUpdate(override.id, day);
				window.$message?.success(t("common.updateSuccess"));
			}
			else {
				const { count } = await workDayOverrideService.fetchCreate({
					targetType: values.targetType,
					departmentId: values.targetType === WorkTargetType.Department ? values.department?.id : null,
					userId: values.targetType === WorkTargetType.User ? values.userId : null,
					from: values.range[0].format(DATE_FORMAT),
					to: values.range[1].format(DATE_FORMAT),
					...day,
				});
				window.$message?.success(t("workCalendar.override.created", { count }));
			}
			onClose(true);
		}
		catch {
			// lỗi đã được interceptor hiển thị
		}
		finally {
			setSaving(false);
		}
	};

	return (
		<Modal
			open={override !== undefined}
			title={t(override ? "workCalendar.override.edit" : "workCalendar.override.add")}
			okText={t("common.save")}
			cancelText={t("common.cancel")}
			confirmLoading={saving}
			onOk={submit}
			onCancel={() => onClose(false)}
			afterOpenChange={(open) => {
				if (!open)
					return;
				form.resetFields();
				form.setFieldsValue(override
					? {
						targetType: override.targetType,
						range: [dayjs(override.date), dayjs(override.date)],
						type: override.type,
						shiftId: override.shift?.id,
						name: override.name,
					}
					: { targetType: WorkTargetType.Company, type: WorkDayType.Off });
			}}
			destroyOnHidden
		>
			<Form form={form} layout="vertical" preserve={false}>
				<Form.Item name="targetType" label={t("workCalendar.target.title")}>
					<Radio.Group
						disabled={!!override}
						optionType="button"
						options={[WorkTargetType.Company, WorkTargetType.Department, WorkTargetType.User].map(value => ({
							value,
							label: t(`workCalendar.target.${value}`),
						}))}
					/>
				</Form.Item>
				{override && targetType !== WorkTargetType.Company && (
					<Form.Item label={t(`workCalendar.target.${targetType}`)}>
						<Input value={targetName(t, override)} disabled />
					</Form.Item>
				)}
				{!override && targetType === WorkTargetType.Department && (
					<Form.Item name="department" label={t("workCalendar.target.department")} rules={[{ required: true }]}>
						<DepartmentPicker />
					</Form.Item>
				)}
				{!override && targetType === WorkTargetType.User && (
					<Form.Item
						name="userId"
						label={t("workCalendar.target.user")}
						rules={[{ required: true }]}
						normalize={(value: PickerValueType) => (value && typeof value === "object" && "id" in value ? value.id : value) as string}
					>
						<PeoplePicker />
					</Form.Item>
				)}
				<Form.Item name="range" label={t("workCalendar.override.dates")} rules={[{ required: true }]}>
					<DatePicker.RangePicker format="DD/MM/YYYY" disabled={!!override} className="w-full" />
				</Form.Item>
				<Form.Item name="type" label={t("workCalendar.override.type")}>
					<Radio.Group
						options={[
							{ value: WorkDayType.Off, label: t("workCalendar.override.off") },
							{ value: WorkDayType.Work, label: t("workCalendar.override.work") },
						]}
					/>
				</Form.Item>
				{type === WorkDayType.Work && (
					<Form.Item name="shiftId" label={t("workCalendar.shift.title")} rules={[{ required: true }]}>
						<Select options={shifts.map(s => ({ value: s.id, label: `${s.code} – ${s.name}` }))} />
					</Form.Item>
				)}
				<Form.Item name="name" label={t("workCalendar.override.name")} rules={[{ required: true, max: 255 }]}>
					<Input placeholder={t("workCalendar.override.namePlaceholder")} />
				</Form.Item>
			</Form>
		</Modal>
	);
}
