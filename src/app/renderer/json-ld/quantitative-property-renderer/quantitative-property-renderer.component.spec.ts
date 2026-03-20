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

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JsonLdNode } from '../../rendering-models';
import { OntologyRegistryService } from '../ontology-registry.service';
import { QuantitativePropertyRendererComponent } from './quantitative-property-renderer.component';

describe('QuantitativePropertyRendererComponent', () => {
  let component: QuantitativePropertyRendererComponent;
  let fixture: ComponentFixture<QuantitativePropertyRendererComponent>;
  let ontologyRegistryServiceSpy: jasmine.SpyObj<OntologyRegistryService>;

  const mockQuantitativePropertyNode: JsonLdNode = {
    '@id': 'https://example.com/property/weight',
    '@type': ['https://w3id.org/eudpp#Weight', 'https://w3id.org/eudpp#QuantitativeProperty'],
    'https://w3id.org/eudpp#numericalValue': [{ '@value': '2.5' }],
    'https://w3id.org/eudpp#tolerance': [{ '@value': '0.1' }],
    'https://w3id.org/eudpp#dictionaryReference': [{ '@value': 'https://dict.example.com/weight' }],
    'https://w3id.org/eudpp#hasMeasurementUnit': [{
      '@type': ['https://w3id.org/eudpp#MeasurementUnit'],
      'https://w3id.org/eudpp#value': [{ '@value': 'kg' }]
    }]
  };

  const mockStringPropertyNode: JsonLdNode = {
    '@id': 'https://example.com/property/color',
    '@type': ['https://w3id.org/eudpp#QuantitativeProperty'],
    'https://w3id.org/eudpp#value': [{ '@value': 'Blue' }]
  };

  beforeEach(async () => {
    const registrySpy = jasmine.createSpyObj('OntologyRegistryService', ['getLabel']);
    registrySpy.getLabel.and.returnValue('Weight Property');

    await TestBed.configureTestingModule({
      imports: [QuantitativePropertyRendererComponent],
      providers: [
        { provide: OntologyRegistryService, useValue: registrySpy }
      ]
    })
      .compileComponents();

    ontologyRegistryServiceSpy = TestBed.inject(OntologyRegistryService) as jasmine.SpyObj<OntologyRegistryService>;
    fixture = TestBed.createComponent(QuantitativePropertyRendererComponent);
    component = fixture.componentInstance;
    component.node = mockQuantitativePropertyNode;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should extract numerical value correctly', () => {
    expect(component.numValue).toBe(2.5);
  });

  it('should extract tolerance correctly', () => {
    expect(component.tolerance).toBe(0.1);
  });

  it('should extract unit correctly', () => {
    expect(component.unit).toBe('kg');
  });

  it('should extract dictionary reference correctly', () => {
    expect(component.dictRef).toBe('https://dict.example.com/weight');
  });

  it('should get type name from registry', () => {
    expect(component.typeName).toBe('Weight Property');
    expect(ontologyRegistryServiceSpy.getLabel).toHaveBeenCalledWith('https://w3id.org/eudpp#Weight');
  });

  it('should handle string value properties', () => {
    component.node = mockStringPropertyNode;
    expect(component.strValue).toBe('Blue');
    expect(component.numValue).toBeUndefined();
  });

  it('should determine category class correctly', () => {
    expect(component.categoryClass).toBe('cat-dimension');
  });
});
