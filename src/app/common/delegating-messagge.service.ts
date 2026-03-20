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

import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

/**
 * Service for displaying user messages and notifications.
 * Wraps PrimeNG MessageService to provide standardized message display.
 */
@Injectable({
  providedIn: 'root'
})
export class DelegatingMessaggeService {

  constructor(private messageService: MessageService) { }

  /**
   * Displays an information message to the user.
   * @param message The information message to display
   */
  public info(message: string): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Info',
      detail: message
    })
  }

  /**
   * Displays an error message to the user.
   * @param message The error message to display
   */
  public error(message: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Operation resulted in an error',
      detail: message
    })
  }

  public success(message: string): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Operation was successful',
      detail: message
    })
  }

}
