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
import { CLASS_ANCESTORS, CLASS_LABELS, CLASS_RENDER_REGISTRY, PROPERTY_LABELS, RenderCategory } from '../../common/cirpass-dpp-ontology';

/**
 * Service for ontology-based type resolution and rendering category assignment.
 * Handles class hierarchy navigation and property label resolution for JSON-LD rendering.
 */
@Injectable({
  providedIn: 'root'
})
export class OntologyRegistryService {

  /**
   * Resolves the render category for a set of RDF types.
   * Uses inheritance hierarchy to find appropriate rendering strategy.
   * @param types Array of RDF type URIs
   * @returns The render category ('abstract', 'actor', 'facility', etc.)
   */
  resolveCategory(types: string[]): RenderCategory {
    for (const typeUri of types) {
      const direct = CLASS_RENDER_REGISTRY[typeUri];
      if (direct) return direct;
      const ancestors = CLASS_ANCESTORS[typeUri] ?? [];
      for (const ancestor of ancestors) {
        const inherited = CLASS_RENDER_REGISTRY[ancestor];
        if (inherited) return inherited;
      }
    }
    return 'abstract';
  }


  /**
   * Checks if node types are instances of or inherit from a specified type.
   * @param nodeTypes Array of node type URIs to check
   * @param typeUri The target type URI to match against
   * @returns True if any node type matches or inherits from target type
   */
  isInstanceOf(nodeTypes: string[], typeUri: string): boolean {
    return nodeTypes.some(t =>
      t === typeUri ||
      (CLASS_ANCESTORS[t] ?? []).includes(typeUri),
    );
  }

  getAncestors(typeUri: string): string[] {
    return CLASS_ANCESTORS[typeUri] ?? [];
  }

  /** Human-readable label for a URI. */
  getLabel(uri: string): string {
    return PROPERTY_LABELS[uri] ?? CLASS_LABELS[uri] ?? this.localName(uri);
  }

  private localName(uri: string): string {
    const local = uri.includes('#') ? uri.split('#').pop()! : uri.split('/').pop()!;
    return local
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
      .trim();
  }
}
