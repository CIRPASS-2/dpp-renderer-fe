import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActorRendererComponent } from './actor-renderer.component';

describe('ActorRendererComponent', () => {
  let component: ActorRendererComponent;
  let fixture: ComponentFixture<ActorRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActorRendererComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActorRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
