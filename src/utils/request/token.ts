import { supabase } from "#src/store/supabaseClient";

export async function getToken(): Promise<string | undefined> {
	const {
		data: { session },
	} = await supabase.auth.getSession();

	const token = session?.access_token;
	return token;
}
