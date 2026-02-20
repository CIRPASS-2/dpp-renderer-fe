import { Component, Input, OnChanges } from '@angular/core';
import { EUDPP_NS } from '../../../common/cirpass-dpp-ontology';
import { JsonLdNode, isIriOnlyRef, extractString, extractStrings } from '../../rendering-models';
import { CardModule } from 'primeng/card';

const NS = EUDPP_NS;

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

  get isIriOnly(): boolean { return isIriOnlyRef(this.resolvedNode ?? this.node); }

  get shortIri(): string {
    const id = this.node['@id'] as string ?? '';
    return id.length > 50 ? '…' + id.slice(-40) : id;
  }

  get displayId(): string | undefined {
    return extractString(this.resolvedNode, `${NS}uniqueFacilityID`) ??
           extractString(this.resolvedNode, `${NS}facilityID`);
  }

  get actors(): string[] {
    return extractStrings(this.resolvedNode, `${NS}isUsedByActor`);
  }
}

