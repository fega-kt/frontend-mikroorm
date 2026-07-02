import type { GroupEntity } from "#src/api/system/group";
import { groupService } from "#src/api/system/group";
import { TrimInput, TrimTextArea } from "#src/components/basic-form";
import { PeoplePicker } from "#src/components/people-picker";
import { ModalForm } from "@ant-design/pro-components";
import { Form, Spin } from "antd";
import { useImperativeHandle, useState } from "react";
import { useTranslation } from "react-i18next";

export interface DetailRef {
	show: (id?: string) => Promise<{ isChange: boolean } | undefined>
}

interface DetailProps {
	ref: React.Ref<DetailRef>
}

let guard: (res?: { isChange: boolean }) => void;

export function Detail({ ref }: DetailProps) {
	const { t } = useTranslation();
	const [form] = Form.useForm<GroupEntity>();
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);

	useImperativeHandle(ref, () => ({
		show: async (id?: string) => {
			form.resetFields();
			setEditingId(id ?? null);
			setOpen(true);
			if (id) {
				setLoading(true);
				try {
					const data = await groupService.fetchGroupItem(id);

					form.setFieldsValue(data);
					setLoading(false);
				}
				catch (error) {
					console.error("[GroupDetail] Failed to fetch group info:", error);
					window.$message?.error(t("common.fetchError"));
				}
			}
			return new Promise<{ isChange: boolean } | undefined>((resolve) => {
				guard = resolve;
			});
		},
	}));

	const onFinish = async (values: GroupEntity) => {
		if (editingId) {
			await groupService.fetchUpdateGroup(editingId, values);
			window.$message?.success(t("common.updateSuccess"));
		}
		else {
			await groupService.fetchAddGroup(values);
			window.$message?.success(t("common.addSuccess"));
		}
		guard?.({ isChange: true });
		return true;
	};

	const onClose = () => {
		setOpen(false);
		setEditingId(null);
		form.resetFields();
		guard?.();
	};

	return (
		<ModalForm<GroupEntity>
			title={editingId ? t("system.userGroup.editGroup") : t("system.userGroup.addGroup")}
			open={open}
			onOpenChange={(visible) => {
				if (!visible) {
					onClose();
				}
			}}
			layout="vertical"
			form={form}
			modalProps={{ destroyOnHidden: true, width: 600 }}
			onFinish={onFinish}
		>
			<Spin spinning={loading}>
				<Form.Item
					name="name"
					label={t("system.userGroup.name")}
					rules={[{
						validator: (_: unknown, value: string) => {
							const v = (value ?? "").trim();
							if (!v)
								return Promise.reject(new Error(t("system.userGroup.nameRequired")));
							if (v.length > 255)
								return Promise.reject(new Error(t("system.userGroup.nameMaxLength")));
							if (!/^\p{L}+(?:\s\p{L}+)*$/u.test(v))
								return Promise.reject(new Error(t("system.userGroup.nameInvalidFormat")));
							return Promise.resolve();
						},
					}]}
				>
					<TrimInput placeholder={t("common.pleaseInput")} />
				</Form.Item>

				<Form.Item name="users" label={t("system.userGroup.users")}>
					<PeoplePicker mode="multiple" api="user" />
				</Form.Item>

				<Form.Item
					name="description"
					label={t("system.userGroup.description")}
					rules={[{
						validator: (_: unknown, value: string) => {
							const v = (value ?? "").trim();
							if (v.length > 500)
								return Promise.reject(new Error(t("system.userGroup.descriptionMaxLength")));
							return Promise.resolve();
						},
					}]}
				>
					<TrimTextArea placeholder={t("common.pleaseInput")} />
				</Form.Item>
			</Spin>
		</ModalForm>
	);
}
