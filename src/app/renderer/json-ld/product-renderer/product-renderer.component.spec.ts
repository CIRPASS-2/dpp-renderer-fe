import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductRendererComponent } from './product-renderer.component';

describe('ProductRendererComponent', () => {
  let component: ProductRendererComponent;
  let fixture: ComponentFixture<ProductRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductRendererComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
