export enum AuthTokenType {
  REFRESH = "refresh",
  EMAIL_VERIFY = "email_verify",
  EMAIL_CHANGE = "email_change",
  PASSWORD_RESET = "password_reset",
  PASSWORD_FORGET = "password_forget",
  TWO_FACTOR_EMAIL_OTP = "TWO_FACTOR_EMAIL_OTP",
  TWO_FACTOR_LOGIN = "TWO_FACTOR_LOGIN",
}

export enum ConversationType {
  DIRECT = "direct",
  GROUP = "group",
}

export enum MemberRole {
  MEMBER = "member",
  ADMIN = "admin",
}

export enum MessageType {
  TEXT = "text",
  IMAGE = "image",
  NUDGE = "nudge",
  SYSTEM = "system",
}

export enum AuditAction {
  LOGIN_SUCCESS = "login_success",
  LOGIN_FAILED = "login_failed",
  LOGOUT = "logout",
  PASSWORD_CHANGED = "password_changed",
  PASSWORD_CHANGE_FAILED = "password_changed_failed",
  PASSWORD_RESET_REQUESTED = "password_reset_requested",
  PASSWORD_RESET_SUCCESS = "password_reset_success",
  EMAIL_CHANGE_REQUESTED = "email_change_requested",
  EMAIL_CHANGED = "email_changed",
  EMAIL_VERIFIED = "email_verified",
  EMAIL_VERIFICATION_FAILED = "email_verification_failed",
  ACCOUNT_LOCKED = "account_locked",
  ACCOUNT_UNLOCKED = "account_unlocked",
  TWO_FACTOR_SETUP_STARTED = "two_factor_setup_started",
  TWO_FACTOR_ENABLED = "two_factor_enabled",
  TWO_FACTOR_DISABLED = "two_factor_disabled",
  TWO_FACTOR_ENABLE_FAILED = "two_factor_enable_failed",
  TWO_FACTOR_REQUIRED = "two_factor_required",
  TWO_FACTOR_LOGIN_FAILED = "two_factor_login_failed",
  PROFILE_UPDATED = "profile_updated",
  SUSPICIOUS_ACTIVITY = "suspicious_activity_detected",
}
