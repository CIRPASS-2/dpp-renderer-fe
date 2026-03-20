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
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { EUDPP_NS } from '../../../common/cirpass-dpp-ontology';
import { JsonLdNode, extractNodes, extractString, extractStrings, isIriOnlyRef } from '../../rendering-models';


const NS = EUDPP_NS;

interface RoleInfo {
  uri: string;
  label: string;
}

/**
 * Component for rendering actor information including legal and natural persons.
 * Displays actor details, roles, contacts, and associated facilities with role-based styling.
 */
@Component({
  selector: 'app-actor-renderer',
  imports: [CardModule, DividerModule, TagModule, TooltipModule],
  templateUrl: './actor-renderer.component.html',
  styleUrl: './actor-renderer.component.css'
})
export class ActorRendererComponent implements OnChanges {
  @Input({ required: true }) node!: JsonLdNode;
  @Input() graph: Map<string, JsonLdNode> = new Map();

  private resolvedNode!: JsonLdNode;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['node'] || changes['graph']) {
      this.resolvedNode = this.resolve(this.node);
    }
  }

  /**
   * If the input node is IRI-only, try to find the full node in the graph.
   */
  private resolve(node: JsonLdNode): JsonLdNode {
    if (isIriOnlyRef(node) && node['@id']) {
      return this.graph.get(node['@id'] as string) ?? node;
    }
    return node;
  }

  /**
   * Checks if the node is an IRI-only reference without full data.
   * @returns True if node contains only an IRI reference
   */
  get isIriOnly(): boolean {
    return isIriOnlyRef(this.resolvedNode ?? this.node);
  }

  /**
   * Gets a shortened version of the IRI for display purposes.
   * @returns Truncated IRI showing last 40 characters if longer than 50
   */
  get shortIri(): string {
    const id = this.node['@id'] as string ?? '';
    return id.length > 50 ? '…' + id.slice(-40) : id;
  }

  /**
   * Gets the primary display name for the actor.
   * Falls back through actor name, trade name, IRI, or 'Actor'.
   * @returns The most appropriate display name
   */
  get displayName(): string {
    return (
      extractString(this.resolvedNode, `${NS}actorName`) ??
      extractString(this.resolvedNode, `${NS}registeredTradeName`) ??
      this.resolvedNode['@id'] as string ??
      'Actor'
    );
  }

  /** Gets the unique operator identifier */
  get operatorId(): string | undefined {
    return extractString(this.resolvedNode, `${NS}uniqueOperatorID`);
  }

  /** Gets the registered trade name */
  get tradeName(): string | undefined {
    return extractString(this.resolvedNode, `${NS}registeredTradeName`);
  }

  /** Gets the registered trademark */
  get trademark(): string | undefined {
    return extractString(this.resolvedNode, `${NS}registeredTrademark`);
  }

  /** Gets array of electronic contact information */
  get contacts(): string[] {
    return extractStrings(this.resolvedNode, `${NS}electronicContact`);
  }

  /** Gets the postal/physical address */
  get postalAddress(): string | undefined {
    return extractString(this.resolvedNode, `${NS}postalAddress`);
  }

  /**
   * Gets the roles this actor plays in the supply chain.
   * @returns Array of role information with URIs and human-readable labels
   */
  get roles(): RoleInfo[] {
    const roleNodes = extractNodes(this.resolvedNode, `${NS}hasRole`);
    return roleNodes.map(rn => {
      const typeUri = ((rn['@type'] as string[]) ?? [])[0];
      const id = rn['@id'] as string | undefined;
      // Try to resolve the full node from graph for better type info
      const full = (id ? this.graph.get(id) : undefined) ?? rn;
      const fullType = ((full['@type'] as string[]) ?? [])[0] ?? typeUri;
      return {
        uri: fullType ?? id ?? '',
        label: fullType
          ? this.roleLabelFor(fullType)
          : (id?.split('#').pop()?.split('/').pop() ?? 'Role'),
      };
    });
  }

  private roleLabelFor(typeUri: string): string {
    const map: Record<string, string> = {
      [`${NS}ManufacturerRole`]: 'Manufacturer',
      [`${NS}ImporterRole`]: 'Importer',
      [`${NS}DistributorRole`]: 'Distributor',
      [`${NS}DealerRole`]: 'Dealer',
      [`${NS}AuthorisedRepresentativeRole`]: 'Auth. Representative',
      [`${NS}FulfilmentServiceProviderRole`]: 'Fulfilment Provider',
      [`${NS}DPPServiceProviderRole`]: 'DPP Provider',
      [`${NS}RecyclerRole`]: 'Recycler',
      [`${NS}RefurbisherRole`]: 'Refurbisher',
      [`${NS}RemanufacturerRole`]: 'Remanufacturer',
      [`${NS}ProfessionalRepairerRole`]: 'Professional Repairer',
      [`${NS}IndependentOperatorRole`]: 'Independent Operator',
      [`${NS}ConsumerRole`]: 'Consumer',
      [`${NS}EndUserRole`]: 'End User',
      [`${NS}IssuingAgencyRole`]: 'Issuing Agency',
      [`${NS}CredentialAgencyRole`]: 'Credential Agency',
      [`${NS}CustomsAuthorityRole`]: 'Customs Authority',
      [`${NS}MarketSurveillanceAuthorityRole`]: 'Market Surveillance',
      [`${NS}NotifiedBodyRole`]: 'Notified Body',
      [`${NS}ConformityAssessmentBodyRole`]: 'Conformity Assessment',
    };
    return map[typeUri] ?? typeUri.split('#').pop() ?? typeUri;
  }

  /**
   * Gets resolved facility nodes associated with this actor.
   * @returns Array of JSON-LD nodes representing facilities
   */
  get facilities(): JsonLdNode[] {
    const refs = extractNodes(this.resolvedNode, `${NS}usesFacility`);
    return refs.map(r => {
      const id = r['@id'] as string | undefined;
      return (id ? this.graph.get(id) : undefined) ?? r;
    });
  }

  /**
   * Gets a display label for a facility.
   * @param fac The facility JSON-LD node
   * @returns Human-readable facility identifier
   */
  facilityLabel(fac: JsonLdNode): string {
    return (
      extractString(fac, `${NS}uniqueFacilityID`) ??
      (fac['@id'] as string | undefined) ??
      'Facility'
    );
  }

  /**
   * Gets CSS class for styling based on actor type.
   * @returns CSS class name for legal person, natural person, or generic actor
   */
  get cardStyle(): string {
    const types = (this.resolvedNode['@type'] as string[]) ?? [];
    if (types.includes(`${NS}LegalPerson`)) return 'legal-card';
    if (types.includes(`${NS}NaturalPerson`)) return 'natural-card';
    return 'actor-card';
  }

  /**
   * Gets emoji icon representing the actor type.
   * @returns Emoji character for legal person (🏢), natural person (👤), or generic (🎭)
   */
  get personIcon(): string {
    const types = (this.resolvedNode['@type'] as string[]) ?? [];
    if (types.includes(`${NS}LegalPerson`)) return '🏢';
    if (types.includes(`${NS}NaturalPerson`)) return '👤';
    return '🎭';
  }
}