import { z } from 'zod';

export const registerSchema = z
	.object({
		name: z.string().min(2, { message: 'Nome deve ter no mínimo 2 caracteres' }),
		email: z.email(),
		password: z
			.string()
			.min(8, 'Senha deve ter no mínimo 6 caracteres')
			.regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
			.regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
		confirmPassword: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'As senhas não coincidem',
		path: ['confirmPassword'],
	});

export type RegisterFormData = z.infer<typeof registerSchema>;
