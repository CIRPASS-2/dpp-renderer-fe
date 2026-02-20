import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { EUDPP_NS } from '../../../common/cirpass-dpp-ontology';
import { JsonLdNode, isIriOnlyRef, extractString, extractStrings, extractNodes } from '../../rendering-models';
import { DividerModule } from 'primeng/divider';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';


const NS = EUDPP_NS;

interface RoleInfo {
  uri: string;
  label: string;
}

@Component({
  selector: 'app-actor-renderer',
  imports: [CardModule,DividerModule,TagModule,TooltipModule],
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

  get isIriOnly(): boolean {
    return isIriOnlyRef(this.resolvedNode ?? this.node);
  }

  get shortIri(): string {
    const id = this.node['@id'] as string ?? '';
    return id.length > 50 ? '…' + id.slice(-40) : id;
  }

  get displayName(): string {
    return (
      extractString(this.resolvedNode, `${NS}actorName`) ??
      extractString(this.resolvedNode, `${NS}registeredTradeName`) ??
      this.resolvedNode['@id'] as string ??
      'Actor'
    );
  }

  get operatorId(): string | undefined {
    return extractString(this.resolvedNode, `${NS}uniqueOperatorID`);
  }

  get tradeName(): string | undefined {
    return extractString(this.resolvedNode, `${NS}registeredTradeName`);
  }

  get trademark(): string | undefined {
    return extractString(this.resolvedNode, `${NS}registeredTrademark`);
  }

  get contacts(): string[] {
    return extractStrings(this.resolvedNode, `${NS}electronicContact`);
  }

  get postalAddress(): string | undefined {
    return extractString(this.resolvedNode, `${NS}postalAddress`);
  }

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
      [`${NS}ManufacturerRole`]:              'Manufacturer',
      [`${NS}ImporterRole`]:                  'Importer',
      [`${NS}DistributorRole`]:               'Distributor',
      [`${NS}DealerRole`]:                    'Dealer',
      [`${NS}AuthorisedRepresentativeRole`]:  'Auth. Representative',
      [`${NS}FulfilmentServiceProviderRole`]: 'Fulfilment Provider',
      [`${NS}DPPServiceProviderRole`]:        'DPP Provider',
      [`${NS}RecyclerRole`]:                  'Recycler',
      [`${NS}RefurbisherRole`]:               'Refurbisher',
      [`${NS}RemanufacturerRole`]:            'Remanufacturer',
      [`${NS}ProfessionalRepairerRole`]:      'Professional Repairer',
      [`${NS}IndependentOperatorRole`]:       'Independent Operator',
      [`${NS}ConsumerRole`]:                  'Consumer',
      [`${NS}EndUserRole`]:                   'End User',
      [`${NS}IssuingAgencyRole`]:             'Issuing Agency',
      [`${NS}CredentialAgencyRole`]:          'Credential Agency',
      [`${NS}CustomsAuthorityRole`]:          'Customs Authority',
      [`${NS}MarketSurveillanceAuthorityRole`]:'Market Surveillance',
      [`${NS}NotifiedBodyRole`]:              'Notified Body',
      [`${NS}ConformityAssessmentBodyRole`]:  'Conformity Assessment',
    };
    return map[typeUri] ?? typeUri.split('#').pop() ?? typeUri;
  }

  get facilities(): JsonLdNode[] {
    const refs = extractNodes(this.resolvedNode, `${NS}usesFacility`);
    return refs.map(r => {
      const id = r['@id'] as string | undefined;
      return (id ? this.graph.get(id) : undefined) ?? r;
    });
  }

  facilityLabel(fac: JsonLdNode): string {
    return (
      extractString(fac, `${NS}uniqueFacilityID`) ??
      (fac['@id'] as string | undefined) ??
      'Facility'
    );
  }

  get cardStyle(): string {
    const types = (this.resolvedNode['@type'] as string[]) ?? [];
    if (types.includes(`${NS}LegalPerson`))  return 'legal-card';
    if (types.includes(`${NS}NaturalPerson`)) return 'natural-card';
    return 'actor-card';
  }

  get personIcon(): string {
    const types = (this.resolvedNode['@type'] as string[]) ?? [];
    if (types.includes(`${NS}LegalPerson`))  return '🏢';
    if (types.includes(`${NS}NaturalPerson`)) return '👤';
    return '🎭';
  }
}