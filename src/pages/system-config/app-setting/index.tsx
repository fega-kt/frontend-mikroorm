import type { AppSettingRow } from "#src/api/system-config/app-setting";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import type { DetailMode, DetailRef } from "./components/detail";
import type { HistoryRef } from "./components/history";

import { appSettingService } from "#src/api/system-config/app-setting";
import { BasicContent } from "#src/components/basic-content";
import { BasicTable } from "#src/components/basic-table";
import { RowActions } from "#src/components/row-actions";
import { useAccess } from "#src/hooks/use-access";
import { PermissionType } from "#src/hooks/use-access/permission-type.enum.js";
import { HistoryOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Tooltip } from "antd";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Detail } from "./components/detail";
import { History } from "./components/history";
import { getConstantColumns } from "./constants";

export default function AppSetting() {
	const { t } = useTranslation();
	const { canAccess } = useAccess();
	const actionRef = useRef<ActionType>(null);
	const detailRef = useRef<DetailRef>(null);
	const historyRef = useRef<HistoryRef>(null);
	const queryClient = useQueryClient();

	const canView = canAccess(PermissionType.ViewAppSettingDetail);
	const canCreate = canAccess(PermissionType.CreateAppSetting);
	const canUpdate = canAccess(PermissionType.UpdateAppSetting);
	const canDelete = canAccess(PermissionType.DeleteAppSetting);

	/** Lịch sử được cache theo key, thao tác xong thì làm mới để lần mở sau thấy ngay log vừa ghi */
	const invalidateHistory = (record: AppSettingRow) => {
		queryClient.invalidateQueries({ queryKey: ["app-setting", "history", record.key] });
	};

	const openDetail = async (record: AppSettingRow, mode: DetailMode) => {
		const res = await detailRef.current?.show(record, mode);
		if (res?.isChange) {
			actionRef.current?.reload();
			invalidateHistory(record);
		}
	};

	const handleAdd = async () => {
		const res = await detailRef.current?.show(undefined, "create");
		if (res?.isChange) {
			actionRef.current?.reload();
			// Key được chọn trong modal nên không biết trước; key từng bị xóa rồi thêm lại vẫn giữ lịch sử cũ
			queryClient.invalidateQueries({ queryKey: ["app-setting", "history"] });
		}
	};

	const handleDelete = async (record: AppSettingRow) => {
		await appSettingService.fetchDeleteAppSetting(record.key);
		actionRef.current?.reload();
		invalidateHistory(record);
		window.$message?.success(t("common.deleteSuccess"));
	};

	const columns: ProColumns<AppSettingRow>[] = [
		...getConstantColumns(t, canView ? record => openDetail(record, "view") : undefined),
	];

	if (canView || canUpdate || canDelete) {
		columns.push({
			title: t("common.action"),
			valueType: "option",
			key: "option",
			width: 120,
			fixed: "right",
			render: (_, record) => (
				<div className="flex items-center gap-2">
					<RowActions
						onEdit={() => openDetail(record, "edit")}
						editEnabled={canUpdate}
						onDelete={() => handleDelete(record)}
						deleteEnabled={canDelete}
						deleteConfirmTitle={t("system.appSetting.deleteConfirm")}
					/>
					{canView && (
						<Tooltip title={t("system.appSetting.history")}>
							<Button
								type="text"
								size="small"
								icon={<HistoryOutlined />}
								onClick={() => historyRef.current?.show(record)}
							/>
						</Tooltip>
					)}
				</div>
			),
		});
	}

	return (
		<BasicContent className="h-full">
			<BasicTable<AppSettingRow>
				adaptive
				rowKey="id"
				columns={columns}
				actionRef={actionRef}
				request={async (params) => {
					const { data, total } = await appSettingService.fetchAppSettingList({
						page: params.page,
						limit: params.limit,
						keyword: params.keyword || undefined,
					});
					return {
						data,
						total,
						success: true,
					};
				}}
				headerTitle={t("system.appSetting.title")}
				toolBarRender={() => [
					<Button
						key="add-app-setting"
						icon={<PlusCircleOutlined />}
						type="primary"
						disabled={!canCreate}
						onClick={handleAdd}
					>
						{t("common.add")}
					</Button>,
				]}
			/>
			<Detail ref={detailRef} />
			<History ref={historyRef} />
		</BasicContent>
	);
}
