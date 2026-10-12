import type { Dayjs } from "dayjs";
import { approvalDelegationService } from "#src/api/approval-delegation";
import { approvalRequestService } from "#src/api/approval-request";
import { ProFormPeoplePicker } from "#src/components/people-picker";
import { ModalForm, ProFormItem, ProFormSelect, ProFormTextArea } from "@ant-design/pro-components";
import { Alert, DatePicker, Form } from "antd";
import dayjs from "dayjs";
import { useImperativeHandle, useState } from "react";
import { useTranslation } from "react-i18next";

export interface DetailRef {
	show: (id?: string) => Promise<{ isChange: boolean } | undefined>
}

interface FormValues {
	toUser?: string | { id: string }
	period?: [Dayjs, Dayjs]
	requestType?: string
	reason?: string
}

let guard: ((res?: { isChange: boolean }) => void) | undefined;

const userId = (value: FormValues["toUser"]) => (typeof value === "string" ? value : value?.id);

export function Detail({ ref }: { ref: React.Ref<DetailRef> }) {
	const { t } = useTranslation();
	const [form] = Form.useForm<FormValues>();
	const [open, setOpen] = useState(false);
	const [editingId, setEditingId] = useState<string>();

	useImperativeHandle(ref, () => ({
		show: async (id) => {
			form.resetFields();
			setEditingId(id);
			setOpen(true);
			if (id) {
				const item = await approvalDelegationService.fetchItem(id);
				form.setFieldsValue({
					toUser: item.toUser.id,
					period: [dayjs(item.startAt), dayjs(item.endAt)],
					requestType: item.requestType?.id,
					reason: item.reason,
				});
			}
			return new Promise((resolve) => {
				guard = resolve;
			});
		},
	}));

	const close = (res?: { isChange: boolean }) => {
		setOpen(false);
		guard?.(res);
		guard = undefined;
	};

	return (
		<ModalForm<FormValues>
			form={form}
			open={open}
			width={560}
			title={t(editingId ? "approval.delegation.edit" : "approval.delegation.add")}
			modalProps={{ destroyOnHidden: true, onCancel: () => close() }}
			// Không để ProForm đổi ngày sang chuỗi khi submit
			dateFormatter={false}
			onFinish={async (values) => {
				const [startAt, endAt] = values.period!.map(v => dayjs(v));
				const payload = {
					toUser: userId(values.toUser)!,
					startAt: startAt.toISOString(),
					endAt: endAt.toISOString(),
					requestType: values.requestType || null,
					reason: values.reason || null,
				};
				if (editingId)
					await approvalDelegationService.fetchUpdate(editingId, payload);
				else
					await approvalDelegationService.fetchCreate(payload);
				window.$message?.success(t(editingId ? "common.updateSuccess" : "common.addSuccess"));
				close({ isChange: true });
				return true;
			}}
		>
			<Alert type="info" showIcon className="mb-4" message={t("approval.delegation.hint")} />
			<ProFormPeoplePicker name="toUser" label={t("approval.delegation.toUser")} rules={[{ required: true }]} />
			{/* RangePicker antd (không qua ProFormDateTimeRangePicker) để giá trị submit luôn là dayjs */}
			<ProFormItem name="period" label={t("approval.delegation.period")} rules={[{ required: true }]}>
				<DatePicker.RangePicker className="w-full" format="DD/MM/YYYY HH:mm" showTime={{ format: "HH:mm" }} />
			</ProFormItem>
			<ProFormSelect
				name="requestType"
				label={t("approval.delegation.requestType")}
				placeholder={t("approval.delegation.allTypes")}
				allowClear
				request={async () => (await approvalRequestService.fetchRequestTypes()).map(item => ({ value: item.id, label: item.name }))}
			/>
			<ProFormTextArea name="reason" label={t("approval.delegation.reason")} fieldProps={{ maxLength: 1000, rows: 3 }} />
		</ModalForm>
	);
}
