import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of, throwError, from } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';

import { UtilityService } from './utility.service';
import { TokenService } from './token.service';
import { SessionService } from './session.service';
import {
  AuthResponse,
  LoginRequest,
  PublicUserInfo,
  RegisterRequest,
  User,
} from '../../shared/models/auth.models';
import { DataBaseService } from './dataBase.service';
import { ValidationResult } from '../../shared/models/shared.types';
import { Session } from '../../shared/models/session.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly USER_STORE = 'users';
  private readonly SETTINGS_STORE = 'settings';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private databaseService: DataBaseService,
    private utilityService: UtilityService,
    private tokenService: TokenService,
    private sessionService: SessionService
  ) {
    this.loadCurrentUser();
  }

register(data: RegisterRequest): Observable<AuthResponse> {
  return of(null).pipe(
    // ۱. اعتبارسنجی داده‌ها
    switchMap(() => {
      const validation = this.validateRegisterData(data);
      if (!validation.valid) {
        // به جای throwError، یه observable با خطا برمی‌گردونیم
        return of({
          success: false,
          message: validation.message!
        } as AuthResponse);
      }
      return of(null);
    }),
    
    // ۲. بررسی وجود کاربر
    switchMap(() => {
      return this.checkUserExists(data).pipe(
        switchMap(userExists => {
          if (userExists) {
            return of({
              success: false,
              message: 'کاربر با این مشخصات قبلاً ثبت‌نام کرده است'
            } as AuthResponse);
          }
          return of(null);
        })
      );
    }),
    
    // ۳. اگر تا اینجا خطا داشتیم، ادامه نده
    switchMap((result: any) => {
      if (result && result.success === false) {
        return of(result); // خطا رو برگردون
      }
      return this.createUser(data);
    }),
    
    // ۴. اگر کاربر ساخته شد، ادامه بده
    switchMap((result: any) => {
      // اگر result یه AuthResponse باشه (یعنی خطا داره)
      if (result && result.success === false) {
        return of(result);
      }
      
      // در غیر این صورت result یه User هست
      const user = result as User;
      const token = this.tokenService.generateToken(
        user.id,
        user.email,
        user.userName,
        user.phonNumber
      );
      
      return this.sessionService.createSession({
        userId: user.id,
        token,
        rememberMe: false
      }).pipe(
        map(session => ({ user, token, session }))
      );
    }),
    
    // ۵. اگر تا اینجا موفق بودیم، ذخیره کن
    tap((result: any) => {
      // فقط اگر success: true نداره (یعنی هنوز خطا نیومده)
      if (!result || result.success !== false) {
        const { user, token } = result as { user: User; token: string; session: Session };
        this.tokenService.saveToken(token);
        this.setCurrentUser(user);
        this.createDefaultSettings(user.id);
      }
    }),
    
    // ۶. ساخت پاسخ نهایی
    map((result: any) => {
      // اگر خطا داشتیم
      if (result && result.success === false) {
        return result as AuthResponse;
      }
      
      // اگر موفق بودیم
      const { user, token, session } = result as { user: User; token: string; session: Session };
      return this.createAuthResponse(
        true,
        'ثبت‌نام موفقیت‌آمیز بود',
        user,
        token,
        session.id
      );
    }),
    
    catchError(error => {
      console.error('خطا در ثبت‌نام:', error);
      return of(this.createAuthResponse(false, error.message || 'خطا در ثبت‌نام'));
    })
  );
}


  /**
   * ورود کاربر
   */
  login(data: LoginRequest): Observable<AuthResponse> {
    return of(null).pipe(
      // ۱. پیدا کردن کاربر
      switchMap(() => this.findUserByIdentifier(data.identifier)),

      // ۲. بررسی وجود کاربر
      switchMap((user) => {
        if (!user) {
          return throwError(() => new Error('نام کاربری، ایمیل یا شماره تلفن یافت نشد'));
        }
        return of(user);
      }),

      // ۳. بررسی رمز عبور
      switchMap((user) => {
        if (!this.verifyPassword(data.password, user.passwordHash)) {
          return throwError(() => new Error('رمز عبور اشتباه است'));
        }
        return of(user);
      }),

      // ۴. ساخت توکن و session
      switchMap((user) => {
        const token = this.tokenService.generateToken(
          user.id,
          user.email,
          user.userName,
          user.phonNumber
        );

        return this.sessionService
          .createSession({
            userId: user.id,
            token,
            rememberMe: data.rememberMe,
          })
          .pipe(map((session) => ({ user, token, session })));
      }),

      // ۵. آپدیت آخرین ورود
      switchMap(({ user, token, session }) => {
        return this.updateUserLastLogin(user.id).pipe(map(() => ({ user, token, session })));
      }),

      // ۶. ذخیره کاربر فعلی
      tap(({ user, token }) => {
        this.tokenService.saveToken(token);
        this.setCurrentUser(user);
      }),

      // ۷. ساخت پاسخ
      map(({ user, token, session }) =>
        this.createAuthResponse(true, 'ورود موفقیت‌آمیز بود', user, token, session.id)
      ),

      catchError((error) => {
        console.error('خطا در ورود:', error);
        return of(this.createAuthResponse(false, error.message || 'خطا در ورود'));
      })
    );
  }

  /**
   * خروج کاربر
   */
  logout(): Observable<boolean> {
    const token = this.tokenService.getToken();

    if (token) {
      // پیدا کردن session و حذف آن
      this.sessionService
        .findSessionByToken(token)
        .pipe(
          switchMap((session) => {
            if (session) {
              return this.sessionService.deleteSession(session.id);
            }
            return of(true);
          })
        )
        .subscribe();
    }

    // پاک کردن همه چیز
    this.clearCurrentUser();
    this.tokenService.clearTokens();

    return of(true);
  }

  /**
   * خروج از همه دستگاه‌ها
   */
  logoutFromAllDevices(): Observable<boolean> {
    const currentUser = this.getCurrentUser();

    if (currentUser) {
      return this.sessionService.deleteUserSessions(currentUser.id).pipe(
        tap(() => {
          this.clearCurrentUser();
          this.tokenService.clearTokens();
        })
      );
    }

    return of(true);
  }

  // ==================== 🔍 متدهای کمکی ====================

  /**
   * بارگذاری کاربر از توکن
   */
  private loadCurrentUser(): void {
    if (this.tokenService.isAuthenticated()) {
      const payload = this.tokenService.getUserFromToken();

      if (payload) {
        this.getUserById(payload.userId).subscribe({
          next: (user) => {
            if (user) {
              this.setCurrentUser(user);
            }
          },
          error: () => {
            this.clearCurrentUser();
          },
        });
      }
    }
  }

  /**
   * تنظیم کاربر فعلی
   */
  private setCurrentUser(user: User): void {
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);

    // ذخیره در localStorage برای بارگذاری سریع
    localStorage.setItem(
      'current_user',
      JSON.stringify({
        id: user.id,
        userName: user.userName,
        email: user.email,
        avatar: user.avatar,
      })
    );
  }

  /**
   * پاک کردن کاربر فعلی
   */
  private clearCurrentUser(): void {
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    localStorage.removeItem('current_user');
  }

  /**
   * ساخت پاسخ احراز هویت
   */
  private createAuthResponse(
    success: boolean,
    message: string,
    user?: User,
    token?: string,
    sessionId?: string
  ): AuthResponse {
    const response: AuthResponse = { success, message };

    if (success && user) {
      response.user = {
        id: user.id,
        userName: user.userName,
        email: user.email,
        phoneNumber: user.phonNumber,
        avatar: user.avatar,
      };

      if (token) response.token = token;
      if (sessionId) response.sessionId = sessionId;
    }

    return response;
  }

  // ==================== 👤 مدیریت کاربران ====================

  /**
   * پیدا کردن کاربر با شناسه
   */
  private findUserByIdentifier(identifier: string): Observable<User | null> {
    return from(this.databaseService.getAllItems<User>(this.USER_STORE)).pipe(
      map((users) => {
        return (
          users.find(
            (user) =>
              user.userName === identifier ||
              user.email === identifier ||
              user.phonNumber === identifier
          ) || null
        );
      }),
      catchError(() => of(null))
    );
  }

  /**
   * دریافت کاربر با ID
   */
  getUserById(userId: string): Observable<User | null> {
    return from(this.databaseService.getItem<User>(this.USER_STORE, userId)).pipe(
      catchError(() => of(null))
    );
  }

  /**
   * بررسی وجود کاربر
   */
  private checkUserExists(data: RegisterRequest): Observable<boolean> {
    return from(this.databaseService.getAllItems<User>(this.USER_STORE)).pipe(
      map((users) => {
        return users.some(
          (user) =>
            (data.email && user.email === data.email) ||
            (data.phoneNumber && user.phonNumber === data.phoneNumber) ||
            (data.userName && user.userName === data.userName)
        );
      }),
      catchError(() => of(false))
    );
  }

  /**
   * ایجاد کاربر جدید
   */
  private createUser(data: RegisterRequest): Observable<User> {
    const user: User = {
      id: this.utilityService.generateUniqueId(),
      userName: data.userName || data.email?.split('@')[0] || `user_${Date.now()}`,
      passwordHash: this.hashPassword(data.password),
      email: data.email,
      phonNumber: data.phoneNumber,
      createdAt: new Date(),
      loginMethods: this.determineLoginMethods(data),
      avatar: this.generateAvatarUrl(data.userName || data.email || 'User'),
    };

    return from(this.databaseService.addItem<User>(this.USER_STORE, user));
  }

  /**
   * آپدیت آخرین زمان ورود
   */
  private updateUserLastLogin(userId: string): Observable<User> {
    return from(
      this.databaseService.updateItem<User>(this.USER_STORE, userId, {
        lastLogin: new Date(),
      })
    );
  }

  // ==================== 🔧 متدهای اعتبارسنجی ====================

  /**
   * اعتبارسنجی داده‌های ثبت‌نام
   */
  private validateRegisterData(data: RegisterRequest): ValidationResult {
    // حداقل یک شناسه باید وجود داشته باشد
    if (!data.email && !data.phoneNumber && !data.userName) {
      return {
        valid: false,
        message: 'حداقل یکی از موارد ایمیل، شماره تلفن یا نام کاربری باید وارد شود',
      };
    }

    // اعتبارسنجی ایمیل
    if (data.email) {
      const emailValidation = this.utilityService.validateEmail(data.email);
      if (!emailValidation.valid) {
        return {
          valid: false,
          message: emailValidation.message || 'ایمیل نامعتبر است',
        };
      }
    }

    // اعتبارسنجی شماره تلفن
    if (data.phoneNumber) {
      const phoneValidation = this.utilityService.validatePhoneNumber(data.phoneNumber);
      if (!phoneValidation.valid) {
        return {
          valid: false,
          message: phoneValidation.message || 'شماره تلفن نامعتبر است',
        };
      }
    }

    // اعتبارسنجی رمز عبور
    if (data.password.length < 6) {
      return {
        valid: false,
        message: 'رمز عبور باید حداقل ۶ کاراکتر باشد',
      };
    }

    // تطابق رمز عبور و تأیید آن
    if (data.password !== data.confirmPassword) {
      return {
        valid: false,
        message: 'رمز عبور و تأیید آن یکسان نیستند',
      };
    }

    return {
      valid: true,
      message: 'داده‌ها معتبر هستند', // این خط رو اضافه کن
    };
  }

  /**
   * تعیین روش‌های ورود مجاز
   */
  private determineLoginMethods(data: RegisterRequest): ('email' | 'phone' | 'username')[] {
    const methods: ('email' | 'phone' | 'username')[] = [];

    if (data.email) methods.push('email');
    if (data.phoneNumber) methods.push('phone');
    if (data.userName) methods.push('username');

    return methods;
  }

  /**
   * hash کردن رمز عبور
   */
  private hashPassword(password: string): string {
    // در پروژه واقعی از bcrypt یا similar استفاده کن
    // اینجا یک hash ساده برای نمونه
    return btoa(password + 'todo_app_salt');
  }

  /**
   * بررسی رمز عبور
   */
  private verifyPassword(password: string, hash: string): boolean {
    const testHash = this.hashPassword(password);
    return testHash === hash;
  }

  /**
   * تولید آدرس آواتار
   */
  private generateAvatarUrl(name: string): string {
    const colors = [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#96CEB4',
      '#FFEAA7',
      '#DDA0DD',
      '#98D8C8',
      '#F7DC6F',
      '#BB8FCE',
      '#85C1E9',
    ];
    const color = colors[name.length % colors.length];
    const initials = name.charAt(0).toUpperCase();

    return `https://ui-avatars.com/api/?name=${initials}&background=${color.slice(
      1
    )}&color=fff&bold=true`;
  }

  // ==================== ⚙️ تنظیمات ====================

  /**
   * ایجاد تنظیمات پیش‌فرض برای کاربر
   */
  private createDefaultSettings(userId: string): void {
    const defaultSettings = {
      userId,
      theme: 'light',
      language: 'fa',
      notifications: true,
      showCompleted: true,
      sortBy: 'createdAt',
      itemsPerPage: 10,
      autoSave: true,
      createdAt: new Date(),
    };

    this.databaseService.addItem(this.SETTINGS_STORE, defaultSettings).subscribe({
      error: (error) => console.error('خطا در ایجاد تنظیمات:', error),
    });
  }

  /**
   * دریافت تنظیمات کاربر
   */
  getUserSettings(userId: string): Observable<any> {
    return from(this.databaseService.getItem<any>(this.SETTINGS_STORE, userId)).pipe(
      map((settings) => settings || this.getDefaultSettings()),
      catchError(() => of(this.getDefaultSettings()))
    );
  }

  /**
   * تنظیمات پیش‌فرض
   */
  private getDefaultSettings(): any {
    return {
      theme: 'light',
      language: 'fa',
      notifications: true,
      showCompleted: true,
      sortBy: 'createdAt',
      itemsPerPage: 10,
      autoSave: true,
    };
  }

  // ==================== 🔑 متدهای عمومی ====================

  /**
   * بررسی لاگین بودن کاربر
   */
  isLoggedIn(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * دریافت کاربر فعلی
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getCurrentUserInfo(): PublicUserInfo | null {
    const user = this.getCurrentUser();
    if (!user) return null;

    return {
      id: user.id,
      userName: user.userName,
      email: user.email,
      phoneNumber: user.phonNumber,
      avatar: user.avatar,
      createdAt: user.createdAt,
    };
  }

  /**
   * رفرش توکن (برای زمانی که توکن منقضی شده)
   */
  refreshToken(): Observable<string | null> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return of(null);

    const newToken = this.tokenService.generateToken(
      currentUser.id,
      currentUser.email,
      currentUser.userName,
      currentUser.phonNumber
    );

    this.tokenService.saveToken(newToken);
    return of(newToken);
  }
}
