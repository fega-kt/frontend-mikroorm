import type { ApproverConfig, WfApprovalData } from "#src/api/setting/workflow-setting";
import type { PrincipalEntity } from "#src/api/system/principal";
import { ApproverType } from "#src/api/setting/workflow-setting";
import { PrincipalPicker } from "#src/components/principal-picker";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Divider, Input, Radio, Select, theme, Tooltip, Typography } from "antd";

interface ApprovalPanelProps {
	data: WfApprovalData
	onChange: (data: WfApprovalData) => void
}

const APPROVER_TYPE_OPTIONS = [
	{ value: "user", label: "User cụ thể" },
	{ value: "dept", label: "Phòng ban" },
	{ value: "role", label: "Role" },
	{ value: "dynamic", label: "Dynamic (field path)" },
];

function ApproverRow({ approver, onChange, onRemove }: {
	approver: ApproverConfig
	onChange: (a: ApproverConfig) => void
	onRemove: () => void
}) {
	const { token } = theme.useToken();

	const handleUsersChange = (value: PrincipalEntity | PrincipalEntity[] | string | string[]) => {
		const arr = (Array.isArray(value) ? value : value ? [value] : []).filter((v): v is PrincipalEntity => typeof v === "object");
		onChange({ ...approver, approvers: arr });
	};

	return (
		<div
			className="rounded-md p-2 space-y-1.5"
			style={{ border: `1px solid ${token.colorBorderSecondary}`, backgroundColor: token.colorFillAlter }}
		>
			<div className="flex items-center gap-1.5">
				<Select
					size="small"
					value={approver.type}
					options={APPROVER_TYPE_OPTIONS}
					onChange={type => onChange({ type })}
					style={{ flex: 1 }}
				/>
				<Tooltip title="Xóa">
					<Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={onRemove} />
				</Tooltip>
			</div>

			{approver.type === ApproverType.User && (
				<PrincipalPicker
					mode="multiple"
					value={approver.approvers ?? []}
					onChange={handleUsersChange}
					placeholder="Tìm và chọn người phê duyệt..."
					size="small"
					style={{ width: "100%" }}
				/>
			)}

			{approver.type === ApproverType.Dept && (
				<Input
					size="small"
					placeholder="Tên phòng ban"
					value={approver.name || ""}
					onChange={e => onChange({ ...approver, name: e.target.value, id: e.target.value })}
				/>
			)}

			{approver.type === ApproverType.Role && (
				<Input
					size="small"
					placeholder="Tên role"
					value={approver.name || ""}
					onChange={e => onChange({ ...approver, name: e.target.value, id: e.target.value })}
				/>
			)}

			{approver.type === ApproverType.Dynamic && (
				<Input
					size="small"
					placeholder="VD: requester.directManager"
					value={approver.fieldPath || ""}
					onChange={e => onChange({ ...approver, fieldPath: e.target.value })}
				/>
			)}
		</div>
	);
}

export function ApprovalPanel({ data, onChange }: ApprovalPanelProps) {
	const { token } = theme.useToken();

	const update = <K extends keyof WfApprovalData>(key: K, val: WfApprovalData[K]) => {
		onChange({ ...data, [key]: val });
	};

	const addApprover = () => {
		const next: ApproverConfig = { type: ApproverType.User, approvers: [] };
		onChange({ ...data, approvers: [...(data.approvers || []), next] });
	};

	const updateApprover = (index: number, approver: ApproverConfig) => {
		const approvers = [...(data.approvers || [])];
		approvers[index] = approver;
		onChange({ ...data, approvers });
	};

	const removeApprover = (index: number) => {
		onChange({ ...data, approvers: (data.approvers || []).filter((_, i) => i !== index) });
	};

	return (
		<div className="space-y-4 p-4">
			<div>
				<Typography.Text className="text-xs font-medium block mb-1" style={{ color: token.colorTextSecondary }}>
					Tiêu đề bước
				</Typography.Text>
				<Input
					value={data.title || ""}
					onChange={e => update("title", e.target.value)}
					placeholder="Bước phê duyệt..."
				/>
			</div>

			<Divider className="my-3" />

			<div>
				<div className="flex items-center justify-between mb-2">
					<Typography.Text className="text-xs font-medium" style={{ color: token.colorTextSecondary }}>
						Người phê duyệt
					</Typography.Text>
					<Button size="small" type="dashed" icon={<PlusOutlined />} onClick={addApprover}>
						Thêm
					</Button>
				</div>
				<div className="space-y-2">
					{(data.approvers || []).map((a, i) => (
						<ApproverRow
							key={`$approval-panel${(i + 1)}`}
							approver={a}
							onChange={approver => updateApprover(i, approver)}
							onRemove={() => removeApprover(i)}
						/>
					))}
					{!data.approvers?.length && (
						<Typography.Text className="text-xs" style={{ color: token.colorTextQuaternary }}>
							Chưa có người phê duyệt
						</Typography.Text>
					)}
				</div>
			</div>

			<Divider className="my-3" />

			<div>
				<Typography.Text className="text-xs font-medium block mb-2" style={{ color: token.colorTextSecondary }}>
					Loại phê duyệt
				</Typography.Text>
				<Radio.Group value={data.approvalType || "all"} onChange={e => update("approvalType", e.target.value)} size="small">
					<Radio.Button value="all">Tất cả</Radio.Button>
					<Radio.Button value="any">Bất kỳ ai</Radio.Button>
				</Radio.Group>
				<Typography.Text className="text-[11px] block mt-1" style={{ color: token.colorTextQuaternary }}>
					{data.approvalType === "any" ? "Chỉ cần 1 người phê duyệt là đủ" : "Tất cả đều phải phê duyệt"}
				</Typography.Text>
			</div>

			<div>
				<Typography.Text className="text-xs font-medium block mb-2" style={{ color: token.colorTextSecondary }}>
					Tự phê duyệt
				</Typography.Text>
				<Radio.Group value={data.selfApproval || "skip"} onChange={e => update("selfApproval", e.target.value)} size="small">
					<Radio.Button value="allow">Cho phép</Radio.Button>
					<Radio.Button value="skip">Bỏ qua</Radio.Button>
				</Radio.Group>
			</div>
		</div>
	);
}
