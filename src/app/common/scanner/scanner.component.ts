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

import { Component, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { ZXingScannerComponent, ZXingScannerModule } from '@zxing/ngx-scanner';
import { ButtonModule } from 'primeng/button';

const regex = new RegExp(/^(http|https):\/\/[^\s/$.?#].[^\s]*$/i);

/**
 * QR code and barcode scanner component using device camera.
 * Validates scanned URLs and emits valid results to parent components.
 */
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

  /**
   * Handles camera not found scenario.
   * Stops scanner and emits completion event.
   */
  onCameraNotFound() {
    this.scanner?.scanStop()
    this.scanCompleted.emit()
    console.log("No camera found on device")
  }

  /**
   * Processes successful scan results.
   * Validates URL format before emitting the result.
   * @param res The scanned text result
   */
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
