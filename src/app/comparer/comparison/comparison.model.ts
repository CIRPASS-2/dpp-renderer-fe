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

import { PropertyPathsMap } from "../selector/ontology-tree.model"

export interface ExtractionRequest {
  ontologyUrl: string
  fallbackNsURI: string
  dppUrls: string[]
  propertyPaths: PropertyPathsMap
}

export interface ExtractionResponse {
  results: any[]
}

export interface ComparisonResult {
  results: any[]
}

export interface ComparisonRow {
  propertyKey: string;
  propertyLabel: string;
  values: Map<string, PropertyValue>;
  isDifferent: boolean;
  isNested?: boolean;
  level?: number;
  parentKey?: string;
}

export interface PropertyValue {
  value: any;
  isDifferent: boolean;
  isMissing: boolean;
  displayValue: string;
}

export interface DppColumn {
  dppId: string;
  dppLabel: string;
}