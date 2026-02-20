import { Component, Input } from '@angular/core';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { FieldsetModule } from 'primeng/fieldset';
import { EUDPP_NS } from '../../../common/cirpass-dpp-ontology';
import { LabelPipe } from '../../../common/label-pipe';
import { extractPropertyUris, extractString, JsonLdNode } from '../../rendering-models';
import { AbstractRendererComponent } from '../abstract-renderer/abstract-renderer.component';

const NS = EUDPP_NS;


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

  get name() { return extractString(this.node, `${NS}productName`); }
  get imageUrl() { return extractString(this.node, `${NS}productImage`); }
  get description() { return extractString(this.node, `${NS}description`); }
  get productId() { return extractString(this.node, `${NS}uniqueProductID`); }
  get gtin() { return extractString(this.node, `${NS}GTIN`); }

  get scalarFields(): { uri: string; value: string }[] {
    const skip = new Set([
      `${NS}productName`, `${NS}productImage`, `${NS}description`, `${NS}uniqueProductID`, `${NS}GTIN`,
    ]);
    return this.knownUris
      .filter(uri => !skip.has(uri))
      .map(uri => ({ uri, value: extractString(this.node, uri) ?? '' }))
      .filter(f => f.value);
  }

  get extraUris(): string[] {
    const known = new Set(this.knownUris);
    return extractPropertyUris(this.node).filter(u => !known.has(u));
  }
}