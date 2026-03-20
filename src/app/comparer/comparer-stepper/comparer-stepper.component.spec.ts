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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { ExtractorService } from '../../common/comparison.service';
import { DelegatingMessaggeService } from '../../common/delegating-messagge.service';
import { ExtractionResponse } from '../comparison/comparison.model';
import { DppComparisonComponent } from '../comparison/dpp-comparison/dpp-comparison.component';
import { DppUrisComponent } from '../comparison/dpp-uris/dpp-uris.component';
import { FieldMapping, OntologyTreeComponent } from '../selector/ontology-tree/ontology-tree.component';
import { ComparerStepperComponent } from './comparer-stepper.component';

// Mock child components
@Component({
  selector: 'app-dpp-uris',
  template: ''
})
class MockDppUrisComponent {
  @Input() existing: any;
}

@Component({
  selector: 'app-ontology-tree',
  template: ''
})
class MockOntologyTreeComponent { }

@Component({
  selector: 'app-dpp-comparison',
  template: ''
})
class MockDppComparisonComponent { }

describe('ComparerStepperComponent', () => {
  let component: ComparerStepperComponent;
  let fixture: ComponentFixture<ComparerStepperComponent>;
  let extractorServiceSpy: jasmine.SpyObj<ExtractorService>;
  let delegatingMessageServiceSpy: jasmine.SpyObj<DelegatingMessaggeService>;

  const mockFieldMapping: FieldMapping = {
    logicalFields: [
      { id: 'field1', logicalName: 'Property 1', mappedProperties: [] },
      { id: 'field2', logicalName: 'Property 2', mappedProperties: [] }
    ],
    propertyPaths: {
      'property1': [{ namespace: 'https://example.com#', path: 'path1' }],
      'property2': [{ namespace: 'https://example.com#', path: 'path2' }]
    }
  };

  const mockExtractionResponse: ExtractionResponse = {
    results: [
      { id: '1', data: { property1: 'value1' } },
      { id: '2', data: { property1: 'value2' } }
    ]
  };

  beforeEach(async () => {
    const extractorSpy = jasmine.createSpyObj('ExtractorService', ['extractProperties']);
    const messageSpy = jasmine.createSpyObj('DelegatingMessaggeService', ['error']);

    await TestBed.configureTestingModule({
      imports: [ComparerStepperComponent],
      providers: [
        { provide: ExtractorService, useValue: extractorSpy },
        { provide: DelegatingMessaggeService, useValue: messageSpy },
        provideNoopAnimations()
      ]
    })
      .overrideComponent(ComparerStepperComponent, {
        remove: {
          imports: [
            DppUrisComponent,
            OntologyTreeComponent,
            DppComparisonComponent
          ]
        },
        add: {
          imports: [MockDppUrisComponent, MockOntologyTreeComponent, MockDppComparisonComponent]
        }
      })
      .compileComponents();

    extractorServiceSpy = TestBed.inject(ExtractorService) as jasmine.SpyObj<ExtractorService>;
    delegatingMessageServiceSpy = TestBed.inject(DelegatingMessaggeService) as jasmine.SpyObj<DelegatingMessaggeService>;
    fixture = TestBed.createComponent(ComparerStepperComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initial state', () => {
    it('should initialize with undefined properties', () => {
      expect(component.fieldMapping).toBeUndefined();
      expect(component.comparisonData).toBeUndefined();
      expect(component.urls).toEqual([]);
    });
  });

  describe('onFieldMappingChanged', () => {
    it('should update field mapping', () => {
      component.onFieldMappingChanged(mockFieldMapping);
      expect(component.fieldMapping).toBe(mockFieldMapping);
    });
  });

  describe('onUrlsSubmitted', () => {
    it('should update urls', () => {
      const testUrls = ['https://example.com/dpp1', 'https://example.com/dpp2'];
      component.onUrlsSubmitted(testUrls);
      expect(component.urls).toEqual(testUrls);
    });
  });

  describe('hasUrlsForNext', () => {
    it('should return true when there are more than 1 URL', () => {
      component.urls = ['url1', 'url2'];
      expect(component.hasUrlsForNext()).toBe(true);
    });

    it('should return false when there is only 1 URL', () => {
      component.urls = ['url1'];
      expect(component.hasUrlsForNext()).toBe(false);
    });

    it('should return false when there are no URLs', () => {
      component.urls = [];
      expect(component.hasUrlsForNext()).toBe(false);
    });

    it('should return false when urls is undefined', () => {
      component.urls = undefined as any;
      expect(component.hasUrlsForNext()).toBe(false);
    });
  });

  describe('hasPropertiesForNext', () => {
    it('should return true when field mapping is defined', () => {
      component.fieldMapping = mockFieldMapping;
      expect(component.hasPropertiesForNext()).toBe(true);
    });

    it('should return false when field mapping is undefined', () => {
      component.fieldMapping = undefined;
      expect(component.hasPropertiesForNext()).toBe(false);
    });

    it('should return false when field mapping is null', () => {
      component.fieldMapping = null as any;
      expect(component.hasPropertiesForNext()).toBe(false);
    });
  });

  describe('runComparison', () => {
    beforeEach(() => {
      component.urls = ['https://example.com/dpp1', 'https://example.com/dpp2'];
      component.fieldMapping = mockFieldMapping;
    });

    it('should call extractorService with correct parameters', () => {
      extractorServiceSpy.extractProperties.and.returnValue(of(mockExtractionResponse));

      component.runComparison();

      expect(extractorServiceSpy.extractProperties).toHaveBeenCalledWith(
        component.urls,
        component.fieldMapping!
      );
    });

    it('should set comparison data on successful extraction', () => {
      extractorServiceSpy.extractProperties.and.returnValue(of(mockExtractionResponse));

      component.runComparison();

      expect(component.comparisonData).toBe(mockExtractionResponse);
    });

    it('should handle extraction error', () => {
      const errorMessage = 'Extraction failed';
      extractorServiceSpy.extractProperties.and.returnValue(throwError(() => new Error(errorMessage)));
      spyOn(console, 'log');

      component.runComparison();

      expect(console.log).toHaveBeenCalledWith(jasmine.any(Error));
      expect(delegatingMessageServiceSpy.error).toHaveBeenCalledWith(jasmine.any(Error));
    });

    it('should not set comparison data on error', () => {
      extractorServiceSpy.extractProperties.and.returnValue(throwError(() => new Error('Test error')));

      component.runComparison();

      expect(component.comparisonData).toBeUndefined();
    });
  });

  describe('template rendering', () => {
    it('should render stepper component', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('p-stepper')).toBeTruthy();
    });
  });
});
