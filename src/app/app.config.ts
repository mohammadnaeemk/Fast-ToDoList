import {
  ApplicationConfig,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { MaterialModule } from './shared/material-module';
import { provideHotToastConfig } from '@ngxpert/hot-toast';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    importProvidersFrom(MaterialModule),
    provideHotToastConfig(),
    provideHotToastConfig({
      position: 'top-right',
      duration: 4000,
      autoClose: true,
      dismissible: true,
      theme: 'toast',
      style: {
        textDirection: 'rtl',
        fontFamily: 'Vazirmatn, Tahoma, sans-serif',
      },
    }),
  ],
};
