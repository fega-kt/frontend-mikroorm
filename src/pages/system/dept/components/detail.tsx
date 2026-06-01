import type { DepartmentEntity } from "#src/api/system/dept";
import type { UserEntity } from "#src/api/user/types";
import { departmentService } from "#src/api/system/dept";
import { ModalForm } from "@ant-design/pro-components";
import { Form, Spin, Tabs } from "antd";
import { useImperativeHandle, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { DeptInfoTab } from "./dept-info-tab";
import { DeptUsersTab } from "./dept-users-tab";

export interface DetailRef {
	show: (id?: string) => Promise<{ isChange: boolean } | undefined>
}

interface DetailProps {
	ref: React.Ref<DetailRef>
}

let guard: (res?: { isChange: boolean }) => void;

export function Detail({ ref }: DetailProps) {
	const { t } = useTranslation();
	const [form] = Form.useForm<DepartmentEntity>();

	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [activeTab, setActiveTab] = useState("info");
	const [editingId, setEditingId] = useState<string | null>(null);
	const [deptUsers, setDeptUsers] = useState<UserEntity[]>([]);

	const title = useMemo(
		() => editingId ? t("system.dept.editDept") : t("system.dept.addDept"),
		[editingId, t],
	);

	useImperativeHandle(ref, () => ({
		show: async (id?: string) => {
			form.resetFields();
			setEditingId(id ?? null);
			setActiveTab("info");
			setDeptUsers([]);
			setOpen(true);
			setLoading(true);
			try {
				const deptItem = id ? await departmentService.fetchDeptItem(id) : null;
				if (deptItem) {
					form.setFieldsValue(deptItem);
					setDeptUsers(deptItem.users ?? []);
				}
				setLoading(false);
			}
			catch (error) {
				window.$message?.error(error instanceof Error ? error.message : t("common.fetchError"));
			}
			return new Promise<{ isChange: boolean } | undefined>((resolve) => {
				guard = resolve;
			});
		},
	}));

	const onFinish = async (values: DepartmentEntity) => {
		if (editingId) {
			await departmentService.fetchUpdateDeptItem(editingId, values);
			window.$message?.success(t("common.updateSuccess"));
		}
		else {
			await departmentService.fetchAddDeptItem(values);
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
		<ModalForm<DepartmentEntity>
			title={title}
			open={open}
			onOpenChange={(visible) => {
				if (visible === false) {
					onClose();
				}
			}}
			labelCol={{ span: 6 }}
			wrapperCol={{ span: 24 }}
			layout="horizontal"
			form={form}
			autoFocusFirstInput
			modalProps={{
				destroyOnHidden: true,
				width: "min(720px, 90vw)",
			}}
			submitter={activeTab === "users"
				? false
				: { submitButtonProps: { disabled: loading } }}
			onFinish={onFinish}
			initialValues={{
				status: 1,
			}}
		>
			<Spin spinning={loading}>
				<Tabs
					activeKey={activeTab}
					onChange={setActiveTab}
					items={[
						{
							key: "info",
							label: t("system.dept.tabInfo"),
							children: <DeptInfoTab isEditing={!!editingId} excludeRootId={editingId ?? undefined} />,
						},
						{
							key: "users",
							label: t("system.dept.tabUsers"),
							disabled: !editingId,
							children: <DeptUsersTab users={deptUsers} />,
						},
					]}
				/>
			</Spin>
		</ModalForm>
	);
}
