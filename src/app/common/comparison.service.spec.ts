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
import { ExtractionRequest, ExtractionResponse } from '../comparer/comparison/comparison.model';
import { OntologyJsonLd, PropertyPathsMap } from '../comparer/selector/ontology-tree.model';
import { FieldMapping, LogicalField } from '../comparer/selector/ontology-tree/ontology-tree.component';
import { ExtractorService } from './comparison.service';

describe('ExtractorService', () => {
  let service: ExtractorService;
  let httpMock: HttpTestingController;
  const extractorUrl = environment.backendUrl.concat("/comparison/v1");
  const fetchUrl = environment.backendUrl.concat("/fetch/v1");

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ExtractorService]
    });
    service = TestBed.inject(ExtractorService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('extractProperties method', () => {
    const mockPropertyPaths: PropertyPathsMap = {
      'property1': [{ namespace: 'https://example.com#', path: 'path/to/property1' }],
      'property2': [{ namespace: 'https://example.com#', path: 'path/to/property2' }]
    };

    const mockLogicalFields: LogicalField[] = [
      { id: 'field1', logicalName: 'Property 1', mappedProperties: [] },
      { id: 'field2', logicalName: 'Property 2', mappedProperties: [] }
    ];

    const mockFieldMapping: FieldMapping = {
      logicalFields: mockLogicalFields,
      propertyPaths: mockPropertyPaths
    };

    const testDppUrls = [
      'https://example.com/dpp1',
      'https://example.com/dpp2'
    ];

    const mockExtractionResponse: ExtractionResponse = {
      results: [
        { id: '1', data: { property1: 'value1', property2: 'value2' } },
        { id: '2', data: { property1: 'value3', property2: 'value4' } }
      ]
    };

    it('should make POST request to extractor endpoint', () => {
      service.extractProperties(testDppUrls, mockFieldMapping).subscribe();

      const req = httpMock.expectOne(extractorUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        dppUrls: testDppUrls,
        propertyPaths: mockPropertyPaths
      } as ExtractionRequest);
    });

    it('should return extraction response', () => {
      service.extractProperties(testDppUrls, mockFieldMapping).subscribe(response => {
        expect(response).toEqual(mockExtractionResponse);
      });

      const req = httpMock.expectOne(extractorUrl);
      req.flush(mockExtractionResponse);
    });

    it('should handle empty DPP URLs', () => {
      const emptyUrls: string[] = [];

      service.extractProperties(emptyUrls, mockFieldMapping).subscribe();

      const req = httpMock.expectOne(extractorUrl);
      expect(req.request.body.dppUrls).toEqual([]);
    });

    it('should handle empty property paths', () => {
      const emptyFieldMapping: FieldMapping = {
        logicalFields: [],
        propertyPaths: {}
      };

      service.extractProperties(testDppUrls, emptyFieldMapping).subscribe();

      const req = httpMock.expectOne(extractorUrl);
      expect(req.request.body.propertyPaths).toEqual({});
    });

    it('should handle single DPP URL', () => {
      const singleUrl = ['https://example.com/single-dpp'];

      service.extractProperties(singleUrl, mockFieldMapping).subscribe();

      const req = httpMock.expectOne(extractorUrl);
      expect(req.request.body.dppUrls).toEqual(singleUrl);
    });

    it('should handle HTTP error responses', () => {
      service.extractProperties(testDppUrls, mockFieldMapping).subscribe({
        next: () => fail('Expected error'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(extractorUrl);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('fetchOntology method', () => {
    const testOntologyUrl = 'https://example.com/ontology.jsonld';

    const mockOntologyResponse: OntologyJsonLd = [
      {
        '@id': 'http://example.com/Class1',
        '@type': ['http://www.w3.org/2002/07/owl#Class'],
        'http://www.w3.org/2000/01/rdf-schema#label': [
          { '@value': 'Class 1', '@language': 'en' }
        ]
      },
      {
        '@id': 'http://example.com/property1',
        '@type': ['http://www.w3.org/2002/07/owl#ObjectProperty'],
        'http://www.w3.org/2000/01/rdf-schema#label': [
          { '@value': 'Property 1', '@language': 'en' }
        ]
      }
    ];

    it('should make GET request to fetch endpoint with correct parameters', () => {
      service.fetchOntology(testOntologyUrl).subscribe();

      const req = httpMock.expectOne(`${fetchUrl}?url=${testOntologyUrl}`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Accept')).toBe('application/ld+json');
    });

    it('should return ontology data', () => {
      service.fetchOntology(testOntologyUrl).subscribe(ontology => {
        expect(ontology).toEqual(mockOntologyResponse);
      });

      const req = httpMock.expectOne(`${fetchUrl}?url=${testOntologyUrl}`);
      req.flush(mockOntologyResponse);
    });

    it('should handle different ontology URL formats', () => {
      const ontologyUrls = [
        'https://example.com/ontology.jsonld',
        'http://w3id.org/ontology',
        'https://vocab.example.org/terms'
      ];

      ontologyUrls.forEach(url => {
        service.fetchOntology(url).subscribe();
        const req = httpMock.expectOne(`${fetchUrl}?url=${url}`);
        req.flush(mockOntologyResponse);
      });
    });

    it('should handle empty ontology response', () => {
      const emptyResponse: OntologyJsonLd = [];

      service.fetchOntology(testOntologyUrl).subscribe(ontology => {
        expect(ontology).toEqual([]);
      });

      const req = httpMock.expectOne(`${fetchUrl}?url=${testOntologyUrl}`);
      req.flush(emptyResponse);
    });

    it('should handle ontology with graph wrapper', () => {
      const wrappedOntology = {
        '@graph': mockOntologyResponse
      };

      service.fetchOntology(testOntologyUrl).subscribe(ontology => {
        expect(ontology).toEqual(wrappedOntology);
      });

      const req = httpMock.expectOne(`${fetchUrl}?url=${testOntologyUrl}`);
      req.flush(wrappedOntology);
    });

    it('should handle HTTP error responses', () => {
      service.fetchOntology(testOntologyUrl).subscribe({
        next: () => fail('Expected error'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${fetchUrl}?url=${testOntologyUrl}`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle malformed ontology URL', () => {
      const malformedUrl = 'not-a-valid-url';

      service.fetchOntology(malformedUrl).subscribe();

      const req = httpMock.expectOne(`${fetchUrl}?url=${malformedUrl}`);
      req.flush(mockOntologyResponse);
    });
  });
});
