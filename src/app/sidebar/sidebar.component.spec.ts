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

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { AuthService } from '../common/auth.service';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;
  let routerSpy: jasmine.SpyObj<Router>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  function createTestBed(hasAnyRoleResult: boolean): Promise<void> {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['logout', 'hasAnyRole']);
    authServiceSpy.hasAnyRole.and.returnValue(hasAnyRoleResult);

    return TestBed.configureTestingModule({
      imports: [SidebarComponent, NoopAnimationsModule],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: authServiceSpy },
      ],
    }).compileComponents();
  }

  describe('without validator role (hasAnyRole=false)', () => {
    beforeEach(async () => {
      await createTestBed(false);
      fixture = TestBed.createComponent(SidebarComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    describe('ngOnInit', () => {
      it('should initialize menuItems with 4 items (no validator)', () => {
        expect(component.menuItems.length).toBe(4);
      });

      it('should have Logout as first menu item', () => {
        const logoutItem = component.menuItems[0];
        expect(logoutItem.label).toBe('Logout');
        expect(logoutItem.icon).toBe('pi pi-sign-out');
      });

      it('should configure Model Level DPP Search menu item', () => {
        const item = component.menuItems[1];
        expect(item.label).toBe('Model Level DPP Search');
        expect(item.icon).toBe('pi pi-search');
        expect(item.command).toBeDefined();
      });

      it('should configure DPP Viewer menu item', () => {
        const item = component.menuItems[2];
        expect(item.label).toBe('DPP Viewer');
        expect(item.icon).toBe('pi pi-eye');
        expect(item.command).toBeDefined();
      });

      it('should configure DPPs Comparison menu item', () => {
        const item = component.menuItems[3];
        expect(item.label).toBe('DPPs Comparison');
        expect(item.icon).toBe('pi pi-chart-bar');
        expect(item.command).toBeDefined();
      });

      it('should not include DPP Validation Resources when user lacks role', () => {
        const labels = component.menuItems.map(i => i.label);
        expect(labels).not.toContain('DPP Validation Resources');
      });
    });

    describe('menu navigation', () => {
      it('should call authService.logout when Logout is clicked', () => {
        component.menuItems[0].command!({});
        expect(authServiceSpy.logout).toHaveBeenCalled();
      });

      it('should navigate to /search when search item is clicked', () => {
        component.menuItems[1].command!({});
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/search']);
      });

      it('should navigate to /view when viewer item is clicked', () => {
        component.menuItems[2].command!({});
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/view']);
      });

      it('should navigate to /comparison when comparison item is clicked', () => {
        component.menuItems[3].command!({});
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/comparison']);
      });
    });

    describe('template rendering', () => {
      it('should render PanelMenu component', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector('p-panelmenu')).toBeTruthy();
      });
    });
  });

  describe('with validator role (hasAnyRole=true)', () => {
    beforeEach(async () => {
      await createTestBed(true);
      fixture = TestBed.createComponent(SidebarComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should initialize menuItems with 5 items (including validator)', () => {
      expect(component.menuItems.length).toBe(5);
    });

    it('should include DPP Validation Resources as last item', () => {
      const validatorItem = component.menuItems[4];
      expect(validatorItem.label).toBe('DPP Validation Resources');
    });

    it('should have Templates and Schemas as sub-items', () => {
      const subItems = component.menuItems[4].items as { label: string; command: (e: object) => void }[];
      expect(subItems.length).toBe(2);
      expect(subItems[0].label).toBe('Templates');
      expect(subItems[1].label).toBe('Schemas');
    });

    it('should navigate to /validator/templates when Templates is clicked', () => {
      const subItems = component.menuItems[4].items as { label: string; command: (e: object) => void }[];
      subItems[0].command({});
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/validator/templates']);
    });

    it('should navigate to /validator/schemas when Schemas is clicked', () => {
      const subItems = component.menuItems[4].items as { label: string; command: (e: object) => void }[];
      subItems[1].command({});
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/validator/schemas']);
    });
  });
});
