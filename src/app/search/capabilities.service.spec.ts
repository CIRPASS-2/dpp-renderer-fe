import { TestBed } from '@angular/core/testing';

import { CapabilitiesService } from './capabilities.service';

describe('CapabilitiesService', () => {
  let service: CapabilitiesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CapabilitiesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
