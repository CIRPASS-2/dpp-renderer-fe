import { Component, Input, OnChanges } from '@angular/core';
import { EUDPP_NS } from '../../../common/cirpass-dpp-ontology';
import { extractNodes, extractString, extractStrings, isIriOnlyRef, JsonLdNode } from '../../rendering-models';
import { DividerModule } from 'primeng/divider';
import { QuantitativePropertyRendererComponent } from '../quantitative-property-renderer/quantitative-property-renderer.component';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';

const NS = EUDPP_NS;


@Component({
  selector: 'app-substance-renderer',
  imports: [DividerModule,TagModule,CardModule,QuantitativePropertyRendererComponent],
  templateUrl: './substance-renderer.component.html',
  styleUrl: './substance-renderer.component.css'
})
export class SubstanceRendererComponent implements OnChanges {
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

  get isSoC(): boolean {
    const types = (this.resolvedNode['@type'] as string[]) ?? [];
    return types.includes(`${NS}SubstanceOfConcern`);
  }

  get displayName(): string {
    return (
      extractString(this.resolvedNode, `${NS}usualName`) ??
      extractString(this.resolvedNode, `${NS}nameCAS`) ??
      extractString(this.resolvedNode, `${NS}nameIUPAC`) ??
      'Substance'
    );
  }

  get casNumber()    { return extractString(this.resolvedNode, `${NS}numberCAS`); }
  get ecNumber()     { return extractString(this.resolvedNode, `${NS}numberEC`); }
  get abbreviation() { return extractString(this.resolvedNode, `${NS}abbreviation`); }
  get iupacName()    { return extractString(this.resolvedNode, `${NS}nameIUPAC`); }
  get casName()      { return extractString(this.resolvedNode, `${NS}nameCAS`); }
  get tradeName()    { return extractString(this.resolvedNode, `${NS}tradeName`); }
  get otherNames()   { return extractStrings(this.resolvedNode, `${NS}otherName`); }
  get location()     { return extractString(this.resolvedNode, `${NS}substanceLocation`); }
  get envImpact()    { return extractString(this.resolvedNode, `${NS}hasImpactOnEnvironment`); }
  get healthImpact() { return extractString(this.resolvedNode, `${NS}hasImpactOnHumanHealth`); }

  get concentrationNodes(): JsonLdNode[] {
    return extractNodes(this.resolvedNode, `${NS}hasConcentration`).map(n => {
      const id = n['@id'] as string | undefined;
      return (id ? this.graph.get(id) : undefined) ?? n;
    });
  }

  get thresholdNodes(): JsonLdNode[] {
    return extractNodes(this.resolvedNode, `${NS}hasThreshold`).map(n => {
      const id = n['@id'] as string | undefined;
      return (id ? this.graph.get(id) : undefined) ?? n;
    });
  }

  get lifeCycleStages(): string[] {
    const stageNodes = extractNodes(this.resolvedNode, `${NS}hasLifeCycleStage`);
    return stageNodes.map(n =>
      extractString(n, `${NS}value`) ??
      (n['@id'] as string | undefined)?.split('#').pop() ??
      'unknown stage'
    );
  }
}
