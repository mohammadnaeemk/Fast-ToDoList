import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent),
    title: 'ورود به برنامه'
  },
  {
    path: 'register',
    loadComponent: () => import('./components/login/register/register.component').then(m => m.RegisterComponent),
    title: 'ثبت‌نام'
  },
//   {
//     path: 'forgot-password',
//     loadComponent: () => import('./components/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
//     title: 'بازیابی رمز عبور'
//   }
];