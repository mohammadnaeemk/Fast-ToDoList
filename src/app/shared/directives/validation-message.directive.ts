import { Directive, Input, TemplateRef, ViewContainerRef, OnInit } from '@angular/core';
import { AbstractControl } from '@angular/forms';

interface ValidationRule {
  error: string;
  message: string;
}

@Directive({
  selector: '[appValidationMessage]',
  standalone: true
})
export class ValidationMessageDirective implements OnInit {
  @Input('appValidationMessage') control!: AbstractControl;
  @Input() validationRules: ValidationRule[] = [];

  private defaultRules: ValidationRule[] = [
    { error: 'required', message: 'این فیلد الزامی است' },
    { error: 'email', message: 'ایمیل معتبر نیست' },
    { error: 'minlength', message: 'حداقل {requiredLength} کاراکتر نیاز است' },
    { error: 'maxlength', message: 'حداکثر {requiredLength} کاراکتر مجاز است' },
    { error: 'pattern', message: 'فرمت معتبر نیست' }
  ];

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef
  ) {}

  ngOnInit(): void {
    this.renderMessages();
    this.control.statusChanges?.subscribe(() => {
      this.renderMessages();
    });
  }

  private renderMessages(): void {
    this.viewContainer.clear();

    if (this.control.invalid && (this.control.dirty || this.control.touched)) {
      const allRules = [...this.defaultRules, ...this.validationRules];
      
      allRules.forEach(rule => {
        if (this.control.hasError(rule.error)) {
          const error = this.control.getError(rule.error);
          let message = rule.message;
          
          // جایگزینی پارامترها
          if (error && typeof error === 'object') {
            Object.keys(error).forEach(key => {
              message = message.replace(`{${key}}`, error[key]);
            });
          }
          
          const context = { $implicit: message, error: rule.error };
          this.viewContainer.createEmbeddedView(this.templateRef, context);
        }
      });
    }
  }
}