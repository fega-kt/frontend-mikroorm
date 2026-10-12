import type { FormField } from "#src/api/setting/request-type/types";
import type { AddableNodeType } from "../lib/node-factory";
import { createContext, use } from "react";

export type NodeStatus = "done" | "current" | "rejected" | "returned" | "skipped" | "pending";

export interface ConditionInfo {
	branches: number
	/** Các biến payload mà các nhánh dùng, ví dụ ["payload.days"] */
	vars: string[]
}

/**
 * Dữ liệu hiển thị dùng chung cho node/cạnh — không phụ thuộc store của màn thiết kế,
 * để ApprovalFlowGraph (chỉ đọc) dùng lại được các component node.
 */
export interface FlowDisplay {
	readOnly: boolean
	selectedId?: string | null
	nodeErrors: Record<string, string[]>
	edgeErrors: Record<string, string[]>
	nodeStatus?: Record<string, NodeStatus>
	/** Khi có: chỉ các node/cạnh này nổi bật, phần còn lại làm mờ (chạy thử) */
	highlightNodes?: Set<string> | null
	highlightEdges?: Set<string> | null
	/** Làm mờ các node chưa có trạng thái / đang chờ (đồ thị theo dõi đơn) */
	dimUnvisited?: boolean
	userNames: Record<string, string>
	fields: FormField[]
	conditionInfo: Record<string, ConditionInfo>
	onInsert?: (edgeId: string, type: AddableNodeType) => void
	onSelect?: (id: string) => void
}

export const EMPTY_DISPLAY: FlowDisplay = {
	readOnly: true,
	nodeErrors: {},
	edgeErrors: {},
	userNames: {},
	fields: [],
	conditionInfo: {},
};

export const FlowDisplayContext = createContext<FlowDisplay>(EMPTY_DISPLAY);

export const useFlowDisplay = () => use(FlowDisplayContext);
