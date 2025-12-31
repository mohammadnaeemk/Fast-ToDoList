/**
 * رابط کاربر در سیستم
 */
export interface User {
  id: string;
  userName: string;
  passwordHash: string;
  email?: string;
  phonNumber?: string;
  createdAt?: Date;
  lastLogin?: Date;
  avatar?: string;
  loginMethods: ('email' | 'phone' | 'username')[];
  resetToken?: string;      // توکن برای بازنشانی رمز عبور
  resetTokenExpiry?: Date;  // تاریخ انقضای توکن
}

/**
 * درخواست ورود کاربر
 */
export interface LoginRequest {
  identifier: string;    // می‌تونه email، phoneNumber یا userName باشه
  password: string;
  rememberMe?: boolean;  // true = session 30 روزه، false = session 24 ساعته
}

/**
 * درخواست ثبت‌نام کاربر جدید
 */
export interface RegisterRequest {
  userName?: string;     // نام کاربری (اختیاری)
  email?: string;        // ایمیل (اختیاری)
  phoneNumber?: string;  // شماره تلفن (اختیاری)
  password: string;      // رمز عبور
  confirmPassword: string;  // تکرار رمز عبور
}

/**
 * پاسخ سیستم به عملیات احراز هویت
 */
export interface AuthResponse {
  success: boolean;      // آیا عملیات موفق بود؟
  message: string;       // پیام برای کاربر
  user?: {              // اطلاعات کاربر (اگر موفق بود)
    id: string;
    userName: string;
    email?: string;
    phoneNumber?: string;
    avatar?: string;
  };
  token?: string;        // توکن دسترسی (اگر موفق بود)
  sessionId?: string;    // شناسه session (اگر موفق بود)
}

/**
 * اطلاعات داخل توکن JWT
 */
export interface TokenPayload {
  userId: string;        // شناسه کاربر
  email?: string;        // ایمیل کاربر
  userName?: string;     // نام کاربری
  phoneNumber?: string;  // شماره تلفن
  iat: number;          // تاریخ ایجاد (ثانیه از epoch)
  exp: number;          // تاریخ انقضا (ثانیه از epoch)
}

/**
 * نتیجه اعتبارسنجی
 */
export interface ValidationResult {
  valid: boolean;        // آیا معتبر است؟
  message?: string;      // پیام خطا یا موفقیت
}

/**
 * اطلاعات کاربر برای نمایش عمومی
 */
export interface PublicUserInfo {
  id: string;
  userName: string;
  email?: string;
  phoneNumber?: string;
  avatar?: string;
  createdAt?: Date;
}

/**
 * درخواست فراموشی رمز عبور
 */
export interface ForgotPasswordRequest {
  identifier: string;  // می‌تونه email، phoneNumber یا userName باشه
}

/**
 * پاسخ درخواست فراموشی رمز عبور
 */
export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  resetToken?: string;  // توکن برای تغییر رمز عبور
}

/**
 * درخواست تغییر رمز عبور
 */
export interface ResetPasswordRequest {
  resetToken: string;      // توکن دریافتی از مرحله قبل
  newPassword: string;     // رمز عبور جدید
  confirmPassword: string; // تأیید رمز عبور جدید
}
