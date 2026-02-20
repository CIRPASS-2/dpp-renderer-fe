import { TestBed } from '@angular/core/testing';

import { OntologyRegistryService } from './ontology-registry.service';

describe('OntologyRegistryService', () => {
  let service: OntologyRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OntologyRegistryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
