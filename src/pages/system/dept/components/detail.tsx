import type { DepartmentEntity } from "#src/api/system/dept";
import { fetchAddDeptItem, fetchDeptItem, fetchDeptList, fetchUpdateDeptItem } from "#src/api/system/dept";
import { handleTree } from "#src/utils/tree";

import {
	ModalForm,
	ProFormCascader,
	ProFormRadio,
	ProFormText,
} from "@ant-design/pro-components";
import { Form, Spin } from "antd";
import { useImperativeHandle, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

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
	const [editingId, setEditingId] = useState<string | null>(null);
	const [flatDeptList, setFlatDeptList] = useState<DepartmentEntity[]>([]);

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
			setOpen(true);
			setLoading(true);
			try {
				const [deptList, deptItem] = await Promise.all([
					fetchDeptList({}),
					id ? fetchDeptItem(id) : Promise.resolve(null),
				]);
				setFlatDeptList(deptList);
				if (deptItem) {
					const parentString = getParentId(deptItem);
					const parent = parentString
						? getAncestorPath(parentString, deptList)
						: undefined;
					form.setFieldsValue({ ...deptItem, parent } as any);
				}
			}
			finally {
				setLoading(false);
			}
			return new Promise<{ isChange: boolean } | undefined>((resolve) => {
				guard = resolve;
			});
		},
	}));

	const onFinish = async (values: DepartmentEntity) => {
		if (editingId) {
			await fetchUpdateDeptItem(editingId, values);
			window.$message?.success(t("common.updateSuccess"));
		}
		else {
			await fetchAddDeptItem(values);
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
			}}
			submitter={{ submitButtonProps: { disabled: loading } }}
			onFinish={onFinish}
			initialValues={{
				status: 1,
			}}
		>
			<Spin spinning={loading}>
				<ProFormText
					allowClear
					rules={[{ required: true }]}
					name="name"
					label={t("system.dept.name")}
					tooltip={t("form.length", { length: 50 })}
				/>

				<ProFormText
					allowClear
					rules={[{ required: true }]}
					name="code"
					label={t("system.dept.code")}
				/>

				<ProFormCascader
					name="parent"
					label={t("system.dept.parentDept")}
					transform={(value: string[]) => ({
						parent: value?.[value.length - 1] ?? null,
					})}
					fieldProps={{
						showSearch: true,
						autoClearSearchValue: true,
						changeOnSelect: true,
						options: handleTree(validParentList),
						fieldNames: {
							label: "name",
							value: "id",
							children: "children",
						},
					}}
				/>

				<ProFormRadio.Group
					name="status"
					label={t("common.status")}
					radioType="button"
					options={[
						{
							label: t("common.enabled"),
							value: 1,
						},
						{
							label: t("common.deactivated"),
							value: 0,
						},
					]}
				/>
			</Spin>
		</ModalForm>
	);
}
