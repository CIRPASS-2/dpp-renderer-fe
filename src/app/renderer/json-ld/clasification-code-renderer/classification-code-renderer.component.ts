import { Component, Input, OnInit } from '@angular/core';
import { extractString, JsonLdNode, JsonLdValue } from '../../rendering-models';
import { EUDPP_NS } from '../../../common/cirpass-dpp-ontology';
import { ChipModule } from 'primeng/chip';

const NS = EUDPP_NS;

@Component({
  selector: 'app-classification-code-renderer',
  imports: [ChipModule],
  templateUrl: './classification-code-renderer.component.html',
  styleUrl: './classification-code-renderer.component.css',
  standalone: true
})
export class ClassificationCodeRendererComponent {
  @Input({ required: true }) node!: JsonLdNode;

  get codeValue() { return extractString(this.node, `${NS}codeValue`); }
  get codeSet()   { return extractString(this.node, `${NS}codeSet`); }
  get dictRef()   { return extractString(this.node, `${NS}dictionaryReference`); }
}
