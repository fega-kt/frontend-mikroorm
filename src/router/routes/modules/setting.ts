import type { AppRouteRecordRaw } from "#src/router/types";
import ContainerLayout from "#src/layout/container-layout";
import { setting } from "#src/router/extra-info";

import { lazy } from "react";

const Category = lazy(() => import("#src/pages/setting/category"));
const RequestType = lazy(() => import("#src/pages/setting/request-type"));
const WorkflowSetting = lazy(() => import("#src/pages/setting/workflow-setting"));
const WorkflowInstance = lazy(() => import("#src/pages/setting/workflow-instance"));
const MyTasks = lazy(() => import("#src/pages/setting/my-tasks"));

const routes: AppRouteRecordRaw[] = [
	{
		path: "/setting",
		Component: ContainerLayout,
		handle: {
			icon: "ToolOutlined",
			title: "common.menu.setting",
			order: setting,
		},
		children: [
			{
				path: "/setting/category",
				Component: Category,
				handle: {
					icon: "TagsOutlined",
					title: "common.menu.category",
					permissions: [
						"permission:button:add",
						"permission:button:update",
						"permission:button:delete",
					],
				},
			},
			{
				path: "/setting/request-type",
				Component: RequestType,
				handle: {
					icon: "FileTextOutlined",
					title: "common.menu.requestType",
					permissions: [
						"permission:button:add",
						"permission:button:update",
						"permission:button:delete",
					],
				},
			},
			{
				path: "/setting/workflow-setting",
				Component: WorkflowSetting,
				handle: {
					icon: "NodeIndexOutlined",
					title: "common.menu.workflowSetting",
					permissions: [
						"permission:button:add",
						"permission:button:update",
						"permission:button:delete",
					],
				},
			},
			{
				path: "/setting/workflow-instance",
				Component: WorkflowInstance,
				handle: {
					icon: "FileDoneOutlined",
					title: "common.menu.workflowInstance",
					permissions: [
						"permission:button:add",
						"permission:button:update",
						"permission:button:delete",
					],
				},
			},
			{
				path: "/setting/my-tasks",
				Component: MyTasks,
				handle: {
					icon: "CheckSquareOutlined",
					title: "common.menu.myTasks",
					permissions: [
						"permission:button:add",
						"permission:button:update",
						"permission:button:delete",
					],
				},
			},
		],
	},
];

export default routes;
