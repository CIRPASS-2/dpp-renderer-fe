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

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { CapabilitiesService } from './capabilities.service';
import { FieldType, SearchField } from './search-models';

describe('CapabilitiesService', () => {
  let service: CapabilitiesService;
  let httpMock: HttpTestingController;
  const capabilitiesUrl = environment.capabilitiesUrl.concat("/capabilities/v1");

  const mockCapabilities: SearchField[] = [
    {
      fieldName: 'productName',
      dependsOn: '',
      targetType: FieldType.STRING
    },
    {
      fieldName: 'price',
      dependsOn: '',
      targetType: FieldType.DECIMAL
    },
    {
      fieldName: 'quantity',
      dependsOn: '',
      targetType: FieldType.INTEGER
    },
    {
      fieldName: 'isActive',
      dependsOn: '',
      targetType: FieldType.BOOLEAN
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CapabilitiesService]
    });
    service = TestBed.inject(CapabilitiesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getCapabilities method', () => {
    it('should make GET request to capabilities endpoint', () => {
      service.getCapabilities().subscribe();

      const req = httpMock.expectOne(capabilitiesUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockCapabilities);
    });

    it('should return search capabilities', () => {
      service.getCapabilities().subscribe(capabilities => {
        expect(capabilities).toEqual(mockCapabilities);
        expect(capabilities.length).toBe(4);
      });

      const req = httpMock.expectOne(capabilitiesUrl);
      req.flush(mockCapabilities);
    });

    it('should handle empty capabilities response', () => {
      const emptyCapabilities: SearchField[] = [];

      service.getCapabilities().subscribe(capabilities => {
        expect(capabilities).toEqual([]);
        expect(capabilities.length).toBe(0);
      });

      const req = httpMock.expectOne(capabilitiesUrl);
      req.flush(emptyCapabilities);
    });

    it('should handle capabilities with different field types', () => {
      const mixedCapabilities: SearchField[] = [
        { fieldName: 'name', dependsOn: '', targetType: FieldType.STRING },
        { fieldName: 'weight', dependsOn: '', targetType: FieldType.DECIMAL },
        { fieldName: 'count', dependsOn: '', targetType: FieldType.INTEGER },
        { fieldName: 'enabled', dependsOn: '', targetType: FieldType.BOOLEAN }
      ];

      service.getCapabilities().subscribe(capabilities => {
        expect(capabilities).toEqual(mixedCapabilities);

        // Verify specific field types
        expect(capabilities.find(c => c.fieldName === 'name')?.targetType).toBe(FieldType.STRING);
        expect(capabilities.find(c => c.fieldName === 'weight')?.targetType).toBe(FieldType.DECIMAL);
        expect(capabilities.find(c => c.fieldName === 'count')?.targetType).toBe(FieldType.INTEGER);
        expect(capabilities.find(c => c.fieldName === 'enabled')?.targetType).toBe(FieldType.BOOLEAN);
      });

      const req = httpMock.expectOne(capabilitiesUrl);
      req.flush(mixedCapabilities);
    });

    it('should handle capabilities with dependencies', () => {
      const dependentCapabilities: SearchField[] = [
        { fieldName: 'category', dependsOn: '', targetType: FieldType.STRING },
        { fieldName: 'subcategory', dependsOn: 'category', targetType: FieldType.STRING },
        { fieldName: 'product', dependsOn: 'subcategory', targetType: FieldType.STRING }
      ];

      service.getCapabilities().subscribe(capabilities => {
        expect(capabilities).toEqual(dependentCapabilities);

        // Verify dependencies
        expect(capabilities[0].dependsOn).toBe('');
        expect(capabilities[1].dependsOn).toBe('category');
        expect(capabilities[2].dependsOn).toBe('subcategory');
      });

      const req = httpMock.expectOne(capabilitiesUrl);
      req.flush(dependentCapabilities);
    });

    it('should handle large capabilities response', () => {
      const largeCapabilities: SearchField[] = Array.from({ length: 100 }, (_, i) => ({
        fieldName: `field${i}`,
        dependsOn: i > 0 ? `field${i - 1}` : '',
        targetType: i % 2 === 0 ? FieldType.STRING : FieldType.INTEGER
      }));

      service.getCapabilities().subscribe(capabilities => {
        expect(capabilities.length).toBe(100);
        expect(capabilities[0].fieldName).toBe('field0');
        expect(capabilities[99].fieldName).toBe('field99');
      });

      const req = httpMock.expectOne(capabilitiesUrl);
      req.flush(largeCapabilities);
    });

    it('should handle HTTP error responses', () => {
      service.getCapabilities().subscribe({
        next: () => fail('Expected error'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(capabilitiesUrl);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle HTTP 404 error', () => {
      service.getCapabilities().subscribe({
        next: () => fail('Expected error'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(capabilitiesUrl);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle network errors', () => {
      service.getCapabilities().subscribe({
        next: () => fail('Expected error'),
        error: (error) => {
          expect(error.error).toBeInstanceOf(ProgressEvent);
        }
      });

      const req = httpMock.expectOne(capabilitiesUrl);
      req.error(new ProgressEvent('network error'));
    });
  });
});
