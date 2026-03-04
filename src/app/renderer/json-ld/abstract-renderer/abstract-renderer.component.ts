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
  kind: 'literal' | 'node' | 'iri';
  text: string;
  node?: JsonLdNode;
}

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
  /** Tracks already-rendered @id values to prevent circular recursion */
  @Input() visited: Set<string> = new Set();

  private _fields: FieldRow[] = [];

  constructor(private registry: OntologyRegistryService) { }

  ngOnChanges(): void {
    this._fields = this.buildFields();
  }

  get legend(): string {
    const types = (this.node['@type'] as string[]) ?? [];
    return types.length > 0
      ? this.registry.getLabel(types[0])
      : (this.node['@id'] as string | undefined)?.split('/').pop() ?? 'Properties';
  }

  get fields(): FieldRow[] {
    return this._fields;
  }

  isIriOnly(node: JsonLdNode): boolean {
    return isIriOnlyRef(node);
  }

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

    // Mark current node as visited for child resolution
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

          // ← stop recursion: if already visited render as IRI link only
          if (id && currentVisited.has(id)) {
            return { kind: 'iri', text: id };
          }

          const resolved = (id ? this.graph.get(id) : undefined) ?? item;

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

  isInRegistry(type: string): boolean {
    const clazz = CLASS_RENDER_REGISTRY[type]
    return clazz !== null && clazz !== undefined
  }
}