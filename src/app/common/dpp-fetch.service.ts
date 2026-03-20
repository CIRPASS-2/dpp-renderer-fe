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

import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, of, switchMap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ExpandedJsonLd, JsonObject } from '../renderer/rendering-models';


export type DppPayloadKind = 'json' | 'jsonld';

export interface DppJsonResult {
  kind: 'json';
  data: JsonObject;
  contentType: string;
}

export interface DppJsonLdResult {
  kind: 'jsonld';
  data: ExpandedJsonLd;
  contentType: string;
}

export type DppFetchResult = DppJsonResult | DppJsonLdResult;


export class DppFetchError extends Error {
  constructor(
    message: string,
    public override readonly cause?: unknown,
    public readonly httpStatus?: number,
  ) {
    super(message);
    this.name = 'DppFetchError';
  }
}

export class UnsupportedContentTypeError extends DppFetchError {
  constructor(public readonly receivedContentType: string) {
    super(`Unsupported content type: "${receivedContentType}". Expected application/json or application/ld+json.`);
    this.name = 'UnsupportedContentTypeError';
  }
}

/**
 * Service for fetching Digital Product Passport (DPP) data from remote URLs.
 * Supports both plain JSON and JSON-LD content types with automatic content type detection.
 * Handles network errors and provides typed results based on content type.
 */
@Injectable({
  providedIn: 'root'
})
export class DppFetchService {

  private static readonly FETCH_PATH = '/fetch/v1';

  constructor(private http: HttpClient) { }

  /**
   * Fetches a DPP from `{host}/fetch/v1`.
   * The server is expected to return already-expanded JSON-LD.
   *
   * - `application/json`    → DppJsonResult   (plain JSON, use PlainJsonRendererComponent)
   * - `application/ld+json` → DppJsonLdResult (expanded JSON-LD, use DppRendererComponent)
   *
   * Throws DppFetchError on HTTP errors or unsupported content types.
   */
  fetch(dppUrl: string): Observable<DppFetchResult> {
    const url = `${environment.backendUrl}${DppFetchService.FETCH_PATH}`;
    let params = new HttpParams();
    params = params.append("url", dppUrl)
    return this.http
      .get<unknown>(url, {
        headers: new HttpHeaders({
          Accept: 'application/ld+json, application/json;q=0.9',
        }),
        params: params,
        observe: 'response',
        responseType: 'json',
      })
      .pipe(
        switchMap((response): Observable<DppFetchResult> => {
          const rawContentType = response.headers.get('Content-Type') ?? '';
          const contentType = this.parseContentType(rawContentType);
          const body = response.body;

          if (contentType === 'application/ld+json') {
            return of({
              kind: 'jsonld',
              data: body as ExpandedJsonLd,
              contentType: rawContentType,
            });
          }

          if (contentType === 'application/json') {
            return of({
              kind: 'json',
              data: body as JsonObject,
              contentType: rawContentType,
            });
          }

          return throwError(() => new UnsupportedContentTypeError(rawContentType));
        }),
        catchError(err => {
          if (err instanceof DppFetchError) return throwError(() => err);

          if (err instanceof HttpErrorResponse) {
            return throwError(() => new DppFetchError(
              `HTTP ${err.status}: ${err.statusText}`,
              err,
              err.status,
            ));
          }

          return throwError(() => new DppFetchError(
            `Unexpected error while fetching DPP`,
            err,
          ));
        }),
      );
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  /** Strips parameters (e.g. charset) and returns the bare media type */
  private parseContentType(raw: string): string {
    return raw.split(';')[0].trim().toLowerCase();
  }

  /** Ensures host has no trailing slash */
  private normalizeHost(host: string): string {
    return host.endsWith('/') ? host.slice(0, -1) : host;
  }

}