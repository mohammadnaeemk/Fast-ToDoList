export interface Session {
  id: string;            // شناسه session
  userId: string;        // شناسه کاربر
  token: string;         // توکن JWT
  expiresAt: Date;       // تاریخ انقضا
  userAgent?: string;    // مرورگر کاربر
  ipAddress?: string;    // آی‌پی کاربر
  deviceInfo?: {         // اطلاعات دستگاه
    device: string;      // موبایل، تبلت، دسکتاپ
    browser: string;     // Chrome, Firefox
    os: string;          // Windows, Android, iOS
  };
  createdAt: Date;       // تاریخ ایجاد
  lastActivity: Date;    // آخرین فعالیت
}

export interface CreateSessionDto {
  userId: string;
  token: string;
  rememberMe?: boolean;  // حالت "مرا به خاطر بسپار"
  userAgent?: string;
}