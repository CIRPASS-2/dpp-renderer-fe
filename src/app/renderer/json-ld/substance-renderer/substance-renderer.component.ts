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
import { TagModule } from 'primeng/tag';
import { EUDPP_NS } from '../../../common/cirpass-dpp-ontology';
import { extractNodes, extractString, extractStrings, isIriOnlyRef, JsonLdNode } from '../../rendering-models';
import { QuantitativePropertyRendererComponent } from '../quantitative-property-renderer/quantitative-property-renderer.component';

const NS = EUDPP_NS;

/**
 * Component for rendering substance information including chemicals and substances of concern.
 * Displays substance properties, concentrations, thresholds, and environmental/health impacts.
 */
@Component({
  selector: 'app-substance-renderer',
  imports: [DividerModule, TagModule, CardModule, QuantitativePropertyRendererComponent],
  templateUrl: './substance-renderer.component.html',
  styleUrl: './substance-renderer.component.css'
})
export class SubstanceRendererComponent implements OnChanges {
  @Input({ required: true }) node!: JsonLdNode;
  @Input() graph: Map<string, JsonLdNode> = new Map();

  private resolvedNode!: JsonLdNode;

  ngOnChanges(): void {
    if (isIriOnlyRef(this.node) && this.node['@id']) {
      this.resolvedNode = this.graph.get(this.node['@id'] as string) ?? this.node;
    } else {
      this.resolvedNode = this.node;
    }
  }

  /**
   * Determines if this substance is classified as a Substance of Concern (SoC).
   * @returns True if the substance is a SubstanceOfConcern type
   */
  get isSoC(): boolean {
    const types = (this.resolvedNode['@type'] as string[]) ?? [];
    return types.includes(`${NS}SubstanceOfConcern`);
  }

  /**
   * Gets the primary display name for the substance.
   * Falls back through usual name, CAS name, IUPAC name, or 'Substance'.
   * @returns The most appropriate display name
   */
  get displayName(): string {
    return (
      extractString(this.resolvedNode, `${NS}usualName`) ??
      extractString(this.resolvedNode, `${NS}nameCAS`) ??
      extractString(this.resolvedNode, `${NS}nameIUPAC`) ??
      'Substance'
    );
  }

  /** Gets the CAS registry number for the substance */
  get casNumber() { return extractString(this.resolvedNode, `${NS}numberCAS`); }
  /** Gets the EC (European Community) number for the substance */
  get ecNumber() { return extractString(this.resolvedNode, `${NS}numberEC`); }
  /** Gets the abbreviated name/symbol for the substance */
  get abbreviation() { return extractString(this.resolvedNode, `${NS}abbreviation`); }
  /** Gets the IUPAC (International Union of Pure and Applied Chemistry) name */
  get iupacName() { return extractString(this.resolvedNode, `${NS}nameIUPAC`); }
  /** Gets the CAS (Chemical Abstracts Service) name */
  get casName() { return extractString(this.resolvedNode, `${NS}nameCAS`); }
  /** Gets the commercial/trade name */
  get tradeName() { return extractString(this.resolvedNode, `${NS}tradeName`); }
  /** Gets array of alternative names for the substance */
  get otherNames() { return extractStrings(this.resolvedNode, `${NS}otherName`); }
  /** Gets the location/context where the substance is found */
  get location() { return extractString(this.resolvedNode, `${NS}substanceLocation`); }
  /** Gets the environmental impact assessment */
  get envImpact() { return extractString(this.resolvedNode, `${NS}hasImpactOnEnvironment`); }
  /** Gets the human health impact assessment */
  get healthImpact() { return extractString(this.resolvedNode, `${NS}hasImpactOnHumanHealth`); }

  /**
   * Gets resolved concentration measurement nodes for the substance.
   * @returns Array of JSON-LD nodes containing concentration data
   */
  get concentrationNodes(): JsonLdNode[] {
    return extractNodes(this.resolvedNode, `${NS}hasConcentration`).map(n => {
      const id = n['@id'] as string | undefined;
      return (id ? this.graph.get(id) : undefined) ?? n;
    });
  }

  /**
   * Gets resolved threshold limit nodes for the substance.
   * @returns Array of JSON-LD nodes containing threshold data
   */
  get thresholdNodes(): JsonLdNode[] {
    return extractNodes(this.resolvedNode, `${NS}hasThreshold`).map(n => {
      const id = n['@id'] as string | undefined;
      return (id ? this.graph.get(id) : undefined) ?? n;
    });
  }

  /**
   * Gets the life cycle stages where this substance is relevant.
   * @returns Array of life cycle stage names
   */
  get lifeCycleStages(): string[] {
    const stageNodes = extractNodes(this.resolvedNode, `${NS}hasLifeCycleStage`);
    return stageNodes.map(n =>
      extractString(n, `${NS}value`) ??
      (n['@id'] as string | undefined)?.split('#').pop() ??
      'unknown stage'
    );
  }
}
