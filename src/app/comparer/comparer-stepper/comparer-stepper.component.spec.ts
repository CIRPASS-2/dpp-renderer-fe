import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComparerStepperComponent } from './comparer-stepper.component';

describe('ComparerStepperComponent', () => {
  let component: ComparerStepperComponent;
  let fixture: ComponentFixture<ComparerStepperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComparerStepperComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComparerStepperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
