import type { LoginInfo, UserEntity } from "./types";

import { supabase } from "#src/store/supabaseClient";
import { request } from "#src/utils/request";

export * from "./types";

export function fetchLogin(data: LoginInfo) {
	return supabase.auth.signInWithPassword({ email: data.username, password: data.password });
}

export function fetchLogout() {
	return supabase.auth.signOut();
}

export async function fetchUserInfo() {
	return request.get<UserEntity>("user/current-user").json();
}

export async function fetchUserList() {
	return request.get<UserEntity[]>("user").json();
}

export interface RefreshTokenResult {
	token: string
	refreshToken: string
}

export async function fetchRefreshToken() {
	return supabase.auth.refreshSession();
}
