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

// parent từ API là string ID (dù type khai báo DepartmentEntity)
type ParentId = string | null | undefined;

function getParentId(item: DepartmentEntity): string | undefined {
	return (item.parent as unknown as ParentId) ?? undefined;
}

/** Trả về tập ID của node đó và toàn bộ con cháu */
function getDescendantIds(id: string, list: DepartmentEntity[]): Set<string> {
	const result = new Set<string>([id]);
	const queue = [id];
	while (queue.length > 0) {
		const current = queue.shift()!;
		for (const item of list) {
			if (getParentId(item) === current && !result.has(item.id)) {
				result.add(item.id);
				queue.push(item.id);
			}
		}
	}
	return result;
}

/** Build path mảng ID từ root đến node (dùng cho Cascader) */
function getAncestorPath(parentId: string, list: DepartmentEntity[]): string[] {
	const path: string[] = [];
	let current: string | undefined = parentId;
	while (current) {
		path.unshift(current);
		const node = list.find(d => d.id === current);
		current = getParentId(node!);
	}
	return path;
}

export function Detail({ ref }: DetailProps) {
	const { t } = useTranslation();
	const [form] = Form.useForm<DepartmentEntity>();

	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [activeTab, setActiveTab] = useState("info");
	const [editingId, setEditingId] = useState<string | null>(null);
	const [flatDeptList, setFlatDeptList] = useState<DepartmentEntity[]>([]);
	const [deptUsers, setDeptUsers] = useState<UserEntity[]>([]);

	const title = useMemo(
		() => editingId ? t("system.dept.editDept") : t("system.dept.addDept"),
		[editingId, t],
	);

	/** Danh sách dept hợp lệ làm parent */
	const validParentList = useMemo(
		() => editingId
			? flatDeptList.filter(d => !getDescendantIds(editingId, flatDeptList).has(d.id))
			: flatDeptList,
		[editingId, flatDeptList],
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
				const [deptList, deptItem] = await Promise.all([
					departmentService.fetchDeptList({}),
					id ? departmentService.fetchDeptItem(id) : Promise.resolve(null),
				]);
				setFlatDeptList(deptList);
				if (deptItem) {
					const parentString = getParentId(deptItem);
					const parent = parentString
						? getAncestorPath(parentString, deptList)
						: undefined;
					// manager/deputy dùng labelInValue: { label, value } để hiển thị ngay không cần pre-load options
					const toSelectValue = (user: UserEntity | null | undefined) =>
						user ? { label: user.fullName, value: user.id } : null;
					form.setFieldsValue({
						...deptItem,
						parent,
						manager: toSelectValue(deptItem.manager),
						deputy: toSelectValue(deptItem.deputy),
					} as any);
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
							children: <DeptInfoTab isEditing={!!editingId} validParentList={validParentList} />,
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
