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
import { ActivatedRoute, ParamMap, Router, convertToParamMap } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { PagedResult, ResourceMetadata } from '../validator-models';
import { ValidatorServiceService } from '../validator-service.service';
import { ValidatorResourcesTableComponent } from './validator-resources-table.component';

describe('ValidatorResourcesTableComponent', () => {
  let component: ValidatorResourcesTableComponent;
  let fixture: ComponentFixture<ValidatorResourcesTableComponent>;
  let validatorServiceSpy: jasmine.SpyObj<ValidatorServiceService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let paramMapSubject: BehaviorSubject<ParamMap>;

  const mockSchemaResource: ResourceMetadata = {
    id: 1,
    metadataType: 'base',
    name: 'schema-a',
    version: '1.0',
    description: 'A schema',
  };

  const mockPagedResult: PagedResult<ResourceMetadata> = {
    elements: [mockSchemaResource],
    totalElements: 1,
    pageSize: 10,
  };

  beforeEach(async () => {
    validatorServiceSpy = jasmine.createSpyObj('ValidatorServiceService', ['search', 'deleteResource']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    paramMapSubject = new BehaviorSubject<ParamMap>(convertToParamMap({ resType: 'schemas' }));

    validatorServiceSpy.search.and.returnValue(of(mockPagedResult));
    validatorServiceSpy.deleteResource.and.returnValue(of(undefined));

    await TestBed.configureTestingModule({
      imports: [ValidatorResourcesTableComponent, NoopAnimationsModule],
      providers: [
        { provide: ValidatorServiceService, useValue: validatorServiceSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: { paramMap: paramMapSubject.asObservable() },
        },
        ConfirmationService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ValidatorResourcesTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── ngOnInit / route param handling ───────────────────────────────────────

  describe('ngOnInit', () => {
    it('should set resourceType to schema for resType=schemas', () => {
      expect(component.resourceType).toBe('schema');
      expect(component.isTemplate).toBeFalse();
    });

    it('should set resourceType to template for resType=templates', () => {
      paramMapSubject.next(convertToParamMap({ resType: 'templates' }));
      fixture.detectChanges();
      expect(component.resourceType).toBe('template');
      expect(component.isTemplate).toBeTrue();
    });

    it('should call search service on init', () => {
      expect(validatorServiceSpy.search).toHaveBeenCalledWith(
        'schema',
        jasmine.objectContaining({ offset: 0, limit: 10 }),
      );
    });

    it('should populate resources from search result', () => {
      expect(component.resources).toEqual([mockSchemaResource]);
      expect(component.totalRecords).toBe(1);
    });

    it('should reset loading to false after load', () => {
      expect(component.loading).toBeFalse();
    });

    it('should reset searchForm when route param changes', () => {
      component.searchForm.patchValue({ name: 'old', version: '0.1' });
      paramMapSubject.next(convertToParamMap({ resType: 'templates' }));
      fixture.detectChanges();
      expect(component.searchForm.value).toEqual({ name: null, version: null, description: null });
    });
  });

  // ── load error handling ────────────────────────────────────────────────────

  describe('load', () => {
    it('should set loading to false on error', () => {
      validatorServiceSpy.search.and.returnValue(throwError(() => new Error('Network error')));
      component.load({ offset: 0, limit: 10 });
      expect(component.loading).toBeFalse();
    });
  });

  // ── search ─────────────────────────────────────────────────────────────────

  describe('search', () => {
    it('should call load with form values merged into params', () => {
      component.searchForm.patchValue({ name: 'schema-a', version: '1.0', description: '' });
      validatorServiceSpy.search.calls.reset();
      component.search();

      expect(validatorServiceSpy.search).toHaveBeenCalledWith(
        'schema',
        jasmine.objectContaining({ name: 'schema-a', version: '1.0', offset: 0, limit: 10 }),
      );
    });

    it('should reset offset to 0 when searching', () => {
      component.currentSearchParams = { offset: 20, limit: 10 };
      component.search();
      expect(component.currentSearchParams.offset).toBe(0);
    });

    it('should omit empty string fields from search params', () => {
      component.searchForm.patchValue({ name: '', version: '2.0', description: '' });
      component.search();
      const callArgs = validatorServiceSpy.search.calls.mostRecent().args[1] as Record<string, unknown>;
      expect(callArgs['name']).toBeUndefined();
      expect(callArgs['description']).toBeUndefined();
    });
  });

  // ── clearSearch ────────────────────────────────────────────────────────────

  describe('clearSearch', () => {
    it('should reset form and reload with empty params', () => {
      component.searchForm.patchValue({ name: 'test' });
      validatorServiceSpy.search.calls.reset();
      component.clearSearch();

      expect(component.searchForm.value).toEqual({ name: null, version: null, description: null });
      expect(validatorServiceSpy.search).toHaveBeenCalledWith(
        'schema',
        jasmine.objectContaining({ offset: 0, limit: 10 }),
      );
    });
  });

  // ── pageChange ─────────────────────────────────────────────────────────────

  describe('pageChange', () => {
    it('should update currentSearchParams and call load', () => {
      validatorServiceSpy.search.calls.reset();
      component.pageChange({ first: 10, rows: 10 });

      expect(validatorServiceSpy.search).toHaveBeenCalledWith(
        'schema',
        jasmine.objectContaining({ offset: 10, limit: 10 }),
      );
    });

    it('should preserve existing search filters on page change', () => {
      component.currentSearchParams = { offset: 0, limit: 10, name: 'schema-a' };
      component.pageChange({ first: 20, rows: 10 });

      const callArgs = validatorServiceSpy.search.calls.mostRecent().args[1] as Record<string, unknown>;
      expect(callArgs['name']).toBe('schema-a');
      expect(callArgs['offset']).toBe(20);
    });
  });

  // ── view ───────────────────────────────────────────────────────────────────

  describe('view', () => {
    it('should navigate to view route with resource state', () => {
      component.view(mockSchemaResource);
      expect(routerSpy.navigate).toHaveBeenCalledWith(
        ['/validator', 'schemas', 'view', 1],
        { state: { metadata: mockSchemaResource } },
      );
    });
  });

  // ── delete ─────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('should call deleteResource and reload on success', () => {
      validatorServiceSpy.search.calls.reset();
      // Access private method via cast
      (component as unknown as { delete: (r: ResourceMetadata) => void }).delete(mockSchemaResource);

      expect(validatorServiceSpy.deleteResource).toHaveBeenCalledWith('schema', 1);
      expect(validatorServiceSpy.search).toHaveBeenCalled();
    });
  });
});
