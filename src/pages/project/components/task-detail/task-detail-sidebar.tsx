import type { SectionEntity } from "#src/api/section/types";
import type { TaskPriority, TaskStatus } from "#src/api/task/types";
import { projectService } from "#src/api/project";
import { ProFormPeoplePicker } from "#src/components/people-picker";
import {
	CalendarOutlined,
	ClockCircleOutlined,
	FlagOutlined,
	FolderOutlined,
	NodeIndexOutlined,
	TagsOutlined,
} from "@ant-design/icons";
import {
	ProFormDatePicker,
	ProFormDigit,
	ProFormSelect,
	ProFormSwitch,
} from "@ant-design/pro-components";
import { Collapse, Space, theme, Typography } from "antd";

const { Text } = Typography;

interface TaskDetailSidebarProps {
	sections: SectionEntity[]
	showProjectPicker?: boolean
	onProjectChange?: (projectId: string) => void
}

function FieldTitle({ icon, text }: { icon: React.ReactNode, text: string }) {
	const { token } = theme.useToken();
	return (
		<Space size={6}>
			<span style={{ fontSize: 13, display: "flex", alignItems: "center", color: token.colorTextDescription }}>
				{icon}
			</span>
			<span style={{ fontSize: 13 }}>{text}</span>
		</Space>
	);
}

const STATUS_OPTIONS: Array<{ label: string, value: TaskStatus }> = [
	{ label: "📋 Chưa làm", value: "TODO" as TaskStatus },
	{ label: "⚡ Đang làm", value: "IN_PROGRESS" as TaskStatus },
	{ label: "✅ Hoàn thành", value: "DONE" as TaskStatus },
	{ label: "❌ Đã hủy", value: "CANCELLED" as TaskStatus },
	{ label: "🚫 Từ chối", value: "REJECTED" as TaskStatus },
];

const PRIORITY_OPTIONS: Array<{ label: string, value: TaskPriority }> = [
	{ label: "🔴 Cao", value: "HIGH" as TaskPriority },
	{ label: "🟡 Trung bình", value: "MEDIUM" as TaskPriority },
	{ label: "🟢 Thấp", value: "LOW" as TaskPriority },
];

export function TaskDetailSidebar({ sections, showProjectPicker, onProjectChange }: TaskDetailSidebarProps) {
	const { token } = theme.useToken();

	const panelStyle = {
		borderColor: token.colorBorderSecondary,
		backgroundColor: token.colorBgContainer,
	};

	const sectionOptions = sections.map(s => ({ label: s.name, value: s.id }));

	return (
		<Collapse
			defaultActiveKey={["assignment", "schedule", "meta"]}
			expandIconPosition="start"
			className="w-full bg-transparent border-none"
		>
			<Collapse.Panel
				key="assignment"
				header={<Text strong className="text-[13px] uppercase tracking-wider">Phân công</Text>}
				className="mb-3 border border-solid rounded-lg overflow-hidden"
				style={panelStyle}
			>
				{showProjectPicker && (
					<ProFormSelect
						name="project"
						label={<FieldTitle icon={<FolderOutlined />} text="Dự án" />}
						rules={[{ required: true, message: "Vui lòng chọn dự án" }]}
						placeholder="Chọn dự án..."
						request={async (params) => {
							const res = await projectService.fetchProjectList({ name: params.keyWords });
							return res.data.map(p => ({ label: p.name, value: p.id }));
						}}
						fieldProps={{
							showSearch: true,
							onChange: val => onProjectChange?.(val as string),
						}}
					/>
				)}
				<ProFormPeoplePicker
					name="assignee"
					label={<FieldTitle icon={<FlagOutlined />} text="Người thực hiện" />}
					rules={[{ required: true, message: "Vui lòng chọn người thực hiện" }]}
					placeholder="Chọn assignee..."
				/>
				<ProFormSelect
					name="status"
					label={<FieldTitle icon={<NodeIndexOutlined />} text="Trạng thái" />}
					options={STATUS_OPTIONS}
					initialValue="TODO"
					rules={[{ required: true }]}
				/>
				<ProFormSelect
					name="priority"
					label={<FieldTitle icon={<FlagOutlined />} text="Độ ưu tiên" />}
					options={PRIORITY_OPTIONS}
					initialValue="MEDIUM"
					rules={[{ required: true }]}
				/>
				{sectionOptions.length > 0 && (
					<ProFormSelect
						name="section"
						label={<FieldTitle icon={<NodeIndexOutlined />} text="Section" />}
						options={sectionOptions}
					/>
				)}
			</Collapse.Panel>

			<Collapse.Panel
				key="schedule"
				header={<Text strong className="text-[13px] uppercase tracking-wider">Thời gian</Text>}
				className="mb-3 border border-solid rounded-lg overflow-hidden"
				style={panelStyle}
			>
				<ProFormDatePicker
					name="startDate"
					label={<FieldTitle icon={<CalendarOutlined />} text="Bắt đầu" />}
					className="w-full"
					fieldProps={{ className: "w-full" }}
				/>
				<ProFormDatePicker
					name="dueDate"
					label={<FieldTitle icon={<CalendarOutlined />} text="Hạn chót" />}
					className="w-full"
					fieldProps={{ className: "w-full" }}
				/>
				<ProFormDigit
					name="estimatedHours"
					label={<FieldTitle icon={<ClockCircleOutlined />} text="Giờ dự kiến" />}
					min={0}
					fieldProps={{ addonAfter: "h", className: "w-full" }}
				/>
				<ProFormDigit
					name="actualHours"
					label={<FieldTitle icon={<ClockCircleOutlined />} text="Giờ thực tế" />}
					min={0}
					fieldProps={{ addonAfter: "h", className: "w-full" }}
				/>
			</Collapse.Panel>

			<Collapse.Panel
				key="meta"
				header={<Text strong className="text-[13px] uppercase tracking-wider">Thông tin thêm</Text>}
				className="mb-3 border border-solid rounded-lg overflow-hidden"
				style={panelStyle}
			>
				<ProFormSelect
					name="labels"
					label={<FieldTitle icon={<TagsOutlined />} text="Labels" />}
					mode="tags"
					placeholder="Thêm label..."
					fieldProps={{ className: "w-full" }}
				/>
				<ProFormSwitch
					name="isMilestone"
					label="Milestone"
					checkedChildren="Có"
					unCheckedChildren="Không"
				/>
			</Collapse.Panel>
		</Collapse>
	);
}
