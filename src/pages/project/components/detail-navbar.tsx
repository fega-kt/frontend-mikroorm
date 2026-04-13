import { BasicButton } from "#src/components/basic-button";
import { ProjectOutlined, SaveOutlined } from "@ant-design/icons";
import { Breadcrumb, Space, theme, Typography } from "antd";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

interface DetailNavbarProps {
	isEditing: boolean
	loading?: boolean
	saving?: boolean
	onCancel: () => void
	onSave: () => void
}

export function DetailNavbar({ isEditing, loading, saving, onCancel, onSave }: DetailNavbarProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();

	return (
		<div
			className="px-4 md:px-8 flex flex-row items-center justify-between z-50 sticky top-0"
			style={{
				backgroundColor: token.colorBgContainer,
				borderBottom: `1px solid ${token.colorBorderSecondary}`,
				paddingTop: 14,
				paddingBottom: 14,
			}}
		>
			{/* Left – Breadcrumb + Title */}
			<div className="flex items-center gap-3">
				<div
					className="w-9 h-9 flex items-center justify-center text-base"
					style={{
						borderRadius: token.borderRadiusLG,
						backgroundColor: token.colorPrimaryBg,
						color: token.colorPrimary,
					}}
				>
					<ProjectOutlined />
				</div>
				<div>
					<Breadcrumb
						className="mb-0.5"
						items={[
							{ title: <Text type="secondary" className="text-xs truncate max-w-[100px]">{t("common.menu.project")}</Text> },
							{
								title: (
									<Text className="text-xs truncate max-w-[120px] md:max-w-none inline-block align-bottom">
										{isEditing ? t("project.update_info") : t("project.create_new")}
									</Text>
								),
							},
						]}
					/>
					<Text strong className="text-base md:text-lg leading-tight line-clamp-2 md:line-clamp-1">
						{isEditing ? t("project.update_info") : t("project.create_new")}
					</Text>
				</div>
			</div>

			{/* Right – Hủy / Lưu */}
			<Space size={8} className="shrink-0">
				<BasicButton
					type="default"
					disabled={loading || saving}
					onClick={onCancel}
					className="rounded-lg font-medium min-w-[60px] md:min-w-[80px]"
				>
					{t("common.cancel")}
				</BasicButton>
				<BasicButton
					type="primary"
					icon={<SaveOutlined />}
					loading={saving}
					disabled={loading}
					onClick={onSave}
					className="rounded-lg font-bold border-none min-w-[60px] md:min-w-[80px]"
				>
					{t("common.save")}
				</BasicButton>
			</Space>
		</div>
	);
}
