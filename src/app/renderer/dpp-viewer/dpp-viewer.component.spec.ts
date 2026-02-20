import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DppViewerComponent } from './dpp-viewer.component';

describe('DppViewerComponent', () => {
  let component: DppViewerComponent;
  let fixture: ComponentFixture<DppViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DppViewerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DppViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
