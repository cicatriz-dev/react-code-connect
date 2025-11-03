import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const jsonServer = require('json-server');
const auth = require('json-server-auth');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const server = jsonServer.create();
const router = jsonServer.router('database.json');
const defaults = jsonServer.defaults();

// Secrets para JWT
const ACCESS_TOKEN_SECRET = 'seu-access-token-secret-super-secreto';
const REFRESH_TOKEN_SECRET = 'seu-refresh-token-secret-ainda-mais-secreto';

// Permissions
const rules = {
	users: 600,
	devs: 644,
};

server.use(
	cors({
		origin: 'http://localhost:5173', // URL do frontend
		credentials: true, // Permite cookies
	})
);
server.use(defaults);
server.use(cookieParser());
server.use(jsonServer.bodyParser);

// Middleware para interceptar login e adicionar refresh token
server.use((req, res, next) => {
	// Interceptar POST /login
	if (req.method === 'POST' && req.path === '/login') {
		// Salvar res.json original
		const originalJson = res.json.bind(res);

		// Override res.json
		res.json = (body) => {
			if (body.accessToken && body.user) {
				// Gerar refresh token
				const refreshToken = jwt.sign({ userId: body.user.id }, REFRESH_TOKEN_SECRET, {
					expiresIn: '7d',
				});

				// Enviar refresh token como HttpOnly cookie
				res.cookie('refreshToken', refreshToken, {
					httpOnly: true,
					secure: false, // true em produção com HTTPS
					sameSite: 'strict',
					maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
				});
			}

			return originalJson(body);
		};
	}
	next();
});

// Rota customizada de refresh token
server.post('/auth/refresh', (req, res) => {
	const refreshToken = req.cookies.refreshToken;

	if (!refreshToken) {
		return res.status(401).json({ message: 'Refresh token não encontrado' });
	}

	try {
		// Verificar refresh token
		const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);

		// Buscar usuário
		const db = router.db; // Acesso ao banco
		const user = db.get('users').find({ id: decoded.userId }).value();

		if (!user) {
			return res.status(401).json({ message: 'Usuário não encontrado' });
		}

		// Gerar novo access token
		const newAccessToken = jwt.sign(
			{
				sub: user.id,
				email: user.email,
			},
			ACCESS_TOKEN_SECRET,
			{ expiresIn: '15m' }
		);

		// Retornar novo access token
		return res.json({
			accessToken: newAccessToken,
			user: {
				id: user.id,
				email: user.email,
				name: user.name || user.email.split('@')[0],
			},
		});
	} catch (error) {
		return res.status(401).json({ message: 'Refresh token inválido ou expirado' });
	}
});

// Rewriter deve vir antes do auth e router
server.use(auth.rewriter(rules));

// Bind the router db to the app
server.db = router.db;

server.use(auth);
server.use(router);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
	console.log(`JSON Server with auth running at http://localhost:${PORT}`);
});
