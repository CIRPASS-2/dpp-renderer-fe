import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DppComparisonComponent } from './dpp-comparison.component';

describe('DppComparisonComponent', () => {
  let component: DppComparisonComponent;
  let fixture: ComponentFixture<DppComparisonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DppComparisonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DppComparisonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
