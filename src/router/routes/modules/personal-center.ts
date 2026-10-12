import type { AppRouteRecordRaw } from "#src/router/types";
import { ProfileCardIcon } from "#src/icons";
import ContainerLayout from "#src/layout/container-layout";
import { $t } from "#src/locales";
import { personalCenter } from "#src/router/extra-info";

import { createElement, lazy } from "react";

const MyProfile = lazy(() => import("#src/pages/personal-center/my-profile"));

/** Hồ sơ cá nhân — một mục đơn (đồng bộ với route trả về từ backend) */
const routes: AppRouteRecordRaw[] = [
	{
		path: "/personal-center",
		Component: ContainerLayout,
		handle: {
			order: personalCenter,
			title: $t("common.menu.profile"),
			icon: createElement(ProfileCardIcon),
		},
		children: [
			{
				path: "/personal-center/my-profile",
				Component: MyProfile,
				handle: {
					title: $t("common.menu.profile"),
					icon: createElement(ProfileCardIcon),
				},
			},
		],
	},
];

export default routes;
