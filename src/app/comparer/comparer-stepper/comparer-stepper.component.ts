import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { StepperModule } from 'primeng/stepper';
import { ExtractorService } from '../../common/comparison.service';
import { ExtractionResponse } from '../comparison/comparison.model';
import { DppComparisonComponent } from '../comparison/dpp-comparison/dpp-comparison.component';
import { DppUrisComponent } from '../comparison/dpp-uris/dpp-uris.component';
import { PropertySelection } from '../selector/ontology-tree.model';
import { FieldMapping, OntologyTreeComponent } from '../selector/ontology-tree/ontology-tree.component';
import { DelegatingMessaggeService } from '../../common/delegating-messagge.service';

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

  constructor(private extractorService: ExtractorService,private delegatingMessageService:DelegatingMessaggeService) { }

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
  }});
  }
}
