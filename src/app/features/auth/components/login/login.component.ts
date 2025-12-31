import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { HotToastService } from '@ngxpert/hot-toast';
import { AuthService } from '../../../../core/services/auth.service';
import { UtilityService } from '../../../../core/services/utility.service';
import { LoginRequest, AuthResponse } from '../../../../shared/models/auth.models';

/**
 * کامپوننت ورود کاربر
 * این کامپوننت فرم ورود را نمایش می‌دهد و عملیات احراز هویت را انجام می‌دهد
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  // فرم ورود
  loginForm: FormGroup;
  
  // وضعیت بارگذاری
  isLoading = false;
  
  // نمایش/مخفی کردن رمز عبور
  showPassword = false;
  
  // تشخیص موبایل
  isMobile = false;
  
  // ذرات برای افکت زمینه
  particles: any[] = [];
  
  /**
   * افکت‌های شناور با آیکون‌های مرتبط
   * این عناصر برای ایجاد جذابیت بصری در پس‌زمینه استفاده می‌شوند
   */
  floatingElements = [
    { icon: '📅', top: '15%', right: '10%', delay: '0s' },
    { icon: '✅', top: '25%', left: '15%', delay: '1s' },
    { icon: '⏰', bottom: '20%', right: '20%', delay: '2s' },
    { icon: '📋', top: '40%', left: '5%', delay: '3s' },
    { icon: '🎯', bottom: '30%', left: '25%', delay: '4s' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private utilityService: UtilityService,
    private router: Router,
    private toast: HotToastService
  ) {
    // ایجاد فرم با اعتبارسنجی
    this.loginForm = this.fb.group({
      identifier: ['', [Validators.required]],  // شناسه کاربر (ایمیل، شماره تلفن یا نام کاربری)
      password: ['', [Validators.required, Validators.minLength(6)]],  // رمز عبور با حداقل 6 کاراکتر
      rememberMe: [false]  // گزینه "مرا به خاطر بسپار"
    });
  }

  /**
   * مقداردهی اولیه کامپوننت
   */
  ngOnInit(): void {
    this.checkScreenSize();
    this.generateParticles();
    
    // چک کردن اگر کاربر قبلاً لاگین کرده باشد، به صفحه اصلی هدایت می‌شود
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/todos']);
    }
  }

  /**
   * رویداد تغییر اندازه پنجره (برای تشخیص موبایل)
   */
  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
  }

  /**
   * بررسی اندازه صفحه برای تشخیص موبایل
   */
  private checkScreenSize(): void {
    this.isMobile = window.innerWidth < 768;
  }

  /**
   * تولید ذرات برای افکت زمینه با رنگ آبی
   */
  private generateParticles(): void {
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        size: Math.random() * 4 + 1,  // اندازه تصادفی بین 1 تا 5 پیکسل
        x: Math.random() * 100,        // موقعیت X تصادفی
        y: Math.random() * 100,        // موقعیت Y تصادفی
        duration: Math.random() * 20 + 10  // مدت زمان انیمیشن
      });
    }
  }

  /**
   * Getter برای دسترسی آسان به کنترل identifier
   */
  get identifier() { return this.loginForm.get('identifier'); }
  
  /**
   * Getter برای دسترسی آسان به کنترل password
   */
  get password() { return this.loginForm.get('password'); }

  /**
   * ارسال فرم ورود
   * این متد فرم را اعتبارسنجی می‌کند و در صورت معتبر بودن، درخواست ورود را ارسال می‌کند
   */
  onSubmit(): void {
    // اگر فرم معتبر نباشد، تمام فیلدها را touched می‌کند تا خطاها نمایش داده شوند
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.isLoading = true;

    // ساخت داده‌های ورود
    const loginData: LoginRequest = {
      identifier: this.identifier?.value,
      password: this.password?.value,
      rememberMe: this.loginForm.get('rememberMe')?.value
    };

    // ارسال درخواست ورود
    this.authService.login(loginData).subscribe({
      next: (response: AuthResponse) => {
        this.isLoading = false;
        
        if (response.success) {
          // نمایش پیام موفقیت
          this.toast.success(response.message, {
            icon: '🎉',
            duration: 3000,
            position: 'top-center'
          });
          
          // هدایت به صفحه اصلی با تأخیر 1.5 ثانیه
          setTimeout(() => {
            this.router.navigate(['/todos']);
          }, 1500);
        } else {
          // نمایش پیام خطا
          this.toast.error(response.message, {
            icon: '⚠️',
            duration: 4000
          });
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        // نمایش پیام خطای سرور
        this.toast.error('خطا در ارتباط با سرور', {
          icon: '❌',
          duration: 4000
        });
        console.error('Login error:', error);
      }
    });
  }

  /**
   * علامت‌گذاری تمام فیلدهای فرم به عنوان touched
   * این متد برای نمایش خطاهای اعتبارسنجی استفاده می‌شود
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control: any) => {
      control.markAsTouched();
      // اگر کنترل خودش یک FormGroup باشد، به صورت بازگشتی اعمال می‌شود
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * تغییر وضعیت نمایش/مخفی کردن رمز عبور
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * دریافت پیام خطا برای فیلدهای فرم
   * @param controlName نام کنترل مورد نظر
   * @returns پیام خطا یا رشته خالی
   */
  getInputError(controlName: string): string {
    const control = this.loginForm.get(controlName);
    
    // بررسی خطای required
    if (control?.hasError('required')) {
      return 'این فیلد الزامی است';
    }
    
    // بررسی حداقل طول رمز عبور
    if (controlName === 'password' && control?.hasError('minlength')) {
      return 'رمز عبور باید حداقل 6 کاراکتر باشد';
    }
    
    return '';
  }
}