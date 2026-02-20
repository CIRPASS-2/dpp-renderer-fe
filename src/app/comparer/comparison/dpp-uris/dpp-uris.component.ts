import { CommonModule } from '@angular/common';
import { Component, EventEmitter, input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { ScannerComponent } from '../../../common/scanner/scanner.component';

interface UrlInput {
  id: number;
  value: string;
}

@Component({
  selector: 'app-dpp-uris',
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, TooltipModule, ScannerComponent],
  templateUrl: './dpp-uris.component.html',
  styleUrl: './dpp-uris.component.css'
})
export class DppUrisComponent implements OnInit, OnChanges {

  urlInputs!: UrlInput[];

  existing = input<string[]>([""])

  showScanner: boolean = false

  private nextId = 0;

  @Output()
  urlsSubmitted: EventEmitter<string[]> = new EventEmitter<string[]>()

  ngOnInit(): void {
    this.initializeUrls()
  }
  ngOnChanges(changes: SimpleChanges): void {
    this.initializeUrls()
  }

  initializeUrls(): void {
    const urls = this.existing()
    this.urlInputs = urls.map(u => ({
      id: this.nextId++,
      value: u
    }))
  }


  addUrlInput(): void {
    this.addUrlInputWithValue('')
  }

  addUrlInputWithValue(value: string): void {

    this.urlInputs.push({
      id: this.nextId++,
      value: value
    });
  }

  removeUrlInput(id: number): void {
    if (this.urlInputs.length > 1) {
      this.urlInputs = this.urlInputs.filter(input => input.id !== id);
    }
  }


  onSubmit(): void {
    const urls = this.urlInputs
      .map(input => input?.value?.trim())
      .filter(url => url !== '');
    this.urlsSubmitted.emit(urls)
  }


  hasValidUrls(): boolean {
    return this.urlInputs.filter(input => input?.value != null && input?.value != undefined && input.value.trim() !== '').length > 1
  }


  getValidUrlCount(): number {
    return this.urlInputs.filter(input => input?.value != undefined && input?.value != null && input.value.trim() !== '').length;
  }


  trackByFn(index: number, item: UrlInput): number {
    return item.id;
  }

  onDoneScanner() {
    this.showScanner = false
  }

  openScanner() {
    this.showScanner = true
  }

  onScanCompleted(event: any) {
    if (event) {
      this.addUrlInputWithValue(event)
    }
    this.showScanner = false
  }
}
