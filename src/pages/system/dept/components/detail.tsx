import type { DepartmentEntity } from "#src/api/system/dept";
import { fetchAddDeptItem, fetchUpdateDeptItem } from "#src/api/system/dept";
import { handleTree } from "#src/utils/tree";

import {
	ModalForm,
	ProFormCascader,
	ProFormRadio,
	ProFormText,
} from "@ant-design/pro-components";
import { Form } from "antd";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

interface DetailProps {
	title: React.ReactNode
	flatDeptList: DepartmentEntity[]
	open: boolean
	detailData: Partial<DepartmentEntity>
	onCloseChange: () => void
	refreshTable?: () => void
}

export function Detail({
	title,
	open,
	flatDeptList,
	onCloseChange,
	detailData,
	refreshTable,
}: DetailProps) {
	const { t } = useTranslation();
	const [form] = Form.useForm<DepartmentEntity>();

	const onFinish = async (values: DepartmentEntity) => {
		if (detailData.id) {
			await fetchUpdateDeptItem(values);
			window.$message?.success(t("common.updateSuccess"));
		}
		else {
			await fetchAddDeptItem(values);
			window.$message?.success(t("common.addSuccess"));
		}
		refreshTable?.();
		return true;
	};

	useEffect(() => {
		if (open) {
			form.setFieldsValue(detailData);
		}
	}, [detailData, form, open]);

	return (
		<ModalForm<DepartmentEntity>
			title={title}
			open={open}
			onOpenChange={(visible) => {
				if (visible === false) {
					onCloseChange();
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
			onFinish={onFinish}
			initialValues={{
				status: 1,
			}}
		>
			<ProFormText
				allowClear
				rules={[{ required: true }]}
				width="md"
				name="name"
				label={t("system.dept.name")}
				tooltip={t("form.length", { length: 50 })}
			/>

			<ProFormText
				allowClear
				rules={[{ required: true }]}
				width="md"
				name="code"
				label={t("system.dept.code")}
			/>

			<ProFormCascader
				name="parent"
				label={t("system.dept.parentDept")}
				transform={(value: DepartmentEntity[]) => ({
					parent: value?.[value.length - 1],
				})}
				fieldProps={{
					showSearch: true,
					autoClearSearchValue: true,
					changeOnSelect: true,
					fieldNames: {
						label: "name",
						value: "id",
						children: "children",
					},
				}}
				request={async () => {
					return handleTree(flatDeptList);
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
		</ModalForm>
	);
}
