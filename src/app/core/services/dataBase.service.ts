import { Injectable } from '@angular/core';
import { catchError, from, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DataBaseService {
  constructor() {}

  private dbName = 'FAST_todo_app_db';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private isInitialized = false;

  initialize(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      // اگر قبلاً initialize شده
      if (this.isInitialized && this.db) {
        resolve(this.db);
        return;
      }
      // باز کردن دیتابیس
      const request = indexedDB.open(this.dbName, this.dbVersion);

      // وقتی نیاز به upgrade باشه
      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createStores(db);
      };

      // وقتی موفق شد
      request.onsuccess = (event: Event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.isInitialized = true;

        // اضافه کردن event listener برای errors
        this.db.onerror = (errorEvent) => {
          console.error('Database error:', errorEvent);
        };

        resolve(this.db);
      };

      // وقتی خطا داد
      request.onerror = (event: Event) => {
        console.error('Failed to open database:', event);
        reject(new Error('Cannot open database'));
      };
    });
  }
  private createStores(db: IDBDatabase): void {
    // Store 1: users
    if (!db.objectStoreNames.contains('users')) {
      const userStore = db.createObjectStore('users', {
        keyPath: 'id',
      });

      // ایجاد indexes برای users
      userStore.createIndex('email', 'email', { unique: true });
      userStore.createIndex('userName', 'userName', { unique: true });
      userStore.createIndex('phonNumber', 'phonNumber', { unique: true });
      userStore.createIndex('createdAt', 'createdAt');
      userStore.createIndex('lastLogin', 'lastLogin');
    }

    // Store 2: sessions
    if (!db.objectStoreNames.contains('sessions')) {
      const sessionStore = db.createObjectStore('sessions', {
        keyPath: 'id',
      });

      sessionStore.createIndex('userId', 'userId');
      sessionStore.createIndex('expiresAt', 'expiresAt');
      sessionStore.createIndex('token', 'token', { unique: true });
    }

    // Store 3: settings
    if (!db.objectStoreNames.contains('settings')) {
      const settingsStore = db.createObjectStore('settings', {
        keyPath: 'userId',
      });

      settingsStore.createIndex('theme', 'theme');
      settingsStore.createIndex('language', 'language');
    }

    // Store 4: files
    if (!db.objectStoreNames.contains('files')) {
      const filesStore = db.createObjectStore('files', {
        keyPath: 'id',
      });

      filesStore.createIndex('userId', 'userId');
      filesStore.createIndex('type', 'type');
      filesStore.createIndex('createdAt', 'createdAt');
      filesStore.createIndex('name', 'name');
    }
  }
  addItem<T>(storeName: string, item: T): Observable<T & { id: string }> {
    return from(
      this.initialize().then((db) => {
        return new Promise<T & { id: string }>((resolve, reject) => {
          const transaction = db.transaction(storeName, 'readwrite');
          const store = transaction.objectStore(storeName);

          const itemWithId = {
            ...item,
            id: (item as any).id || this.generateId(),
          } as T & { id: string };

          const request = store.add(itemWithId);

          request.onsuccess = () => {
            resolve(itemWithId);
          };

          request.onerror = (event) => {
            const error = (event.target as IDBRequest).error;
            if (error?.name === 'ConstraintError') {
              reject(new Error('این آیتم قبلاً ذخیره شده است'));
            } else {
              reject(new Error(`خطا در ذخیره: ${error?.message || 'خطای ناشناخته'}`));
            }
          };
        });
      })
    ).pipe(
      catchError((error) => {
        console.error('خطا در اضافه کردن آیتم:', error);
        throw error;
      })
    );
  }

  getAllItems<T>(storeName: string): Promise<T[]> {
    return this.initialize().then((db) => {
      return new Promise<T[]>((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => {
          resolve(request.result || []);
        };

        request.onerror = (event) => {
          reject(new Error(`خطا در دریافت آیتم‌ها: ${event}`));
        };
      });
    });
  }

  getItem<T>(storeName: string, id: string): Promise<T | null> {
    return this.initialize().then((db) => {
      return new Promise<T | null>((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);

        request.onsuccess = () => {
          resolve(request.result || null);
        };

        request.onerror = (event) => {
          reject(new Error(`خطا در دریافت آیتم: ${event}`));
        };
      });
    });
  }

  updateItem<T>(storeName: string, id: string, updates: Partial<T>): Promise<T> {
    return this.initialize().then((db) => {
      return new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);

        // اول آیتم رو می‌گیریم
        const getRequest = store.get(id);

        getRequest.onsuccess = () => {
          const item = getRequest.result;
          if (!item) {
            reject(new Error('آیتم یافت نشد'));
            return;
          }

          // آپدیت می‌کنیم
          const updatedItem = { ...item, ...updates };
          const putRequest = store.put(updatedItem);

          putRequest.onsuccess = () => {
            resolve(updatedItem);
          };

          putRequest.onerror = (event) => {
            reject(new Error(`خطا در آپدیت آیتم: ${event}`));
          };
        };

        getRequest.onerror = (event) => {
          reject(new Error(`خطا در دریافت آیتم: ${event}`));
        };
      });
    });
  }

  deleteItem(storeName: string, id: string): Promise<boolean> {
    return this.initialize().then((db) => {
      return new Promise<boolean>((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);

        request.onsuccess = () => {
          resolve(true);
        };

        request.onerror = (event) => {
          reject(new Error(`خطا در حذف آیتم: ${event}`));
        };
      });
    });
  }

  clearStore(storeName: string): Promise<boolean> {
    return this.initialize().then((db) => {
      return new Promise<boolean>((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => {
          resolve(true);
        };

        request.onerror = (event) => {
          reject(new Error(`خطا در پاک کردن store: ${event}`));
        };
      });
    });
  }
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}
