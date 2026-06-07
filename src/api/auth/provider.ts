import type { IAuthProvider, LoginInfo, RefreshResult, SetSessionParams } from "./types";
import { supabase } from "#src/store/supabaseClient";

class SupabaseAuthProvider implements IAuthProvider {
	async login(data: LoginInfo) {
		return supabase.auth.signInWithPassword({ email: data.username, password: data.password });
	}

	async logout() {
		await supabase.auth.signOut();
	}

	async setSession(params: SetSessionParams) {
		await supabase.auth.setSession(params);
	}

	onAuthStateChange(callback: (session: { access_token: string } | null) => void): () => void {
		const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
			callback(session ? { access_token: session.access_token } : null);
		});
		return () => subscription.unsubscribe();
	}

	async getToken(): Promise<string | undefined> {
		const { data: { session } } = await supabase.auth.getSession();
		return session?.access_token;
	}

	async refreshSession(): Promise<RefreshResult> {
		const { data, error } = await supabase.auth.refreshSession();
		return {
			data: { session: data.session ? { access_token: data.session.access_token } : null },
			error,
		};
	}
}

export enum AuthProviderType {
	Supabase = "supabase",
}

const providers: Record<AuthProviderType, IAuthProvider> = {
	[AuthProviderType.Supabase]: new SupabaseAuthProvider(),
};

const key = (import.meta.env.VITE_AUTH_PROVIDER ?? AuthProviderType.Supabase) as AuthProviderType;

if (!providers[key]) {
	throw new Error(`Auth provider "${key}" is not registered`);
}

export const authProvider: IAuthProvider = providers[key];
