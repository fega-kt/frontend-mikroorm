import type { RoleEntity } from "#src/api/system/role";
import type { PermissionType } from "#src/api/system/role/types";
import { roleService } from "#src/api/system/role";
import { ProFormPrincipalPicker } from "#src/components/principal-picker";
import { ModalForm, ProFormText, ProFormTextArea } from "@ant-design/pro-components";
import { Button, Checkbox, Col, Collapse, Form, Row, Spin, theme, Typography } from "antd";
import * as React from "react";
import { useImperativeHandle, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { PERMISSION_GROUPS } from "./permissions";

const { Text } = Typography;

export interface DetailRef {
	show: (id?: string) => Promise<{ isChange: boolean } | undefined>
}

interface DetailProps {
	ref: React.Ref<DetailRef>
}

let guard: (res?: { isChange: boolean }) => void;

export function Detail({ ref }: DetailProps) {
	const { t } = useTranslation();
	const [form] = Form.useForm<RoleEntity>();
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);

	const { token } = theme.useToken();
	const title = useMemo(
		() => (editingId ? t("system.role.editRole") : t("system.role.addRole")),
		[editingId, t],
	);

	useImperativeHandle(ref, () => ({
		show: async (id?: string) => {
			form.resetFields();
			setEditingId(id ?? null);
			setOpen(true);
			if (id) {
				setLoading(true);
				try {
					const data = await roleService.fetchRoleItem(id);
					form.setFieldsValue(data);
					setLoading(false);
				}
				catch (error) {
					console.error("[RoleDetail] Failed to fetch role info:", error);
					// Keep loading=true to prevent user interaction or close modal
					window.$message?.error(t("common.fetchError"));
				}
			}
			return new Promise<{ isChange: boolean } | undefined>((resolve) => {
				guard = resolve;
			});
		},
	}));

	const rights = Form.useWatch<PermissionType[]>("rights", form) || [];

	const onFinish = async (values: RoleEntity) => {
		if (editingId) {
			await roleService.fetchUpdateRole(editingId, values);
			window.$message?.success(t("common.updateSuccess"));
		}
		else {
			await roleService.fetchAddRole(values);
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
		<ModalForm<RoleEntity>
			title={title}
			open={open}
			onOpenChange={(visible) => {
				if (visible === false) {
					onClose();
				}
			}}
			layout="vertical"
			form={form}
			autoFocusFirstInput
			modalProps={{
				destroyOnHidden: true,
				width: 800,
				styles: {
					body: {
						maxHeight: "calc(100vh - 240px)",
						overflowY: "auto",
						overflowX: "hidden",
						paddingInline: 24,
						paddingBlock: 16,
					},
				},
			}}
			onFinish={onFinish}
		>
			<Spin spinning={loading}>
				<ProFormText
					name="name"
					label={t("system.role.name")}
					placeholder={t("common.pleaseInput")}
					rules={[{ required: true }]}
				/>

				<ProFormTextArea
					name="description"
					label={t("system.role.description")}
					placeholder={t("common.pleaseInput")}
					fieldProps={{ autoSize: { minRows: 1, maxRows: 3 } }}
				/>

				<ProFormPrincipalPicker
					multiple
					name="usersAndGroups"
					label={t("system.role.usersAndGroups")}
					fieldProps={{
						placeholder: t("common.pleaseSelect"),
					}}
				/>

				<Text strong className="mb-3 block">{t("system.role.rights")}</Text>

				<Form.Item name="rights" className="mb-0">
					<Checkbox.Group className="w-full">
						<Collapse
							size="small"
							defaultActiveKey={Object.keys(PERMISSION_GROUPS)}
							expandIconPosition="start"
							className="permission-collapse w-full bg-transparent border-none"
						>
							{Object.entries(PERMISSION_GROUPS).map(([group, permissions]) => (
								<Collapse.Panel
									key={group}
									header={(
										<div className="flex w-full items-center justify-between">
											<Text strong className="text-[13px]">{t(`system.role.group.${group.toLowerCase()}`)}</Text>
											<Button
												type="link"
												size="small"
												className="p-0 h-auto text-[12px] font-normal"
												onClick={(e) => {
													e.stopPropagation();
													const isAllSelected = permissions.every(p => rights.includes(p));
													const next = isAllSelected
														? rights.filter(p => !permissions.includes(p))
														: Array.from(new Set([...rights, ...permissions]));
													form.setFieldsValue({ rights: next });
												}}
											>
												{permissions.length > 0 && permissions.every(p => rights.includes(p))
													? t("common.cancelAll")
													: t("common.selectAll")}
											</Button>
										</div>
									)}
									className="mb-3 border border-solid rounded-lg overflow-hidden"
									style={{
										borderColor: token.colorBorderSecondary,
										backgroundColor: token.colorFillAlter,
									}}
								>
									<div className="px-3 pb-3">
										<Row gutter={[12, 12]}>
											{permissions.map(perm => (
												<Col span={8} key={perm}>
													<Checkbox value={perm} className="text-[12.5px] whitespace-nowrap">
														{t(`system.role.permission.${perm.split(":").pop()}`)}
													</Checkbox>
												</Col>
											))}
										</Row>
									</div>
								</Collapse.Panel>
							))}
						</Collapse>
					</Checkbox.Group>
				</Form.Item>
			</Spin>
		</ModalForm>
	);
}
