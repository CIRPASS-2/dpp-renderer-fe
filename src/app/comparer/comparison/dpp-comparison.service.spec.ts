import { TestBed } from '@angular/core/testing';

import { DppComparisonService } from './dpp-comparison.service';

describe('DppComparisonService', () => {
  let service: DppComparisonService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DppComparisonService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
