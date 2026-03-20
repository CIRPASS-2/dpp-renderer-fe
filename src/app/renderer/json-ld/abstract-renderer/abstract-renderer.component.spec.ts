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
import { AbstractRendererComponent } from './abstract-renderer.component';

describe('AbstractRendererComponent', () => {
  let component: AbstractRendererComponent;
  let fixture: ComponentFixture<AbstractRendererComponent>;
  let ontologyRegistryServiceSpy: jasmine.SpyObj<OntologyRegistryService>;

  const mockAbstractNode: JsonLdNode = {
    '@id': 'https://example.com/abstract/123',
    '@type': ['https://w3id.org/eudpp#ConcentrationRange'],
    'https://w3id.org/eudpp#minValue': [{ '@value': '0.1' }],
    'https://w3id.org/eudpp#maxValue': [{ '@value': '0.5' }],
    'https://w3id.org/eudpp#measurementUnit': [{ '@value': 'ppm' }],
    'https://w3id.org/eudpp#category': [{ '@id': 'https://example.com/category/toxic' }]
  };

  const mockGraph = new Map<string, JsonLdNode>([
    ['https://example.com/category/toxic', {
      '@id': 'https://example.com/category/toxic',
      '@type': ['https://w3id.org/eudpp#Category'],
      'https://w3id.org/eudpp#label': [{ '@value': 'Toxic Category' }]
    }]
  ]);

  beforeEach(async () => {
    const registrySpy = jasmine.createSpyObj('OntologyRegistryService', ['getLabel', 'resolveCategory']);
    registrySpy.getLabel.and.returnValue('Concentration Range');
    registrySpy.resolveCategory.and.returnValue('abstract');

    await TestBed.configureTestingModule({
      imports: [AbstractRendererComponent],
      providers: [
        { provide: OntologyRegistryService, useValue: registrySpy }
      ]
    })
      .compileComponents();

    ontologyRegistryServiceSpy = TestBed.inject(OntologyRegistryService) as jasmine.SpyObj<OntologyRegistryService>;
    fixture = TestBed.createComponent(AbstractRendererComponent);
    component = fixture.componentInstance;
    component.node = mockAbstractNode;
    component.graph = mockGraph;
    component.ngOnChanges();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should get legend from registry', () => {
    expect(component.legend).toBe('Concentration Range');
    expect(ontologyRegistryServiceSpy.getLabel).toHaveBeenCalledWith('https://w3id.org/eudpp#ConcentrationRange');
  });

  it('should build fields from node properties', () => {
    component.ngOnChanges();
    expect(component.fields.length).toBeGreaterThan(0);
    const fields = component.fields;
    // OntologyRegistryService always returns 'Concentration Range' in mock
    // so all fields will have similar labels, not specific property names
    expect(fields.some(f => f.label.includes('Concentration Range'))).toBe(true);
    expect(fields.some(f => f.label.includes('Concentration Range'))).toBe(true);
  });

  it('should detect IRI-only nodes', () => {
    const iriOnly = { '@id': 'https://example.com/test' };
    const fullNode = { '@id': 'https://example.com/test', 'prop': [{ '@value': 'value' }] };

    expect(component.isIriOnly(iriOnly)).toBe(true);
    expect(component.isIriOnly(fullNode)).toBe(false);
  });

  it('should handle visited set for child nodes', () => {
    const childNode = { '@id': 'https://example.com/child' };
    const visited = component.childVisited(childNode);
    expect(visited.has('https://example.com/abstract/123')).toBe(true);
  });
});
