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
import { EUDPP_NS } from '../../../common/cirpass-dpp-ontology';
import { JsonLdNode, JsonLdPropertyValue, extractNumber, extractPropertyUris, extractString, isJsonLdNode } from '../../rendering-models';
import { AbstractRendererComponent } from '../abstract-renderer/abstract-renderer.component';
import { OntologyRegistryService } from '../ontology-registry.service';

const NS = EUDPP_NS;
const RDFS_LABEL = 'http://www.w3.org/2000/01/rdf-schema#label';
const OM2_SYMBOL = 'http://www.ontology-of-units-of-measure.org/resource/om-2/symbol';

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
  imports: [CardModule, DividerModule, TooltipModule, AbstractRendererComponent],
  templateUrl: './lca-renderer.component.html',
  styleUrl: './lca-renderer.component.css'
})
export class LcaRendererComponent implements OnChanges {
  @Input({ required: true }) node!: JsonLdNode;
  @Input() graph: Map<string, JsonLdNode> = new Map();

  impacts: ImpactEntry[] = [];
  footprintLabel = 'Life Cycle Assessment';
  methodologyName: string | null = null;

  readonly handledUris = [
    `${NS}hasLCAResult`,
    `${NS}hasLCIAResult`,
    `${NS}hasInventoryIndicatorResult`,
    `${NS}forLCIAOrInventoryMethod`,
    `${NS}hasModuleValue`,
    `${NS}impactCategory`,
    `${NS}hasUnit`,
    `${NS}forModule`,
    `${NS}forScenario`,
    `${NS}amount`,
    `${NS}isDeclared`,
    `${NS}methodology`,
  ];

  constructor(private readonly registry: OntologyRegistryService) { }

  ngOnChanges(): void {
    this.resolveFootprintLabel();
    this.buildImpacts();
    this.resolveMethodology();
  }

  get extraUris(): string[] {
    const handled = new Set(this.handledUris);
    return extractPropertyUris(this.node).filter(uri => !handled.has(uri));
  }

  private resolveFootprintLabel(): void {
    const types = (this.node['@type'] as string[]) ?? [];
    this.footprintLabel = types.length > 0
      ? this.registry.getLabel(types[0])
      : 'Life Cycle Assessment';
  }

  private buildImpacts(): void {
    this.impacts = [];

    for (const result of this.resultNodes()) {
      const method = this.collectLinked(result, [`${NS}forLCIAOrInventoryMethod`])[0];
      const category = method
        ? this.collectLinked(method, [`${NS}impactCategory`])[0]
        : undefined;
      const categoryLabel = this.labelFromNode(category) ?? this.labelFromNode(result) ?? 'LCA Result';
      const methodLabel = this.labelFromNode(method) ?? this.labelFromNode(result) ?? 'LCA Result';
      const moduleValues = this.collectLinked(result, [`${NS}hasModuleValue`]);

      if (moduleValues.length === 0) {
        this.impacts.push({
          categoryLabel,
          indicatorLabel: methodLabel,
          value: null,
          unit: this.unitLabel(method),
          method: this.labelFromNode(method),
        });
        continue;
      }

      for (const moduleValue of moduleValues) {
        const module = this.collectLinked(moduleValue, [`${NS}forModule`])[0];
        const moduleLabel = this.labelFromNode(module);
        const scenario = extractString(moduleValue, `${NS}forScenario`);
        const amount = extractNumber(moduleValue, `${NS}amount`);
        const isDeclared = extractString(moduleValue, `${NS}isDeclared`);

        this.impacts.push({
          categoryLabel,
          indicatorLabel: [methodLabel, moduleLabel, scenario].filter(Boolean).join(' - '),
          value: amount ?? (isDeclared === 'false' ? 'Not declared' : null),
          unit: this.unitLabel(moduleValue) ?? this.unitLabel(method),
          method: this.labelFromNode(method),
        });
      }
    }
  }

  private resultNodes(): JsonLdNode[] {
    const linkedResults = this.collectLinked(this.node, [
      `${NS}hasLCAResult`,
      `${NS}hasLCIAResult`,
      `${NS}hasInventoryIndicatorResult`,
    ]);
    if (linkedResults.length > 0) return this.uniqueNodes(linkedResults);

    const hasResultData = this.collectLinked(this.node, [
      `${NS}forLCIAOrInventoryMethod`,
      `${NS}hasModuleValue`,
    ]).length > 0;
    return hasResultData ? [this.node] : [];
  }

  private unitLabel(node: JsonLdNode | undefined): string | null {
    if (!node) return null;

    const unit = this.collectLinked(node, [`${NS}hasUnit`])[0];
    return unit
      ? extractString(unit, OM2_SYMBOL) ?? this.labelFromNode(unit)
      : extractString(node, `${NS}unitAsString`) ?? null;
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

  private uniqueNodes(nodes: JsonLdNode[]): JsonLdNode[] {
    return nodes.filter((node, index) => {
      const id = node['@id'];
      return !id || nodes.findIndex(candidate => candidate['@id'] === id) === index;
    });
  }

  private labelFromNode(node: JsonLdNode | undefined): string | null {
    if (!node) return null;

    const label = extractString(node, RDFS_LABEL);
    if (label) return label;

    const id = node['@id'] as string | undefined;
    if (id) return this.registry.getLabel(id);

    const types = (node['@type'] as string[]) ?? [];
    return types.length > 0 ? this.registry.getLabel(types[0]) : null;
  }

  private resolveMethodology(): void {
    const method = this.resultNodes()
      .flatMap(result => this.collectLinked(result, [`${NS}forLCIAOrInventoryMethod`]))[0];
    const methodology = method
      ? this.collectLinked(method, [`${NS}methodology`])[0]
      : undefined;
    this.methodologyName = this.labelFromNode(methodology);
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
