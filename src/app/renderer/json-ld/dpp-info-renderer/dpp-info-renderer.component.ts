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

  get dppId() { return extractString(this.node, `${NS}uniqueDPPID`); }
  get status() { return extractString(this.node, `${NS}status`); }

  get statusSeverity(): StatusSeverity {
    switch ((this.status ?? '').toLowerCase()) {
      case 'active': return 'success';
      case 'inactive': return 'warning';
      case 'revoked': return 'danger';
      default: return 'info';
    }
  }

  get metaFields(): { uri: string; value: string }[] {
    const skip = new Set([`${NS}uniqueDPPID`, `${NS}status`]);
    return this.knownUris
      .filter(uri => !skip.has(uri))
      .map(uri => ({ uri, value: extractString(this.node, uri) ?? '' }))
      .filter(f => f.value);
  }

  get extraUris(): string[] {
    const known = new Set(this.knownUris);
    return extractPropertyUris(this.node).filter(u => !known.has(u));
  }

  isLink(value: string): boolean {
    return value.startsWith('http://') || value.startsWith('https://');
  }
}
