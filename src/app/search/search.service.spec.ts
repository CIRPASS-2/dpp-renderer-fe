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
import { environment } from '../../environments/environment.development';
import { FilterOp, PagedResult, SearchRequest, SearchResult } from './search-models';
import { SearchService } from './search.service';

describe('SearchService', () => {
  let service: SearchService;
  let httpMock: HttpTestingController;
  const searchUrl = environment.backendUrl + "/search/v1";

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SearchService]
    });
    service = TestBed.inject(SearchService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('search method', () => {
    const mockSearchRequest: SearchRequest = {
      filters: [
        {
          property: 'name',
          op: FilterOp.LIKE,
          literal: 'test'
        }
      ],
      offset: 0,
      limit: 10
    };

    const mockSearchResult: SearchResult = {
      id: 1,
      upi: 'test-upi',
      liveURL: 'https://example.com/dpp/1',
      data: { name: 'Test DPP' }
    };

    const mockPagedResult: PagedResult = {
      elements: [mockSearchResult],
      count: 1,
      numberOfElements: 1
    };

    it('should make POST request to search endpoint', () => {
      service.search(mockSearchRequest).subscribe();

      const req = httpMock.expectOne(searchUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockSearchRequest);
    });

    it('should return paged result on successful search', () => {
      service.search(mockSearchRequest).subscribe(result => {
        expect(result).toEqual(mockPagedResult);
      });

      const req = httpMock.expectOne(searchUrl);
      req.flush(mockPagedResult);
    });

    it('should handle search request with null filters', () => {
      const requestWithNullFilters: SearchRequest = {
        filters: null,
        offset: 0,
        limit: 10
      };

      service.search(requestWithNullFilters).subscribe();

      const req = httpMock.expectOne(searchUrl);
      expect(req.request.body).toEqual(requestWithNullFilters);
      req.flush(mockPagedResult);
    });

    it('should handle different filter operations', () => {
      const requestWithDifferentOps: SearchRequest = {
        filters: [
          { property: 'price', op: FilterOp.GT, literal: '100' },
          { property: 'category', op: FilterOp.EQ, literal: 'electronics' }
        ],
        offset: 5,
        limit: 20
      };

      service.search(requestWithDifferentOps).subscribe();

      const req = httpMock.expectOne(searchUrl);
      expect(req.request.body).toEqual(requestWithDifferentOps);
      req.flush(mockPagedResult);
    });

    it('should handle pagination parameters', () => {
      const paginatedRequest: SearchRequest = {
        filters: [],
        offset: 50,
        limit: 25
      };

      service.search(paginatedRequest).subscribe();

      const req = httpMock.expectOne(searchUrl);
      expect(req.request.body.offset).toBe(50);
      expect(req.request.body.limit).toBe(25);
      req.flush(mockPagedResult);
    });

    it('should return empty result when no elements found', () => {
      const emptyResult: PagedResult = {
        elements: [],
        count: 0,
        numberOfElements: 0
      };

      service.search(mockSearchRequest).subscribe(result => {
        expect(result.elements).toEqual([]);
        expect(result.count).toBe(0);
        expect(result.numberOfElements).toBe(0);
      });

      const req = httpMock.expectOne(searchUrl);
      req.flush(emptyResult);
    });

    it('should handle HTTP error responses', () => {
      const errorMessage = 'Server error';

      service.search(mockSearchRequest).subscribe({
        next: () => fail('Expected error'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(searchUrl);
      req.flush(errorMessage, { status: 500, statusText: 'Internal Server Error' });
    });
  });
});
