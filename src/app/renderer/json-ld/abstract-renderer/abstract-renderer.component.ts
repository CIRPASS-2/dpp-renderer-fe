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

import { Component, Input, OnChanges } from '@angular/core';
import { DividerModule } from 'primeng/divider';
import { FieldsetModule } from 'primeng/fieldset';
import { CLASS_RENDER_REGISTRY } from '../../../common/cirpass-dpp-ontology';
import {
  JsonLdNode,
  JsonLdPropertyValue,
  extractPropertyUris,
  isIriOnlyRef,
  isJsonLdNode,
  isJsonLdValue,
} from '../../rendering-models';
import { OntologyRegistryService } from '../ontology-registry.service';

interface FieldRow {
  label: string;
  values: FieldValue[];
}

interface FieldValue {
  kind: 'literal' | 'node' | 'iri' | 'ref';
  text: string;
  refLabel?: string;
  node?: JsonLdNode;
}

/**
 * Generic component for rendering JSON-LD nodes without specialized renderers.
 * Displays all properties in a structured format with cycle detection and reference handling.
 */
@Component({
  selector: 'app-abstract-renderer',
  imports: [DividerModule, FieldsetModule],
  templateUrl: './abstract-renderer.component.html',
  styleUrl: './abstract-renderer.component.css',
})
export class AbstractRendererComponent implements OnChanges {
  @Input({ required: true }) node!: JsonLdNode;
  @Input() graph: Map<string, JsonLdNode> = new Map();
  @Input() skipUris: string[] = [];
  @Input() visited: Set<string> = new Set();

  private _fields: FieldRow[] = [];

  constructor(private registry: OntologyRegistryService) { }

  ngOnChanges(): void {
    this._fields = this.buildFields();
  }

  /**
   * Gets the legend/title for the property group.
   * @returns Human-readable label based on node type or ID
   */
  get legend(): string {
    const types = (this.node['@type'] as string[]) ?? [];
    return types.length > 0
      ? this.registry.getLabel(types[0])
      : (this.node['@id'] as string | undefined)?.split('/').pop() ?? 'Properties';
  }

  /**
   * Gets the field rows for rendering.
   * @returns Array of field rows containing property labels and values
   */
  get fields(): FieldRow[] {
    return this._fields;
  }

  /**
   * Checks if a node is an IRI-only reference.
   * @param node The JSON-LD node to check
   * @returns True if node contains only IRI without data
   */
  isIriOnly(node: JsonLdNode): boolean {
    return isIriOnlyRef(node);
  }

  /**
   * Creates a visited set for child rendering to prevent cycles.
   * @param node The child node being rendered
   * @returns Updated visited set including current and child node IDs
   */
  childVisited(node: JsonLdNode): Set<string> {
    const next = new Set(this.visited);
    const selfId = this.node['@id'] as string | undefined;
    if (selfId) next.add(selfId);
    const childId = node['@id'] as string | undefined;
    if (childId) next.add(childId);
    return next;
  }

  private buildFields(): FieldRow[] {
    const skip = new Set(this.skipUris);
    const selfId = this.node['@id'] as string | undefined;

    const currentVisited = new Set(this.visited);
    if (selfId) currentVisited.add(selfId);

    const rows: FieldRow[] = [];

    for (const uri of extractPropertyUris(this.node)) {
      if (skip.has(uri)) continue;
      const arr = this.node[uri] as JsonLdPropertyValue;
      if (!Array.isArray(arr) || arr.length === 0) continue;

      const values: FieldValue[] = arr.map(item => {
        if (isJsonLdValue(item)) {
          return { kind: 'literal', text: String(item['@value']) };
        }

        if (isJsonLdNode(item)) {
          const id = item['@id'] as string | undefined;

          if (id && currentVisited.has(id)) {
            return { kind: 'iri', text: id };
          }

          const resolved = (id ? this.graph.get(id) : undefined) ?? item;
          const types = (resolved['@type'] as string[]) ?? [];

          // If this node's type has a dedicated top-level renderer (non-abstract
          // RenderCategory), don't expand as it is rendered
          // separately by DppRendererComponent. Show a typed reference badge instead.
          if (types.length > 0) {
            const category = this.registry.resolveCategory(types);
            if (category !== 'abstract') {
              return {
                kind: 'ref',
                text: id ?? '',
                refLabel: this.registry.getLabel(types[0]),
              };
            }
          }

          if (isIriOnlyRef(resolved)) {
            return { kind: 'iri', text: id ?? '', node: resolved };
          }

          return { kind: 'node', text: id ?? '', node: resolved };
        }

        return { kind: 'iri', text: (item as any)['@id'] ?? '' };
      });

      rows.push({
        label: this.registry.getLabel(uri),
        values,
      });
    }

    return rows;
  }

  /**
   * Checks if a type has a dedicated renderer in the registry.
   * @param type The RDF type URI to check
   * @returns True if type has a registered renderer
   */
  isInRegistry(type: string): boolean {
    const clazz = CLASS_RENDER_REGISTRY[type];
    return clazz !== null && clazz !== undefined;
  }
  /**
   * Determines if a field row should be skipped from rendering.
   * @param frow The field row to check
   * @returns True if row has no values or only reference values
   */
  skip(frow: FieldRow): boolean {
    if (frow?.values?.length === 0) {
      return true
    } else if (frow?.values?.filter(r => r.kind !== 'ref').length == 0) {
      return true;
    }
    return false;
  }
}