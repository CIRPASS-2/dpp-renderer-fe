import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubstanceRendererComponent } from './substance-renderer.component';

describe('SubstanceRendererComponent', () => {
  let component: SubstanceRendererComponent;
  let fixture: ComponentFixture<SubstanceRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubstanceRendererComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubstanceRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
