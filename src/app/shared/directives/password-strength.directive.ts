import { Directive, ElementRef, Input, OnChanges, SimpleChanges, HostBinding } from '@angular/core';

export type PasswordStrength = 'weak' | 'medium' | 'strong';

@Directive({
  selector: '[appPasswordStrength]',
  standalone: true
})
export class PasswordStrengthDirective implements OnChanges {
  @Input('appPasswordStrength') password: string = '';
  
  @HostBinding('class') strengthClass: string = '';
  @HostBinding('title') tooltip: string = '';

  private readonly patterns = {
    length: /.{8,}/,
    lowercase: /[a-z]/,
    uppercase: /[A-Z]/,
    numbers: /\d/,
    special: /[!@#$%^&*(),.?":{}|<>]/
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['password']) {
      this.updateStrength();
    }
  }

  private updateStrength(): void {
    const strength = this.calculateStrength(this.password);
    this.strengthClass = this.getStrengthClass(strength);
    this.tooltip = this.getTooltip(strength);
    
    // اضافه کردن رنگ به element
    this.el.nativeElement.style.setProperty('--strength-color', this.getStrengthColor(strength));
  }

  private calculateStrength(password: string): PasswordStrength {
    if (!password) return 'weak';
    
    let score = 0;
    const checks = [
      this.patterns.length.test(password),
      this.patterns.lowercase.test(password),
      this.patterns.uppercase.test(password),
      this.patterns.numbers.test(password),
      this.patterns.special.test(password)
    ];

    score = checks.filter(Boolean).length;

    if (score >= 4) return 'strong';
    if (score >= 3) return 'medium';
    return 'weak';
  }

  private getStrengthClass(strength: PasswordStrength): string {
    const classes = {
      weak: 'password-weak',
      medium: 'password-medium',
      strong: 'password-strong'
    };
    return classes[strength];
  }

  private getTooltip(strength: PasswordStrength): string {
    const messages = {
      weak: 'رمز عبور ضعیف - حداقل ۸ کاراکتر با ترکیب حروف و اعداد',
      medium: 'رمز عبور متوسط - اضافه کردن حروف بزرگ یا علائم ویژه',
      strong: 'رمز عبور قوی - امنیت بالا'
    };
    return messages[strength];
  }

  private getStrengthColor(strength: PasswordStrength): string {
    const colors = {
      weak: '#ef4444', // قرمز
      medium: '#f59e0b', // نارنجی
      strong: '#10b981'  // سبز
    };
    return colors[strength];
  }

  constructor(private el: ElementRef) {}
}