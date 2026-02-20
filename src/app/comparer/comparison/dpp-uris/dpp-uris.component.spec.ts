import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DppUrisComponent } from './dpp-uris.component';

describe('DppUrisComponent', () => {
  let component: DppUrisComponent;
  let fixture: ComponentFixture<DppUrisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DppUrisComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DppUrisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
