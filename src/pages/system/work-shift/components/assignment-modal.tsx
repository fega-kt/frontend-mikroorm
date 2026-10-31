import type { WorkAssignment, WorkSchedule, WorkTarget } from "#src/api/work-calendar";
import type { PickerValueType } from "#src/components/people-picker";
import type { Dayjs } from "dayjs";
import { workScheduleAssignmentService, WorkTargetType } from "#src/api/work-calendar";
import { PeoplePicker } from "#src/components/people-picker";
import { Alert, DatePicker, Form, Modal, Select } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DATE_FORMAT } from "../utils";

interface FormValues {
	userId?: string
	scheduleId: string
	effectiveFrom: Dayjs
	effectiveTo?: Dayjs | null
}

export interface AssignmentModalState {
	/** Đối tượng nhận lịch; targetType = user mà không có userId thì chọn người trong form */
	target: WorkTarget
	/** Có = sửa */
	assignment?: WorkAssignment
}

interface AssignmentModalProps {
	state: AssignmentModalState | undefined
	schedules: WorkSchedule[]
	onClose: (changed: boolean) => void
}

/** Gán lịch cho công ty / phòng / người trong khoảng hiệu lực (trống ngày kết thúc = không thời hạn) */
export function AssignmentModal({ state, schedules, onClose }: AssignmentModalProps) {
	const { t } = useTranslation();
	const [form] = Form.useForm<FormValues>();
	const [saving, setSaving] = useState(false);
	const editing = state?.assignment;
	const pickUser = state?.target.targetType === WorkTargetType.User && !state.target.userId && !editing;

	const submit = async () => {
		if (!state)
			return;
		const values = await form.validateFields();
		const payload = {
			scheduleId: values.scheduleId,
			effectiveFrom: values.effectiveFrom.format(DATE_FORMAT),
			effectiveTo: values.effectiveTo ? values.effectiveTo.format(DATE_FORMAT) : null,
		};
		setSaving(true);
		try {
			if (editing)
				await workScheduleAssignmentService.fetchUpdate(editing.id, payload);
			else
				await workScheduleAssignmentService.fetchCreate({ ...state.target, ...(pickUser && { userId: values.userId }), ...payload });
			window.$message?.success(t(editing ? "common.updateSuccess" : "common.addSuccess"));
			onClose(true);
		}
		catch {
			// lỗi (trùng khoảng hiệu lực…) đã được interceptor hiển thị
		}
		finally {
			setSaving(false);
		}
	};

	return (
		<Modal
			open={!!state}
			title={t(editing ? "workCalendar.assignment.edit" : "workCalendar.assignment.add")}
			okText={t("common.save")}
			cancelText={t("common.cancel")}
			confirmLoading={saving}
			onOk={submit}
			onCancel={() => onClose(false)}
			afterOpenChange={(open) => {
				if (!open)
					return;
				form.resetFields();
				form.setFieldsValue(editing
					? {
						scheduleId: editing.schedule.id,
						effectiveFrom: dayjs(editing.effectiveFrom),
						effectiveTo: editing.effectiveTo ? dayjs(editing.effectiveTo) : null,
					}
					: { effectiveFrom: dayjs().startOf("day") });
			}}
			destroyOnHidden
		>
			<Form form={form} layout="vertical" preserve={false}>
				{!editing && <Alert type="info" showIcon className="mb-4" message={t("workCalendar.assignment.autoCloseHint")} />}
				{pickUser && (
					<Form.Item
						name="userId"
						label={t("workCalendar.target.user")}
						rules={[{ required: true }]}
						normalize={(value: PickerValueType) => (value && typeof value === "object" && "id" in value ? value.id : value) as string}
					>
						<PeoplePicker />
					</Form.Item>
				)}
				<Form.Item name="scheduleId" label={t("workCalendar.schedule.title")} rules={[{ required: true }]}>
					<Select
						showSearch
						optionFilterProp="label"
						options={schedules.map(s => ({ value: s.id, label: `${s.code} – ${s.name}` }))}
					/>
				</Form.Item>
				<div className="flex gap-4">
					<Form.Item name="effectiveFrom" label={t("workCalendar.assignment.from")} rules={[{ required: true }]} className="flex-1">
						<DatePicker format="DD/MM/YYYY" className="w-full" />
					</Form.Item>
					<Form.Item
						name="effectiveTo"
						label={t("workCalendar.assignment.to")}
						tooltip={t("workCalendar.assignment.toHint")}
						dependencies={["effectiveFrom"]}
						className="flex-1"
						rules={[
							({ getFieldValue }) => ({
								validator: (_, value?: Dayjs | null) => {
									const from = getFieldValue("effectiveFrom") as Dayjs | undefined;
									return !value || !from || !value.isBefore(from, "day")
										? Promise.resolve()
										: Promise.reject(new Error(t("workCalendar.invalidRange")));
								},
							}),
						]}
					>
						<DatePicker format="DD/MM/YYYY" className="w-full" />
					</Form.Item>
				</div>
			</Form>
		</Modal>
	);
}
