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
import { Router } from '@angular/router';
import { CallbackComponent } from './callback.component';

describe('CallbackComponent', () => {
  let component: CallbackComponent;
  let fixture: ComponentFixture<CallbackComponent>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [CallbackComponent],
      providers: [
        { provide: Router, useValue: spy }
      ]
    })
      .compileComponents();

    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture = TestBed.createComponent(CallbackComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should navigate to search page', async () => {
      await component.ngOnInit();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/search']);
    });

    it('should navigate immediately when component initializes', async () => {
      const navigateSpy = routerSpy.navigate;
      navigateSpy.and.returnValue(Promise.resolve(true));

      await component.ngOnInit();

      expect(navigateSpy).toHaveBeenCalledTimes(1);
      expect(navigateSpy).toHaveBeenCalledWith(['/search']);
    });
  });

  describe('template rendering', () => {
    it('should render component template', () => {
      fixture.detectChanges();
      expect(fixture.nativeElement).toBeTruthy();
    });
  });
});
