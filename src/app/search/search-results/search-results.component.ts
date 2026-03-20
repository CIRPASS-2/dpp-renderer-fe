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

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { LabelPipe } from '../../common/label-pipe';
import { CapabilitiesService } from '../capabilities.service';
import { SearchFiltersComponent } from '../search-filters/search-filters.component';
import { SearchField, SearchFilter, SearchRequest, SearchResult } from '../search-models';
import { SearchService } from '../search.service';

@Component({
  selector: 'app-search-results',
  imports: [LabelPipe, TableModule, ButtonModule, TagModule, SearchFiltersComponent],
  templateUrl: './search-results.component.html',
  styleUrl: './search-results.component.css'
})
export class SearchResultsComponent implements OnInit {

  currSearchReq!: SearchRequest
  totalElements!: number
  elements!: SearchResult[]
  capabilities!: SearchField[]

  constructor(private searchService: SearchService, private capabilitiesService: CapabilitiesService, private router: Router) { }


  ngOnInit(): void {
    this.currSearchReq = this.buildFilter([])
    this.capabilitiesService.getCapabilities().subscribe(c => this.capabilities = c)
    this.search(this.currSearchReq)
  }


  buildFilter(filters: SearchFilter[]): SearchRequest {
    return {
      filters: filters && filters.length > 0 ? filters : null,
      offset: 0,
      limit: 10
    }
  }

  doSearch(event: any) {
    let request = {
      filters: event,
      offset: 0,
      limit: 10
    } as SearchRequest
    this.search(request)
  }

  search(searchReq: SearchRequest) {
    this.searchService.search(searchReq).subscribe(pr => {
      this.totalElements = pr.count
      this.elements = pr.elements
    })
  }

  pageChange(page: any) {
    this.currSearchReq.limit = page.rows
    this.currSearchReq.offset = page.first
    this.search(this.currSearchReq)
  }

  details(liveUrl: string) {
    this.router.navigate(["view"], { queryParams: { url: liveUrl } })
  }

  get dataKeys(): string[] {
    if (!this.capabilities?.length) return [];
    return this.capabilities.filter(f => f.dependsOn === null || f.dependsOn === undefined || f.dependsOn === '').map(f => f.fieldName);
  }

  retrieveTableValue(entry: SearchResult, key: string): string {
    let value = String(entry.data[key])
    let dependant = this.capabilities.filter(f => f.dependsOn === key)
    if (dependant.length > 0) {
      for (let d of dependant) {
        let dep = entry.data[d.fieldName]
        if (dep) value += ' ' + String(dep)
      }
    }
    return value
  }

}
