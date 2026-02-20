import { Component, Input, OnInit } from '@angular/core';
import { EUDPP_NS } from '../../../common/cirpass-dpp-ontology';
import { extractNodes, extractNumber, extractString, JsonLdNode, JsonLdValue } from '../../rendering-models';
import { OntologyRegistryService } from '../ontology-registry.service';

const NS = EUDPP_NS;


@Component({
  selector: 'app-quantitative-property-renderer',
  imports: [],
  templateUrl: './quantitative-property-renderer.component.html',
  styleUrl: './quantitative-property-renderer.component.css'
})
export class QuantitativePropertyRendererComponent {
  @Input({ required: true }) node!: JsonLdNode;

  constructor(private registry: OntologyRegistryService) {}

  get typeName(): string {
    const types = (this.node['@type'] as string[]) ?? [];
    return types.length > 0 ? this.registry.getLabel(types[0]) : 'Property';
  }

  get numValue(): number | undefined {
    return extractNumber(this.node, `${NS}numericalValue`);
  }

  get strValue(): string | undefined {
    return extractString(this.node, `${NS}value`);
  }

  get unit(): string | undefined {
    const unitNodes = extractNodes(this.node, `${NS}hasMeasurementUnit`);
    if (unitNodes.length > 0) {
      return extractString(unitNodes[0], `${NS}value`) ?? unitNodes[0]['@id'] as string | undefined;
    }
    return undefined;
  }

  get tolerance(): number | undefined {
    return extractNumber(this.node, `${NS}tolerance`);
  }

  get dictRef(): string | undefined {
    return extractString(this.node, `${NS}dictionaryReference`);
  }

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

