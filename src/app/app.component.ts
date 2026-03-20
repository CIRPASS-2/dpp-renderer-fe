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

import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './common/auth.service';
import { SidebarComponent } from './sidebar/sidebar.component';

/**
 * Root component of the DPP Renderer application.
 * Handles authentication initialization and provides main layout structure.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  constructor(private authService: AuthService, private router: Router) { }

  async ngOnInit(): Promise<void> {
    await this.authService.initialize();
  }

  /**
   * Checks if the user is currently logged in.
   * @returns True if user is authenticated, false otherwise
   */
  isLoggedIn(): boolean {
    const loggedIn = this.authService.isLoggedIn
    return loggedIn
  }
}
