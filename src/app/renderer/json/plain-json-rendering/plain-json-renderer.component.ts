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

  isMixedPrimitive(v: JsonValue): boolean {
    return v === null || typeof v !== 'object';
  }

  formatMixed(v: JsonValue): string {
    if (v === null) return 'null';
    if (typeof v !== 'object') return String(v);
    return JSON.stringify(v);
  }

  asObject(v: JsonValue): JsonObject {
    return v as JsonObject;
  }

  trackByKey(_: number, e: ResolvedEntry) { return e.key; }
  trackByIndex(i: number) { return i; }

  get isTooDeep(): boolean {
    return this.depth >= PlainJsonRendererComponent.MAX_DEPTH;
  }
}
