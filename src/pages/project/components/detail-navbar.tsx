import { CloseOutlined, ProjectOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, Form, Space, theme, Typography } from "antd";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

const STATUS_LABEL: Record<string, { icon: string, color: string, label: string }> = {
	PLANNING: { icon: "📍", color: "orange", label: "Lên kế hoạch" },
	ACTIVE: { icon: "⚡", color: "blue", label: "Đang hoạt động" },
	COMPLETED: { icon: "✅", color: "green", label: "Hoàn thành" },
	ON_HOLD: { icon: "⏳", color: "default", label: "Tạm dừng" },
	ARCHIVED: { icon: "📦", color: "default", label: "Lưu trữ" },
};

interface DetailNavbarProps {
	isEditing: boolean
	saving?: boolean
	onCancel: () => void
	onSave: () => void
}

export function DetailNavbar({ isEditing, saving, onCancel, onSave }: DetailNavbarProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const form = Form.useFormInstance();
	const status: string = form.getFieldValue("status") || "PLANNING";
	const statusCfg = STATUS_LABEL[status] ?? STATUS_LABEL.PLANNING;

	return (
		<div
			className="px-8 py-3 flex items-center justify-between z-50 sticky top-0"
			style={{
				backgroundColor: token.colorBgContainer,
				borderBottom: `1px solid ${token.colorBorderSecondary}`,
				boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
			}}
		>
			<div className="flex items-center gap-3">
				<div
					className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner"
					style={{ backgroundColor: token.colorPrimaryBg, color: token.colorPrimary }}
				>
					<ProjectOutlined />
				</div>
				<div>
					<div className="flex items-center gap-2 mb-0.5">
						<Text type="secondary" className="text-[10px] font-bold uppercase tracking-widest leading-none">
							Project Studio
						</Text>
						<span className="text-[11px]">
							{statusCfg.icon}
							{" "}
							<Text type="secondary" className="text-[11px]">{statusCfg.label}</Text>
						</span>
					</div>
					<Text strong className="text-sm leading-none">
						{isEditing ? t("project.update_info") : t("project.create_new")}
					</Text>
				</div>
			</div>

			<Space size={12}>
				<Button
					type="text"
					icon={<CloseOutlined />}
					onClick={onCancel}
					className="rounded-lg h-9 w-9 flex items-center justify-center"
				/>
				<div className="w-px h-6 mx-1" style={{ backgroundColor: token.colorBorderSecondary }} />
				<Button
					type="primary"
					icon={<SaveOutlined />}
					size="large"
					loading={saving}
					onClick={onSave}
					className="shadow-md font-bold border-none h-10 rounded-lg"
				>
					{isEditing ? t("project.update_btn") : t("project.save_btn")}
				</Button>
			</Space>
		</div>
	);
}
