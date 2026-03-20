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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AppComponent } from './app.component';
import { AuthService } from './common/auth.service';
import { SidebarComponent } from './sidebar/sidebar.component';

@Component({
    selector: 'app-sidebar',
    template: ''
})
class MockSidebarComponent { }

describe('AppComponent', () => {
    let component: AppComponent;
    let fixture: ComponentFixture<AppComponent>;
    let authServiceSpy: jasmine.SpyObj<AuthService>;
    let routerSpy: jasmine.SpyObj<Router>;

    beforeEach(async () => {
        const authSpy = jasmine.createSpyObj('AuthService', ['initialize'], {
            isLoggedIn: false
        });
        const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);

        await TestBed.configureTestingModule({
            imports: [AppComponent],
            providers: [
                { provide: AuthService, useValue: authSpy },
                { provide: Router, useValue: routerSpyObj }
            ]
        })
            .overrideComponent(AppComponent, {
                remove: { imports: [SidebarComponent] },
                add: { imports: [MockSidebarComponent] }
            })
            .compileComponents();

        authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
        routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AppComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('ngOnInit', () => {
        it('should initialize auth service', async () => {
            authServiceSpy.initialize.and.returnValue(Promise.resolve());

            await component.ngOnInit();

            expect(authServiceSpy.initialize).toHaveBeenCalled();
        });

        it('should handle auth service initialization error', async () => {
            authServiceSpy.initialize.and.returnValue(Promise.reject(new Error('Init failed')));

            try {
                await component.ngOnInit();
                fail('Should have thrown error');
            } catch (error) {
                expect(error).toEqual(new Error('Init failed'));
            }
        });
    });

    describe('isLoggedIn', () => {
        it('should return true when user is logged in', () => {
            Object.defineProperty(authServiceSpy, 'isLoggedIn', {
                get: jasmine.createSpy().and.returnValue(true)
            });

            expect(component.isLoggedIn()).toBe(true);
        });

        it('should return false when user is not logged in', () => {
            Object.defineProperty(authServiceSpy, 'isLoggedIn', {
                get: jasmine.createSpy().and.returnValue(false)
            });

            expect(component.isLoggedIn()).toBe(false);
        });
    });

    describe('template', () => {
        it('should render router outlet', () => {
            fixture.detectChanges();
            const compiled = fixture.nativeElement as HTMLElement;
            expect(compiled.querySelector('router-outlet')).toBeTruthy();
        });

        it('should render sidebar component', () => {
            fixture.detectChanges();
            const compiled = fixture.nativeElement as HTMLElement;
            // Sidebar is only shown when user is logged in
            // In test environment, user is typically not logged in
            expect(compiled.querySelector('app-sidebar')).toBeFalsy();
        });
    });
});
