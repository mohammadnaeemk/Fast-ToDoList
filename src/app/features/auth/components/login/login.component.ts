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
import { LoginRequest } from '../../../../shared/models/auth.models';

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
  loginForm: FormGroup;
  isLoading = false;
  showPassword = false;
  isMobile = false;
  particles: any[] = [];
  
  // افکت‌های شناور با آیکون‌های مرتبط
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
    this.loginForm = this.fb.group({
      identifier: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  ngOnInit(): void {
    this.checkScreenSize();
    this.generateParticles();
    
    // چک کردن اگر قبلاً لاگین کرده
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/todos']);
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    this.isMobile = window.innerWidth < 768;
  }

  private generateParticles(): void {
    // ایجاد ذرات برای افکت زمینه با رنگ آبی
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        size: Math.random() * 4 + 1,
        x: Math.random() * 100,
        y: Math.random() * 100,
        duration: Math.random() * 20 + 10
      });
    }
  }

  get identifier() { return this.loginForm.get('identifier'); }
  get password() { return this.loginForm.get('password'); }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.isLoading = true;

    const loginData: LoginRequest = {
      identifier: this.identifier?.value,
      password: this.password?.value,
      rememberMe: this.loginForm.get('rememberMe')?.value
    };

    this.authService.login(loginData).subscribe({
      next: (response) => {
        this.isLoading = false;
        
        if (response.success) {
          this.toast.success(response.message, {
            icon: '🎉',
            duration: 3000,
            position: 'top-center'
          });
          
          // هدایت به صفحه اصلی با تأخیر
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
        this.toast.error('خطا در ارتباط با سرور', {
          icon: '❌',
          duration: 4000
        });
        console.error('Login error:', error);
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  getInputError(controlName: string): string {
    const control = this.loginForm.get(controlName);
    
    if (control?.hasError('required')) {
      return 'این فیلد الزامی است';
    }
    
    if (controlName === 'password' && control?.hasError('minlength')) {
      return 'رمز عبور باید حداقل ۶ کاراکتر باشد';
    }
    
    return '';
  }
}