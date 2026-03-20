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

import { Injectable } from '@angular/core';
import { ComparisonRow, DppColumn, ExtractionResponse, PropertyValue } from './comparison.model';

/**
 * Service for transforming DPP data into comparable tabular format.
 * Processes multiple DPP objects and creates comparison rows highlighting differences.
 * Supports nested object structures and property type detection.
 */
@Injectable({
  providedIn: 'root'
})
export class DppComparisonService {

  private readonly EXCLUDED_KEYS = new Set(['id', '@id', '@context', '@type']);

  /**
   * Transforms raw DPP extraction data into comparison-ready format.
   * Creates columns for each DPP and rows for each property with difference detection.
   * @param data The extraction response containing DPP results
   * @returns Object containing columns and rows for comparison table
   */
  transformToComparisonRows(data: ExtractionResponse): {
    columns: DppColumn[];
    rows: ComparisonRow[];
  } {
    if (!data.results) {
      return { columns: [], rows: [] };
    }

    const columns = this.extractColumns(data.results);

    const allPropertyKeys = this.extractAllPropertyKeys(data.results);

    const rows = this.buildComparisonRows(allPropertyKeys, data.results, columns);

    return { columns, rows };
  }


  private extractColumns(results: any[]): DppColumn[] {
    return results.map((dpp, index) => ({
      dppId: this.findProp(dpp, ['id', '@id']) ?? `DPP-${index + 1}`,
      dppLabel: this.findProp(dpp, ['name', 'label', 'productName']) ?? `DPP ${index + 1}`
    }));
  }

  private findProp(obj: any, keys: string[]): any {
    if (!obj || typeof obj !== 'object') return undefined;
    const normalize = (s: string) => s.toLowerCase().replace(/[_\-\s]/g, '');
    const normalizedKeys = keys.map(normalize);
    const match = Object.keys(obj).find(k => normalizedKeys.includes(normalize(k)));
    return match !== undefined ? obj[match] : undefined;
  }


  private extractAllPropertyKeys(results: object[]): Set<string> {
    return new Set<string>(
      results
        .flatMap(dpp => Object.keys(dpp))
        .filter(key => !this.EXCLUDED_KEYS.has(key))
        .sort((a, b) => a.localeCompare(b))
    );
  }


  private buildComparisonRows(
    propertyKeys: Set<string>,
    results: Map<string, any>[],
    columns: DppColumn[]
  ): ComparisonRow[] {
    const rows: ComparisonRow[] = [];

    propertyKeys.forEach(key => {
      const row = this.buildRowForProperty(key, results, columns);
      rows.push(row);
      const firstValue = (results[0] as any)[key];
      if (firstValue && typeof firstValue === 'object' && !Array.isArray(firstValue)) {
        const nestedRows = this.buildNestedRows(key, results, columns);
        rows.push(...nestedRows);
      }
    });

    return rows;
  }

  private buildRowForProperty(
    propertyKey: string,
    results: Map<string, any>[],
    columns: DppColumn[]
  ): ComparisonRow {
    const values = new Map<string, PropertyValue>();
    const distinctValues = new Set<string>();

    results.forEach((dpp, index) => {
      const rawValue = (dpp as any)[propertyKey];
      const propertyValue = this.createPropertyValue(rawValue);

      values.set(columns[index].dppId, propertyValue);

      if (!propertyValue.isMissing) {
        distinctValues.add(JSON.stringify(rawValue));
      }
    });

    return {
      propertyKey,
      propertyLabel: this.formatPropertyLabel(propertyKey),
      values,
      isDifferent: distinctValues.size > 1,
      isNested: false,
      level: 0
    };
  }


  private buildNestedRows(
    parentKey: string,
    results: Map<string, any>[],
    columns: DppColumn[],
    level: number = 1
  ): ComparisonRow[] {
    const rows: ComparisonRow[] = [];
    const nestedKeys = new Set<string>();

    results.forEach(dpp => {
      const parentValue = [(dpp as any)(parentKey)];
      if (parentValue && typeof parentValue === 'object') {
        Object.keys(parentValue).forEach(key => nestedKeys.add(key));
      }
    });

    nestedKeys.forEach(nestedKey => {
      const values = new Map<string, PropertyValue>();
      const distinctValues = new Set<string>();

      results.forEach((dpp, index) => {
        const parentValue = (dpp as any)[parentKey];
        const rawValue = parentValue?.[nestedKey];
        const propertyValue = this.createPropertyValue(rawValue);

        values.set(columns[index].dppId, propertyValue);

        if (!propertyValue.isMissing) {
          distinctValues.add(JSON.stringify(rawValue));
        }
      });

      rows.push({
        propertyKey: `${parentKey}.${nestedKey}`,
        propertyLabel: this.formatPropertyLabel(nestedKey),
        values,
        isDifferent: distinctValues.size > 1,
        isNested: true,
        level,
        parentKey
      });
    });

    return rows;
  }


  private createPropertyValue(rawValue: any): PropertyValue {
    const isMissing = rawValue === null || rawValue === undefined;

    return {
      value: rawValue,
      isMissing,
      isDifferent: false,
      displayValue: this.formatDisplayValue(rawValue, isMissing)
    };
  }


  private formatDisplayValue(value: any, isMissing: boolean): string {
    if (isMissing) {
      return '—';
    }

    if (typeof value === 'boolean') {
      return value ? '✓' : '✗';
    }

    if (typeof value === 'object') {
      return Array.isArray(value)
        ? `[${value.length} items]`
        : '[Object]';
    }

    if (typeof value === 'number') {
      return value.toLocaleString('en');
    }

    return String(value);
  }


  private formatPropertyLabel(key: string): string {
    let parts = key.split(".");
    let last = parts.length - 1
    let label = parts[last--]
    if (parts.length > 1) {
      while (last > -1) {
        let p = parts[last--]
        let type = this.extractTypeFilter(p)
        if (type) {
          label = type + "(" + label + ")"
          break
        }
      }
    }
    return label;
  }

  extractTypeFilter(path: string): string | undefined {
    return path.match(/\[*@type=(\w+)\]/)?.[1];
  }


  filterOnlyDifferences(rows: ComparisonRow[]): ComparisonRow[] {
    return rows.filter(row => row.isDifferent);
  }
}
