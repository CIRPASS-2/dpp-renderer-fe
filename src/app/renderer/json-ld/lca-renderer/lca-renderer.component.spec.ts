import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LcaRendererComponent } from './lca-renderer.component';

describe('LcaRendererComponent', () => {
  let component: LcaRendererComponent;
  let fixture: ComponentFixture<LcaRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LcaRendererComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LcaRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
