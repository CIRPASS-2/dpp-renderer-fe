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
import { EUDPP_NS } from '../../../common/cirpass-dpp-ontology';
import { extractNodes, extractNumber, extractString, JsonLdNode } from '../../rendering-models';
import { OntologyRegistryService } from '../ontology-registry.service';

const NS = EUDPP_NS;

/**
 * Component for rendering quantitative property measurements with units and tolerances.
 * Supports numerical values, string values, measurement units, and category-based styling.
 */
@Component({
  selector: 'app-quantitative-property-renderer',
  imports: [],
  templateUrl: './quantitative-property-renderer.component.html',
  styleUrl: './quantitative-property-renderer.component.css'
})
export class QuantitativePropertyRendererComponent {
  @Input({ required: true }) node!: JsonLdNode;

  constructor(private registry: OntologyRegistryService) { }

  /**
   * Gets the human-readable type name for this property.
   * @returns Localized label for the property type or 'Property' as fallback
   */
  get typeName(): string {
    const types = (this.node['@type'] as string[]) ?? [];
    return types.length > 0 ? this.registry.getLabel(types[0]) : 'Property';
  }

  /** Gets the numerical value of the property */
  get numValue(): number | undefined {
    return extractNumber(this.node, `${NS}numericalValue`);
  }

  /** Gets the string value of the property */
  get strValue(): string | undefined {
    return extractString(this.node, `${NS}value`);
  }

  /**
   * Gets the measurement unit for this property.
   * @returns Unit string from measurement unit node, or unit IRI if no value found
   */
  get unit(): string | undefined {
    const unitNodes = extractNodes(this.node, `${NS}hasMeasurementUnit`);
    if (unitNodes.length > 0) {
      return extractString(unitNodes[0], `${NS}value`) ?? unitNodes[0]['@id'] as string | undefined;
    }
    return undefined;
  }

  /** Gets the tolerance value for the measurement */
  get tolerance(): number | undefined {
    return extractNumber(this.node, `${NS}tolerance`);
  }

  /** Gets the dictionary reference identifier */
  get dictRef(): string | undefined {
    return extractString(this.node, `${NS}dictionaryReference`);
  }

  /**
   * Gets the CSS class for category-based styling.
   * Analyzes property types to assign appropriate visual styling.
   * @returns CSS class name for styling (cat-dimension, cat-environment, etc.)
   */
  get categoryClass(): string {
    const types = (this.node['@type'] as string[]) ?? [];
    if (types.some(t => t.includes('Dimension') || t.includes('Height') || t.includes('Width') || t.includes('Length') || t.includes('Volume') || t.includes('Weight')))
      return 'cat-dimension';
    if (types.some(t => t.includes('Footprint') || t.includes('Emission') || t.includes('Pollution') || t.includes('Plastics')))
      return 'cat-environment';
    if (types.some(t => t.includes('Resource') || t.includes('Consumption') || t.includes('LandUse')))
      return 'cat-resource';
    if (types.some(t => t.includes('Waste')))
      return 'cat-waste';
    if (types.some(t => t.includes('Circular') || t.includes('Rate') || t.includes('Recycl')))
      return 'cat-circular';
    if (types.some(t => t.includes('Quality') || t.includes('Durability') || t.includes('Reliability')))
      return 'cat-quality';
    return 'cat-default';
  }
}

