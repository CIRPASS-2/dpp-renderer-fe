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

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { PanelMenuModule } from 'primeng/panelmenu';

/**
 * Sidebar navigation component providing access to main application features.
 * Displays navigation menu with icons and handles routing to different pages.
 */
@Component({
  standalone: true,
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  imports: [CommonModule, PanelMenuModule]
})
export class SidebarComponent implements OnInit {

  menuItems: MenuItem[] = [];

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.menuItems = [
      {
        label: 'Model Level DPP Search',
        icon: 'pi pi-search',
        command: () => {
          this.router.navigate(['/search']);
        }
      },
      {
        label: 'DPP Viewer',
        icon: 'pi pi-eye',
        command: () => {
          this.router.navigate(['/view']);
        }
      },
      {
        label: 'DPPs Comparison',
        icon: 'pi pi-chart-bar',
        command: () => {
          this.router.navigate(['/comparison']);
        }
      }
    ];
  }
}