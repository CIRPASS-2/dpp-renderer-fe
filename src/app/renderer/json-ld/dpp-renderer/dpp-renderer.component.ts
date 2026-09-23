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

import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { EUDPP_NS, RenderCategory } from '../../../common/cirpass-dpp-ontology';
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
import { EventRendererComponent } from '../event-renderer/event-renderer.component';
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

const AUXILIARY_TYPES = new Set([
  `${EUDPP_NS}ActorRoleAssignment`,
  `${EUDPP_NS}AuthorisedRepresentativeRoleAssignment`,
]);

const NESTED_LCA_RESULT_TYPES = new Set([
  `${EUDPP_NS}LCAResult`,
  `${EUDPP_NS}LCIAResult`,
  `${EUDPP_NS}InventoryIndicatorResult`,
]);

/**
 * Main component for rendering expanded JSON-LD DPP documents.
 * Processes complex JSON-LD graphs, resolves node relationships, and orchestrates 
 * specialized renderer components for different entity types (actors, products, substances, etc.).
 * Implements intelligent node deduplication and semantic ordering for optimal presentation.
 */
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
    EventRendererComponent,
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

  constructor(private readonly registry: OntologyRegistryService) { }

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
      const category = this.registry.resolveCategory(types);

      if (!this.isRenderable(node, types, category, referencedIds)) continue;

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

  private isRenderable(
    node: JsonLdNode,
    types: string[],
    category: RenderCategory,
    referencedIds: Set<string>,
  ): boolean {
    if (isIriOnlyRef(node)) return false;
    if (!Object.keys(node).some(key => key !== '@id' && key !== '@type')) return false;
    if (types.some(type => AUXILIARY_TYPES.has(type))) return false;

    const id = node['@id'] as string | undefined;
    if (id && referencedIds.has(id) && types.some(type => NESTED_LCA_RESULT_TYPES.has(type))) return false;

    return category !== 'abstract' || !id || !referencedIds.has(id);
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
      this.collectNodeReferenceIds(node, referenced);
    }

    return referenced;
  }

  private collectNodeReferenceIds(node: JsonLdNode, referenced: Set<string>): void {
    for (const key of Object.keys(node)) {
      if (key === '@id' || key === '@type') continue;
      this.collectPropertyReferenceIds(node[key] as JsonLdPropertyValue | undefined, referenced);
    }
  }

  private collectPropertyReferenceIds(
    values: JsonLdPropertyValue | undefined,
    referenced: Set<string>,
  ): void {
    if (!Array.isArray(values)) return;

    for (const value of values) {
      if (!isJsonLdNode(value)) continue;
      const id = value['@id'] as string | undefined;
      if (id) referenced.add(id);
    }
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
  *   event             – product, passport, and technical lifecycle events
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
    'event': 8,
    'lca': 9,
    'abstract': 10,
  };

  private sortPriority(r: ResolvedNode): number {
    return DppRendererComponent.CATEGORY_ORDER[r.category] ?? 99;
  }
}