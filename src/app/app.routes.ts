import { Routes } from '@angular/router';

export const routes: Routes = [
  // ==================== 🏠 صفحه اصلی ====================
  {
    path: '',
    redirectTo: 'todos',
    pathMatch: 'full'
  },

  // ==================== 🔐 صفحات احراز هویت ====================
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
    data: { skipAuth: true } // این صفحات نیاز به لاگین ندارن
  },

  // ==================== 📝 صفحات Todo ====================
//   {
//     path: 'todos',
//     loadChildren: () => import('./features/todos/todos.routes').then(m => m.TODO_ROUTES),
//     canActivate: [AuthGuard] // نیاز به لاگین داره
//   },

  // ==================== 👤 پروفایل کاربر ====================
//   {
//     path: 'profile',
//     loadChildren: () => import('./features/profile/profile.routes').then(m => m.PROFILE_ROUTES),
//     canActivate: [AuthGuard]
//   },

  // ==================== ⚙️ تنظیمات ====================
//   {
//     path: 'settings',
//     loadChildren: () => import('./features/settings/settings.routes').then(m => m.SETTINGS_ROUTES),
//     canActivate: [AuthGuard]
//   },

  // ==================== ❌ صفحه 404 ====================
//   {
//     path: 'not-found',
//     loadComponent: () => import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent)
//   },

  // ==================== 🚫 دسترسی ممنوع ====================
//   {
//     path: 'access-denied',
//     loadComponent: () => import('./shared/components/access-denied/access-denied.component').then(m => m.AccessDeniedComponent)
//   },

  // ==================== 🔀 صفحه پیش‌فرض ====================
  {
    path: '**',
    redirectTo: 'not-found'
  }
];