import type { UserBrief } from "#src/api/approval-request";
import type { Dayjs } from "dayjs";
import { ApprovalDelegationMode, approvalDelegationService } from "#src/api/approval-delegation";
import { approvalRequestService } from "#src/api/approval-request";
import { PeoplePicker, ProFormPeoplePicker } from "#src/components/people-picker";
import { useAccess } from "#src/hooks/use-access";
import { PermissionType } from "#src/hooks/use-access/permission-type.enum";
import { ModalForm, ProFormItem, ProFormRadio, ProFormSelect, ProFormTextArea } from "@ant-design/pro-components";
import { Alert, DatePicker, Form, Typography } from "antd";
import dayjs from "dayjs";
import { useImperativeHandle, useState } from "react";
import { useTranslation } from "react-i18next";

export interface DetailRef {
	show: (id?: string) => Promise<{ isChange: boolean } | undefined>
}

interface FormValues {
	fromUser?: string | { id: string }
	toUser?: string | { id: string }
	period?: [Dayjs, Dayjs]
	mode: ApprovalDelegationMode
	requestType?: string
	reason?: string
}

let guard: ((res?: { isChange: boolean }) => void) | undefined;

const userId = (value: FormValues["toUser"]) => (typeof value === "string" ? value : value?.id);

export function Detail({ ref }: { ref: React.Ref<DetailRef> }) {
	const { t } = useTranslation();
	// Người quản lý ủy quyền (vd: HR) được tạo hộ người khác
	const canManage = useAccess().canAccess(PermissionType.ManageApprovalDelegation);
	const [form] = Form.useForm<FormValues>();
	const [open, setOpen] = useState(false);
	const [editingId, setEditingId] = useState<string>();
	// Người ủy quyền của bản đang sửa — chỉ hiển thị, không đổi được
	const [fromUser, setFromUser] = useState<UserBrief>();

	useImperativeHandle(ref, () => ({
		show: async (id) => {
			form.resetFields();
			setEditingId(id);
			setFromUser(undefined);
			setOpen(true);
			if (id) {
				const item = await approvalDelegationService.fetchItem(id);
				setFromUser(item.fromUser);
				form.setFieldsValue({
					toUser: item.toUser.id,
					period: [dayjs(item.startAt), dayjs(item.endAt)],
					mode: item.mode,
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
			width={600}
			title={t(editingId ? "approval.delegation.edit" : "approval.delegation.add")}
			modalProps={{ destroyOnHidden: true, onCancel: () => close() }}
			initialValues={{ mode: ApprovalDelegationMode.Window }}
			// Không để ProForm đổi ngày sang chuỗi khi submit
			dateFormatter={false}
			onFinish={async (values) => {
				const [startAt, endAt] = values.period!.map(v => dayjs(v));
				const payload = {
					toUser: userId(values.toUser)!,
					startAt: startAt.toISOString(),
					endAt: endAt.toISOString(),
					mode: values.mode,
					requestType: values.requestType || null,
					reason: values.reason || null,
				};
				if (editingId)
					await approvalDelegationService.fetchUpdate(editingId, payload);
				else
					await approvalDelegationService.fetchCreate({ ...payload, fromUser: userId(values.fromUser) || null });
				window.$message?.success(t(editingId ? "common.updateSuccess" : "common.addSuccess"));
				close({ isChange: true });
				return true;
			}}
		>
			<Alert type="info" showIcon className="mb-4" message={t("approval.delegation.hint")} />
			{/* Tạo hộ: chọn người ủy quyền; không đổi được sau khi tạo */}
			{editingId
				? canManage && fromUser && (
					<ProFormItem label={t("approval.delegation.fromUser")}>
						<PeoplePicker readonly user={fromUser} showEmail={false} />
					</ProFormItem>
				)
				: canManage && (
					<ProFormPeoplePicker
						name="fromUser"
						label={t("approval.delegation.fromUser")}
						fieldProps={{ placeholder: t("approval.delegation.fromUserHint"), allowClear: true }}
					/>
				)}
			<ProFormPeoplePicker name="toUser" label={t("approval.delegation.toUser")} rules={[{ required: true }]} />
			{/* RangePicker antd (không qua ProFormDateTimeRangePicker) để giá trị submit luôn là dayjs */}
			<ProFormItem name="period" label={t("approval.delegation.period")} rules={[{ required: true }]}>
				<DatePicker.RangePicker className="w-full" format="DD/MM/YYYY HH:mm" showTime={{ format: "HH:mm" }} />
			</ProFormItem>
			<ProFormRadio.Group
				name="mode"
				label={t("approval.delegation.mode")}
				rules={[{ required: true }]}
				fieldProps={{ className: "flex flex-col gap-2" }}
				options={Object.values(ApprovalDelegationMode).map(mode => ({
					value: mode,
					label: (
						<span className="flex flex-col">
							<span>{t(`approval.delegation.modes.${mode}`)}</span>
							<Typography.Text type="secondary" className="text-xs">{t(`approval.delegation.modeDesc.${mode}`)}</Typography.Text>
						</span>
					),
				}))}
			/>
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
