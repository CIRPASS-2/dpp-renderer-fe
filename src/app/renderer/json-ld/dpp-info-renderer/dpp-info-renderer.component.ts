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

import { Component, Input } from '@angular/core';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { EUDPP_NS } from '../../../common/cirpass-dpp-ontology';
import { LabelPipe } from '../../../common/label-pipe';
import { extractPropertyUris, extractString, JsonLdNode } from '../../rendering-models';
import { AbstractRendererComponent } from '../abstract-renderer/abstract-renderer.component';

const NS = EUDPP_NS;

type StatusSeverity = 'success' | 'warning' | 'danger' | 'info';



/**
 * Component for rendering DPP (Digital Product Passport) metadata and administrative information.
 * Displays passport status, validity, issuer details, and compliance information with visual status indicators.
 */
@Component({
  selector: 'app-dpp-info-renderer',
  imports: [TagModule, DividerModule, LabelPipe, AbstractRendererComponent, CardModule],
  templateUrl: './dpp-info-renderer.component.html',
  styleUrl: './dpp-info-renderer.component.css'
})
export class DppInfoRendererComponent {
  @Input({ required: true }) node!: JsonLdNode;
  @Input() graph: Map<string, JsonLdNode> = new Map();

  readonly nsUniqueId = `${NS}uniqueDPPID`;

  readonly knownUris = [
    `${NS}uniqueDPPID`, `${NS}status`, `${NS}schemaVersion`,
    `${NS}validFrom`, `${NS}validUntil`, `${NS}lastUpdate`,
    `${NS}linkToPreviousDPP`,
  ];

  /** Gets the unique DPP identifier */
  get dppId() { return extractString(this.node, `${NS}uniqueDPPID`); }

  /** Gets the current status of the DPP */
  get status() { return extractString(this.node, `${NS}status`); }

  /**
   * Gets the visual severity for the status tag based on the status value.
   * Active = success (green), Inactive = warning (yellow), Revoked = danger (red)
   */
  get statusSeverity(): StatusSeverity {
    switch ((this.status ?? '').toLowerCase()) {
      case 'active': return 'success';
      case 'inactive': return 'warning';
      case 'revoked': return 'danger';
      default: return 'info';
    }
  }

  /**
   * Gets the metadata fields for the DPP (excluding ID and status).
   * Returns fields like schema version, validity dates, and previous DPP links.
   */
  get metaFields(): { uri: string; value: string }[] {
    const skip = new Set([`${NS}uniqueDPPID`, `${NS}status`]);
    return this.knownUris
      .filter(uri => !skip.has(uri))
      .map(uri => ({ uri, value: extractString(this.node, uri) ?? '' }))
      .filter(f => f.value);
  }

  /** Gets extra URIs that are not part of the known metadata fields */
  get extraUris(): string[] {
    const known = new Set(this.knownUris);
    return extractPropertyUris(this.node).filter(u => !known.has(u));
  }

  /**
   * Determines if a value is a link that should be rendered as a hyperlink.
   * @param value The value to check
   * @returns True if the value is an HTTP or HTTPS URL
   */
  isLink(value: string): boolean {
    return value.startsWith('http://') || value.startsWith('https://');
  }
}
