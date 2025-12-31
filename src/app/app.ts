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
}