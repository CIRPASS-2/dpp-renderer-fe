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

import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { StepperModule } from 'primeng/stepper';
import { ExtractorService } from '../../common/comparison.service';
import { DelegatingMessaggeService } from '../../common/delegating-messagge.service';
import { ExtractionResponse } from '../comparison/comparison.model';
import { DppComparisonComponent } from '../comparison/dpp-comparison/dpp-comparison.component';
import { DppUrisComponent } from '../comparison/dpp-uris/dpp-uris.component';
import { FieldMapping, OntologyTreeComponent } from '../selector/ontology-tree/ontology-tree.component';

@Component({
  selector: 'app-comparer-stepper',
  imports: [StepperModule, DppUrisComponent, OntologyTreeComponent, ButtonModule, DppComparisonComponent],
  templateUrl: './comparer-stepper.component.html',
  styleUrl: './comparer-stepper.component.css'
})
export class ComparerStepperComponent {

  fieldMapping?: FieldMapping

  comparisonData?: ExtractionResponse

  urls: string[] = []

  constructor(private extractorService: ExtractorService, private delegatingMessageService: DelegatingMessaggeService) { }

  onFieldMappingChanged(event: FieldMapping) {
    this.fieldMapping = event
  }

  onUrlsSubmitted(event: any) {
    this.urls = event
  }

  hasUrlsForNext(): boolean {
    return this.urls?.length > 1
  }

  hasPropertiesForNext(): boolean {
    return this.fieldMapping != null && this.fieldMapping != undefined
  }

  runComparison() {
    const uris = this.urls
    this.extractorService.extractProperties(uris!, this.fieldMapping!).subscribe({
      next: (data) => {
        this.comparisonData = data
      },
      error: (err) => {
        console.log(err)
        this.delegatingMessageService.error(err)
      }
    });
  }
}
