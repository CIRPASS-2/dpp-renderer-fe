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
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { CapabilitiesService } from '../capabilities.service';
import { FieldType, FilterOp, SearchField, SearchResult } from '../search-models';
import { SearchService } from '../search.service';
import { SearchResultsComponent } from './search-results.component';

describe('SearchResultsComponent', () => {
  let component: SearchResultsComponent;
  let fixture: ComponentFixture<SearchResultsComponent>;
  let searchServiceSpy: jasmine.SpyObj<SearchService>;
  let capabilitiesServiceSpy: jasmine.SpyObj<CapabilitiesService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockCapabilities: SearchField[] = [
    { fieldName: 'productName', dependsOn: '', targetType: FieldType.STRING },
    { fieldName: 'price', dependsOn: '', targetType: FieldType.DECIMAL },
    { fieldName: 'category', dependsOn: 'productName', targetType: FieldType.STRING }
  ];

  const mockSearchResults: SearchResult[] = [
    {
      id: 1,
      upi: 'test-upi-1',
      liveURL: 'https://example.com/dpp/1',
      data: { productName: 'Test Product 1', price: '99.99' }
    },
    {
      id: 2,
      upi: 'test-upi-2',
      liveURL: 'https://example.com/dpp/2',
      data: { productName: 'Test Product 2', price: '149.99' }
    }
  ];

  beforeEach(async () => {
    const searchSpy = jasmine.createSpyObj('SearchService', ['search']);
    const capabilitiesSpy = jasmine.createSpyObj('CapabilitiesService', ['getCapabilities']);
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);

    searchSpy.search.and.returnValue(of({
      elements: mockSearchResults,
      count: 2,
      numberOfElements: 2
    }));
    capabilitiesSpy.getCapabilities.and.returnValue(of(mockCapabilities));

    await TestBed.configureTestingModule({
      imports: [SearchResultsComponent],
      providers: [
        { provide: SearchService, useValue: searchSpy },
        { provide: CapabilitiesService, useValue: capabilitiesSpy },
        { provide: Router, useValue: routerSpyObj },
        provideNoopAnimations()
      ]
    })
      .compileComponents();

    searchServiceSpy = TestBed.inject(SearchService) as jasmine.SpyObj<SearchService>;
    capabilitiesServiceSpy = TestBed.inject(CapabilitiesService) as jasmine.SpyObj<CapabilitiesService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture = TestBed.createComponent(SearchResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize capabilities and perform initial search on init', () => {
    expect(capabilitiesServiceSpy.getCapabilities).toHaveBeenCalled();
    expect(searchServiceSpy.search).toHaveBeenCalled();
    expect(component.capabilities).toEqual(mockCapabilities);
    expect(component.elements).toEqual(mockSearchResults);
    expect(component.totalElements).toBe(2);
  });

  it('should navigate to details when details method called', () => {
    const testUrl = 'https://example.com/test-dpp';
    component.details(testUrl);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['view'], { queryParams: { url: testUrl } });
  });

  it('should return correct data keys', () => {
    component.capabilities = mockCapabilities;
    const keys = component.dataKeys;
    expect(keys).toEqual(['productName', 'price']);
  });

  it('should retrieve table value with dependent fields', () => {
    component.capabilities = mockCapabilities;
    const testEntry: SearchResult = {
      id: 1,
      upi: 'test',
      liveURL: 'https://test.com',
      data: { productName: 'Test', category: 'Electronics' }
    };

    const value = component.retrieveTableValue(testEntry, 'productName');
    expect(value).toBe('Test Electronics');
  });

  it('should build filter request correctly', () => {
    const filters = [{ property: 'name', op: FilterOp.EQ, literal: 'test' }];
    const request = component.buildFilter(filters);
    expect(request.filters).toEqual(filters);
    expect(request.offset).toBe(0);
    expect(request.limit).toBe(10);
  });

  it('should handle page change correctly', () => {
    const pageEvent = { first: 20, rows: 5 };
    component.currSearchReq = { filters: null, offset: 0, limit: 10 };

    component.pageChange(pageEvent);

    expect(component.currSearchReq.limit).toBe(5);
    expect(component.currSearchReq.offset).toBe(20);
    expect(searchServiceSpy.search).toHaveBeenCalled();
  });
});
