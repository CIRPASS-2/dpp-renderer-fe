import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { PanelMenuModule } from 'primeng/panelmenu';

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