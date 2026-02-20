import { TestBed } from '@angular/core/testing';

import { DppFetchService } from './dpp-fetch.service';

describe('DppFetchService', () => {
  let service: DppFetchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DppFetchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
