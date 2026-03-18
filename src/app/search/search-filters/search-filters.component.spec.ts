import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { FieldType, FilterOp, SearchField, SearchFilter } from '../search-models';
import { SearchFiltersComponent } from './search-filters.component';

describe('SearchFiltersComponent', () => {
  let component: SearchFiltersComponent;
  let fixture: ComponentFixture<SearchFiltersComponent>;
  let formBuilder: FormBuilder;

  const mockCapabilities: SearchField[] = [
    { fieldName: 'productName', dependsOn: '', targetType: FieldType.STRING },
    { fieldName: 'price', dependsOn: '', targetType: FieldType.DECIMAL },
    { fieldName: 'category', dependsOn: '', targetType: FieldType.STRING }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchFiltersComponent, ReactiveFormsModule],
      providers: [
        provideNoopAnimations()
      ]
    })
      .compileComponents();

    formBuilder = TestBed.inject(FormBuilder);
    fixture = TestBed.createComponent(SearchFiltersComponent);
    component = fixture.componentInstance;

    // Set up capabilities input signal
    fixture.componentRef.setInput('capabilities', mockCapabilities);

    // Manually trigger ngOnChanges to initialize the form
    component.ngOnChanges({ capabilities: { currentValue: mockCapabilities, previousValue: undefined, firstChange: true } } as any);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize renderable fields from capabilities', () => {
    // Ensure form is initialized before testing
    if (!component.filterForm) {
      component.init();
    }

    component.ngOnChanges({ capabilities: { currentValue: mockCapabilities } } as any);
    expect(component.renderableFields.length).toBe(3);
    expect(component.renderableFields[0].fieldLabel).toContain('Product Name');
    expect(component.renderableFields[0].fieldType).toBe(FieldType.STRING);
  });

  it('should emit search filters on submit', () => {
    spyOn(component.onSearch, 'emit');
    const mockFilters: SearchFilter[] = [
      { property: 'productName', op: FilterOp.EQ, literal: 'test' }
    ];

    // Mock the form and filtersArray
    const mockForm = {
      get: jasmine.createSpy().and.returnValue({
        value: [mockFilters[0], null]
      })
    };
    component.filterForm = mockForm as any;

    component.onSubmit();

    expect(component.onSearch.emit).toHaveBeenCalledWith([mockFilters[0]]);
  });

  it('should generate correct operations for different field types', () => {
    const stringOps = (component as any).opsFromType(FieldType.STRING);
    const numericOps = (component as any).opsFromType(FieldType.DECIMAL);

    expect(stringOps).toEqual(['=', '≈']);
    expect(numericOps).toEqual(['=', '<', '>', '<=', '>=']);
  });

  it('should clear form on clear method', () => {
    const mockForm = {
      reset: jasmine.createSpy()
    };
    component.filterForm = mockForm as any;

    component.clear();

    expect(mockForm.reset).toHaveBeenCalled();
  });
});
