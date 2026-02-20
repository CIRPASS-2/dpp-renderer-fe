import { Component, Input } from '@angular/core';
import { TagModule } from 'primeng/tag';
import { EUDPP_NS } from '../../../common/cirpass-dpp-ontology';
import { JsonLdNode, extractString } from '../../rendering-models';

const NS = EUDPP_NS;


@Component({
  selector: 'app-document-renderer',
  imports: [TagModule],
  templateUrl: './document-renderer.component.html',
  styleUrl: './document-renderer.component.css'
})
export class DocumentRendererComponent {
  @Input({ required: true }) node!: JsonLdNode;

  get isInstruction(): boolean {
    return ((this.node['@type'] as string[]) ?? []).includes(`${NS}DigitalInstruction`);
  }

  get icon(): string { return this.isInstruction ? '📋' : '📄'; }

  get typeName(): string {
    return this.isInstruction ? 'Digital Instruction' : 'Document';
  }

  get description() { return extractString(this.node, `${NS}description`); }
  get webLink() { return extractString(this.node, `${NS}webLink`); }
  get contentType() { return extractString(this.node, `${NS}contentType`); }
  get value() { return extractString(this.node, `${NS}value`); }
}
