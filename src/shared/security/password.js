import bcrypt from 'bcryptjs';

const ROUNDS = 12;

// Nunca se guarda la contraseña original; solamente su hash BCrypt.
export const hashPassword = (password) => bcrypt.hash(password, ROUNDS);
export const verifyPassword = (password, hash) => bcrypt.compare(password, hash);

