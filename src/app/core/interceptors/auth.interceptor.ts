import { Injectable } from '@angular/core';
import { 
  HttpInterceptor, 
  HttpRequest, 
  HttpHandler, 
  HttpEvent, 
  HttpErrorResponse,
  HttpHeaders
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';
import { HotToastService } from '@ngxpert/hot-toast';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(
    private authService: AuthService,
    private tokenService: TokenService,
    private toast: HotToastService
  ) {}

  // ==================== 🔄 intercept اصلی ====================
  
  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // اگر request نیاز به توکن نداره
    if (this.shouldSkipToken(request)) {
      return next.handle(request);
    }

    // اضافه کردن توکن به header
    const authRequest = this.addTokenToRequest(request);

    return next.handle(authRequest).pipe(
      catchError(error => {
        // اگر خطای 401 بود (Unauthorized)
        if (error instanceof HttpErrorResponse && error.status === 401) {
          return this.handle401Error(authRequest, next);
        }
        
        // اگر خطای 403 بود (Forbidden)
        if (error instanceof HttpErrorResponse && error.status === 403) {
          return this.handle403Error(error);
        }
        
        // سایر خطاها
        return this.handleOtherErrors(error);
      })
    );
  }

  // ==================== 🔧 متدهای کمکی ====================

  /**
   * بررسی اینکه آیا request نیاز به توکن دارد یا نه
   */
  private shouldSkipToken(request: HttpRequest<any>): boolean {
    // APIهای عمومی که نیاز به توکن ندارند
    const publicUrls = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/refresh',
      '/assets/'
    ];

    return publicUrls.some(url => request.url.includes(url));
  }

  /**
   * اضافه کردن توکن به headerهای request
   */
  private addTokenToRequest(request: HttpRequest<any>): HttpRequest<any> {
    const token = this.tokenService.getToken();
    
    if (!token) {
      return request;
    }

    return request.clone({
      headers: request.headers.set('Authorization', `Bearer ${token}`)
    });
  }

  // ==================== ⚠️ مدیریت خطاها ====================

  /**
   * مدیریت خطای 401 (Unauthorized)
   */
  private handle401Error(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // اگر در حال رفرش توکن نیستیم
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap((newToken: string | null) => {
          this.isRefreshing = false;
          
          if (newToken) {
            this.refreshTokenSubject.next(newToken);
            // request جدید با توکن تازه
            const newRequest = this.addTokenToRequest(request);
            return next.handle(newRequest);
          }
          
          // اگر رفرش موفق نبود
          return this.handleRefreshFailed();
        }),
        catchError(error => {
          this.isRefreshing = false;
          return this.handleRefreshFailed();
        })
      );
    }

    // اگر در حال رفرش هستیم، منتظر می‌مونیم
    return this.refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => {
        const newRequest = this.addTokenToRequest(request);
        return next.handle(newRequest);
      })
    );
  }

  /**
   * وقتی رفرش توکن شکست خورد
   */
  private handleRefreshFailed(): Observable<HttpEvent<any>> {
    // پاک کردن اطلاعات احراز هویت
    this.authService.logout().subscribe();
    
    // نمایش پیام
    this.toast.error('نشست شما منقضی شده است. لطفاً مجدداً وارد شوید.', {
      duration: 5000,
      position: 'top-right',
      icon: '⏰'
    });

    // هدایت به صفحه لاگین
    // اینجا نمی‌تونیم router استفاده کنیم، بعداً route guard این کار رو می‌کنه
    setTimeout(() => {
      window.location.href = '/auth/login';
    }, 1000);

    return throwError(() => new Error('نشست منقضی شده است'));
  }

  /**
   * مدیریت خطای 403 (Forbidden)
   */
  private handle403Error(error: HttpErrorResponse): Observable<HttpEvent<any>> {
    this.toast.error('شما دسترسی لازم را ندارید', {
      duration: 4000,
      position: 'top-right',
      icon: '🚫'
    });

    // TODO: هدایت به صفحه access-denied
    return throwError(() => error);
  }

  /**
   * مدیریت سایر خطاها
   */
  private handleOtherErrors(error: HttpErrorResponse): Observable<HttpEvent<any>> {
    let errorMessage = 'خطای ناشناخته رخ داده است';
    
    if (error.error instanceof ErrorEvent) {
      // خطای سمت کلاینت
      errorMessage = `خطای کلاینت: ${error.error.message}`;
    } else {
      // خطای سمت سرور
      errorMessage = this.getServerErrorMessage(error);
    }

    // نمایش پیام خطا
    this.toast.error(errorMessage, {
      duration: 5000,
      position: 'top-right',
      icon: '❌'
    });

    return throwError(() => new Error(errorMessage));
  }

  /**
   * تبدیل کد خطای HTTP به پیام فارسی
   */
  private getServerErrorMessage(error: HttpErrorResponse): string {
    switch (error.status) {
      case 400:
        return 'درخواست نامعتبر است';
      case 404:
        return 'منبع مورد نظر یافت نشد';
      case 500:
        return 'خطای داخلی سرور';
      case 502:
        return 'مشکل در ارتباط با سرور';
      case 503:
        return 'سرور در دسترس نیست';
      default:
        return `خطای سرور: ${error.status}`;
    }
  }

  // ==================== 🕒 مدیریت timeout ====================

  /**
   * اضافه کردن timeout به request
   */
  private addTimeout(request: HttpRequest<any>): HttpRequest<any> {
    const timeout = 30000; // 30 ثانیه
    
    return request.clone({
      setHeaders: {
        'X-Request-Timeout': timeout.toString()
      }
    });
  }

  /**
   * اضافه کردن headerهای عمومی
   */
  private addCommonHeaders(request: HttpRequest<any>): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-App-Version': '1.0.0',
        'X-Client-Type': 'web'
      }
    });
  }
}