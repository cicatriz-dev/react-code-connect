import { fetchClient } from '../../../lib/fetchClient';
import type { AuthResponse, LoginCredentials, RegisterData } from '../types/auth.types';

export const authService = {
	login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
		return fetchClient.post<AuthResponse>('/login', credentials);
	},
	register: async (data: RegisterData): Promise<AuthResponse> => {
		return fetchClient.post<AuthResponse>('/register', data);
	},
	logout: async (): Promise<void> => {
		// Futuramente: invalidar refresh token no servidor
		return Promise.resolve();
	},
};
