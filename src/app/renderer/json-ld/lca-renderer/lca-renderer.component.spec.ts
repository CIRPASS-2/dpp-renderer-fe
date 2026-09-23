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
import { EUDPP_NS } from '../../../common/cirpass-dpp-ontology';
import { JsonLdNode } from '../../rendering-models';
import { OntologyRegistryService } from '../ontology-registry.service';
import { LcaRendererComponent } from './lca-renderer.component';

const NS = EUDPP_NS;
const RDFS_LABEL = 'http://www.w3.org/2000/01/rdf-schema#label';

describe('LcaRendererComponent', () => {
  let component: LcaRendererComponent;
  let fixture: ComponentFixture<LcaRendererComponent>;

  const resultId = 'https://example.com/lca/results/climate-change';
  const methodId = 'https://example.com/lca/methods/ef31-climate-change';
  const moduleValueId = 'https://example.com/lca/module-values/a1-a3';

  const mockLcaNode: JsonLdNode = {
    '@id': 'https://example.com/lca/studies/123',
    '@type': [`${NS}LCAStudy`],
    [`${NS}hasLCIAResult`]: [{ '@id': resultId }],
    [`${NS}baseName`]: [{ '@value': 'Example environmental study' }],
    [`${NS}hasComplianceDeclaration`]: [{ '@id': 'https://example.com/lca/compliance/1' }]
  };

  const mockGraph = new Map<string, JsonLdNode>([
    [resultId, {
      '@id': resultId,
      '@type': [`${NS}LCIAResult`],
      [`${NS}forLCIAOrInventoryMethod`]: [{ '@id': methodId }],
      [`${NS}hasModuleValue`]: [{ '@id': moduleValueId }]
    }],
    [methodId, {
      '@id': methodId,
      '@type': [`${NS}LCIAOrInventoryMethod`],
      [RDFS_LABEL]: [{ '@value': 'EF 3.1 climate method' }],
      [`${NS}impactCategory`]: [{ '@id': `${NS}climateChange` }],
      [`${NS}methodology`]: [{ '@id': `${NS}methodology_EF3_1` }]
    }],
    [moduleValueId, {
      '@id': moduleValueId,
      '@type': [`${NS}LCIAModuleValue`],
      [`${NS}amount`]: [{ '@value': '2.5' }],
      [`${NS}forModule`]: [{ '@id': `${NS}moduleA1A3` }],
      [`${NS}hasUnit`]: [{ '@id': 'https://example.com/units/kg-co2-eq' }]
    }],
    [`${NS}climateChange`, {
      '@id': `${NS}climateChange`,
      [RDFS_LABEL]: [{ '@value': 'Climate change' }]
    }],
    [`${NS}moduleA1A3`, {
      '@id': `${NS}moduleA1A3`,
      [RDFS_LABEL]: [{ '@value': 'A1-A3 Product stage' }]
    }],
    [`${NS}methodology_EF3_1`, {
      '@id': `${NS}methodology_EF3_1`,
      [RDFS_LABEL]: [{ '@value': 'EF 3.1' }]
    }],
    ['https://example.com/units/kg-co2-eq', {
      '@id': 'https://example.com/units/kg-co2-eq',
      [RDFS_LABEL]: [{ '@value': 'kg CO2-eq' }]
    }],
    ['https://example.com/lca/compliance/1', {
      '@id': 'https://example.com/lca/compliance/1',
      '@type': [`${NS}ComplianceDeclaration`],
      [`${NS}complianceStatus`]: [{ '@id': `${NS}fullyCompliant` }]
    }]
  ]);

  beforeEach(async () => {
    const registrySpy = jasmine.createSpyObj('OntologyRegistryService', ['getLabel', 'resolveCategory']);
    registrySpy.getLabel.and.callFake((uri: string) => uri.split('#').pop() ?? uri);
    registrySpy.resolveCategory.and.returnValue('abstract');

    await TestBed.configureTestingModule({
      imports: [LcaRendererComponent],
      providers: [{ provide: OntologyRegistryService, useValue: registrySpy }]
    })
      .compileComponents();

    fixture = TestBed.createComponent(LcaRendererComponent);
    component = fixture.componentInstance;
    component.node = mockLcaNode;
    component.graph = mockGraph;
    component.ngOnChanges();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should extract module values from a current LCA study', () => {
    expect(component.impacts).toEqual([{
      categoryLabel: 'Climate change',
      indicatorLabel: 'EF 3.1 climate method - A1-A3 Product stage',
      value: 2.5,
      unit: 'kg CO2-eq',
      method: 'EF 3.1 climate method'
    }]);
  });

  it('should resolve the methodology through the result method', () => {
    expect(component.methodologyName).toBe('EF 3.1');
  });

  it('should delegate current study metadata to the generic renderer', () => {
    expect(component.extraUris).toEqual([
      `${NS}baseName`,
      `${NS}hasComplianceDeclaration`,
    ]);
  });

  it('should render a result node directly', () => {
    component.node = mockGraph.get(resultId)!;
    component.ngOnChanges();

    expect(component.impacts).toHaveSize(1);
    expect(component.impacts[0].value).toBe(2.5);
  });

  it('should format numeric values for display', () => {
    expect(component.formatValue(2.5)).toBe('2.5');
    expect(component.formatValue(0.00001)).toBe('1.0000e-5');
  });

  it('should prefer an OM-2 unit symbol when it is available', () => {
    const graphWithSymbol = new Map(mockGraph);
    graphWithSymbol.set('https://example.com/units/kg-co2-eq', {
      '@id': 'https://example.com/units/kg-co2-eq',
      'http://www.ontology-of-units-of-measure.org/resource/om-2/symbol': [{ '@value': 'kg CO2-eq' }]
    });
    component.graph = graphWithSymbol;
    component.ngOnChanges();

    expect(component.impacts[0].unit).toBe('kg CO2-eq');
  });
});
