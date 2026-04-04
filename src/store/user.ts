import type { UserEntity } from "#src/api/user/types";
import { userService } from "#src/api/user";

import { create } from "zustand";

const initialState = {
	id: "",
	avatar: "",
	fullName: "",
	loginName: "",
	phoneNumber: "",
	workEmail: "",
	description: "",
	permissions: [],
};

type UserState = UserEntity;

interface UserAction {
	getUserInfo: () => Promise<UserEntity>
	reset: () => void
};

export const useUserStore = create<UserState & UserAction>()(

	set => ({
		...initialState,

		getUserInfo: async () => {
			const userInfo = await userService.fetchUserInfo();
			set({ ...userInfo });
			return userInfo;
		},

		reset: () => {
			return set({
				...initialState,
			});
		},

	}),

);
