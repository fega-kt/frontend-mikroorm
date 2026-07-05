import type { AppRouteRecordRaw } from "#src/router/types";
import ContainerLayout from "#src/layout/container-layout";
import { approval } from "#src/router/extra-info";
import { lazy } from "react";

const ApprovalTaskPage = lazy(() => import("#src/pages/approval/task"));

const routes: AppRouteRecordRaw[] = [
	{
		path: "/approval",
		Component: ContainerLayout,
		handle: {
			icon: "ContainerOutlined",
			title: "common.menu.approval",
			order: approval,
		},
		children: [
			{
				path: "/approval/my-tasks",
				Component: ApprovalTaskPage,
				handle: {
					icon: "NodeIndexOutlined",
					title: "common.menu.approvalTask",
					permissions: [
						"permission:approval-task:complete",
					],
				},
			},
		],
	},
];

export default routes;
