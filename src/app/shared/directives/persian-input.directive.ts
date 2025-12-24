import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Directive({
  selector: '[appPersianInput]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: PersianInputDirective,
      multi: true
    }
  ]
})
export class PersianInputDirective implements ControlValueAccessor {
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  @Input() type: 'text' | 'number' | 'phone' = 'text';

  constructor(private el: ElementRef) {}

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // تبدیل اعداد انگلیسی به فارسی
    if (this.type === 'number' || this.type === 'phone') {
      value = this.toPersianNumbers(value);
    }

    // حذف کاراکترهای غیرمجاز
    value = this.sanitizeInput(value);

    input.value = value;
    this.onChange(value);
  }

  @HostListener('blur')
  onBlur(): void {
    this.onTouched();
  }

  private toPersianNumbers(input: string): string {
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    return input.replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
  }

  private sanitizeInput(input: string): string {
    // حذف کاراکترهای غیرمجاز بر اساس type
    switch (this.type) {
      case 'number':
        return input.replace(/[^۰-۹0-9]/g, '');
      case 'phone':
        return input.replace(/[^۰-۹0-9+\s-]/g, '');
      default:
        return input;
    }
  }

  writeValue(value: string): void {
    if (value) {
      this.el.nativeElement.value = value;
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.el.nativeElement.disabled = isDisabled;
  }
}