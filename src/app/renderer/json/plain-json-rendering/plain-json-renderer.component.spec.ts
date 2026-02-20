import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlainJsonRendererComponent } from './plain-json-renderer.component';

describe('PlainJsonRenderingComponent', () => {
  let component: PlainJsonRendererComponent;
  let fixture: ComponentFixture<PlainJsonRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlainJsonRendererComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(PlainJsonRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
