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

import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { ExtractionRequest, ExtractionResponse } from '../comparer/comparison/comparison.model';
import { OntologyJsonLd } from '../comparer/selector/ontology-tree.model';
import { FieldMapping } from '../comparer/selector/ontology-tree/ontology-tree.component';

const extractor = environment.backendUrl.concat("/comparison/v1")

const fetch = environment.backendUrl.concat("/fetch/v1")

/**
 * Service for extracting and comparing properties from multiple DPP sources.
 * Handles ontology fetching and property extraction for comparison features.
 */
@Injectable({
  providedIn: 'root'
})
export class ExtractorService {

  constructor(private http: HttpClient) { }

  /**
   * Extracts specified properties from multiple DPP URLs for comparison.
   * @param dppUris Array of DPP URLs to extract data from
   * @param properties Field mapping containing property paths to extract
   * @returns Observable of extraction response with property data
   */
  extractProperties(dppUris: string[], properties: FieldMapping): Observable<ExtractionResponse> {
    let payload = {
      dppUrls: dppUris,
      propertyPaths: properties.propertyPaths
    } as ExtractionRequest
    return this.http.post<ExtractionResponse>(extractor, payload)
  }

  fetchOntology(ontologyUrl: string): Observable<OntologyJsonLd> {
    let params = new HttpParams();
    params = params.append("url", ontologyUrl)
    let headers = new HttpHeaders();
    headers = headers.append("Accept", "application/ld+json")
    return this.http.get<OntologyJsonLd>(fetch, { params: params, headers: headers })
  }
}
