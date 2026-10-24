/**
 * Auth errors that mean "there is no usable session" rather than "the auth
 * service is down". Kept in a framework-free module so both the RSC auth layer
 * and the edge proxy can use it.
 */
const MISSING_SESSION_CODES = new Set([
  "session_not_found",
  "session_expired",
  "user_not_found",
  "refresh_token_not_found",
  "refresh_token_already_used",
  "bad_jwt",
]);

export function isMissingSessionError(error: {
  name?: string;
  status?: number;
  code?: string;
  message?: string;
}) {
  return (
    error.name === "AuthSessionMissingError" ||
    error.status === 401 ||
    (error.code ? MISSING_SESSION_CODES.has(error.code) : false) ||
    error.message?.toLowerCase().includes("does not exist") === true
  );
}
