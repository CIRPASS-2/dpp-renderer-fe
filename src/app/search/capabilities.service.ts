import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SearchField } from './search-models';

const capabilities = environment.capabilitiesUrl.concat("/capabilities/v1")
@Injectable({
  providedIn: 'root'
})
export class CapabilitiesService {

  constructor(private http:HttpClient) { }

  public getCapabilities(): Observable<SearchField[]> {
    return this.http.get<SearchField[]>(capabilities)
  }
}
