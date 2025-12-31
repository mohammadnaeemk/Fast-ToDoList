import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HotToastService } from '@ngxpert/hot-toast';
import { AuthService } from '../../../../core/services/auth.service';
import { 
  ForgotPasswordRequest, 
  ForgotPasswordResponse,
  ResetPasswordRequest,
  AuthResponse
} from '../../../../shared/models/auth.models';

/**
 * کامپوننت فراموشی و بازنشانی رمز عبور
 * این کامپوننت دو مرحله دارد:
 * 1. مرحله درخواست: کاربر شناسه خود را وارد می‌کند
 * 2. مرحله بازنشانی: کاربر با توکن دریافتی رمز عبور جدید را تنظیم می‌کند
 */
@Component({
  selector: 'app-forgot-password',
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
    MatProgressSpinnerModule
  ],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit {
  // فرم درخواست فراموشی رمز عبور
  forgotPasswordForm: FormGroup;
  
  // فرم بازنشانی رمز عبور
  resetPasswordForm: FormGroup;
  
  // وضعیت فعلی کامپوننت: 'request' یا 'reset'
  currentStep: 'request' | 'reset' = 'request';
  
  // وضعیت بارگذاری
  isLoading = false;
  
  // نمایش/مخفی کردن رمز عبور
  showPassword = false;
  showConfirmPassword = false;
  
  // تشخیص موبایل
  isMobile = false;
  
  // ذرات برای افکت زمینه
  particles: any[] = [];
  
  // افکت‌های شناور
  floatingElements = [
    { icon: '🔒', top: '15%', right: '10%', delay: '0s' },
    { icon: '🔑', top: '25%', left: '15%', delay: '1s' },
    { icon: '🛡️', bottom: '20%', right: '20%', delay: '2s' },
    { icon: '✉️', top: '40%', left: '5%', delay: '3s' }
  ];
  
  // توکن بازنشانی (از URL یا localStorage)
  resetToken: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toast: HotToastService
  ) {
    // فرم درخواست فراموشی رمز عبور
    this.forgotPasswordForm = this.fb.group({
      identifier: ['', [Validators.required]]
    });
    
    // فرم بازنشانی رمز عبور
    this.resetPasswordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    this.checkScreenSize();
    this.generateParticles();
    
    // بررسی وجود توکن در URL (برای زمانی که از لینک ایمیل می‌آید)
    this.route.queryParams.subscribe(params => {
      if (params['token']) {
        this.resetToken = params['token'];
        this.currentStep = 'reset';
        // ذخیره توکن در localStorage برای استفاده در فرم
        if (this.resetToken) {
          localStorage.setItem('resetToken', this.resetToken);
        }
      } else {
        // بررسی localStorage برای توکن
        const savedToken = localStorage.getItem('resetToken');
        if (savedToken) {
          this.resetToken = savedToken;
          this.currentStep = 'reset';
        }
      }
    });
  }

  /**
   * بررسی اندازه صفحه برای تشخیص موبایل
   */
  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    this.isMobile = window.innerWidth < 768;
  }

  /**
   * تولید ذرات برای افکت زمینه
   */
  private generateParticles(): void {
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        size: Math.random() * 4 + 1,
        x: Math.random() * 100,
        y: Math.random() * 100,
        duration: Math.random() * 20 + 10
      });
    }
  }

  /**
   * اعتبارسنجی تطابق رمز عبور و تأیید آن
   */
  private passwordMatchValidator(formGroup: FormGroup): { [key: string]: boolean } | null {
    const password = formGroup.get('newPassword')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;
    
    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    
    return null;
  }

  // Getter ها برای دسترسی آسان به کنترل‌های فرم
  get identifier() { 
    return this.forgotPasswordForm.get('identifier'); 
  }
  
  get newPassword() { 
    return this.resetPasswordForm.get('newPassword'); 
  }
  
  get confirmPassword() { 
    return this.resetPasswordForm.get('confirmPassword'); 
  }

  /**
   * ارسال درخواست فراموشی رمز عبور
   */
  onSubmitForgotPassword(): void {
    if (this.forgotPasswordForm.invalid) {
      this.markFormGroupTouched(this.forgotPasswordForm);
      return;
    }

    this.isLoading = true;

    const requestData: ForgotPasswordRequest = {
      identifier: this.identifier?.value
    };

    this.authService.forgotPassword(requestData).subscribe({
      next: (response: ForgotPasswordResponse) => {
        this.isLoading = false;
        
        if (response.success) {
          // ذخیره توکن برای استفاده در مرحله بعد
          if (response.resetToken) {
            this.resetToken = response.resetToken;
            localStorage.setItem('resetToken', this.resetToken);
            this.currentStep = 'reset';
          }
          
          this.toast.success(response.message, {
            icon: '✅',
            duration: 4000,
            position: 'top-center'
          });
        } else {
          this.toast.error(response.message, {
            icon: '⚠️',
            duration: 4000
          });
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        this.toast.error('خطا در ارتباط با سرور', {
          icon: '❌',
          duration: 4000
        });
        console.error('Forgot password error:', error);
      }
    });
  }

  /**
   * بازنشانی رمز عبور
   */
  onSubmitResetPassword(): void {
    if (this.resetPasswordForm.invalid) {
      this.markFormGroupTouched(this.resetPasswordForm);
      return;
    }

    if (!this.resetToken) {
      this.toast.error('توکن بازنشانی یافت نشد. لطفاً دوباره درخواست دهید', {
        icon: '❌',
        duration: 4000
      });
      this.currentStep = 'request';
      return;
    }

    this.isLoading = true;

    const resetData: ResetPasswordRequest = {
      resetToken: this.resetToken,
      newPassword: this.newPassword?.value,
      confirmPassword: this.confirmPassword?.value
    };

    this.authService.resetPassword(resetData).subscribe({
      next: (response: AuthResponse) => {
        this.isLoading = false;
        
        if (response.success) {
          // پاک کردن توکن از localStorage
          localStorage.removeItem('resetToken');
          
          this.toast.success(response.message, {
            icon: '🎉',
            duration: 4000,
            position: 'top-center'
          });
          
          // هدایت به صفحه ورود
          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 2000);
        } else {
          this.toast.error(response.message, {
            icon: '⚠️',
            duration: 4000
          });
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        this.toast.error('خطا در ارتباط با سرور', {
          icon: '❌',
          duration: 4000
        });
        console.error('Reset password error:', error);
      }
    });
  }

  /**
   * بازگشت به مرحله درخواست
   */
  backToRequest(): void {
    this.currentStep = 'request';
    this.resetPasswordForm.reset();
    this.resetToken = null;
    localStorage.removeItem('resetToken');
  }

  /**
   * علامت‌گذاری تمام فیلدهای فرم به عنوان touched برای نمایش خطاها
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control: any) => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * تغییر نمایش رمز عبور
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * تغییر نمایش رمز عبور تأیید
   */
  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  /**
   * دریافت پیام خطا برای فیلدهای فرم
   */
  getInputError(controlName: string, formGroup: FormGroup): string {
    const control = formGroup.get(controlName);
    
    if (control?.hasError('required')) {
      return 'این فیلد الزامی است';
    }
    
    if (controlName === 'newPassword' && control?.hasError('minlength')) {
      return 'رمز عبور باید حداقل 6 کاراکتر باشد';
    }
    
    if (controlName === 'confirmPassword' && formGroup.hasError('passwordMismatch')) {
      return 'رمز عبور و تأیید آن یکسان نیستند';
    }
    
    return '';
  }
}

