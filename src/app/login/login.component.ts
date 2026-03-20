/*
 * Copyright 2024-2027 CIRPASS-2
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Component } from '@angular/core';
import { AuthService } from '../common/auth.service';

/**
 * Login page component providing authentication interface.
 * Displays login form with decorative elements and handles user authentication.
 */
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

  /**
   * Initiates the login process through the authentication service.
   */
  login() {
    this.authService.login()
  }
}
