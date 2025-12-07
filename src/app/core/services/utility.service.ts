import { Injectable } from '@angular/core';
import { ValidationResult } from '../../shared/models/shared.types';
import { toJalaali, toGregorian } from 'jalaali-js';
@Injectable({
  providedIn: 'root',
})
export class UtilityService {
  constructor() {}
  private persianMonths = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];

  private persianDays = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];

  validatePhoneNumber(phoneNumber: string): ValidationResult {
    if (!phoneNumber) {
      return { valid: false, message: 'شماره تلفن نمی‌تواند خالی باشد' };
    }
    const cleaned = phoneNumber.replace(/\D/g, '');

    const mobilePattern = /^(09[0-9]{9}|9[0-9]{9})$/;
    const landlinePattern = /^(0[0-9]{2,})[0-9]{7,}$/;

    if (mobilePattern.test(cleaned)) {
      return {
        valid: true,
        message: 'شماره موبایل معتبر است',
      };
    } else if (landlinePattern.test(cleaned)) {
      return {
        valid: true,
        message: 'شماره ثابت معتبر است',
      };
    } else {
      return {
        valid: false,
        message: 'فرمت شماره تلفن نامعتبر است',
      };
    }
  }

  formatPhonNumber(phonNumber: string) {
    const cleaned = phonNumber.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('09')) {
      return `${cleaned.substring(0, 4)} ${cleaned.substring(4, 7)} ${cleaned.substring(7)}`;
    } else if (cleaned.length === 10 && cleaned.startsWith('9')) {
      return `${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
    } else if (cleaned.startsWith('0')) {
      const areaCode = cleaned.substring(0, 3);
      const number = cleaned.substring(3);
      return `${areaCode} ${number}`;
    }
    return phonNumber;
  }

  validateEmail(email: string): ValidationResult {
    if (!email) {
      return { valid: false, message: 'ایمیل نمی‌تواند خالی باشد' };
    }

    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const valid = emailPattern.test(email);

    return {
      valid,
      message: valid ? 'ایمیل معتبر است' : 'فرمت ایمیل نامعتبر است',
    };
  }

  maskEmail(email: string): string {
    if (!email.includes('@')) return email;

    const [localPart, domain] = email.split('@');
    const maskedLocal =
      localPart.length > 2
        ? localPart.substring(0, 2) + '*'.repeat(localPart.length - 2)
        : localPart;

    return `${maskedLocal}@${domain}`;
  }

  toPersianNumbers(input: string | number): string {
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    return input.toString().replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
  }

  toEnglishNumbers(input: string): string {
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
    let result = input;

    for (let i = 0; i < persianDigits.length; i++) {
      result = result.replace(new RegExp(persianDigits[i], 'g'), i.toString());
    }

    for (let i = 0; i < arabicDigits.length; i++) {
      result = result.replace(new RegExp(arabicDigits[i], 'g'), i.toString());
    }

    return result;
  }

  generateUniqueId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('خطا در کپی کردن متن:', err);
      return false;
    }
  }

  convertUtcToTehranTime(
    utcTime: string,
    showSeconds: boolean = false
  ): {
    fullTime: { english: string; persian: string };
    date: { english: string; persian: string };
    time: { english: string; persian: string };
    month: string;
    dayOfWeek: string;
    fullPersianDate: string;
    timestamp: number;
  } {
    try {
      const date = new Date(utcTime);
      const tehranOffset = 3.5 * 60 * 60 * 1000;
      const tehranTime = new Date(date.getTime() + tehranOffset);

      const gregorianDate = {
        year: tehranTime.getUTCFullYear(),
        month: tehranTime.getUTCMonth() + 1,
        day: tehranTime.getUTCDate(),
      };

      const jalaliDate = toJalaali(gregorianDate.year, gregorianDate.month, gregorianDate.day);

      const hours = tehranTime.getUTCHours();
      const minutes = tehranTime.getUTCMinutes();
      const seconds = tehranTime.getUTCSeconds();

      const dayOfWeek = tehranTime.getUTCDay();
      const persianDayIndex = (dayOfWeek + 1) % 7;

      const timeFormat = showSeconds
        ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(
            seconds
          ).padStart(2, '0')}`
        : `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

      const dateFormat = `${jalaliDate.jy}/${String(jalaliDate.jm).padStart(2, '0')}/${String(
        jalaliDate.jd
      ).padStart(2, '0')}`;
      const fullFormat = `${dateFormat} ${timeFormat}`;

      const timeFormatPersian = this.toPersianNumbers(timeFormat);
      const dateFormatPersian = this.toPersianNumbers(dateFormat);
      const fullFormatPersian = `${dateFormatPersian} ${timeFormatPersian}`;

      return {
        fullTime: {
          english: fullFormat,
          persian: fullFormatPersian,
        },
        date: {
          english: dateFormat,
          persian: dateFormatPersian,
        },
        time: {
          english: timeFormat,
          persian: timeFormatPersian,
        },
        month: this.persianMonths[jalaliDate.jm - 1],
        dayOfWeek: this.persianDays[persianDayIndex],
        fullPersianDate: `${this.persianDays[persianDayIndex]} ${this.toPersianNumbers(
          jalaliDate.jd
        )} ${this.persianMonths[jalaliDate.jm - 1]} ${this.toPersianNumbers(
          jalaliDate.jy
        )} ساعت ${timeFormatPersian}`,
        timestamp: date.getTime(),
      };
    } catch (error) {
      console.error('خطا در تبدیل تاریخ:', error);
      throw new Error('فرمت تاریخ نامعتبر است');
    }
  }

  convertPersianToUtc(
    persianDate: string,
    hasTime: boolean = true
  ): {
    utcString: string;
    utcDate: Date;
    timestamp: number;
    isoString: string;
    localString: string;
  } {
    try {
      let datePart = persianDate;
      let hour = 0,
        minute = 0,
        second = 0;

      if (hasTime) {
        const parts = persianDate.split(' ');
        datePart = parts[0];

        if (parts[1]) {
          const timeParts = parts[1].split(':');
          hour = parseInt(this.toEnglishNumbers(timeParts[0])) || 0;
          minute = parseInt(this.toEnglishNumbers(timeParts[1])) || 0;
          second = parseInt(this.toEnglishNumbers(timeParts[2])) || 0;
        }
      }

      const englishDate = this.toEnglishNumbers(datePart);

      const dateParts = englishDate.split('/');
      if (dateParts.length !== 3) {
        throw new Error('فرمت تاریخ نامعتبر است');
      }

      const jy = parseInt(dateParts[0]);
      const jm = parseInt(dateParts[1]);
      const jd = parseInt(dateParts[2]);

      if (!this.isValidPersianDate(jy, jm, jd)) {
        throw new Error('تاریخ شمسی نامعتبر است');
      }

      const gregorianDate = toGregorian(jy, jm, jd);

      const localDate = new Date(
        gregorianDate.gy,
        gregorianDate.gm - 1,
        gregorianDate.gd,
        hour,
        minute,
        second
      );

      const tehranOffset = 3.5 * 60 * 60 * 1000;
      const utcTimestamp = localDate.getTime() - tehranOffset;
      const utcDate = new Date(utcTimestamp);

      return {
        utcString: utcDate.toISOString(),
        utcDate: utcDate,
        timestamp: utcTimestamp,
        isoString: utcDate.toISOString(),
        localString: utcDate.toLocaleString('fa-IR'),
      };
    } catch (error) {
      console.error('خطا در تبدیل تاریخ شمسی:', error);
      throw error;
    }
  }

  private isValidPersianDate(year: number, month: number, day: number): boolean {
    try {
      const gregorian = toGregorian(year, month, day);
      if (month < 1 || month > 12) return false;
      const monthLength = this.getPersianMonthLength(year, month);
      if (day < 1 || day > monthLength) return false;
      if (year < 1300 || year > 1500) return false;

      return true;
    } catch {
      return false;
    }
  }

  private getPersianMonthLength(year: number, month: number): number {
    if (month <= 6) return 31;
    if (month <= 11) return 30;
    return this.isPersianLeapYear(year) ? 30 : 29;
  }

  private isPersianLeapYear(year: number): boolean {
    const leapYears = [1, 5, 9, 13, 17, 22, 26, 30];
    const remainder = year % 33;
    return leapYears.includes(remainder);
  }

  getCurrentTehranTime(showSeconds: boolean = true) {
    const now = new Date();
    const utcString = now.toISOString();
    return this.convertUtcToTehranTime(utcString, showSeconds);
  }

  formatPersianDate(date: string, format: 'full' | 'short' | 'numeric' | 'time' = 'full'): string {
    try {
      const converted = this.convertUtcToTehranTime(date, true);

      switch (format) {
        case 'full':
          return converted.fullPersianDate;
        case 'short':
          return `${converted.date.persian} ${converted.time.persian}`;
        case 'numeric':
          return converted.date.persian;
        case 'time':
          return converted.time.persian;
        default:
          return converted.fullPersianDate;
      }
    } catch {
      return 'تاریخ نامعتبر';
    }
  }
}
