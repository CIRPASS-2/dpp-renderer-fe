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
import { PagedResult, ResourceMetadata, TemplateResourceMetadata } from './validator-models';
import { ValidatorServiceService } from './validator-service.service';

describe('ValidatorServiceService', () => {
  let service: ValidatorServiceService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.validatorUrl}/resource/v1`;

  const mockSchemaMeta: ResourceMetadata = {
    metadataType: 'base',
    id: 1,
    name: 'my-schema',
    version: '1.0',
    description: 'A test schema',
  };

  const mockTemplateMeta: TemplateResourceMetadata = {
    metadataType: 'template',
    id: 2,
    name: 'my-template',
    version: '2.0',
    contextUri: 'https://example.com/ctx',
  };

  const mockPagedResult: PagedResult<ResourceMetadata> = {
    elements: [mockSchemaMeta],
    totalElements: 1,
    pageSize: 10,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ValidatorServiceService],
    });
    service = TestBed.inject(ValidatorServiceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ── addResource ────────────────────────────────────────────────────────────

  describe('addResource', () => {
    it('should POST to the correct URL with FormData', () => {
      const file = new File(['content'], 'schema.json', { type: 'application/json' });
      let received: number | undefined;

      service.addResource('json', file, mockSchemaMeta).subscribe(id => (received = id));

      const req = httpMock.expectOne(`${baseUrl}/json`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBeTrue();
      req.flush(1);

      expect(received).toBe(1);
    });

    it('should include the file and meta parts in FormData', () => {
      const file = new File(['data'], 'schema.json', { type: 'application/json' });
      service.addResource('json', file, mockSchemaMeta).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/json`);
      const body: FormData = req.request.body;
      expect(body.get('file')).toBe(file);
      expect(body.get('meta')).toBeInstanceOf(Blob);
      req.flush(42);
    });

    it('should use the payloadType in the URL', () => {
      const file = new File(['@prefix ex: <http://example.com/>.'], 'template.ttl', { type: 'text/turtle' });
      service.addResource('turtle', file, mockTemplateMeta).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/turtle`);
      expect(req.request.url).toContain('/turtle');
      req.flush(5);
    });
  });

  // ── getResourceById ────────────────────────────────────────────────────────

  describe('getResourceById', () => {
    it('should GET text content for a schema by ID', () => {
      let result: string | undefined;
      service.getResourceById('schema', 1).subscribe(c => (result = c));

      const req = httpMock.expectOne(`${baseUrl}/schema/1`);
      expect(req.request.method).toBe('GET');
      req.flush('{"key":"value"}');

      expect(result).toBe('{"key":"value"}');
    });

    it('should GET text content for a template by ID', () => {
      let result: string | undefined;
      service.getResourceById('template', 2).subscribe(c => (result = c));

      const req = httpMock.expectOne(`${baseUrl}/template/2`);
      expect(req.request.method).toBe('GET');
      req.flush('@prefix ex: <http://example.com/>.');

      expect(result).toBe('@prefix ex: <http://example.com/>.');
    });
  });

  // ── getResourceByNameAndVersion ────────────────────────────────────────────

  describe('getResourceByNameAndVersion', () => {
    it('should GET content with name and version in URL', () => {
      let result: string | undefined;
      service.getResourceByNameAndVersion('schema', 'my-schema', '1.0').subscribe(c => (result = c));

      const req = httpMock.expectOne(`${baseUrl}/schema/my-schema/1.0`);
      expect(req.request.method).toBe('GET');
      req.flush('{}');

      expect(result).toBe('{}');
    });
  });

  // ── search ─────────────────────────────────────────────────────────────────

  describe('search', () => {
    it('should GET without query params when none provided', () => {
      let result: PagedResult<ResourceMetadata> | undefined;
      service.search('schema').subscribe(r => (result = r));

      const req = httpMock.expectOne(`${baseUrl}/schema`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPagedResult);

      expect(result).toEqual(mockPagedResult);
    });

    it('should append name, version and description as query params', () => {
      service.search('schema', { name: 'my-schema', version: '1.0', description: 'test' }).subscribe();

      const req = httpMock.expectOne(r =>
        r.url === `${baseUrl}/schema` &&
        r.params.get('name') === 'my-schema' &&
        r.params.get('version') === '1.0' &&
        r.params.get('description') === 'test',
      );
      req.flush(mockPagedResult);
    });

    it('should append offset and limit as query params', () => {
      service.search('template', { offset: 10, limit: 5 }).subscribe();

      const req = httpMock.expectOne(r =>
        r.url === `${baseUrl}/template` &&
        r.params.get('offset') === '10' &&
        r.params.get('limit') === '5',
      );
      req.flush({ elements: [], totalElements: 0, pageSize: 5 });
    });

    it('should omit undefined params', () => {
      service.search('schema', { name: undefined, offset: 0, limit: 10 }).subscribe();

      const req = httpMock.expectOne(r =>
        r.url === `${baseUrl}/schema` &&
        !r.params.has('name') &&
        r.params.get('offset') === '0' &&
        r.params.get('limit') === '10',
      );
      req.flush(mockPagedResult);
    });
  });

  // ── deleteResource ─────────────────────────────────────────────────────────

  describe('deleteResource', () => {
    it('should DELETE to the correct URL', () => {
      let completed = false;
      service.deleteResource('schema', 1).subscribe(() => (completed = true));

      const req = httpMock.expectOne(`${baseUrl}/schema/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);

      expect(completed).toBeTrue();
    });

    it('should DELETE a template by ID', () => {
      service.deleteResource('template', 7).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/template/7`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
