import type { AppRouteRecordRaw } from "#src/router/types";
import ContainerLayout from "#src/layout/container-layout";
import { setting } from "#src/router/extra-info";

import { lazy } from "react";

const Category = lazy(() => import("#src/pages/setting/category"));

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
		],
	},
];

export default routes;
