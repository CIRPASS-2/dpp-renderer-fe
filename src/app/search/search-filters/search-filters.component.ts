import { CommonModule } from '@angular/common';
import { Component, EventEmitter, input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { prettify } from '../../common/label-pipe';
import { SearchFieldComponent } from '../search-field/search-field.component';
import { FieldType, RenderableSearchField, SearchField, SearchFilter } from '../search-models';

// Il valore del form array è SearchFilter | null per ogni riga
type FilterFormArray = FormArray<FormControl<SearchFilter | null>>;

@Component({
  selector: 'app-search-filters',
  standalone: true,
  imports: [AccordionModule, ReactiveFormsModule, SearchFieldComponent, CommonModule, ButtonModule],
  templateUrl: './search-filters.component.html',
  styleUrl: './search-filters.component.css',
})
export class SearchFiltersComponent implements OnChanges {

  capabilities = input<SearchField[]>([])
  renderableFields: RenderableSearchField[] = [];

  @Output() onSearch: EventEmitter<SearchFilter[]> = new EventEmitter<SearchFilter[]>()

  filterForm?: FormGroup
  constructor(
    private fb: FormBuilder
  ) { }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes["capabilities"]) {
      this.init()
    }
  }



  init(): void {
    if (!this.filterForm) {
      this.filterForm = this.fb.group({
        filters: this.fb.array<FormControl<SearchFilter | null>>([])
      });
    }
    const fields = this.capabilities()
    if (fields) {
      this.renderableFields = fields.map(f => this.asRenderable(f))
      fields.forEach(() => {
        this.filtersArray.push(new FormControl<SearchFilter | null>(null));
      });
    }
  }

  onSubmit(): void {
    const filters: SearchFilter[] = this.filtersArray.value.filter(
      (f): f is SearchFilter => f !== null
    );
    this.onSearch.emit(filters)
  }

  get filtersArray(): FilterFormArray {
    return this.filterForm?.get('filters') as FilterFormArray;
  }

  private asRenderable(field: SearchField): RenderableSearchField {
    return {
      fieldLabel: prettify(field.fieldName),
      fieldName: field.fieldName,
      fieldType: field.targetType,
      availableOps: this.opsFromType(field.targetType),
      literal: ''
    };
  }

  clear() {
    this.filterForm?.reset()
  }

  private opsFromType(type: FieldType): string[] {
    if (type === FieldType.STRING) return ['=', '≈'];
    if (type === FieldType.INTEGER || type === FieldType.DECIMAL) return ['=', '<', '>', '<=', '>='];
    return ['='];
  }

}