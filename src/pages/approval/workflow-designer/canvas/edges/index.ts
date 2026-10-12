import type { EdgeTypes } from "@xyflow/react";
import { FLOW_EDGE_TYPE } from "../../lib/to-definition";
import { AddStepEdge } from "./AddStepEdge";

export { AddStepEdge };

/** Bảng component cạnh cho ReactFlow — dùng chung cho màn thiết kế và đồ thị chỉ đọc */
export const flowEdgeTypes: EdgeTypes = { [FLOW_EDGE_TYPE]: AddStepEdge };
