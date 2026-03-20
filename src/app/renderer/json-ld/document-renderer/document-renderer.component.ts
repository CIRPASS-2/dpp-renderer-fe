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
import { TagModule } from 'primeng/tag';
import { EUDPP_NS } from '../../../common/cirpass-dpp-ontology';
import { JsonLdNode, extractString } from '../../rendering-models';

const NS = EUDPP_NS;

/**
 * Component for rendering document references including digital instructions and attachments.
 * Displays document metadata with appropriate icons and links for different document types.
 */
@Component({
  selector: 'app-document-renderer',
  imports: [TagModule],
  templateUrl: './document-renderer.component.html',
  styleUrl: './document-renderer.component.css'
})
export class DocumentRendererComponent {
  @Input({ required: true }) node!: JsonLdNode;

  /**
   * Determines if this document is a digital instruction.
   * @returns True if document type includes DigitalInstruction
   */
  get isInstruction(): boolean {
    return ((this.node['@type'] as string[]) ?? []).includes(`${NS}DigitalInstruction`);
  }

  /** Gets the emoji icon for the document type */
  get icon(): string { return this.isInstruction ? '📋' : '📄'; }

  /** Gets the human-readable type name */
  get typeName(): string {
    return this.isInstruction ? 'Digital Instruction' : 'Document';
  }

  /** Gets the document description */
  get description() { return extractString(this.node, `${NS}description`); }
  /** Gets the web link URL */
  get webLink() { return extractString(this.node, `${NS}webLink`); }
  /** Gets the MIME content type */
  get contentType() { return extractString(this.node, `${NS}contentType`); }
  /** Gets the document content value */
  get value() { return extractString(this.node, `${NS}value`); }
}
