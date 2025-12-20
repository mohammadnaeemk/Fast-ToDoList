import { Injectable } from '@angular/core';
import { 
  Router, 
  CanActivate, 
  ActivatedRouteSnapshot, 
  RouterStateSnapshot,
  CanActivateChild,
  CanLoad,
  Route,
  UrlSegment
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { HotToastService } from '@ngxpert/hot-toast';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild, CanLoad {
  
  constructor(
    private authService: AuthService,
    private router: Router,
    private toast: HotToastService
  ) {}

  // ==================== 🚪 اصلی ====================
  
  /**
   * بررسی دسترسی به route
   */
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.checkAuth(route, state);
  }

  /**
   * بررسی دسترسی به child routes
   */
  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.checkAuth(childRoute, state);
  }

  /**
   * بررسی قبل از لود کردن ماژول
   */
  canLoad(
    route: Route,
    segments: UrlSegment[]
  ): Observable<boolean> {
    return this.checkAuth(null, null);
  }

  // ==================== 🔍 منطق بررسی ====================

  private checkAuth(
    route: ActivatedRouteSnapshot | null,
    state: RouterStateSnapshot | null
  ): Observable<boolean> {
    // اگر route نیاز به احراز هویت نداشته باشه
    if (route && route.data['skipAuth']) {
      return of(true);
    }

    // بررسی لاگین بودن
    if (this.authService.isLoggedIn()) {
      // اگر لاگینه، بررسی roleها (اگر route نیاز داشته باشه)
      if (route && route.data['roles']) {
        const requiredRoles = route.data['roles'] as string[];
        const userRoles = this.getUserRoles(); // بعداً کامل می‌کنیم
        
        if (!this.hasRequiredRoles(userRoles, requiredRoles)) {
          this.showAccessDenied();
          return of(false);
        }
      }
      
      return of(true);
    }

    // اگر لاگین نیست
    return this.handleNotAuthenticated(state);
  }

  // ==================== ⚠️ مدیریت حالت‌های مختلف ====================

  /**
   * وقتی کاربر لاگین نیست
   */
  private handleNotAuthenticated(state: RouterStateSnapshot | null): Observable<boolean> {
    // ذخیره URL فعلی برای redirect بعد از login
    if (state) {
      const returnUrl = state.url;
      localStorage.setItem('returnUrl', returnUrl);
    }

    // نمایش پیام
    this.toast.warning('لطفاً ابتدا وارد شوید', {
      duration: 3000,
      position: 'top-right',
      icon: '🔐'
    });

    // هدایت به صفحه لاگین
    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl: state?.url || '/' }
    });

    return of(false);
  }

  /**
   * وقتی کاربر دسترسی ندارد
   */
  private showAccessDenied(): void {
    this.toast.error('شما دسترسی لازم را ندارید', {
      duration: 4000,
      position: 'top-right',
      icon: '🚫'
    });

    this.router.navigate(['/access-denied']);
  }

  // ==================== 👥 بررسی نقش‌ها (بعداً کامل می‌کنیم) ====================

  private getUserRoles(): string[] {
    // TODO: بعداً از Token Service بگیریم
    return ['user']; // پیش‌فرض
  }

  private hasRequiredRoles(userRoles: string[], requiredRoles: string[]): boolean {
    return requiredRoles.some(role => userRoles.includes(role));
  }

  // ==================== 🔄 بررسی توکن منقضی شده ====================

  /**
   * بررسی اینکه آیا توکن منقضی شده یا نه
   */
  private isTokenExpired(): Observable<boolean> {
    // TODO: بعداً از Token Service استفاده می‌کنیم
    return of(false);
  }

  /**
   * تلاش برای رفرش توکن
   */
  private tryRefreshToken(): Observable<boolean> {
    // TODO: بعداً کامل می‌کنیم
    return of(false);
  }
}