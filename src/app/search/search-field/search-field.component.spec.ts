import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { FieldType, FilterOp, RenderableSearchField, SearchFilter } from '../search-models';
import { SearchFieldComponent } from './search-field.component';

describe('SearchFieldComponent', () => {
  let component: SearchFieldComponent;
  let fixture: ComponentFixture<SearchFieldComponent>;

  const mockStringField: RenderableSearchField = {
    fieldLabel: 'Product Name',
    fieldName: 'productName',
    fieldType: FieldType.STRING,
    availableOps: ['=', '≈'],
    literal: ''
  };

  const mockNumberField: RenderableSearchField = {
    fieldLabel: 'Price',
    fieldName: 'price',
    fieldType: FieldType.DECIMAL,
    availableOps: ['=', '<', '>', '<=', '>='],
    literal: ''
  };

  const mockBooleanField: RenderableSearchField = {
    fieldLabel: 'Active',
    fieldName: 'isActive',
    fieldType: FieldType.BOOLEAN,
    availableOps: ['='],
    literal: ''
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchFieldComponent, ReactiveFormsModule]
    })
      .compileComponents();

    fixture = TestBed.createComponent(SearchFieldComponent);
    component = fixture.componentInstance;

    // Set a default renderable field
    fixture.componentRef.setInput('renderableField', mockStringField);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form controls', () => {
    expect(component.form.get('op')).toBeTruthy();
    expect(component.form.get('literal')).toBeTruthy();
  });

  it('should build filter correctly for string field', () => {
    component.form.patchValue({ op: '=', literal: 'test value' });
    const filter = (component as any).buildFilter();

    expect(filter).toBeTruthy();
    expect(filter.property).toBe('productName');
    expect(filter.op).toBe(FilterOp.EQ);
    expect(filter.literal).toBe("'test value'");
  });

  it('should build filter correctly for numeric field', () => {
    fixture.componentRef.setInput('renderableField', mockNumberField);
    component.ngOnChanges();
    component.form.patchValue({ op: '>', literal: '100' });

    const filter = (component as any).buildFilter();

    expect(filter).toBeTruthy();
    expect(filter.property).toBe('price');
    expect(filter.op).toBe(FilterOp.GT);
    expect(filter.literal).toBe('100');
  });

  it('should convert FilterOp to string correctly', () => {
    const testFilter: SearchFilter = {
      property: 'test',
      op: FilterOp.LIKE,
      literal: 'value'
    };

    const stringOp = component.toStringOp(testFilter);
    expect(stringOp).toBe('LIKE');
  });

  it('should convert string to FilterOp correctly', () => {
    expect((component as any).toFilterOp('>')).toBe(FilterOp.GT);
    expect((component as any).toFilterOp('<')).toBe(FilterOp.LT);
    expect((component as any).toFilterOp('>=')).toBe(FilterOp.GTE);
    expect((component as any).toFilterOp('<=')).toBe(FilterOp.LTE);
    expect((component as any).toFilterOp('≈')).toBe(FilterOp.LIKE);
    expect((component as any).toFilterOp('=')).toBe(FilterOp.EQ);
  });

  it('should handle boolean field correctly', () => {
    fixture.componentRef.setInput('renderableField', mockBooleanField);
    component.ngOnChanges();
    component.form.patchValue({ literal: 'true' });

    const filter = (component as any).buildFilter();

    expect(filter).toBeTruthy();
    expect(filter.property).toBe('isActive');
    expect(filter.literal).toBe('true');
  });

  it('should return null filter for incomplete form', () => {
    component.form.patchValue({ op: null, literal: null });
    const filter = (component as any).buildFilter();
    expect(filter).toBeNull();
  });

  it('should validate form correctly', () => {
    // Test when form is invalid by setting invalid values
    component.form.patchValue({ literal: '' }); // Empty string should make it invalid
    component.form.markAsTouched(); // Make sure validation runs

    const result = component.validate(null as any);
    const isInvalid = component.form.invalid;

    if (isInvalid) {
      expect(result).toBeTruthy(); // Validation error should be present
    } else {
      expect(result).toBeNull(); // No validation error
    }
  });
});
