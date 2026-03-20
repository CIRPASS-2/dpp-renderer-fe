/*
 * Copyright 2024-2027 CIRPASS-2
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { FormControl } from "@angular/forms"

export interface SearchField {
    fieldName: string,
    dependsOn: string,
    targetType: FieldType
}

export enum FieldType {
    STRING = "STRING",
    DECIMAL = "DECIMAL",
    INTEGER = "INTEGER",
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
    filters: SearchFilter[] | null,
    offset: number,
    limit: number
}

export interface SearchResult {
    id: number,
    upi: string,
    liveURL: string,
    data: Record<string, unknown>
}

export interface PagedResult {
    elements: SearchResult[],
    count: number,
    numberOfElements: number
}

export interface RenderableSearchField {
    fieldLabel: string
    fieldName: string
    fieldType: FieldType,
    availableOps: string[]
    literal: string
}

export type SearchFormField = {
    op: FormControl<string | null>,
    literal: FormControl<string | null>
}

