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
import { EUDPP_NS } from '../../../common/cirpass-dpp-ontology';
import { LabelPipe } from '../../../common/label-pipe';
import {
  JsonLdNode,
  JsonLdPropertyValue,
  extractPropertyUris,
  extractString,
  isIriOnlyRef,
  isJsonLdNode,
  isJsonLdValue,
} from '../../rendering-models';
import { AbstractRendererComponent } from '../abstract-renderer/abstract-renderer.component';
import { OntologyRegistryService } from '../ontology-registry.service';

const NS = EUDPP_NS;
const RDFS_LABEL = 'http://www.w3.org/2000/01/rdf-schema#label';
const DCTERMS_TITLE = 'http://purl.org/dc/terms/title';

interface EventValue {
  text: string;
  href?: string;
}

interface EventField {
  uri: string;
  values: EventValue[];
}

@Component({
  selector: 'app-event-renderer',
  imports: [CardModule, DividerModule, LabelPipe, AbstractRendererComponent],
  templateUrl: './event-renderer.component.html',
  styleUrl: './event-renderer.component.css',
})
export class EventRendererComponent implements OnChanges {
  @Input({ required: true }) node!: JsonLdNode;
  @Input() graph: Map<string, JsonLdNode> = new Map();

  readonly knownUris = [
    `${NS}eventIdentifier`,
    `${NS}eventTime`,
    `${NS}eventTimeZoneOffset`,
    `${NS}recordedAt`,
    `${NS}dppEventRecordIdentifier`,
    `${NS}dppEventRecordedAt`,
    `${NS}recordedInSystem`,
    `${NS}recordedInSystemName`,
    `${NS}hasActionType`,
    `${NS}hasDPPActionType`,
    `${NS}hasBusinessStep`,
    `${NS}hasDisposition`,
    `${NS}hasProductEvent`,
    `${NS}isRepresentedByCarrier`,
    `${NS}isTriggeredByProductEvent`,
    `${NS}triggersDPPEvent`,
    `${NS}recordsDPPEvent`,
    `${NS}isRecordedAs`,
  ];

  private resolvedNode!: JsonLdNode;

  constructor(private readonly registry: OntologyRegistryService) { }

  ngOnChanges(): void {
    this.resolvedNode = this.resolve(this.node);
  }

  get title(): string {
    const types = (this.currentNode['@type'] as string[]) ?? [];
    return types.length > 0 ? this.registry.getLabel(types[0]) : 'Event';
  }

  get eventId(): string | undefined {
    return extractString(this.currentNode, `${NS}eventIdentifier`) ??
      extractString(this.currentNode, `${NS}dppEventRecordIdentifier`);
  }

  get summaryFields(): EventField[] {
    return this.knownUris
      .map(uri => ({ uri, values: this.valuesFor(uri) }))
      .filter(field => field.values.length > 0);
  }

  get extraUris(): string[] {
    const known = new Set(this.knownUris);
    return extractPropertyUris(this.currentNode).filter(uri => !known.has(uri));
  }

  isLink(value: EventValue): boolean {
    return Boolean(value.href);
  }

  get currentNode(): JsonLdNode {
    return this.resolvedNode ?? this.node;
  }

  private valuesFor(uri: string): EventValue[] {
    const values = this.currentNode[uri] as JsonLdPropertyValue | undefined;
    if (!Array.isArray(values)) return [];

    return values.flatMap(value => {
      if (isJsonLdValue(value)) {
        const text = String(value['@value']);
        return text ? [{ text, href: this.httpUrl(text) ? text : undefined }] : [];
      }

      if (isJsonLdNode(value)) {
        const resolved = this.resolve(value);
        const href = resolved['@id'] as string | undefined;
        const text = this.labelFromNode(resolved);
        return text ? [{ text, href }] : [];
      }

      return [];
    });
  }

  private labelFromNode(node: JsonLdNode): string | undefined {
    const label = extractString(node, RDFS_LABEL) ??
      extractString(node, DCTERMS_TITLE) ??
      extractString(node, `${NS}productName`) ??
      extractString(node, `${NS}actorName`) ??
      extractString(node, `${NS}identifierValue`);
    if (label) return label;

    const types = (node['@type'] as string[]) ?? [];
    if (types.length > 0) return this.registry.getLabel(types[0]);

    const id = node['@id'] as string | undefined;
    return id ? this.registry.getLabel(id) : undefined;
  }

  private resolve(node: JsonLdNode): JsonLdNode {
    if (isIriOnlyRef(node) && node['@id']) {
      return this.graph.get(node['@id'] as string) ?? node;
    }
    return node;
  }

  private httpUrl(value: string): boolean {
    return value.startsWith('http://') || value.startsWith('https://');
  }
}