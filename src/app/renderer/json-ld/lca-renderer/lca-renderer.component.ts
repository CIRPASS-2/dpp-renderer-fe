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
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { EUDPP_LCA_NS, EUDPP_NS } from '../../../common/cirpass-dpp-ontology';
import { JsonLdNode, JsonLdPropertyValue, extractNumber, isJsonLdNode } from '../../rendering-models';
import { OntologyRegistryService } from '../ontology-registry.service';

const LCA = EUDPP_LCA_NS;
const NS = EUDPP_NS;

interface ImpactEntry {
  categoryLabel: string;
  indicatorLabel: string;
  value: number | string | null;
  unit: string | null;
  method: string | null;
}

/**
 * Component for rendering Life Cycle Assessment (LCA) data and environmental impact indicators.
 * Processes complex LCA graph structures to display impact categories, indicators, values, and methodologies.
 */
@Component({
  selector: 'app-lca-renderer',
  imports: [CardModule, DividerModule, TooltipModule],
  templateUrl: './lca-renderer.component.html',
  styleUrl: './lca-renderer.component.css'
})
export class LcaRendererComponent implements OnChanges {
  @Input({ required: true }) node!: JsonLdNode;
  @Input() graph: Map<string, JsonLdNode> = new Map();

  impacts: ImpactEntry[] = [];
  footprintLabel = 'Environmental Footprint (LCA)';
  methodologyName: string | null = null;

  constructor(private registry: OntologyRegistryService) { }

  ngOnChanges(): void {
    this.resolveFootprintLabel();
    this.buildImpacts();
    this.resolveMethodology();
  }

  private resolveFootprintLabel(): void {
    const types = (this.node['@type'] as string[]) ?? [];
    this.footprintLabel = types.length > 0
      ? this.registry.getLabel(types[0])
      : 'Environmental Footprint (LCA)';
  }

  /**
   * Walk the LCA graph structure:
   */
  private buildImpacts(): void {
    this.impacts = [];

    // Collect ICI nodes referenced from this footprint node
    const iciNodes = this.collectLinked(this.node, [
      `${LCA}quantifies`,
      `${LCA}quantified_by`,
      `${LCA}ICI_quantified_by_CF`,
    ]);

    // If nothing found, look for Impact_Category nodes directly
    const icNodes = this.collectLinked(this.node, [
      `${LCA}ICI_assess_IC`,
      `${LCA}corresponds_to_IC`,
      `${LCA}related_to`,
    ]);

    const targets = iciNodes.length > 0 ? iciNodes : icNodes.length > 0 ? icNodes : [this.node];

    for (const ici of targets) {
      const entry = this.extractEntry(ici);
      if (entry) this.impacts.push(entry);
    }

    // If still empty, try to render the node itself if it has numeric data
    if (this.impacts.length === 0) {
      const self = this.extractEntry(this.node);
      if (self) this.impacts.push(self);
    }
  }

  private extractEntry(node: JsonLdNode): ImpactEntry | null {
    const types = (node['@type'] as string[]) ?? [];
    const catLabel = types.length > 0 ? this.registry.getLabel(types[0]) : 'Impact';

    // category label from Impact_Category
    const icNodes = this.collectLinked(node, [`${LCA}ICI_assess_IC`, `${LCA}corresponds_to_IC`]);
    const icLabel = icNodes.length > 0
      ? (this.labelFromNode(icNodes[0]) ?? catLabel)
      : catLabel;

    const resultNodes = this.collectLinked(node, [`${LCA}ICI_computes_IR`, `${LCA}quantifies`]);
    let value: number | string | null = null;
    let unit: string | null = null;

    if (resultNodes.length > 0) {
      const r = resultNodes[0];
      value = extractNumber(r, `${NS}numericalValue`) ?? extractNumber(r, `${NS}value`) ?? null;
      const unitNodes = this.collectLinked(r, [`${LCA}has_unit`]);
      if (unitNodes.length > 0) {
        unit = this.labelFromNode(unitNodes[0]);
      }
    } else {
      value = extractNumber(node, `${NS}numericalValue`) ??
        extractNumber(node, `${NS}value`) ?? null;
    }

    const methodNodes = this.collectLinked(node, [`${LCA}CF_calculated_by_CM`, `${LCA}CM_used_in_method`]);
    const method = methodNodes.length > 0 ? this.labelFromNode(methodNodes[0]) : null;

    return {
      categoryLabel: icLabel ?? catLabel,
      indicatorLabel: this.labelFromNode(node) ?? catLabel,
      value,
      unit,
      method,
    };
  }

  private collectLinked(node: JsonLdNode, properties: string[]): JsonLdNode[] {
    const results: JsonLdNode[] = [];
    for (const prop of properties) {
      const arr = node[prop] as JsonLdPropertyValue | undefined;
      if (!Array.isArray(arr)) continue;
      for (const item of arr) {
        if (isJsonLdNode(item)) {
          const id = item['@id'] as string | undefined;
          const resolved = (id ? this.graph.get(id) : undefined) ?? item;
          results.push(resolved);
        }
      }
    }
    return results;
  }

  private labelFromNode(node: JsonLdNode): string | null {
    // Try rdfs:label first
    const labelProp = 'http://www.w3.org/2000/01/rdf-schema#label';
    const arr = node[labelProp] as JsonLdPropertyValue | undefined;
    if (Array.isArray(arr) && arr.length > 0 && isJsonLdNode(arr[0])) {
      const v = (arr[0] as any)['@value'];
      if (v) return String(v);
    }
    // Fallbak use type label
    const types = (node['@type'] as string[]) ?? [];
    return types.length > 0 ? this.registry.getLabel(types[0]) : null;
  }

  private resolveMethodology(): void {
    const methNodes = this.collectLinked(this.node, [
      `${LCA}CM_used_in_method`,
      `${LCA}method_uses_CM`,
    ]);
    this.methodologyName = methNodes.length > 0 ? this.labelFromNode(methNodes[0]) : null;
  }

  /**
   * Formats numerical values for display with appropriate precision and notation.
   * Uses scientific notation for very small or very large numbers.
   * @param value The numerical or string value to format
   * @returns Formatted string representation
   */
  formatValue(value: number | string): string {
    if (typeof value === 'number') {
      // Format as scientific notation for very small/large numbers
      if (Math.abs(value) !== 0 && (Math.abs(value) < 0.0001 || Math.abs(value) > 1e6)) {
        return value.toExponential(4);
      }
      return value.toLocaleString('en-US', { maximumFractionDigits: 6 });
    }
    return String(value);
  }
}
