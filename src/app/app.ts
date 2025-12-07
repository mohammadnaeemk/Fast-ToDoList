import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HotToastService } from '@ngxpert/hot-toast';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit{
  constructor(private toast: HotToastService)  {}
  ngOnInit() {
    setTimeout(() => {
      this.toast.error('🎉 HotToast آماده است!');
    }, 1000);
  }
  protected readonly title = signal('ToDoList');
}
