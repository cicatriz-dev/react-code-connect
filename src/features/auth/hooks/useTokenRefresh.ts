import { useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { authService } from '../services/authService';
import { useAuth } from './useAuth';

interface JWTPayload {
	exp: number;
	sub: string;
	email: string;
}

export function useTokenRefresh() {
	const { accessToken, setAuth, logout } = useAuth();

	useEffect(() => {
		if (!accessToken) return;

		try {
			const decoded = jwtDecode<JWTPayload>(accessToken);
			const expiresAt = decoded.exp * 1000;
			const now = Date.now();
			const timeUntilExpiry = expiresAt - now;

			const refreshTime = timeUntilExpiry - 60000;

			if (refreshTime <= 0) {
				console.log('Expired token detected, refreshing...');
				authService
					.refresh()
					.then((response) => setAuth(response))
					.catch((error) => {
						console.error('Failed to refresh token:', error);
						logout();
					});
				return;
			}

			console.log(`Token will be refreshed in ${Math.floor(refreshTime / 1000)}s`);

			const timerId = setTimeout(() => {
				console.log('Refreshing token...');
				authService
					.refresh()
					.then((response) => {
						setAuth(response);
						console.log('Token refreshed successfully');
					})
					.catch((error) => {
						console.error('Failed to refresh token:', error);
						logout();
					});
			}, refreshTime);

			return () => clearTimeout(timerId);
		} catch (error) {
			console.error('Error decoding token:', error);
		}
	}, [accessToken, setAuth, logout]);
}
