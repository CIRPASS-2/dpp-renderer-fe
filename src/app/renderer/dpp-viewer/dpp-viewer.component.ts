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
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { DppFetchResult, DppFetchService, DppJsonLdResult, DppJsonResult } from '../../common/dpp-fetch.service';
import { ScannerComponent } from '../../common/scanner/scanner.component';
import { DppRendererComponent } from '../json-ld/dpp-renderer/dpp-renderer.component';
import { PlainJsonRendererComponent } from '../json/plain-json-rendering/plain-json-renderer.component';
import { ExpandedJsonLd, JsonObject } from '../rendering-models';

/**
 * Component for viewing and rendering Digital Product Passport (DPP) data.
 * Supports both JSON and JSON-LD formats with integrated URL input and QR code scanning.
 */
@Component({
  selector: 'app-dpp-viewer',
  imports: [FormsModule, InputTextModule, DividerModule, TooltipModule, ButtonModule, PlainJsonRendererComponent, DppRendererComponent, ScannerComponent],
  templateUrl: './dpp-viewer.component.html',
  styleUrl: './dpp-viewer.component.css'
})
export class DppViewerComponent implements OnInit {

  url?: string

  fetchResult?: DppFetchResult

  showScanner: boolean = false

  constructor(private route: ActivatedRoute, private fetchService: DppFetchService) { }
  ngOnInit(): void {
    this.route.queryParams.subscribe(p => {
      this.url = p['url']
      if (this.url) this.fetchService.fetch(this.url).subscribe(r => this.fetchResult = r)
    });
  }


  /**
   * Fetches DPP data from the current URL.
   */
  fetch() {
    if (this.url) this.fetchService.fetch(this.url).subscribe(r => this.fetchResult = r)
  }

  /**
   * Checks if a URL is currently set.
   * @returns True if URL is available, false otherwise
   */
  hasUrl(): boolean {
    return this.url !== undefined && this.url !== null
  }

  /**
   * Opens the QR code scanner interface.
   */
  openScanner() {
    this.showScanner = true
  }

  onScanCompleted(event: any) {
    if (event) {
      this.url = event
    }
    this.showScanner = false
  }


  onDoneScanner() {
    this.showScanner = false
  }

  get asJsonLd(): ExpandedJsonLd {
    return (this.fetchResult as DppJsonLdResult).data;
  }

  get asJson(): JsonObject {
    return (this.fetchResult as DppJsonResult).data;
  }

}
