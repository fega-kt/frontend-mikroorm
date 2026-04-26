import type { AppRouteRecordRaw } from "#src/router/types";
import ContainerLayout from "#src/layout/container-layout";
import { project } from "#src/router/extra-info";
import { lazy } from "react";

const ProjectPage = lazy(() => import("#src/pages/project"));
const TaskPage = lazy(() => import("#src/pages/task"));
const ResourcePage = lazy(() => import("#src/pages/resource"));
const ReportsPage = lazy(() => import("#src/pages/reports"));

const routes: AppRouteRecordRaw[] = [
	{
		path: "/project-mgmt",
		Component: ContainerLayout,
		handle: {
			icon: "ProjectOutlined",
			title: "common.menu.projectMgmt",
			order: project,
		},
		children: [
			{
				path: "/project-mgmt/projects",
				Component: ProjectPage,
				handle: {
					icon: "FolderOpenOutlined",
					title: "common.menu.project",
					permissions: [
						"permission:project:create",
						"permission:project:update",
						"permission:project:delete",
					],
				},
			},
			{
				path: "/project-mgmt/tasks",
				Component: TaskPage,
				handle: {
					icon: "CheckSquareOutlined",
					title: "common.menu.task",
					permissions: [
						"permission:task:create",
						"permission:task:update",
						"permission:task:delete",
					],
				},
			},
			{
				path: "/project-mgmt/resource",
				Component: ResourcePage,
				handle: {
					icon: "TeamOutlined",
					title: "common.menu.resource",
				},
			},
			{
				path: "/project-mgmt/reports",
				Component: ReportsPage,
				handle: {
					icon: "BarChartOutlined",
					title: "common.menu.reports",
				},
			},
		],
	},
];

export default routes;
