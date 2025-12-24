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

// ولیداتور سفارشی برای تطابق رمز عبور
// ولیداتور سفارشی برای تطابق رمز عبور - نسخه اصلاح شده
function passwordMatchValidator(): ValidatorFn {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    const password = formGroup.get('password');
    const confirmPassword = formGroup.get('confirmPassword');

    // اگر هر دو کنترل وجود ندارند یا هنوز مقادیر ندارند
    if (!password || !confirmPassword) {
      return null;
    }

    // فقط اگر هر دو مقدار دارند، بررسی تطابق انجام شود
    if (password.value && confirmPassword.value) {
      if (password.value !== confirmPassword.value) {
        confirmPassword.setErrors({ passwordMismatch: true });
        return { passwordMismatch: true };
      } else {
        // اگر تطابق دارند، خطای قبلی را پاک کنید
        if (confirmPassword.errors?.['passwordMismatch']) {
          const errors = { ...confirmPassword.errors };
          delete errors['passwordMismatch'];
          confirmPassword.setErrors(Object.keys(errors).length ? errors : null);
        }
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

  // قوانین
  termsAccepted = false;

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
        Validators.pattern(/^(09[0-9]{9}|9[0-9]{9}|0[0-9]{2,}[0-9]{7,})$/)
      ]]
    }),

    // Step 2: رمز عبور
    securityInfo: this.fb.group({
      password: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: passwordMatchValidator() }), // بدون پارامتر

    // شرایط و ضوابط
    acceptTerms: [false, [Validators.requiredTrue]]
  });
}

  ngOnInit(): void {
    this.checkScreenSize();
    this.generateParticles();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    this.isMobile = window.innerWidth < 768;
  }

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
    if (this.currentStep === 1 && this.personalInfo.valid) {
      this.currentStep++;
    }
  }

  prevStep(): void {
    if (this.currentStep === 2) {
      this.currentStep--;
    }
  }

  // ارسال فرم
  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.markFormGroupTouched(this.registerForm);
      return;
    }

    if (!this.acceptTerms?.value) {
      this.toast.warning('لطفاً شرایط و ضوابط را بپذیرید');
      return;
    }

    this.isLoading = true;

    const formData = this.registerForm.value;
    const registerData: RegisterRequest = {
      userName: formData.personalInfo.userName,
      email: formData.personalInfo.email,
      phoneNumber: formData.personalInfo.phoneNumber,
      password: formData.securityInfo.password,
      confirmPassword: formData.securityInfo.confirmPassword
    };

    this.authService.register(registerData).subscribe({
      next: (response) => {
        this.isLoading = false;
        
        if (response.success) {
          this.toast.success(response.message, {
            icon: '🎉',
            duration: 3000,
            position: 'top-center'
          });
          
          setTimeout(() => {
            this.router.navigate(['/todos']);
          }, 1500);
        } else {
          this.toast.error(response.message, {
            icon: '⚠️',
            duration: 4000
          });
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.toast.error('خطا در ثبت‌نام', {
          icon: '❌',
          duration: 4000
        });
        console.error('Register error:', error);
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

  togglePasswordVisibility(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
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
      if (control === this.password) return 'رمز عبور باید شامل حروف بزرگ، کوچک و اعداد باشد';
    }
    if (errors['passwordMismatch']) return 'رمز عبور و تأیید آن یکسان نیستند';

    return 'مقدار وارد شده معتبر نیست';
  }

  // محاسبه قدرت رمز عبور
  getPasswordStrength(password: string): { strength: string; percentage: number } {
    if (!password) return { strength: 'ضعیف', percentage: 0 };

    let score = 0;
    const checks = [
      /.{8,}/.test(password),        // طول
      /[a-z]/.test(password),        // حروف کوچک
      /[A-Z]/.test(password),        // حروف بزرگ
      /\d/.test(password),           // اعداد
      /[!@#$%^&*(),.?":{}|<>]/.test(password) // علائم ویژه
    ];

    score = checks.filter(Boolean).length;

    if (score >= 4) return { strength: 'قوی', percentage: 100 };
    if (score >= 3) return { strength: 'متوسط', percentage: 66 };
    return { strength: 'ضعیف', percentage: 33 };
  }

  // اعتبارسنجی ایمیل
  validateEmail(): void {
    if (this.email?.valid) {
      // در حالت واقعی چک می‌کنیم ایمیل تکراری نباشه
      this.toast.info('ایمیل معتبر است', { duration: 2000 });
    }
  }
  getStrengthColor(strength: string): string {
  switch (strength) {
    case 'قوی': return '#10b981'; // سبز
    case 'متوسط': return '#f59e0b'; // نارنجی
    case 'ضعیف': return '#ef4444'; // قرمز
    default: return '#6b7280'; // خاکستری
  }
}
  
}