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
import { CLASS_LABELS, EUDPP_NS, SCHEMA_NS } from '../../../common/cirpass-dpp-ontology';
import { JsonLdNode, extractNodes, extractPropertyUris, extractString, extractStrings, isIriOnlyRef } from '../../rendering-models';
import { AbstractRendererComponent } from '../abstract-renderer/abstract-renderer.component';


const NS = EUDPP_NS;
const SCHEMA = SCHEMA_NS;

interface RoleInfo {
  uri: string;
  label: string;
}

interface ContactInfo {
  label: string;
  value: string;
  href: string;
}

interface RoleAssignmentInfo extends RoleInfo {
  validFrom?: string;
  validTo?: string;
  representedManufacturer?: string;
}

interface RepresentativeMandateInfo {
  representative: string;
  validFrom?: string;
  validTo?: string;
}

/**
 * Component for rendering actor information including legal and natural persons.
 * Displays actor details, roles, contacts, and associated facilities with role-based styling.
 */
@Component({
  selector: 'app-actor-renderer',
  imports: [CardModule, DividerModule, TagModule, TooltipModule, AbstractRendererComponent],
  templateUrl: './actor-renderer.component.html',
  styleUrl: './actor-renderer.component.css'
})
export class ActorRendererComponent implements OnChanges {
  @Input({ required: true }) node!: JsonLdNode;
  @Input() graph: Map<string, JsonLdNode> = new Map();

  readonly identifierSkipUris = [`${NS}identifierValue`];

  private resolvedNode!: JsonLdNode;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['node'] || changes['graph']) {
      this.resolvedNode = this.resolve(this.node) ?? this.node;
    }
  }

  /**
   * If the input node is IRI-only, try to find the full node in the graph.
   */
  private resolve(node: JsonLdNode | undefined): JsonLdNode | undefined {
    if (!node) return undefined;
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

  get operatorIdentifier(): JsonLdNode | undefined {
    return this.resolve(extractNodes(this.resolvedNode, `${NS}hasUniqueOperatorIdentifier`)[0]);
  }

  /** Gets the unique operator identifier */
  get operatorId(): string | undefined {
    return this.operatorIdentifier
      ? extractString(this.operatorIdentifier, `${NS}identifierValue`)
      : undefined;
  }

  get identifierExtraUris(): string[] {
    return this.operatorIdentifier
      ? extractPropertyUris(this.operatorIdentifier).filter(uri => !this.identifierSkipUris.includes(uri))
      : [];
  }

  /** Gets the registered trade name */
  get tradeName(): string | undefined {
    return extractString(this.resolvedNode, `${NS}registeredTradeName`);
  }

  /** Gets the registered trademark */
  get trademark(): string | undefined {
    return extractString(this.resolvedNode, `${NS}registeredTrademark`);
  }

  /** Gets the email, telephone, and website contact information */
  get contacts(): ContactInfo[] {
    return [
      ...extractStrings(this.resolvedNode, `${SCHEMA}email`).map(value => ({
        label: 'Email', value, href: `mailto:${value}`
      })),
      ...extractStrings(this.resolvedNode, `${SCHEMA}telephone`).map(value => ({
        label: 'Telephone', value, href: `tel:${value}`
      })),
      ...extractStrings(this.resolvedNode, `${SCHEMA}url`).map(value => ({
        label: 'Website', value, href: value
      }))
    ];
  }

  /** Gets the postal/physical address */
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

  /**
   * Gets the roles this actor plays in the supply chain.
   * @returns Array of role information with URIs and human-readable labels
   */
  get roles(): RoleInfo[] {
    return this.roleAssignments.map(({ uri, label }) => ({ uri, label }));
  }

  get roleAssignments(): RoleAssignmentInfo[] {
    return this.assignmentNodesForActor().flatMap(assignment =>
      extractNodes(assignment, `${NS}hasRole`).flatMap(role => {
        const resolvedRole = this.resolve(role);
        if (!resolvedRole) return [];
        const uri = (resolvedRole['@id'] as string | undefined) ??
          ((resolvedRole['@type'] as string[] | undefined) ?? [])[0] ?? '';
        const manufacturer = extractNodes(assignment, `${NS}representsManufacturer`)[0];
        const resolvedManufacturer = manufacturer ? this.resolve(manufacturer) : undefined;

        return [{
          uri,
          label: this.roleLabelFor(uri),
          validFrom: extractString(assignment, `${NS}assignmentValidFrom`),
          validTo: extractString(assignment, `${NS}assignmentValidTo`),
          representedManufacturer: resolvedManufacturer
            ? this.actorLabel(resolvedManufacturer)
            : undefined,
        }];
      })
    );
  }

  get roleAssignmentDetails(): RoleAssignmentInfo[] {
    return this.roleAssignments.filter(assignment =>
      assignment.validFrom || assignment.validTo || assignment.representedManufacturer
    );
  }

  get representativeMandates(): RepresentativeMandateInfo[] {
    const actorId = this.resolvedNode['@id'] as string | undefined;
    if (!actorId) return [];

    const directMandates = extractNodes(this.resolvedNode, `${NS}hasRepresentativeMandate`)
      .map(mandate => this.resolve(mandate))
      .filter((mandate): mandate is JsonLdNode => !!mandate);
    const inverseMandates = Array.from(this.graph.values()).filter(assignment =>
      extractNodes(assignment, `${NS}representsManufacturer`)
        .some(manufacturer => manufacturer['@id'] === actorId)
    );
    const mandates = [...directMandates, ...inverseMandates].filter((mandate, index, all) => {
      const id = mandate['@id'];
      return !id || all.findIndex(candidate => candidate['@id'] === id) === index;
    });

    return mandates.flatMap(mandate => {
      const representative = extractNodes(mandate, `${NS}hasActor`)[0];
      if (!representative) return [];
      const resolvedRepresentative = this.resolve(representative);
      if (!resolvedRepresentative) return [];

      return [{
        representative: this.actorLabel(resolvedRepresentative),
        validFrom: extractString(mandate, `${NS}assignmentValidFrom`),
        validTo: extractString(mandate, `${NS}assignmentValidTo`),
      }];
    });
  }

  private roleLabelFor(typeUri: string): string {
    return CLASS_LABELS[typeUri] ?? typeUri.split('#').pop() ?? 'Role';
  }

  private assignmentNodesForActor(): JsonLdNode[] {
    const actorId = this.resolvedNode['@id'] as string | undefined;
    if (!actorId) return [];

    return Array.from(this.graph.values()).filter(assignment =>
      extractNodes(assignment, `${NS}hasActor`).some(actor => actor['@id'] === actorId)
    );
  }

  private actorLabel(actor: JsonLdNode): string {
    return extractString(actor, `${NS}actorName`) ??
      extractString(actor, `${NS}registeredTradeName`) ??
      (actor['@id'] as string | undefined) ??
      'Actor';
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
      this.identifierValue(fac, `${NS}hasUniqueFacilityIdentifier`) ??
      (fac['@id'] as string | undefined) ??
      'Facility'
    );
  }

  private identifierValue(node: JsonLdNode, propertyUri: string): string | undefined {
    const identifier = this.resolve(extractNodes(node, propertyUri)[0]);
    return identifier ? extractString(identifier, `${NS}identifierValue`) : undefined;
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