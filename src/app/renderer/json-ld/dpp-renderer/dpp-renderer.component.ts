import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { RenderCategory } from '../../../common/cirpass-dpp-ontology';
import { ExpandedJsonLd, isIriOnlyRef, JsonLdNode } from '../../rendering-models';
import { AbstractRendererComponent } from '../abstract-renderer/abstract-renderer.component';
import { ActorRendererComponent } from '../actor-renderer/actor-renderer.component';
import { ClassificationCodeRendererComponent } from '../clasification-code-renderer/classification-code-renderer.component';
import { DocumentRendererComponent } from '../document-renderer/document-renderer.component';
import { DppInfoRendererComponent } from '../dpp-info-renderer/dpp-info-renderer.component';
import { FacilityRendererComponent } from '../facility-renderer/facility-renderer.component';
import { LcaRendererComponent } from '../lca-renderer/lca-renderer.component';
import { OntologyRegistryService } from '../ontology-registry.service';
import { ProductRendererComponent } from '../product-renderer/product-renderer.component';
import { QuantitativePropertyRendererComponent } from '../quantitative-property-renderer/quantitative-property-renderer.component';
import { SubstanceRendererComponent } from '../substance-renderer/substance-renderer.component';
export interface ResolvedNode {
  node: JsonLdNode;
  category: RenderCategory;
}

@Component({
  selector: 'app-dpp-renderer',
  imports: [ProgressSpinnerModule, SubstanceRendererComponent, LcaRendererComponent, DocumentRendererComponent, ActorRendererComponent, FacilityRendererComponent, MessageModule, ProductRendererComponent, AbstractRendererComponent, DppInfoRendererComponent, ClassificationCodeRendererComponent, QuantitativePropertyRendererComponent],
  templateUrl: './dpp-renderer.component.html',
  styleUrl: './dpp-renderer.component.css'
})
export class DppRendererComponent implements OnChanges {

  @Input({ required: true }) expandedJsonLd!: ExpandedJsonLd;

  resolvedNodes: ResolvedNode[] = [];
  /** Flat id→node map built once from the expanded graph – for @id resolution. */
  graph: Map<string, JsonLdNode> = new Map();
  error?: string;

  constructor(private registry: OntologyRegistryService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['expandedJsonLd']) {
      this.process();
    }
  }

  private process(): void {
    this.error = undefined;
    this.graph = new Map();
    this.resolvedNodes = [];

    if (!Array.isArray(this.expandedJsonLd) || this.expandedJsonLd.length === 0) {
      this.error = 'Empty or invalid JSON-LD document.';
      return;
    }

    for (const node of this.expandedJsonLd) {
      if (node['@id']) {
        this.graph.set(node['@id'] as string, node);
      }
    }

    for (const node of this.expandedJsonLd) {
      const types = (node['@type'] as string[]) ?? [];

      // Skip IRI-only reference nodes since they exist only as pointers, not as
      // standalone data nodes and will be resolved by child renderers
      if (isIriOnlyRef(node)) continue;

      if (types.length === 1 && types[0].endsWith('Role') && Object.keys(node).filter(k => k !== '@id' && k !== '@type').length === 0) continue;

      const category = this.registry.resolveCategory(types);
      this.resolvedNodes.push({ node, category });
    }
    if (this.resolvedNodes) {
      this.resolvedNodes.sort((a, b) => this.sortPriority(a) - this.sortPriority(b));
    }
  }

  private sortPriority(r: ResolvedNode): number {
    if (r.category === 'dpp') return 0;  
    if (r.category === 'product') return 1;  
    return 2;
  }
}










