import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HotToastService } from '@ngxpert/hot-toast';
import { DataBaseService } from './core/services/dataBase.service';
import { LoginRequest, RegisterRequest } from './shared/models/auth.models';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './core/services/auth.service';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit{
  constructor(private _toast: HotToastService ,private _authService : AuthService, private _databaseService: DataBaseService)  {}
  ngOnInit() {}
  // debugAuthFlow() {
  // console.log('🔍 دیباگ Auth Flow...');
  
  // // تست ۱: فقط createUser
  // console.log('\n۱. تست createUser...');
  // const testData: RegisterRequest = {
  //   userName: 'debuguser',
  //   email: 'debug@example.com',
  //   phoneNumber: '09121234568',
  //   password: '123456',
  //   confirmPassword: '123456'
  // };
  
  // // مستقیم createUser رو صدا بزن
  // this._authService['createUser'](testData).subscribe({
  //   next: (user) => {
  //     console.log('✅ کاربر ساخته شد:', user.id);
      
  //     // تست ۲: ساخت توکن
  //     console.log('\n۲. تست generateToken...');
  //     const token = this._authService['tokenService'].generateToken(
  //       user.id,
  //       user.email,
  //       user.userName,
  //       user.phonNumber
  //     );
  //     console.log('✅ توکن ساخته شد:', token.substring(0, 30) + '...');
      
  //     // تست ۳: ساخت session
  //     console.log('\n۳. تست createSession...');
  //     this._authService['sessionService'].createSession({
  //       userId: user.id,
  //       token,
  //       rememberMe: false
  //     }).subscribe({
  //       next: (session) => {
  //         console.log('✅ session ساخته شد:', session.id);
  //         console.log('🎉 همه چیز اوکی!');
  //       },
  //       error: (error) => {
  //         console.error('❌ خطا در createSession:', error);
  //       }
  //     });
  //   },
  //   error: (error) => {
  //     console.error('❌ خطا در createUser:', error);
  //   }
  // });
// }
}