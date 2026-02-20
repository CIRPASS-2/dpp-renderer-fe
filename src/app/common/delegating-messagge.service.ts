import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class DelegatingMessaggeService {

  constructor(private messageService: MessageService) { }

  public info(message: string): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Info',
      detail: message
    })
  }

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
