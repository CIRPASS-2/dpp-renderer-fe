import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AbstractRendererComponent } from './abstract-renderer.component';

describe('AbstractRendererComponent', () => {
  let component: AbstractRendererComponent;
  let fixture: ComponentFixture<AbstractRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AbstractRendererComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AbstractRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
