import { TestBed } from '@angular/core/testing';

import { OntologyTreeService } from './ontology-tree.service';

describe('OntologyTreeService', () => {
  let service: OntologyTreeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OntologyTreeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
