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

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  PagedResult,
  PayloadType,
  ResourceMetadata,
  ResourceSearchParams,
  ResourceType,
} from './validator-models';

/**
 * Service for interacting with the validation-resource REST API (`/resource/v1`).
 * Covers upload, retrieval, search and deletion of validation resources
 * (JSON schemas and RDF templates).
 */
@Injectable({
  providedIn: 'root',
})
export class ValidatorServiceService {

  private readonly baseUrl = environment.validatorUrl + '/resource/v1';

  constructor(private http: HttpClient) { }

  /**
   * Uploads a new validation resource.
   *
   * Maps to: POST /resource/v1/{payloadType}
   *
   * @param payloadType The serialisation format of the uploaded file.
   * @param file        The resource file to upload.
   * @param metadata    Resource metadata sent as a JSON part.
   * @returns Observable emitting the numeric ID assigned to the new resource.
   */
  addResource(
    payloadType: PayloadType,
    file: File,
    metadata: ResourceMetadata,
  ): Observable<number> {
    const formData = new FormData();
    formData.append('file', file);
    const metaBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
    formData.append('meta', metaBlob);
    return this.http.post<number>(`${this.baseUrl}/${payloadType}`, formData);
  }

  /**
   * Retrieves the raw content of a validation resource by its numeric ID.
   *
   * Maps to: GET /resource/v1/{resourceType}/{id}
   */
  getResourceById(resourceType: ResourceType, id: number): Observable<string> {
    return this.http.get(`${this.baseUrl}/${resourceType}/${id}`, {
      responseType: 'text',
    });
  }

  /**
   * Retrieves the raw content of a validation resource by name and version.
   *
   * Maps to: GET /resource/v1/{resourceType}/{resourceName}/{resourceVersion}
   */
  getResourceByNameAndVersion(
    resourceType: ResourceType,
    name: string,
    version: string,
  ): Observable<string> {
    return this.http.get(`${this.baseUrl}/${resourceType}/${name}/${version}`, {
      responseType: 'text',
    });
  }

  /**
   * Searches validation resources of the given type using optional filters and pagination.
   *
   * Maps to: GET /resource/v1/{resourceType}
   */
  search(
    resourceType: ResourceType,
    params: ResourceSearchParams = {},
  ): Observable<PagedResult<ResourceMetadata>> {
    let httpParams = new HttpParams();
    if (params.name) httpParams = httpParams.set('name', params.name);
    if (params.description) httpParams = httpParams.set('description', params.description);
    if (params.version) httpParams = httpParams.set('version', params.version);
    if (params.offset !== undefined) httpParams = httpParams.set('offset', params.offset);
    if (params.limit !== undefined) httpParams = httpParams.set('limit', params.limit);
    return this.http.get<PagedResult<ResourceMetadata>>(
      `${this.baseUrl}/${resourceType}`,
      { params: httpParams },
    );
  }

  /**
   * Deletes a validation resource by its numeric ID.
   *
   * Maps to: DELETE /resource/v1/{resourceType}/{id}
   */
  deleteResource(resourceType: ResourceType, id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${resourceType}/${id}`);
  }
}
