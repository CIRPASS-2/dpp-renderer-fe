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
import { throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ExpandedJsonLd, JsonObject } from '../renderer/rendering-models';
import { DppFetchError, DppFetchService, DppJsonLdResult, DppJsonResult, UnsupportedContentTypeError } from './dpp-fetch.service';

describe('DppFetchService', () => {
  let service: DppFetchService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.backendUrl}/fetch/v1`;

  const mockJsonData: JsonObject = { test: 'data', id: '123' };
  const mockJsonLdData: ExpandedJsonLd = [{ '@id': 'test', '@type': ['TestType'] }];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DppFetchService]
    });
    service = TestBed.inject(DppFetchService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('fetch method', () => {
    const testDppUrl = 'https://example.com/dpp/123';

    it('should make GET request with correct URL and parameters', () => {
      service.fetch(testDppUrl).subscribe();

      const req = httpMock.expectOne(`${baseUrl}?url=${testDppUrl}`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Accept')).toBe('application/ld+json, application/json;q=0.9');

      req.flush(mockJsonData, {
        headers: { 'Content-Type': 'application/json' }
      });
    });

    it('should handle JSON response correctly', () => {
      service.fetch(testDppUrl).subscribe(result => {
        expect(result.kind).toBe('json');
        expect((result as DppJsonResult).data).toEqual(mockJsonData);
        expect(result.contentType).toBe('application/json');
      });

      const req = httpMock.expectOne(`${baseUrl}?url=${testDppUrl}`);
      req.flush(mockJsonData, {
        headers: { 'Content-Type': 'application/json' }
      });
    });

    it('should handle JSON-LD response correctly', () => {
      service.fetch(testDppUrl).subscribe(result => {
        expect(result.kind).toBe('jsonld');
        expect((result as DppJsonLdResult).data).toEqual(mockJsonLdData);
        expect(result.contentType).toBe('application/ld+json');
      });

      const req = httpMock.expectOne(`${baseUrl}?url=${testDppUrl}`);
      req.flush(mockJsonLdData, {
        headers: { 'Content-Type': 'application/ld+json' }
      });
    });

    it('should handle JSON with charset parameter', () => {
      service.fetch(testDppUrl).subscribe(result => {
        expect(result.kind).toBe('json');
        expect(result.contentType).toBe('application/json; charset=utf-8');
      });

      const req = httpMock.expectOne(`${baseUrl}?url=${testDppUrl}`);
      req.flush(mockJsonData, {
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    });

    it('should handle JSON-LD with charset parameter', () => {
      service.fetch(testDppUrl).subscribe(result => {
        expect(result.kind).toBe('jsonld');
        expect(result.contentType).toBe('application/ld+json; charset=utf-8');
      });

      const req = httpMock.expectOne(`${baseUrl}?url=${testDppUrl}`);
      req.flush(mockJsonLdData, {
        headers: { 'Content-Type': 'application/ld+json; charset=utf-8' }
      });
    });

    it('should throw UnsupportedContentTypeError for unsupported content type', () => {
      service.fetch(testDppUrl).subscribe({
        next: () => fail('Should have thrown error'),
        error: (error) => {
          expect(error).toBeInstanceOf(UnsupportedContentTypeError);
          expect(error.receivedContentType).toBe('text/html');
          expect(error.message).toContain('Unsupported content type: "text/html"');
        }
      });

      const req = httpMock.expectOne(`${baseUrl}?url=${testDppUrl}`);
      req.flush('<html></html>', {
        headers: { 'Content-Type': 'text/html' }
      });
    });

    it('should handle missing Content-Type header', () => {
      service.fetch(testDppUrl).subscribe({
        next: () => fail('Should have thrown error'),
        error: (error) => {
          expect(error).toBeInstanceOf(UnsupportedContentTypeError);
          expect(error.receivedContentType).toBe('');
        }
      });

      const req = httpMock.expectOne(`${baseUrl}?url=${testDppUrl}`);
      req.flush(mockJsonData); // No Content-Type header
    });

    it('should handle HTTP 404 error', () => {
      service.fetch(testDppUrl).subscribe({
        next: () => fail('Should have thrown error'),
        error: (error) => {
          expect(error).toBeInstanceOf(DppFetchError);
          expect(error.message).toBe('HTTP 404: Not Found');
          expect(error.httpStatus).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${baseUrl}?url=${testDppUrl}`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle HTTP 500 error', () => {
      service.fetch(testDppUrl).subscribe({
        next: () => fail('Should have thrown error'),
        error: (error) => {
          expect(error).toBeInstanceOf(DppFetchError);
          expect(error.message).toBe('HTTP 500: Internal Server Error');
          expect(error.httpStatus).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${baseUrl}?url=${testDppUrl}`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle network errors', () => {
      service.fetch(testDppUrl).subscribe({
        next: () => fail('Should have thrown error'),
        error: (error) => {
          expect(error).toBeInstanceOf(DppFetchError);
          expect(error.message).toBe('HTTP 0: Unknown Error');
          expect(error.httpStatus).toBe(0);
        }
      });

      const req = httpMock.expectOne(`${baseUrl}?url=${testDppUrl}`);
      req.error(new ProgressEvent('network error'));
    });

    it('should preserve existing DppFetchError', () => {
      const originalError = new DppFetchError('Custom error');

      // Mock HttpClient to return an observable that throws the original error
      spyOn(service['http'], 'get').and.returnValue(throwError(() => originalError));

      service.fetch(testDppUrl).subscribe({
        next: () => fail('Should have thrown error'),
        error: (error) => {
          expect(error).toBeInstanceOf(DppFetchError);
          expect(error.message).toBe('Custom error');
        }
      });
    });
  });

  describe('private methods', () => {
    it('should parse content type correctly', () => {
      // Access private method for testing
      const parseContentType = (service as any).parseContentType.bind(service);

      expect(parseContentType('application/json')).toBe('application/json');
      expect(parseContentType('application/json; charset=utf-8')).toBe('application/json');
      expect(parseContentType('APPLICATION/JSON')).toBe('application/json');
      expect(parseContentType('application/ld+json; charset=utf-8')).toBe('application/ld+json');
      expect(parseContentType('')).toBe('');
    });

    it('should normalize host correctly', () => {
      // Access private method for testing
      const normalizeHost = (service as any).normalizeHost.bind(service);

      expect(normalizeHost('https://example.com')).toBe('https://example.com');
      expect(normalizeHost('https://example.com/')).toBe('https://example.com');
      expect(normalizeHost('https://example.com//')).toBe('https://example.com/');
    });
  });
});
