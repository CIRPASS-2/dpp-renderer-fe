import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { DelegatingMessaggeService } from './delegating-messagge.service';

describe('DelegatingMessaggeService', () => {
  let service: DelegatingMessaggeService;
  let messageServiceSpy: jasmine.SpyObj<MessageService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('MessageService', ['add']);

    TestBed.configureTestingModule({
      providers: [
        DelegatingMessaggeService,
        { provide: MessageService, useValue: spy }
      ]
    });

    service = TestBed.inject(DelegatingMessaggeService);
    messageServiceSpy = TestBed.inject(MessageService) as jasmine.SpyObj<MessageService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('info method', () => {
    it('should call MessageService.add with info severity', () => {
      const testMessage = 'This is an info message';

      service.info(testMessage);

      expect(messageServiceSpy.add).toHaveBeenCalledWith({
        severity: 'info',
        summary: 'Info',
        detail: testMessage
      });
    });

    it('should handle empty message', () => {
      const emptyMessage = '';

      service.info(emptyMessage);

      expect(messageServiceSpy.add).toHaveBeenCalledWith({
        severity: 'info',
        summary: 'Info',
        detail: emptyMessage
      });
    });

    it('should handle long message', () => {
      const longMessage = 'This is a very long message that contains a lot of text to test how the service handles lengthy information messages that might be displayed to users';

      service.info(longMessage);

      expect(messageServiceSpy.add).toHaveBeenCalledWith({
        severity: 'info',
        summary: 'Info',
        detail: longMessage
      });
    });
  });

  describe('error method', () => {
    it('should call MessageService.add with error severity', () => {
      const testMessage = 'This is an error message';

      service.error(testMessage);

      expect(messageServiceSpy.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Operation resulted in an error',
        detail: testMessage
      });
    });

    it('should handle error message', () => {
      const errorMessage = 'Failed to fetch data from server';

      service.error(errorMessage);

      expect(messageServiceSpy.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Operation resulted in an error',
        detail: errorMessage
      });
    });

    it('should handle technical error message', () => {
      const technicalError = 'HTTP 500: Internal Server Error - Database connection failed';

      service.error(technicalError);

      expect(messageServiceSpy.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Operation resulted in an error',
        detail: technicalError
      });
    });
  });

  describe('success method', () => {
    it('should call MessageService.add with success severity', () => {
      const testMessage = 'This is a success message';

      service.success(testMessage);

      expect(messageServiceSpy.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Operation was successful',
        detail: testMessage
      });
    });

    it('should handle success message', () => {
      const successMessage = 'Data saved successfully';

      service.success(successMessage);

      expect(messageServiceSpy.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Operation was successful',
        detail: successMessage
      });
    });

    it('should handle completion message', () => {
      const completionMessage = 'DPP comparison completed successfully';

      service.success(completionMessage);

      expect(messageServiceSpy.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Operation was successful',
        detail: completionMessage
      });
    });
  });

  describe('multiple calls', () => {
    it('should handle multiple message calls in sequence', () => {
      service.info('First info message');
      service.error('An error occurred');
      service.success('Operation completed');

      expect(messageServiceSpy.add).toHaveBeenCalledTimes(3);
      expect(messageServiceSpy.add.calls.argsFor(0)[0]).toEqual({
        severity: 'info',
        summary: 'Info',
        detail: 'First info message'
      });
      expect(messageServiceSpy.add.calls.argsFor(1)[0]).toEqual({
        severity: 'error',
        summary: 'Operation resulted in an error',
        detail: 'An error occurred'
      });
      expect(messageServiceSpy.add.calls.argsFor(2)[0]).toEqual({
        severity: 'success',
        summary: 'Operation was successful',
        detail: 'Operation completed'
      });
    });
  });
});
