import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  FormsModule, 
  ReactiveFormsModule, 
  FormBuilder, 
  FormGroup, 
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn, 
  FormControl
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HotToastService } from '@ngxpert/hot-toast';
import { AuthService } from '../../../../../core/services/auth.service';
import { UtilityService } from '../../../../../core/services/utility.service';
import { PersianInputDirective } from '../../../../../shared/directives/persian-input.directive';
import { ValidationMessageDirective } from '../../../../../shared/directives/validation-message.directive';
import { PasswordStrengthDirective } from '../../../../../shared/directives/password-strength.directive';
import { RegisterRequest } from '../../../../../shared/models/auth.models';

// ولیداتور سفارشی برای تطابق رمز عبور - نسخه اصلاح شده
function passwordMatchValidator(): ValidatorFn {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    const password = formGroup.get('password');
    const confirmPassword = formGroup.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    // بررسی تطابق رمز عبور
    if (password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      // پاک کردن خطای تطابق اگر وجود داشت
      if (confirmPassword.hasError('passwordMismatch')) {
        const errors = { ...confirmPassword.errors };
        delete errors['passwordMismatch'];
        confirmPassword.setErrors(Object.keys(errors).length ? errors : null);
      }
    }

    return null;
  };
}

@Component({
  selector: 'app-register',
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
    MatStepperModule,
    MatTooltipModule,
    PersianInputDirective,
    ValidationMessageDirective,
    PasswordStrengthDirective,
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;
  isMobile = false;
  currentStep = 1;
  totalSteps = 2;
  particles: any[] = [];

  // افکت‌های شناور
  floatingElements = [
    { icon: '👤', top: '15%', left: '10%', delay: '0s' },
    { icon: '🔐', top: '25%', right: '15%', delay: '1s' },
    { icon: '📧', bottom: '20%', left: '20%', delay: '2s' },
    { icon: '📱', top: '40%', right: '5%', delay: '3s' },
    { icon: '✅', bottom: '30%', right: '25%', delay: '4s' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private utilityService: UtilityService,
    private router: Router,
    private toast: HotToastService
  ) {
    this.registerForm = this.fb.group({
      // Step 1: اطلاعات شخصی
      personalInfo: this.fb.group({
        userName: ['', [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(30),
          Validators.pattern(/^[a-zA-Zآ-ی0-9_.]+$/)
        ]],
        email: ['', [
          Validators.required,
          Validators.email
        ]],
        phoneNumber: ['', [
          Validators.pattern(/^(09\d{9}|9\d{9}|0\d{2,}\d{7,})$/)
        ]]
      }),

      // Step 2: رمز عبور
      securityInfo: this.fb.group({
        password: ['', [
          Validators.required,
          Validators.minLength(6),
          this.passwordStrengthValidator
        ]],
        confirmPassword: ['', [Validators.required]]
      }, { validators: passwordMatchValidator() }),

      // شرایط و ضوابط
      acceptTerms: [false, [Validators.requiredTrue]]
    });
  }

  ngOnInit(): void {
    this.checkScreenSize();
    this.generateParticles();
    
    // مشاهده تغییرات رمز عبور برای اعتبارسنجی مجدد تطابق
    this.password?.valueChanges.subscribe(() => {
      this.confirmPassword?.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    });
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    this.isMobile = window.innerWidth < 768;
  }

  private generateParticles(): void {
    this.particles = [];
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        size: Math.random() * 4 + 1,
        x: Math.random() * 100,
        y: Math.random() * 100,
        duration: Math.random() * 20 + 10
      });
    }
  }

  // Getterهای فرم
  get personalInfo(): FormGroup {
    return this.registerForm.get('personalInfo') as FormGroup;
  }

  get securityInfo(): FormGroup {
    return this.registerForm.get('securityInfo') as FormGroup;
  }

  get userName(): FormControl {
    return this.personalInfo.get('userName') as FormControl;
  }

  get email(): FormControl {
    return this.personalInfo.get('email') as FormControl;
  }

  get phoneNumber(): FormControl {
    return this.personalInfo.get('phoneNumber') as FormControl;
  }

  get password(): FormControl {
    return this.securityInfo.get('password') as FormControl;
  }

  get confirmPassword(): FormControl {
    return this.securityInfo.get('confirmPassword') as FormControl;
  }

  get acceptTerms(): FormControl {
    return this.registerForm.get('acceptTerms') as FormControl;
  }

  // مدیریت مراحل
  nextStep(): void {
    if (this.currentStep === 1) {
      this.personalInfo.markAllAsTouched();
      if (this.personalInfo.valid) {
        this.currentStep++;
      } else {
        this.toast.warning('لطفاً تمام فیلدهای مرحله اول را به درستی پر کنید');
      }
    }
  }

  prevStep(): void {
    if (this.currentStep === 2) {
      this.currentStep--;
    }
  }

  // ارسال فرم
  onSubmit(): void {
    // بررسی اعتبار فرم
    this.markFormGroupTouched(this.registerForm);
    
    if (this.registerForm.invalid) {
      this.scrollToFirstInvalidControl();
      return;
    }

    if (!this.acceptTerms?.value) {
      this.toast.warning('لطفاً شرایط و ضوابط را بپذیرید');
      return;
    }

    this.isLoading = true;

    const formData = this.registerForm.value;
    const registerData: RegisterRequest = {
      userName: formData.personalInfo.userName.trim(),
      email: formData.personalInfo.email.toLowerCase().trim(),
      phoneNumber: formData.personalInfo.phoneNumber || null,
      password: formData.securityInfo.password,
      confirmPassword: formData.securityInfo.confirmPassword
    };

    // اعتبارسنجی اضافی
    if (registerData.password !== registerData.confirmPassword) {
      this.toast.error('رمز عبور و تأیید آن مطابقت ندارند');
      this.isLoading = false;
      return;
    }

    this.authService.register(registerData).subscribe({
      next: (response) => {
        this.isLoading = false;
        
        if (response.success) {
          this.toast.success(response.message || 'ثبت‌نام با موفقیت انجام شد', {
            icon: '🎉',
            duration: 3000,
            position: 'top-center'
          });
          
          // هدایت به صفحه todos یا login
          setTimeout(() => {
            this.router.navigate(['/todos']);
          }, 1500);

        } else {
          this.toast.error(response.message || 'خطا در ثبت‌نام', {
            icon: '⚠️',
            duration: 4000
          });
        }
      },
      error: (error) => {
        this.isLoading = false;
        
        // مدیریت خطاهای مختلف
        let errorMessage = 'خطا در ثبت‌نام';
        if (error.status === 409) {
          errorMessage = 'نام کاربری یا ایمیل قبلاً ثبت شده است';
        } else if (error.status === 400) {
          errorMessage = 'داده‌های ارسالی معتبر نیستند';
        } else if (error.status === 0) {
          errorMessage = 'اتصال به سرور برقرار نیست';
        }
        
        this.toast.error(errorMessage, {
          icon: '❌',
          duration: 4000
        });
        console.error('Register error:', error);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  // اعتبارسنجی فیلدها
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // اسکرول به اولین کنترل نامعتبر
  private scrollToFirstInvalidControl(): void {
    const firstInvalidControl = document.querySelector('.ng-invalid');
    if (firstInvalidControl) {
      firstInvalidControl.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }

  togglePasswordVisibility(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  // ولیداتور قدرت رمز عبور
  private passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.value;
    if (!password) return null;

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isValidLength = password.length >= 8;

    if (!isValidLength) {
      return { weakPassword: 'رمز عبور باید حداقل ۸ کاراکتر باشد' };
    }

    let strength = 0;
    if (hasUpperCase) strength++;
    if (hasLowerCase) strength++;
    if (hasNumbers) strength++;
    if (hasSpecialChars) strength++;

    if (strength < 3) {
      return { weakPassword: 'رمز عبور باید شامل حروف بزرگ، کوچک و اعداد باشد' };
    }

    return null;
  }

  // پیام‌های خطای سفارشی
  getErrorMessage(control: AbstractControl | null): string {
    if (!control?.errors) return '';

    const errors = control.errors;
    
    if (errors['required']) return 'این فیلد الزامی است';
    if (errors['email']) return 'ایمیل معتبر نیست';
    if (errors['minlength']) return `حداقل ${errors['minlength'].requiredLength} کاراکتر نیاز است`;
    if (errors['maxlength']) return `حداکثر ${errors['maxlength'].requiredLength} کاراکتر مجاز است`;
    if (errors['pattern']) {
      if (control === this.userName) return 'فقط حروف، اعداد و آندرلاین مجاز است';
      if (control === this.phoneNumber) return 'شماره تلفن معتبر نیست';
    }
    if (errors['weakPassword']) return errors['weakPassword'];
    if (errors['passwordMismatch']) return 'رمز عبور و تأیید آن یکسان نیستند';

    return 'مقدار وارد شده معتبر نیست';
  }

  // محاسبه قدرت رمز عبور برای نمایش بصری
  getPasswordStrength(password: string): { strength: string; percentage: number } {
    if (!password) return { strength: 'ضعیف', percentage: 0 };

    let score = 0;
    const checks = [
      password.length >= 8,
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /\d/.test(password),
      /[!@#$%^&*(),.?":{}|<>]/.test(password)
    ];

    score = checks.filter(Boolean).length;

    if (score >= 4) return { strength: 'قوی', percentage: 100 };
    if (score >= 3) return { strength: 'متوسط', percentage: 66 };
    if (score >= 2) return { strength: 'ضعیف', percentage: 33 };
    return { strength: 'خیلی ضعیف', percentage: 10 };
  }

  getStrengthColor(strength: string): string {
    switch (strength) {
      case 'قوی': return '#10b981'; // سبز
      case 'متوسط': return '#f59e0b'; // نارنجی
      case 'ضعیف': return '#ef4444'; // قرمز
      case 'خیلی ضعیف': return '#dc2626'; // قرمز تیره
      default: return '#6b7280'; // خاکستری
    }
  }
}
