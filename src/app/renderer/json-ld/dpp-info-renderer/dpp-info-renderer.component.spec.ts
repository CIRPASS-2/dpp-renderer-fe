import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DppInfoRendererComponent } from './dpp-info-renderer.component';

describe('DppInfoRendererComponent', () => {
  let component: DppInfoRendererComponent;
  let fixture: ComponentFixture<DppInfoRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DppInfoRendererComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DppInfoRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
