import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { UtilityService } from './utility.service';
import { DataBaseService } from './dataBase.service';
import { CreateSessionDto, Session } from '../../shared/models/session.model';


@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private readonly SESSION_STORE = 'sessions';
  
  constructor(
    private databaseService: DataBaseService,
    private utilityService: UtilityService
  ) {}
  

  createSession(dto: CreateSessionDto): Observable<Session> {
    const session: Session = {
      id: this.utilityService.generateUniqueId(),
      userId: dto.userId,
      token: dto.token,
      expiresAt: this.calculateExpiry(dto.rememberMe),
      userAgent: dto.userAgent || navigator.userAgent,
      deviceInfo: this.getDeviceInfo(),
      createdAt: new Date(),
      lastActivity: new Date()
    };
    
    return from(
      this.databaseService.addItem<Session>(this.SESSION_STORE, session)
    ).pipe(
      catchError(error => {
        console.error('خطا در ایجاد session:', error);
        throw new Error('امکان ایجاد session وجود ندارد');
      })
    );
  }
  

  findSessionByToken(token: string): Observable<Session | null> {
    return from(
      this.databaseService.getAllItems<Session>(this.SESSION_STORE)
    ).pipe(
      map(sessions => {
        return sessions.find(s => s.token === token) || null;
      }),
      catchError(error => {
        console.error('خطا در پیدا کردن session:', error);
        return of(null);
      })
    );
  }
  

  getSessionById(sessionId: string): Observable<Session | null> {
    return from(
      this.databaseService.getItem<Session>(this.SESSION_STORE, sessionId)
    ).pipe(
      catchError(error => {
        console.error('خطا در دریافت session:', error);
        return of(null);
      })
    );
  }
  
  getUserSessions(userId: string): Observable<Session[]> {
    return from(
      this.databaseService.getAllItems<Session>(this.SESSION_STORE)
    ).pipe(
      map(sessions => {
        return sessions.filter(s => s.userId === userId);
      }),
      catchError(error => {
        console.error('خطا در دریافت sessionهای کاربر:', error);
        return of([]);
      })
    );
  }

  getActiveUserSessions(userId: string): Observable<Session[]> {
    return this.getUserSessions(userId).pipe(
      map(sessions => {
        const now = new Date();
        return sessions.filter(s => new Date(s.expiresAt) > now);
      })
    );
  }
  
  deleteSession(sessionId: string): Observable<boolean> {
    return from(
      this.databaseService.deleteItem(this.SESSION_STORE, sessionId)
    ).pipe(
      catchError(error => {
        console.error('خطا در حذف session:', error);
        return of(false);
      })
    );
  }
  

  deleteUserSessions(userId: string): Observable<boolean> {
    return this.getUserSessions(userId).pipe(
      map(sessions => {
        const deletePromises = sessions.map(session => 
          this.databaseService.deleteItem(this.SESSION_STORE, session.id)
        );
        return Promise.all(deletePromises).then(() => true);
      }),
      switchMap(promise => from(promise)),
      catchError(error => {
        console.error('خطا در حذف sessionهای کاربر:', error);
        return of(false);
      })
    );
  }
  

  cleanupExpiredSessions(): Observable<number> {
    return from(
      this.databaseService.getAllItems<Session>(this.SESSION_STORE)
    ).pipe(
      map(sessions => {
        const now = new Date();
        const expiredSessions = sessions.filter(s => new Date(s.expiresAt) <= now);
        
        const deletePromises = expiredSessions.map(session =>
          this.databaseService.deleteItem(this.SESSION_STORE, session.id)
        );
        
        return Promise.all(deletePromises).then(() => expiredSessions.length);
      }),
      switchMap(promise => from(promise)),
      catchError(error => {
        console.error('خطا در پاک‌سازی sessionها:', error);
        return of(0);
      })
    );
  }
  

  updateLastActivity(sessionId: string): Observable<boolean> {
    return from(
      this.databaseService.updateItem<Session>(this.SESSION_STORE, sessionId, {
        lastActivity: new Date()
      })
    ).pipe(
      map(() => true),
      catchError(error => {
        console.error('خطا در آپدیت آخرین فعالیت:', error);
        return of(false);
      })
    );
  }
  

  isSessionValid(session: Session): boolean {
    return new Date(session.expiresAt) > new Date();
  }
  

  private calculateExpiry(rememberMe?: boolean): Date {
    const now = new Date();
    if (rememberMe) {
      // ۳۰ روز برای حالت "مرا به خاطر بسپار"
      return new Date(now.setDate(now.getDate() + 30));
    } else {
      // ۲۴ ساعت برای session عادی
      return new Date(now.setHours(now.getHours() + 24));
    }
  }
  

  private getDeviceInfo(): { device: string; browser: string; os: string } {
    const userAgent = navigator.userAgent;
    
    let device = 'Desktop';
    if (/mobile/i.test(userAgent)) device = 'Mobile';
    if (/tablet/i.test(userAgent)) device = 'Tablet';
    
    let browser = 'Unknown';
    if (/chrome/i.test(userAgent)) browser = 'Chrome';
    if (/firefox/i.test(userAgent)) browser = 'Firefox';
    if (/safari/i.test(userAgent)) browser = 'Safari';
    if (/edge/i.test(userAgent)) browser = 'Edge';
    
    let os = 'Unknown';
    if (/windows/i.test(userAgent)) os = 'Windows';
    if (/macintosh/i.test(userAgent)) os = 'macOS';
    if (/linux/i.test(userAgent)) os = 'Linux';
    if (/android/i.test(userAgent)) os = 'Android';
    if (/iphone|ipad|ipod/i.test(userAgent)) os = 'iOS';
    
    return { device, browser, os };
  }
}