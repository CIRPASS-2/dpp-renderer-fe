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
import { EUDPP_NS, SCHEMA_NS } from '../../../common/cirpass-dpp-ontology';
import { JsonLdNode, extractNodes, extractPropertyUris, extractString, isIriOnlyRef } from '../../rendering-models';
import { AbstractRendererComponent } from '../abstract-renderer/abstract-renderer.component';

const NS = EUDPP_NS;
const SCHEMA = SCHEMA_NS;

interface Coordinates {
  latitude?: string;
  longitude?: string;
}

/**
 * Component for rendering facility information including IDs and associated actors.
 * Displays facility identifiers and the actors that use the facility.
 */
@Component({
  selector: 'app-facility-renderer',
  imports: [CardModule, DividerModule, AbstractRendererComponent],
  templateUrl: './facility-renderer.component.html',
  styleUrl: './facility-renderer.component.css'
})
export class FacilityRendererComponent implements OnChanges {
  @Input({ required: true }) node!: JsonLdNode;
  @Input() graph: Map<string, JsonLdNode> = new Map();

  readonly identifierSkipUris = [`${NS}identifierValue`];

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

  get facilityIdentifier(): JsonLdNode | undefined {
    return this.resolve(extractNodes(this.resolvedNode, `${NS}hasUniqueFacilityIdentifier`)[0]);
  }

  /**
   * Gets the display identifier for the facility.
   * @returns Unique facility identifier value, undefined when unavailable
   */
  get displayId(): string | undefined {
    return this.facilityIdentifier
      ? extractString(this.facilityIdentifier, `${NS}identifierValue`)
      : undefined;
  }

  get identifierExtraUris(): string[] {
    return this.facilityIdentifier
      ? extractPropertyUris(this.facilityIdentifier).filter(uri => !this.identifierSkipUris.includes(uri))
      : [];
  }

  /**
   * Gets the list of actors that use this facility.
   * Includes explicit isUsedByActor links and reverse usesFacility links in the graph.
   */
  get actors(): JsonLdNode[] {
    const directActors = extractNodes(this.resolvedNode, `${NS}isUsedByActor`);
    const facilityId = this.resolvedNode['@id'] as string | undefined;
    const reverseActors = facilityId
      ? Array.from(this.graph.values()).filter(actor =>
        extractNodes(actor, `${NS}usesFacility`).some(facility => facility['@id'] === facilityId)
      )
      : [];
    const actors = [...directActors, ...reverseActors]
      .map(actor => this.resolve(actor) ?? actor);

    return actors.filter((actor, index) => {
      const actorId = actor['@id'];
      return !actorId || actors.findIndex(candidate => candidate['@id'] === actorId) === index;
    });
  }

  /** Gets the facility address formatted from a schema:PostalAddress node. */
  get postalAddress(): string | undefined {
    const address = this.resolve(extractNodes(this.resolvedNode, `${SCHEMA}address`)[0]);
    if (!address) return undefined;

    const locality = [
      extractString(address, `${SCHEMA}postalCode`),
      extractString(address, `${SCHEMA}addressLocality`),
    ].filter(Boolean).join(' ');
    const formatted = [
      extractString(address, `${SCHEMA}streetAddress`),
      locality,
      extractString(address, `${SCHEMA}addressCountry`),
    ].filter(Boolean).join(', ');
    return formatted || undefined;
  }

  get coordinates(): Coordinates | undefined {
    const geo = this.resolve(extractNodes(this.resolvedNode, `${SCHEMA}geo`)[0]);
    if (!geo) return undefined;

    const latitude = extractString(geo, `${SCHEMA}latitude`);
    const longitude = extractString(geo, `${SCHEMA}longitude`);
    return latitude || longitude ? { latitude, longitude } : undefined;
  }

  /** Gets a concise display name for a linked actor. */
  actorLabel(actor: JsonLdNode): string {
    return extractString(actor, `${NS}actorName`) ??
      extractString(actor, `${NS}registeredTradeName`) ??
      (actor['@id'] as string | undefined) ??
      'Actor';
  }

  private resolve(node: JsonLdNode | undefined): JsonLdNode | undefined {
    if (node && isIriOnlyRef(node) && node['@id']) {
      return this.graph.get(node['@id']) ?? node;
    }
    return node;
  }
}

