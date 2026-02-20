import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OntologyTreeComponent } from './ontology-tree.component';

describe('OntologyTreeComponent', () => {
  let component: OntologyTreeComponent;
  let fixture: ComponentFixture<OntologyTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OntologyTreeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OntologyTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
