import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { DppFetchResult, DppFetchService, DppJsonLdResult, DppJsonResult } from '../../common/dpp-fetch.service';
import { ScannerComponent } from '../../common/scanner/scanner.component';
import { DppRendererComponent } from '../json-ld/dpp-renderer/dpp-renderer.component';
import { PlainJsonRendererComponent } from '../json/plain-json-rendering/plain-json-renderer.component';
import { ExpandedJsonLd, JsonObject } from '../rendering-models';

@Component({
  selector: 'app-dpp-viewer',
  imports: [FormsModule, InputTextModule, TooltipModule, ButtonModule, PlainJsonRendererComponent, DppRendererComponent, ScannerComponent],
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


  fetch() {
    if (this.url) this.fetchService.fetch(this.url).subscribe(r => this.fetchResult = r)
  }

  hasUrl(): boolean {
    return this.url !== undefined && this.url !== null
  }

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
