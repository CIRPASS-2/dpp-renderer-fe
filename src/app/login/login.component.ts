import { Component } from '@angular/core';
import { AuthService } from '../common/auth.service';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  readonly stars = Array(12).fill(null);
  readonly year = new Date().getFullYear();

  constructor(private authService: AuthService) {

  }

  login() {
    this.authService.login()
  }
}
