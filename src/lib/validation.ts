export function validateEmail(email: string): string | null {
  const value = email.trim();
  if (!value) return 'Informe seu e-mail.';
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  return ok ? null : 'E-mail inválido.';
}

export function validateUsername(username: string): string | null {
  const value = username.trim();
  if (!value) return 'Escolha um nome de usuário.';
  if (value.length < 3) return 'Use ao menos 3 caracteres.';
  if (!/^[a-zA-Z0-9_.]+$/.test(value))
    return 'Use apenas letras, números, "_" ou ".".';
  return null;
}

export function validateFullName(name: string): string | null {
  if (name.trim().length < 2) return 'Informe seu nome.';
  return null;
}

/** Security requirements for the password, returned as a checklist. */
export type PasswordCheck = { label: string; met: boolean };

export function passwordChecks(password: string): PasswordCheck[] {
  return [
    { label: 'Mínimo de 8 caracteres', met: password.length >= 8 },
    { label: 'Uma letra maiúscula', met: /[A-Z]/.test(password) },
    { label: 'Um número', met: /[0-9]/.test(password) },
    { label: 'Um caractere especial', met: /[^A-Za-z0-9]/.test(password) },
  ];
}

export function validatePassword(password: string): string | null {
  const failed = passwordChecks(password).filter((c) => !c.met);
  return failed.length === 0 ? null : 'Sua senha não atende aos requisitos.';
}

/** Friendly Portuguese messages for common Supabase auth errors. */
export function authErrorMessage(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login')) return 'E-mail ou senha incorretos.';
  if (m.includes('already registered') || m.includes('already been registered'))
    return 'Este e-mail já possui uma conta.';
  if (m.includes('duplicate key') && m.includes('username'))
    return 'Este nome de usuário já está em uso.';
  if (m.includes('rate limit')) return 'Muitas tentativas. Tente novamente em instantes.';
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.';
  return message;
}
