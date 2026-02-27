import { CommonModule } from '@angular/common';
import {
  Component, forwardRef, input, OnChanges, OnDestroy, OnInit
} from '@angular/core';
import {
  AbstractControl, ControlValueAccessor, FormControl, FormGroup,
  NG_VALIDATORS, NG_VALUE_ACCESSOR, ReactiveFormsModule,
  ValidationErrors, Validator
} from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Subscription } from 'rxjs';
import { FieldType, FilterOp, RenderableSearchField, SearchFilter, SearchFormField } from '../search-models';

@Component({
  selector: 'app-search-field',
  standalone: true,
  imports: [ReactiveFormsModule, SelectModule, InputTextModule, CheckboxModule, InputNumberModule, CommonModule],
  templateUrl: './search-field.component.html',
  styleUrl: './search-field.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchFieldComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => SearchFieldComponent),
      multi: true
    }
  ]
})
export class SearchFieldComponent
  implements ControlValueAccessor, Validator, OnInit, OnChanges, OnDestroy {

  static nextId = 0;
  id = `search-field-${SearchFieldComponent.nextId++}`;

  renderableField = input<RenderableSearchField>();

  // Typed properly — no more `any`
  private onChange: (value: SearchFilter | null) => void = () => { };
  private onTouched: () => void = () => { };

  form = new FormGroup<SearchFormField>({
    op: new FormControl<string | null>(null),
    literal: new FormControl<string | null>(null)
  });

  private sub?: Subscription;

  ngOnInit(): void {
    this.sub = this.form.valueChanges.subscribe(() => {
      this.onChange(this.buildFilter());
    });
  }

  ngOnChanges(): void {
    const rf = this.renderableField();
    if (rf) {
      this.form.reset(
        { op: rf.availableOps[0] ?? null, literal: null },
        { emitEvent: false }
      );
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  writeValue(value: SearchFilter | null): void {
    if (value) {

      this.form.setValue({ op: this.toStringOp(value), literal: value.literal }, { emitEvent: false });
    } else {
      this.form.reset(undefined, { emitEvent: false });
    }
  }

  toStringOp(searchFilter: SearchFilter): string {
    if (searchFilter.op === FilterOp.GT) return ">"
    if (searchFilter.op === FilterOp.GTE) return ">="
    if (searchFilter.op === FilterOp.LT) return "<"
    if (searchFilter.op === FilterOp.LTE) return "<="
    if (searchFilter.op === FilterOp.LIKE) return "LIKE"
    return "="
  }

  registerOnChange(fn: (value: SearchFilter | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    isDisabled
      ? this.form.disable({ emitEvent: false })
      : this.form.enable({ emitEvent: false });
  }


  validate(_control: AbstractControl): ValidationErrors | null {
    if (this.form.invalid) {
      return { searchField: this.form.errors };
    }
    return null;
  }


  private buildFilter(): SearchFilter | null {
    const rf = this.renderableField();
    const { op, literal } = this.form.getRawValue();
    if (!rf || !op || literal === null || literal === '') return null;
    return {
      property: rf.fieldName,
      op: this.toFilterOp(op) as FilterOp,
      literal: this.asLiteral(rf.fieldType, literal)
    };
  }

  private asLiteral(fieldType: FieldType, literal: any): string {
    if (fieldType == FieldType.STRING) return "'" + literal + "'"
    return String(literal)
  }

  private toFilterOp(op: string): FilterOp {
    switch (op) {
      case ">": return FilterOp.GT
      case "<": return FilterOp.LT
      case ">=": return FilterOp.GTE
      case "<=": return FilterOp.LTE
      case "≈": return FilterOp.LIKE
      default: return FilterOp.EQ
    }
  }
  onBlur(): void {
    this.onTouched();
  }
}