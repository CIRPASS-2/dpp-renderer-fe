import { Injectable } from '@angular/core';
import { CLASS_ANCESTORS, CLASS_LABELS, CLASS_RENDER_REGISTRY, PROPERTY_LABELS, RenderCategory } from '../../common/cirpass-dpp-ontology';
import { prettify } from '../../common/label-pipe';
import { JsonLdNode } from '../rendering-models';

@Injectable({
  providedIn: 'root'
})
export class OntologyRegistryService {

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
