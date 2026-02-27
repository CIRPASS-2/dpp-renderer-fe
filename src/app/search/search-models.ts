import { FormArray, FormControl } from "@angular/forms"

export interface SearchField {
    fieldName: string,
    dependsOn: string,
    targetType: FieldType
}

export enum FieldType {
    STRING = "STRING",
    DECIMAL = "DECIMAL",
    INTEGER="INTEGER",
    BOOLEAN = "BOOLEAN"
}

export enum FilterOp {
    EQ = "EQ",
    GT = "GT",
    GTE = "GTE",
    LT = "LT",
    LTE = "LTE",
    LIKE = "LIKE"
}

export interface SearchFilter {
    property: string,
    op: FilterOp,
    literal: string
}

export interface SearchRequest {
    filters: SearchFilter[]|null,
    offset: number,
    limit: number
}

export interface SearchResult {
    id: number,
    upi: string,
    liveURL: string,
    data: Record<string,unknown>
}

export interface PagedResult {
    elements: SearchResult[],
    count: number,
    numberOfElements: number
}

export interface RenderableSearchField{
  fieldLabel: string
  fieldName: string
  fieldType: FieldType,
  availableOps:string[]
  literal:string
}

export type SearchFormField = {
    op: FormControl<string | null>,
    literal: FormControl<string | null>
}

