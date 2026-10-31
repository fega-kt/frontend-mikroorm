import type { WorkShift, WorkShiftPayload } from "#src/api/work-calendar";
import type { Color } from "antd/es/color-picker";
import { workShiftService } from "#src/api/work-calendar";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, ColorPicker, Form, Input, Modal, Space, TimePicker } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { dayjsToTime, DEFAULT_SHIFT_COLOR, timeToDayjs } from "../utils";

interface ShiftModalProps {
	/** undefined = đóng, null = thêm mới */
	shift: WorkShift | null | undefined
	onClose: (changed: boolean) => void
}

/** Thêm / sửa ca: mã, tên, màu và các khung giờ (khung kết thúc trước giờ bắt đầu = sang hôm sau) */
export function ShiftModal({ shift, onClose }: ShiftModalProps) {
	const { t } = useTranslation();
	const [form] = Form.useForm<WorkShiftPayload>();
	const [saving, setSaving] = useState(false);

	const submit = async () => {
		const values = await form.validateFields();
		setSaving(true);
		try {
			if (shift)
				await workShiftService.fetchUpdate(shift.id, values);
			else
				await workShiftService.fetchCreate(values);
			window.$message?.success(t(shift ? "common.updateSuccess" : "common.addSuccess"));
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
			open={shift !== undefined}
			title={t(shift ? "workCalendar.shift.edit" : "workCalendar.shift.add")}
			okText={t("common.save")}
			cancelText={t("common.cancel")}
			confirmLoading={saving}
			onOk={submit}
			onCancel={() => onClose(false)}
			afterOpenChange={(open) => {
				if (open) {
					form.resetFields();
					form.setFieldsValue(shift ?? { color: DEFAULT_SHIFT_COLOR, segments: [{ start: "08:00", end: "17:00" }] });
				}
			}}
			destroyOnHidden
		>
			<Form form={form} layout="vertical" preserve={false}>
				<Space.Compact block>
					<Form.Item name="code" label={t("workCalendar.code")} rules={[{ required: true, max: 50 }]} className="w-1/3">
						<Input placeholder="HC" />
					</Form.Item>
					<Form.Item name="name" label={t("workCalendar.name")} rules={[{ required: true, max: 255 }]} className="flex-1">
						<Input placeholder={t("workCalendar.shift.namePlaceholder")} />
					</Form.Item>
				</Space.Compact>
				<Form.Item
					name="color"
					label={t("workCalendar.shift.color")}
					getValueFromEvent={(color: Color) => color.toHexString()}
				>
					<ColorPicker disabledAlpha />
				</Form.Item>
				<Form.Item label={t("workCalendar.shift.segments")} extra={t("workCalendar.shift.segmentsHint")} required>
					<Form.List name="segments">
						{(fields, { add, remove }) => (
							<div className="flex flex-col gap-2">
								{fields.map(field => (
									<Space key={field.key} align="baseline">
										{(["start", "end"] as const).map(key => (
											<Form.Item
												key={key}
												name={[field.name, key]}
												noStyle
												rules={[{ required: true }]}
												getValueProps={(value?: string) => ({ value: timeToDayjs(value) })}
												normalize={dayjsToTime}
											>
												<TimePicker format="HH:mm" minuteStep={5} needConfirm={false} placeholder={t(`workCalendar.shift.${key}`)} />
											</Form.Item>
										))}
										{fields.length > 1 && <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} />}
									</Space>
								))}
								{fields.length < 6 && (
									<Button type="dashed" icon={<PlusOutlined />} onClick={() => add({})} className="w-fit">
										{t("workCalendar.shift.addSegment")}
									</Button>
								)}
							</div>
						)}
					</Form.List>
				</Form.Item>
				<Form.Item name="description" label={t("workCalendar.description")} rules={[{ max: 500 }]}>
					<Input.TextArea rows={2} />
				</Form.Item>
			</Form>
		</Modal>
	);
}
