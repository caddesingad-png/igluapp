export type PasswordScore = 0 | 1 | 2 | 3;

const COMMON = new Set([
  "password",
  "senha",
  "123456",
  "12345678",
  "qwerty",
  "abc123",
  "iloveyou",
  "admin",
  "welcome",
  "letmein",
  "111111",
  "000000",
]);

export const scorePassword = (pw: string): PasswordScore => {
  if (!pw) return 0;
  const lower = pw.toLowerCase();
  if (COMMON.has(lower)) return 0;
  if (pw.length < 6) return 0;

  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  const variety =
    (/[a-z]/.test(pw) ? 1 : 0) +
    (/[A-Z]/.test(pw) ? 1 : 0) +
    (/\d/.test(pw) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(pw) ? 1 : 0);
  if (variety >= 2) score++;
  if (variety >= 3) score++;

  // Clamp 0..3
  if (score >= 4) return 3;
  if (score >= 2) return 2;
  if (score >= 1) return 1;
  return 0;
};

export const strengthLabel = (s: PasswordScore): string =>
  s === 0 ? "Muito fraca" : s === 1 ? "Fraca" : s === 2 ? "Média" : "Forte";
