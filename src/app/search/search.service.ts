import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { PagedResult, SearchRequest } from './search-models';

const searchUrl = environment.backendUrl + "/search/v1"
@Injectable({
  providedIn: 'root'
})
export class SearchService {

  constructor(private http: HttpClient) { }

  public search(request: SearchRequest): Observable<PagedResult> {
    return this.http.post<PagedResult>(searchUrl, request)
  }
}
