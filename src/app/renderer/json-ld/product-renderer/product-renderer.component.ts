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
import { FieldsetModule } from 'primeng/fieldset';
import { EUDPP_NS } from '../../../common/cirpass-dpp-ontology';
import { LabelPipe } from '../../../common/label-pipe';
import { extractPropertyUris, extractString, JsonLdNode } from '../../rendering-models';
import { AbstractRendererComponent } from '../abstract-renderer/abstract-renderer.component';

const NS = EUDPP_NS;

/**
 * Component for rendering product information including name, description, IDs, and additional properties.
 * Displays core product metadata with extensible rendering for unknown properties.
 */
@Component({
  selector: 'app-product-renderer',
  imports: [LabelPipe, FieldsetModule, CardModule, DividerModule, AbstractRendererComponent],
  templateUrl: './product-renderer.component.html',
  styleUrl: './product-renderer.component.css'
})
export class ProductRendererComponent {
  @Input({ required: true }) node!: JsonLdNode;
  @Input() graph: Map<string, JsonLdNode> = new Map();

  readonly knownUris = [
    `${NS}productName`, `${NS}productImage`, `${NS}description`,
    `${NS}uniqueProductID`, `${NS}GTIN`, `${NS}commodityCode`,
    `${NS}isEnergyRelated`, `${NS}granularity`,
  ];

  /** Gets the product name */
  get name() { return extractString(this.node, `${NS}productName`); }
  /** Gets the product image URL */
  get imageUrl() { return extractString(this.node, `${NS}productImage`); }
  /** Gets the product description */
  get description() { return extractString(this.node, `${NS}description`); }
  /** Gets the unique product identifier */
  get productId() { return extractString(this.node, `${NS}uniqueProductID`); }
  /** Gets the Global Trade Item Number */
  get gtin() { return extractString(this.node, `${NS}GTIN`); }

  /**
   * Gets scalar fields for display excluding the main product identifiers.
   * @returns Array of URI-value pairs for additional product properties
   */
  get scalarFields(): { uri: string; value: string }[] {
    const skip = new Set([
      `${NS}productName`, `${NS}productImage`, `${NS}description`, `${NS}uniqueProductID`, `${NS}GTIN`,
    ]);
    return this.knownUris
      .filter(uri => !skip.has(uri))
      .map(uri => ({ uri, value: extractString(this.node, uri) ?? '' }))
      .filter(f => f.value);
  }

  /**
   * Gets property URIs not handled by known rendering logic.
   * @returns Array of unknown property URIs for abstract rendering
   */
  get extraUris(): string[] {
    const known = new Set(this.knownUris);
    return extractPropertyUris(this.node).filter(u => !known.has(u));
  }
}