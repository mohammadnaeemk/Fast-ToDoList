import { Injectable } from '@angular/core';
import { 
  HttpInterceptor, 
  HttpRequest, 
  HttpHandler, 
  HttpEvent, 
  HttpErrorResponse 
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HotToastService } from '@ngxpert/hot-toast';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  
  constructor(private toast: HotToastService) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // مدیریت خطاهای مختلف
        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  /**
   * مدیریت انواع خطاها
   */
  private handleError(error: HttpErrorResponse): void {
    // اگر خطای شبکه بود
    if (error.status === 0) {
      this.showNetworkError();
      return;
    }

    // اگر خطای validation بود
    if (error.status === 422 || error.status === 400) {
      this.showValidationError(error);
      return;
    }

    // سایر خطاها
    this.showGenericError(error);
  }

  /**
   * نمایش خطای شبکه
   */
  private showNetworkError(): void {
    this.toast.error('اتصال اینترنت خود را بررسی کنید', {
      duration: 5000,
      position: 'top-right',
      icon: '📡',
      ariaLive: 'assertive'
    });
  }

  /**
   * نمایش خطای validation
   */
  private showValidationError(error: HttpErrorResponse): void {
    const messages = this.extractValidationMessages(error);
    
    if (messages.length > 0) {
      messages.forEach(message => {
        this.toast.warning(message, {
          duration: 4000,
          position: 'top-right',
          icon: '⚠️'
        });
      });
    }
  }

  /**
   * استخراج پیام‌های validation از خطا
   */
  private extractValidationMessages(error: HttpErrorResponse): string[] {
    const messages: string[] = [];
    
    if (error.error && error.error.errors) {
      // ساختار استاندارد Laravel
      const errors = error.error.errors;
      Object.keys(errors).forEach(key => {
        errors[key].forEach((message: string) => {
          messages.push(`${key}: ${message}`);
        });
      });
    } else if (error.error && error.error.message) {
      // ساختار ساده
      messages.push(error.error.message);
    }
    
    return messages;
  }

  /**
   * نمایش خطای عمومی
   */
  private showGenericError(error: HttpErrorResponse): void {
    // خطاهای 5xx و 4xx که قبلاً intercept نشدن
    if (error.status >= 500) {
      this.toast.error('مشکلی در سرور رخ داده است. لطفاً بعداً تلاش کنید.', {
        duration: 5000,
        position: 'top-right',
        icon: '🚨'
      });
    } else if (error.status >= 400 && error.status !== 401 && error.status !== 403) {
      this.toast.error('درخواست شما با خطا مواجه شد', {
        duration: 4000,
        position: 'top-right',
        icon: '❌'
      });
    }
  }

  /**
   * لاگ کردن خطا برای توسعه‌دهنده
   */
  private logErrorForDeveloper(error: HttpErrorResponse): void {
    console.group('💥 خطای HTTP');
    console.error('URL:', error.url);
    console.error('Status:', error.status);
    console.error('Message:', error.message);
    console.error('Error Object:', error.error);
    console.groupEnd();
  }
}