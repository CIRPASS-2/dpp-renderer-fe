import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuantitativePropertyRendererComponent } from './quantitative-property-renderer.component';

describe('QuantitativePropertyRendererComponent', () => {
  let component: QuantitativePropertyRendererComponent;
  let fixture: ComponentFixture<QuantitativePropertyRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuantitativePropertyRendererComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuantitativePropertyRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
