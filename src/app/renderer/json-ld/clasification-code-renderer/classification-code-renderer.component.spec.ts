import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClassificationCodeRendererComponent } from './classification-code-renderer.component';

describe('ClasificationCodeRendererComponent', () => {
  let component: ClassificationCodeRendererComponent;
  let fixture: ComponentFixture<ClassificationCodeRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClassificationCodeRendererComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ClassificationCodeRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
