import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacilityRendererComponent } from './facility-renderer.component';

describe('FacilityRendererComponent', () => {
  let component: FacilityRendererComponent;
  let fixture: ComponentFixture<FacilityRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacilityRendererComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacilityRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
