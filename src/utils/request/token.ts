import { authProvider } from "#src/api/auth/provider";

export async function getToken(): Promise<string | undefined> {
	return authProvider.getToken();
}
