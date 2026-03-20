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

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { PagedResult, SearchRequest } from './search-models';

const searchUrl = environment.backendUrl + "/search/v1"

/**
 * Service for performing searches against the DPP backend API.
 * Handles search requests with filters and pagination.
 */
@Injectable({
  providedIn: 'root'
})
export class SearchService {

  constructor(private http: HttpClient) { }

  /**
   * Executes a search request against the DPP search API.
   * @param request The search request containing filters and pagination parameters
   * @returns Observable of paged search results
   */
  public search(request: SearchRequest): Observable<PagedResult> {
    return this.http.post<PagedResult>(searchUrl, request)
  }
}
