import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { ExtractionRequest, ExtractionResponse } from '../comparer/comparison/comparison.model';
import { OntologyJsonLd, PropertySelection } from '../comparer/selector/ontology-tree.model';

const extractor = environment.backendUrl.concat("/comparison/v1")

const fetch = environment.backendUrl.concat("/fetch/v1")

@Injectable({
  providedIn: 'root'
})
export class ExtractorService {

  constructor(private http: HttpClient) { }

  extractProperties(dppUris: string[], properties: PropertySelection): Observable<ExtractionResponse> {
    let payload = {
      dppUrls: dppUris,
      propertyPaths: properties.selectedPaths
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
