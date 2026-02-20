import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DppRendererComponent } from './dpp-renderer.component';

describe('DppRendererComponent', () => {
  let component: DppRendererComponent;
  let fixture: ComponentFixture<DppRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DppRendererComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DppRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
