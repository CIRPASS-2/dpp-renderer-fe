import { TestBed } from '@angular/core/testing';

import { DelegatingMessaggeService } from './delegating-messagge.service';

describe('DelegatingMessaggeService', () => {
  let service: DelegatingMessaggeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DelegatingMessaggeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
