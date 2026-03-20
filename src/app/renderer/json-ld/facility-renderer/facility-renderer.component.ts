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
import { EUDPP_NS } from '../../../common/cirpass-dpp-ontology';
import { JsonLdNode, extractString, extractStrings, isIriOnlyRef } from '../../rendering-models';

const NS = EUDPP_NS;

/**
 * Component for rendering facility information including IDs and associated actors.
 * Displays facility identifiers and the actors that use the facility.
 */
@Component({
  selector: 'app-facility-renderer',
  imports: [CardModule],
  templateUrl: './facility-renderer.component.html',
  styleUrl: './facility-renderer.component.css'
})
export class FacilityRendererComponent implements OnChanges {
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

  /** Checks if the node is an IRI-only reference without full data */
  get isIriOnly(): boolean { return isIriOnlyRef(this.resolvedNode ?? this.node); }

  /**
   * Gets a shortened version of the IRI for display purposes.
   * @returns Truncated IRI showing last 40 characters if longer than 50
   */
  get shortIri(): string {
    const id = this.node['@id'] as string ?? '';
    return id.length > 50 ? '…' + id.slice(-40) : id;
  }

  /**
   * Gets the display identifier for the facility.
   * @returns Unique facility ID or facility ID, undefined if neither exists
   */
  get displayId(): string | undefined {
    return extractString(this.resolvedNode, `${NS}uniqueFacilityID`) ??
      extractString(this.resolvedNode, `${NS}facilityID`);
  }

  /**
   * Gets the list of actors that use this facility.
   * @returns Array of actor identifiers
   */
  get actors(): string[] {
    return extractStrings(this.resolvedNode, `${NS}isUsedByActor`);
  }
}

