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

import { Component, Input } from '@angular/core';
import { DividerModule } from 'primeng/divider';
import { FieldsetModule } from 'primeng/fieldset';
import { LabelPipe } from '../../../common/label-pipe';
import { JsonObject, JsonValue } from '../../rendering-models';


interface ResolvedEntry {
  key: string;
  kind: 'primitive' | 'array-of-primitives' | 'object' | 'array-of-objects' | 'mixed-array';
  primitiveValue?: string;
  primitiveItems?: string[];   // array-of-primitives
  objectValue?: JsonObject;    // object
  objectItems?: JsonObject[];  // array-of-objects
  mixedItems?: JsonValue[];    // mixed-array fallback
}

/**
 * Component for rendering plain JSON data in a structured, recursive format.
 * Handles different data types (primitives, arrays, objects) with depth limiting and collapsible sections.
 */
@Component({
  selector: 'app-plain-json-renderer',
  imports: [FieldsetModule, DividerModule, LabelPipe],
  templateUrl: './plain-json-renderer.component.html',
  styleUrl: './plain-json-renderer.component.css'
})
export class PlainJsonRendererComponent {

  private static readonly MAX_DEPTH = 15;

  @Input({ required: true }) data!: JsonObject | JsonObject[];

  @Input() panelLabel?: string;
  @Input() collapsed = false;
  @Input() depth = 0;

  /**
   * Gets resolved entries for rendering the JSON data structure.
   * @returns Array of resolved entries with type information for rendering
   */
  get entries(): ResolvedEntry[] {
    const obj: JsonObject = Array.isArray(this.data)
      ? { items: this.data as unknown as JsonValue }
      : this.data;

    return Object.entries(obj).map(([key, value]) => this.resolve(key, value));
  }

  private resolve(key: string, value: JsonValue): ResolvedEntry {
    if (value === null || typeof value !== 'object') {
      return { key, kind: 'primitive', primitiveValue: this.formatPrimitive(value) };
    }

    if (!Array.isArray(value)) {
      return { key, kind: 'object', objectValue: value as JsonObject };
    }

    if (value.length === 0) {
      return { key, kind: 'array-of-primitives', primitiveItems: [] };
    }

    const allPrimitive = value.every(v => v === null || typeof v !== 'object');
    if (allPrimitive) {
      return {
        key,
        kind: 'array-of-primitives',
        primitiveItems: (value as (string | number | boolean | null)[]).map(v => this.formatPrimitive(v)),
      };
    }

    const allObjects = value.every(v => v !== null && typeof v === 'object' && !Array.isArray(v));
    if (allObjects) {
      return { key, kind: 'array-of-objects', objectItems: value as JsonObject[] };
    }

    return { key, kind: 'mixed-array', mixedItems: value };
  }

  private formatPrimitive(v: string | number | boolean | null): string {
    if (v === null) return 'null';
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    return String(v);
  }

  /**
   * Checks if a value in a mixed array is a primitive type.
   * @param v The JSON value to check
   * @returns True if the value is primitive (null, string, number, boolean)
   */
  isMixedPrimitive(v: JsonValue): boolean {
    return v === null || typeof v !== 'object';
  }

  /**
   * Formats a mixed-type value for display.
   * @param v The JSON value to format
   * @returns Formatted string representation
   */
  formatMixed(v: JsonValue): string {
    if (v === null) return 'null';
    if (typeof v !== 'object') return String(v);
    return JSON.stringify(v);
  }

  /**
   * Type guard to cast a JsonValue to JsonObject for template use.
   * @param v The JSON value to cast
   * @returns The value cast as JsonObject
   */
  asObject(v: JsonValue): JsonObject {
    return v as JsonObject;
  }

  /** TrackBy function for Angular ngFor performance optimization */
  trackByKey(_: number, e: ResolvedEntry) { return e.key; }
  /** TrackBy function for index-based iteration */
  trackByIndex(i: number) { return i; }

  /**
   * Checks if the current rendering depth exceeds the maximum allowed depth.
   * @returns True if too deep for rendering (prevents infinite recursion)
   */
  get isTooDeep(): boolean {
    return this.depth >= PlainJsonRendererComponent.MAX_DEPTH;
  }
}
