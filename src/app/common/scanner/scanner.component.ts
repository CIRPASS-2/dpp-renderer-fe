import { Component, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { ZXingScannerComponent, ZXingScannerModule } from '@zxing/ngx-scanner';
import { ButtonModule } from 'primeng/button';

const regex = new RegExp(/^(http|https):\/\/[^\s/$.?#].[^\s]*$/i);
@Component({
  selector: 'app-scanner',
  imports: [ZXingScannerModule, ButtonModule],
  templateUrl: './scanner.component.html',
  styleUrl: './scanner.component.css'
})
export class ScannerComponent implements OnDestroy {
  @ViewChild('scanner', { static: false })
  scanner!: ZXingScannerComponent;

  @Output()
  scanCompleted: EventEmitter<string> = new EventEmitter<string>();

  @Output()
  done: EventEmitter<void> = new EventEmitter<void>()
  constructor() { }

  private scanTimeout: any;



  onScanFailure(event: any) {
    if (!this.scanTimeout) {
      this.scanTimeout = setTimeout(() => {
        console.log("Unable to scan the code");
        this.scanTimeout = null;
      }, 5000);
    }
  }

  onCameraNotFound() {
    this.scanner?.scanStop()
    this.scanCompleted.emit()
    console.log("No camera found on device")
  }

  onScanComplete(res: any) {
    if (this.isValidUrl(res)) {
      this.scanCompleted.emit(res)
    }
  }

  ngOnDestroy(): void {
    this.scanner?.scanStop();
    this.scanCompleted.emit()
  }

  isValidUrl(value: any): boolean {
    return value != null && value != undefined && typeof value === 'string' && regex.test(value)
  }

  onDone() {
    this.scanner?.scanStop()
    this.done.emit()
  }
}
