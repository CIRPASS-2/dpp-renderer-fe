import { Component, Input } from '@angular/core';
import { DividerModule } from 'primeng/divider';
import { FieldsetModule } from 'primeng/fieldset';
import { JsonLdNode, JsonLdPropertyValue, extractPropertyUris, isIriOnlyRef, isJsonLdNode, isJsonLdValue } from '../../rendering-models';
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
  styleUrl: './abstract-renderer.component.css'
})
export class AbstractRendererComponent {

  @Input({ required: true }) node!: JsonLdNode;
  @Input() graph: Map<string, JsonLdNode> = new Map();
  /** URIs to exclude (used by parent renderers to skip already-rendered fields) */
  @Input() skipUris: string[] = [];

  constructor(private registry: OntologyRegistryService) { }

  get legend(): string {
    const types = (this.node['@type'] as string[]) ?? [];
    return types.length > 0
      ? this.registry.getLabel(types[0])
      : (this.node['@id'] as string | undefined)?.split('/').pop() ?? 'Properties';
  }

  get fields(): FieldRow[] {
    const skip = new Set(this.skipUris);
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

  isIriOnly(node: JsonLdNode): boolean {
    return isIriOnlyRef(node);
  }

}
