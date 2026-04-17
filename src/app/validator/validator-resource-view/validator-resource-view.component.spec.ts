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
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ResourceMetadata, TemplateResourceMetadata } from '../validator-models';
import { ValidatorServiceService } from '../validator-service.service';
import { ValidatorResourceViewComponent } from './validator-resource-view.component';

describe('ValidatorResourceViewComponent', () => {
  let component: ValidatorResourceViewComponent;
  let fixture: ComponentFixture<ValidatorResourceViewComponent>;
  let validatorServiceSpy: jasmine.SpyObj<ValidatorServiceService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockSchemaMeta: ResourceMetadata = {
    id: 3,
    metadataType: 'base',
    name: 'my-schema',
    version: '1.0',
  };

  const mockTemplateMeta: TemplateResourceMetadata = {
    id: 7,
    metadataType: 'template',
    name: 'my-template',
    version: '2.0',
    contextUri: 'https://example.com/ctx',
  };

  function buildTestBed(resType: string, id: string, stateMetadata?: ResourceMetadata): Promise<void> {
    validatorServiceSpy = jasmine.createSpyObj('ValidatorServiceService', ['getResourceById']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    // Mock history.state so ngOnInit picks up metadata
    if (stateMetadata) {
      spyOnProperty(window.history, 'state').and.returnValue({ metadata: stateMetadata });
    }

    return TestBed.configureTestingModule({
      imports: [ValidatorResourceViewComponent, NoopAnimationsModule],
      providers: [
        { provide: ValidatorServiceService, useValue: validatorServiceSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ resType, id }),
            },
          },
        },
      ],
    }).compileComponents();
  }

  // ── Schema resType ─────────────────────────────────────────────────────────

  describe('with resType=schemas', () => {
    beforeEach(async () => {
      await buildTestBed('schemas', '3', mockSchemaMeta);
      validatorServiceSpy.getResourceById.and.returnValue(of('{"key":"value"}'));

      fixture = TestBed.createComponent(ValidatorResourceViewComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should set resourceType to schema', () => {
      expect(component.resourceType).toBe('schema');
    });

    it('should set isTemplate to false', () => {
      expect(component.isTemplate).toBeFalse();
    });

    it('should call getResourceById with correct id', () => {
      expect(validatorServiceSpy.getResourceById).toHaveBeenCalledWith('schema', 3);
    });

    it('should pretty-print JSON content for schemas', () => {
      expect(component.content).toBe(JSON.stringify({ key: 'value' }, null, 2));
    });

    it('should populate metadata from history.state', () => {
      expect(component.metadata).toEqual(mockSchemaMeta);
    });

    it('should set loading to false after content loaded', () => {
      expect(component.loading).toBeFalse();
    });

    it('should keep raw content when JSON is invalid', () => {
      validatorServiceSpy.getResourceById.and.returnValue(of('not-json'));
      component.loadContent(3);
      expect(component.content).toBe('not-json');
    });

    it('should set loading to false on error', () => {
      validatorServiceSpy.getResourceById.and.returnValue(throwError(() => new Error('fail')));
      component.loadContent(3);
      expect(component.loading).toBeFalse();
    });
  });

  // ── Template resType ───────────────────────────────────────────────────────

  describe('with resType=templates', () => {
    beforeEach(async () => {
      await buildTestBed('templates', '7', mockTemplateMeta);
      validatorServiceSpy.getResourceById.and.returnValue(of('@prefix ex: <http://example.com/>.'));

      fixture = TestBed.createComponent(ValidatorResourceViewComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should set resourceType to template', () => {
      expect(component.resourceType).toBe('template');
    });

    it('should set isTemplate to true', () => {
      expect(component.isTemplate).toBeTrue();
    });

    it('should keep raw content for templates (no JSON pretty-print)', () => {
      expect(component.content).toBe('@prefix ex: <http://example.com/>.');
    });

    it('should expose templateMeta casting', () => {
      component.metadata = mockTemplateMeta;
      expect(component.templateMeta.contextUri).toBe('https://example.com/ctx');
    });
  });

  // ── back navigation ────────────────────────────────────────────────────────

  describe('back', () => {
    beforeEach(async () => {
      await buildTestBed('schemas', '3');
      validatorServiceSpy.getResourceById.and.returnValue(of('{}'));

      fixture = TestBed.createComponent(ValidatorResourceViewComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should navigate back to the list', () => {
      component.back();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/validator', 'schemas']);
    });
  });
});
