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
import { ChipModule } from 'primeng/chip';
import { EUDPP_NS } from '../../../common/cirpass-dpp-ontology';
import { extractString, JsonLdNode } from '../../rendering-models';

const NS = EUDPP_NS;

/**
 * Component for rendering classification codes like HS codes, ECLASS codes, and other taxonomic identifiers.
 * Displays classification system information as chips with code values, code sets, and dictionary references.
 */
@Component({
  selector: 'app-classification-code-renderer',
  imports: [ChipModule],
  templateUrl: './classification-code-renderer.component.html',
  styleUrl: './classification-code-renderer.component.css',
  standalone: true
})
export class ClassificationCodeRendererComponent {
  @Input({ required: true }) node!: JsonLdNode;

  /** Gets the classification code value */
  get codeValue() { return extractString(this.node, `${NS}codeValue`); }

  /** Gets the classification code set identifier */
  get codeSet() { return extractString(this.node, `${NS}codeSet`); }

  /** Gets the dictionary reference for the classification code */
  get dictRef() { return extractString(this.node, `${NS}dictionaryReference`); }
}
