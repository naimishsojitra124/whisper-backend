export enum AuthTokenType {
  REFRESH = 'refresh',
  EMAIL_VERIFY = 'email_verify',
  PASSWORD_RESET = 'password_reset',
  PASSWORD_FORGET = 'password_forget',
  TWO_FACTOR = 'two_factor'
}

export enum ConversationType {
  DIRECT = 'direct',
  GROUP = 'group'
}

export enum MemberRole {
  MEMBER = 'member',
  ADMIN = 'admin'
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  NUDGE = 'nudge',
  SYSTEM = 'system'
}

export enum AuditAction {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  LOGOUT = 'logout',
  PASSWORD_CHANGED = 'password_changed',
  PASSWORD_RESET_REQUESTED = 'password_reset_requested',
  PASSWORD_RESET_SUCCESS = 'password_reset_success',
  EMAIL_VERIFIED = 'email_verified',
  EMAIL_VERIFICATION_FAILED = 'email_verification_failed',
  ACCOUNT_LOCKED = 'account_locked',
  ACCOUNT_UNLOCKED = 'account_unlocked',
  TWO_FACTOR_ENABLED = 'two_factor_enabled',
  TWO_FACTOR_DISABLED = 'two_factor_disabled',
  PROFILE_UPDATED = 'profile_updated',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity_detected'
}
