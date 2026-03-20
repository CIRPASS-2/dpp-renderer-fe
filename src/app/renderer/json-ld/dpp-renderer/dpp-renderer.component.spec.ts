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

import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { RenderCategory } from '../../../common/cirpass-dpp-ontology';
import { ExpandedJsonLd, JsonLdNode } from '../../rendering-models';
import { OntologyRegistryService } from '../ontology-registry.service';
import { DppRendererComponent, ResolvedNode } from './dpp-renderer.component';

describe('DppRendererComponent', () => {
  let component: DppRendererComponent;
  let fixture: ComponentFixture<DppRendererComponent>;
  let ontologyRegistryServiceSpy: jasmine.SpyObj<OntologyRegistryService>;

  const mockProductNode: JsonLdNode = {
    '@id': 'https://example.com/product/123',
    '@type': ['http://example.com/Product'],
    'productName': [{ '@value': 'Test Product' }],
    'weight': [{ '@value': '2.5kg' }]
  };

  const mockDppNode: JsonLdNode = {
    '@id': 'https://example.com/dpp/456',
    '@type': ['http://example.com/DigitalProductPassport'],
    'issuer': [{ '@value': 'Test Issuer' }],
    'appliesToProduct': [{ '@id': 'https://example.com/product/123' }]
  };

  const mockActorNode: JsonLdNode = {
    '@id': 'https://example.com/actor/789',
    '@type': ['http://example.com/Actor'],
    'actorName': [{ '@value': 'Test Actor' }],
    'hasRole': [{ '@id': 'https://example.com/role/manufacturer' }]
  };

  const mockAbstractNode: JsonLdNode = {
    '@id': 'https://example.com/concentration/001',
    '@type': ['http://example.com/Concentration'],
    'value': [{ '@value': '10.5' }],
    'unit': [{ '@value': 'mg/kg' }]
  };

  const mockRoleNode: JsonLdNode = {
    '@id': 'https://example.com/role/manufacturer',
    '@type': ['http://example.com/ManufacturerRole']
  };

  const mockIriOnlyNode: JsonLdNode = {
    '@id': 'https://example.com/reference/only'
  };

  const mockEmptyDataNode: JsonLdNode = {
    '@id': 'https://example.com/empty',
    '@type': ['http://example.com/EmptyType']
  };

  const mockExpandedJsonLd: ExpandedJsonLd = [
    mockProductNode,
    mockDppNode,
    mockActorNode,
    mockAbstractNode,
    mockRoleNode,
    mockIriOnlyNode,
    mockEmptyDataNode
  ];

  beforeEach(async () => {
    const registrySpy = jasmine.createSpyObj('OntologyRegistryService', ['resolveCategory']);

    await TestBed.configureTestingModule({
      imports: [DppRendererComponent],
      providers: [
        { provide: OntologyRegistryService, useValue: registrySpy },
        provideNoopAnimations()
      ]
    })
      .compileComponents();

    ontologyRegistryServiceSpy = TestBed.inject(OntologyRegistryService) as jasmine.SpyObj<OntologyRegistryService>;
    fixture = TestBed.createComponent(DppRendererComponent);
    component = fixture.componentInstance;

    // Setup default spy responses
    ontologyRegistryServiceSpy.resolveCategory.and.returnValue('abstract');
    ontologyRegistryServiceSpy.resolveCategory.and.callFake((types: string[]) => {
      if (types.includes('http://example.com/Product')) return 'product';
      if (types.includes('http://example.com/DigitalProductPassport')) return 'dpp';
      if (types.includes('http://example.com/Actor')) return 'actor';
      if (types.includes('http://example.com/Concentration')) return 'abstract';
      if (types.includes('http://example.com/ManufacturerRole')) return 'abstract';
      return 'abstract';
    });
  });

  it('should create', () => {
    component.expandedJsonLd = mockExpandedJsonLd;
    expect(component).toBeTruthy();
  });

  describe('initial state', () => {
    it('should have initial loading state', () => {
      expect(component.loading).toBe(true);
      expect(component.resolvedNodes).toEqual([]);
      expect(component.graph.size).toBe(0);
      expect(component.error).toBeUndefined();
    });
  });

  describe('ngOnChanges', () => {
    it('should call process when expandedJsonLd changes', () => {
      spyOn(component as any, 'process');

      component.ngOnChanges({
        expandedJsonLd: new SimpleChange(null, mockExpandedJsonLd, true)
      });

      expect((component as any).process).toHaveBeenCalled();
    });

    it('should not call process when other properties change', () => {
      spyOn(component as any, 'process');

      component.ngOnChanges({
        otherProp: new SimpleChange(null, 'value', false)
      });

      expect((component as any).process).not.toHaveBeenCalled();
    });
  });

  describe('process method', () => {
    beforeEach(() => {
      component.expandedJsonLd = mockExpandedJsonLd;
    });

    it('should handle empty or invalid JSON-LD', () => {
      component.expandedJsonLd = [];
      component.ngOnChanges({
        expandedJsonLd: new SimpleChange(null, [], true)
      });

      expect(component.error).toBe('Empty or invalid JSON-LD document.');
      expect(component.loading).toBe(false);
      expect(component.resolvedNodes).toEqual([]);
    });

    it('should handle null JSON-LD', () => {
      component.expandedJsonLd = null as any;
      component.ngOnChanges({
        expandedJsonLd: new SimpleChange(null, null, true)
      });

      expect(component.error).toBe('Empty or invalid JSON-LD document.');
      expect(component.loading).toBe(false);
    });

    it('should build graph index correctly', () => {
      component.ngOnChanges({
        expandedJsonLd: new SimpleChange(null, mockExpandedJsonLd, true)
      });

      expect(component.graph.size).toBe(7); // All nodes with @id
      expect(component.graph.get('https://example.com/product/123')).toBe(mockProductNode);
      expect(component.graph.get('https://example.com/dpp/456')).toBe(mockDppNode);
      expect(component.graph.get('https://example.com/actor/789')).toBe(mockActorNode);
    });

    it('should filter out IRI-only nodes', () => {
      component.ngOnChanges({
        expandedJsonLd: new SimpleChange(null, mockExpandedJsonLd, true)
      });

      const iriOnlyResolved = component.resolvedNodes.find(
        r => r.node['@id'] === 'https://example.com/reference/only'
      );
      expect(iriOnlyResolved).toBeUndefined();
    });

    it('should filter out nodes with only @id and @type', () => {
      component.ngOnChanges({
        expandedJsonLd: new SimpleChange(null, mockExpandedJsonLd, true)
      });

      const emptyDataResolved = component.resolvedNodes.find(
        r => r.node['@id'] === 'https://example.com/empty'
      );
      expect(emptyDataResolved).toBeUndefined();

      const roleResolved = component.resolvedNodes.find(
        r => r.node['@id'] === 'https://example.com/role/manufacturer'
      );
      expect(roleResolved).toBeUndefined();
    });

    it('should keep abstract nodes that are not referenced by others', () => {
      // Test with abstract node that's not referenced
      const unreferencedAbstract: JsonLdNode = {
        '@id': 'https://example.com/standalone/abstract',
        '@type': ['http://example.com/StandaloneAbstract'],
        'value': [{ '@value': 'standalone' }]
      };

      const testData = [unreferencedAbstract];
      component.expandedJsonLd = testData;

      component.ngOnChanges({
        expandedJsonLd: new SimpleChange(null, testData, true)
      });

      const abstractResolved = component.resolvedNodes.find(
        r => r.node['@id'] === 'https://example.com/standalone/abstract'
      );
      expect(abstractResolved).toBeDefined();
    });

    it('should filter out abstract nodes referenced by others', () => {
      // The abstract node should be filtered out because it's referenced by the product
      const referencingProduct: JsonLdNode = {
        '@id': 'https://example.com/product/with-ref',
        '@type': ['http://example.com/Product'],
        'productName': [{ '@value': 'Product with reference' }],
        'hasConcentration': [{ '@id': 'https://example.com/concentration/001' }]
      };

      const testData = [referencingProduct, mockAbstractNode];
      component.expandedJsonLd = testData;

      component.ngOnChanges({
        expandedJsonLd: new SimpleChange(null, testData, true)
      });

      const abstractResolved = component.resolvedNodes.find(
        r => r.node['@id'] === 'https://example.com/concentration/001'
      );
      expect(abstractResolved).toBeUndefined();
    });

    it('should include known category nodes even if referenced', () => {
      // Product node should be included even if referenced by DPP
      component.ngOnChanges({
        expandedJsonLd: new SimpleChange(null, mockExpandedJsonLd, true)
      });

      const productResolved = component.resolvedNodes.find(
        r => r.node['@id'] === 'https://example.com/product/123'
      );
      expect(productResolved).toBeDefined();
      expect(productResolved?.category).toBe('product');
    });

    it('should sort nodes by category priority', () => {
      component.ngOnChanges({
        expandedJsonLd: new SimpleChange(null, mockExpandedJsonLd, true)
      });

      const categories = component.resolvedNodes.map(r => r.category);

      // Should be sorted by priority: product, dpp, actor
      expect(categories.indexOf('product')).toBeLessThan(categories.indexOf('dpp'));
      expect(categories.indexOf('dpp')).toBeLessThan(categories.indexOf('actor'));
    });

    it('should set loading to false after processing', () => {
      component.ngOnChanges({
        expandedJsonLd: new SimpleChange(null, mockExpandedJsonLd, true)
      });

      expect(component.loading).toBe(false);
    });

    it('should clear error after successful processing', () => {
      // Set an error first
      component.error = 'Previous error';

      component.ngOnChanges({
        expandedJsonLd: new SimpleChange(null, mockExpandedJsonLd, true)
      });

      expect(component.error).toBeUndefined();
    });
  });

  describe('collectReferencedIds method', () => {
    it('should collect all referenced node IDs', () => {
      component.expandedJsonLd = mockExpandedJsonLd;
      const referencedIds = (component as any).collectReferencedIds();

      expect(referencedIds.has('https://example.com/product/123')).toBe(true);
      expect(referencedIds.has('https://example.com/role/manufacturer')).toBe(true);
    });

    it('should handle nodes without references', () => {
      const noRefsData: ExpandedJsonLd = [
        {
          '@id': 'https://example.com/standalone',
          '@type': ['http://example.com/Standalone'],
          'value': [{ '@value': 'no references' }]
        }
      ];

      component.expandedJsonLd = noRefsData;
      const referencedIds = (component as any).collectReferencedIds();

      expect(referencedIds.size).toBe(0);
    });

    it('should handle nested references', () => {
      const nestedData: ExpandedJsonLd = [
        {
          '@id': 'https://example.com/parent',
          '@type': ['http://example.com/Parent'],
          'hasChild': [
            { '@id': 'https://example.com/child1' },
            { '@id': 'https://example.com/child2' }
          ]
        }
      ];

      component.expandedJsonLd = nestedData;
      const referencedIds = (component as any).collectReferencedIds();

      expect(referencedIds.has('https://example.com/child1')).toBe(true);
      expect(referencedIds.has('https://example.com/child2')).toBe(true);
    });

    it('should skip @id and @type properties', () => {
      const testData: ExpandedJsonLd = [
        {
          '@id': 'https://example.com/test',
          '@type': ['http://example.com/TestType'],
          'regularProp': [{ '@id': 'https://example.com/ref' }]
        }
      ];

      component.expandedJsonLd = testData;
      const referencedIds = (component as any).collectReferencedIds();

      expect(referencedIds.has('https://example.com/test')).toBe(false);
      expect(referencedIds.has('https://example.com/ref')).toBe(true);
    });
  });

  describe('sortPriority method', () => {
    it('should return correct priority for known categories', () => {
      const testCases: Array<[RenderCategory, number]> = [
        ['product', 0],
        ['dpp', 1],
        ['actor', 2],
        ['facility', 3],
        ['classification-code', 4],
        ['substance', 5],
        ['quantitative-property', 6],
        ['document', 7],
        ['lca', 8],
        ['abstract', 9]
      ];

      testCases.forEach(([category, expectedPriority]) => {
        const resolvedNode: ResolvedNode = {
          node: { '@id': 'test', '@type': ['test'] },
          category
        };

        const priority = (component as any).sortPriority(resolvedNode);
        expect(priority).toBe(expectedPriority);
      });
    });

    it('should return default priority for unknown categories', () => {
      const resolvedNode: ResolvedNode = {
        node: { '@id': 'test', '@type': ['test'] },
        category: 'unknown' as RenderCategory
      };

      const priority = (component as any).sortPriority(resolvedNode);
      expect(priority).toBe(99);
    });
  });

  describe('category order constant', () => {
    it('should have all expected categories defined', () => {
      const categoryOrder = (DppRendererComponent as any).CATEGORY_ORDER;

      expect(categoryOrder['product']).toBeDefined();
      expect(categoryOrder['dpp']).toBeDefined();
      expect(categoryOrder['actor']).toBeDefined();
      expect(categoryOrder['facility']).toBeDefined();
      expect(categoryOrder['classification-code']).toBeDefined();
      expect(categoryOrder['substance']).toBeDefined();
      expect(categoryOrder['quantitative-property']).toBeDefined();
      expect(categoryOrder['document']).toBeDefined();
      expect(categoryOrder['lca']).toBeDefined();
      expect(categoryOrder['abstract']).toBeDefined();
    });

    it('should have proper ordering priorities', () => {
      const categoryOrder = (DppRendererComponent as any).CATEGORY_ORDER;

      expect(categoryOrder['product']).toBeLessThan(categoryOrder['dpp']);
      expect(categoryOrder['dpp']).toBeLessThan(categoryOrder['actor']);
      expect(categoryOrder['actor']).toBeLessThan(categoryOrder['facility']);
      expect(categoryOrder['abstract']).toBe(9); // Should be last
    });
  });

  describe('template integration', () => {
    it('should render loading spinner when loading', () => {
      component.loading = true;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('p-progressspinner')).toBeTruthy();
    });

    it('should render error message when error exists', () => {
      component.loading = false;
      component.error = 'Test error message';
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('p-message')).toBeTruthy();
    });

    it('should render resolved nodes when loaded', () => {
      component.expandedJsonLd = mockExpandedJsonLd;
      component.loading = false;
      component.error = undefined;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    it('should handle nodes without @id', () => {
      const noIdData: ExpandedJsonLd = [
        {
          '@type': ['http://example.com/NoId'],
          'value': [{ '@value': 'no id node' }]
        }
      ];

      component.expandedJsonLd = noIdData;
      component.ngOnChanges({
        expandedJsonLd: new SimpleChange(null, noIdData, true)
      });

      expect(component.graph.size).toBe(0);
      expect(component.resolvedNodes.length).toBe(1);
      expect(component.error).toBeUndefined();
    });

    it('should handle nodes without @type', () => {
      const noTypeData: ExpandedJsonLd = [
        {
          '@id': 'https://example.com/no-type',
          'value': [{ '@value': 'no type node' }]
        }
      ];

      component.expandedJsonLd = noTypeData;
      component.ngOnChanges({
        expandedJsonLd: new SimpleChange(null, noTypeData, true)
      });

      expect(ontologyRegistryServiceSpy.resolveCategory).toHaveBeenCalledWith([]);
      expect(component.resolvedNodes.length).toBe(1);
    });

    it('should handle complex nested property structures', () => {
      const complexData: ExpandedJsonLd = [
        {
          '@id': 'https://example.com/complex',
          '@type': ['http://example.com/Complex'],
          'nestedArray': [
            { '@id': 'https://example.com/nested1' },
            { '@value': 'literal value' },
            { '@id': 'https://example.com/nested2' }
          ]
        }
      ];

      component.expandedJsonLd = complexData;

      expect(() => {
        component.ngOnChanges({
          expandedJsonLd: new SimpleChange(null, complexData, true)
        });
      }).not.toThrow();

      expect(component.error).toBeUndefined();
    });

    it('should handle duplicate node IDs gracefully', () => {
      const duplicateData: ExpandedJsonLd = [
        {
          '@id': 'https://example.com/duplicate',
          '@type': ['http://example.com/Type1'],
          'prop1': [{ '@value': 'first' }]
        },
        {
          '@id': 'https://example.com/duplicate',
          '@type': ['http://example.com/Type2'],
          'prop2': [{ '@value': 'second' }]
        }
      ];

      component.expandedJsonLd = duplicateData;
      component.ngOnChanges({
        expandedJsonLd: new SimpleChange(null, duplicateData, true)
      });

      expect(component.graph.size).toBe(1); // Only one entry per ID
      expect(component.error).toBeUndefined();
    });
  });
});
