import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { RenderCategory } from '../../../common/cirpass-dpp-ontology';
import {
  ExpandedJsonLd,
  isIriOnlyRef,
  isJsonLdNode,
  JsonLdNode,
  JsonLdPropertyValue,
} from '../../rendering-models';
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

/**
 * Categories that are always rendered at top level even when referenced
 * by other nodes (e.g. DPP.appliesToProduct back-references Product).
 *
 * NOTE: deduplication of nodes that appear both at top level AND inline is
 * handled by AbstractRendererComponent, which renders known-category nodes
 * as reference badges instead of expanding them recursively.
 */
const ALWAYS_ROOT_CATEGORIES = new Set<RenderCategory>(['product', 'dpp']);

@Component({
  selector: 'app-dpp-renderer',
  imports: [
    ProgressSpinnerModule,
    MessageModule,
    SubstanceRendererComponent,
    LcaRendererComponent,
    DocumentRendererComponent,
    ActorRendererComponent,
    FacilityRendererComponent,
    ProductRendererComponent,
    AbstractRendererComponent,
    DppInfoRendererComponent,
    ClassificationCodeRendererComponent,
    QuantitativePropertyRendererComponent,
  ],
  templateUrl: './dpp-renderer.component.html',
  styleUrl: './dpp-renderer.component.css',
})
export class DppRendererComponent implements OnChanges {
  @Input({ required: true }) expandedJsonLd!: ExpandedJsonLd;

  resolvedNodes: ResolvedNode[] = [];
  graph: Map<string, JsonLdNode> = new Map();
  error?: string;
  loading = true;

  constructor(private registry: OntologyRegistryService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['expandedJsonLd']) {
      this.process();
    }
  }

  private process(): void {
    this.loading = true;
    this.error = undefined;
    this.graph = new Map();
    this.resolvedNodes = [];

    if (!Array.isArray(this.expandedJsonLd) || this.expandedJsonLd.length === 0) {
      this.error = 'Empty or invalid JSON-LD document.';
      this.loading = false;
      return;
    }

    // Pass 1 – build the graph index
    for (const node of this.expandedJsonLd) {
      if (node['@id']) {
        this.graph.set(node['@id'] as string, node);
      }
    }

    // Pass 2 – collect IDs referenced as property values by other nodes.
    // Used in Pass 3 to suppress "owned" abstract nodes (e.g. Concentration,
    // Threshold, PackagingDetail) that the JSON-LD expander lifts to the flat
    // top-level array but that belong semantically to a single parent.
    const referencedIds = this.collectReferencedIds();

    // Pass 3 – select top-level renderable nodes
    for (const node of this.expandedJsonLd) {
      const types = (node['@type'] as string[]) ?? [];
      const id = node['@id'] as string | undefined;
      const category = this.registry.resolveCategory(types);

      // 1. Never render bare IRI-only stubs ({ @id } with no other content)
      if (isIriOnlyRef(node)) continue;

      // 2. Skip nodes that carry no data beyond @id / @type.
      //    Covers bare Role stubs and similar link-only nodes.
      const dataKeys = Object.keys(node).filter(k => k !== '@id' && k !== '@type');
      if (dataKeys.length === 0) continue;

      // 3. Strategy C: skip a node only when BOTH conditions hold:
      //    a) its type resolves to 'abstract' — it has no dedicated renderer,
      //       meaning it is an auxiliary data structure, not a domain entity
      //    b) it is referenced by at least one other node — meaning a parent
      //       component already renders it inline (e.g. SubstanceRenderer
      //       renders Concentration/Threshold; ProductRenderer renders
      //       PackagingDetail)
      //
      //    Nodes with a known category (actor, substance, quantitative-property
      //    …) are domain entities with their own identity and always get a
      //    top-level card, even if a parent also references them.
      if (category === 'abstract' && id && referencedIds.has(id)) continue;

      this.resolvedNodes.push({ node, category });
    }

    this.resolvedNodes.sort((a, b) => {
      const delta = this.sortPriority(a) - this.sortPriority(b);
      if (delta !== 0) return delta;
      // Secondary: stable alphabetical sort by @id within the same category
      const idA = (a.node['@id'] as string | undefined) ?? '';
      const idB = (b.node['@id'] as string | undefined) ?? '';
      return idA.localeCompare(idB);
    });
    this.loading = false;
  }

  /**
   * Walks every property array of every node and collects the @id of each
   * object value (both IRI-only refs and inline nodes with an @id).
   *
   * The resulting set is used exclusively for the Strategy-C filter:
   * abstract nodes that are referenced by a parent are "owned" structures
   * (Concentration, Threshold, PackagingDetail, MeasurementUnit, …) and
   * must not be rendered as independent top-level cards.
   */
  private collectReferencedIds(): Set<string> {
    const referenced = new Set<string>();

    for (const node of this.expandedJsonLd) {
      for (const key of Object.keys(node)) {
        if (key === '@id' || key === '@type') continue;

        const values = node[key] as JsonLdPropertyValue | undefined;
        if (!Array.isArray(values)) continue;

        for (const v of values) {
          if (isJsonLdNode(v)) {
            const childId = (v as JsonLdNode)['@id'] as string | undefined;
            if (childId) referenced.add(childId);
          }
        }
      }
    }

    return referenced;
  }

  /**
   * Defines the top-level rendering order for a DPP document.
   *
   * Reading flow rationale:
   *   product           – what the passport describes (always first)
   *   dpp               – passport metadata (validity, status, issuer)
   *   actor             – who manufactured / distributed / certified it
   *   facility          – where it was produced
   *   classification-code – normative categorisation (HS/ECLASS/...)
   *   substance         – hazardous-substance disclosure (SCIP/REACH)
   *   quantitative-property – measurements and environmental indicators
   *   document          – attached instructions, certificates, manuals
   *   lca               – derived lifecycle-assessment data (most technical)
   *   abstract          – catch-all for unmapped types
   */
  private static readonly CATEGORY_ORDER: Record<RenderCategory, number> = {
    'product': 0,
    'dpp': 1,
    'actor': 2,
    'facility': 3,
    'classification-code': 4,
    'substance': 5,
    'quantitative-property': 6,
    'document': 7,
    'lca': 8,
    'abstract': 9,
  };

  private sortPriority(r: ResolvedNode): number {
    return DppRendererComponent.CATEGORY_ORDER[r.category] ?? 99;
  }
}