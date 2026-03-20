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

import { TestBed } from '@angular/core/testing';
import { TreeNode } from 'primeng/api';
import { OntologyJsonLd } from './ontology-tree.model';
import { OntologyTreeService } from './ontology-tree.service';

describe('OntologyTreeService', () => {
  let service: OntologyTreeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OntologyTreeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('transformOntologyToTree', () => {
    let mockOntology: OntologyJsonLd;

    beforeEach(() => {
      // Create comprehensive mock ontology with classes and properties
      mockOntology = {
        '@graph': [
          // Class definitions
          {
            '@id': 'https://example.com/Product',
            '@type': ['http://www.w3.org/2000/01/rdf-schema#Class'],
            'http://www.w3.org/2000/01/rdf-schema#label': [{ '@value': 'Product' }],
            'http://www.w3.org/2000/01/rdf-schema#comment': [{ '@value': 'A product class' }]
          },
          {
            '@id': 'https://example.com/TextileProduct',
            '@type': ['http://www.w3.org/2000/01/rdf-schema#Class'],
            'http://www.w3.org/2000/01/rdf-schema#label': [{ '@value': 'Textile Product' }],
            'http://www.w3.org/2000/01/rdf-schema#subClassOf': [{ '@id': 'https://example.com/Product' }]
          },
          // Simple property
          {
            '@id': 'https://example.com/hasName',
            '@type': ['http://www.w3.org/1999/02/22-rdf-syntax-ns#Property'],
            'http://www.w3.org/2000/01/rdf-schema#label': [{ '@value': 'has name' }],
            'http://www.w3.org/2000/01/rdf-schema#domain': [{ '@id': 'https://example.com/Product' }],
            'http://www.w3.org/2000/01/rdf-schema#range': [{ '@id': 'http://www.w3.org/2001/XMLSchema#string' }]
          },
          // Container property pointing to another class
          {
            '@id': 'https://example.com/hasComponents',
            '@type': ['http://www.w3.org/1999/02/22-rdf-syntax-ns#Property'],
            'http://www.w3.org/2000/01/rdf-schema#label': [{ '@value': 'has components' }],
            'http://www.w3.org/2000/01/rdf-schema#domain': [{ '@id': 'https://example.com/Product' }],
            'http://www.w3.org/2000/01/rdf-schema#range': [{ '@id': 'https://example.com/Component' }]
          },
          // Component class
          {
            '@id': 'https://example.com/Component',
            '@type': ['http://www.w3.org/2000/01/rdf-schema#Class'],
            'http://www.w3.org/2000/01/rdf-schema#label': [{ '@value': 'Component' }]
          },
          // Subclass of Component
          {
            '@id': 'https://example.com/MetalComponent',
            '@type': ['http://www.w3.org/2000/01/rdf-schema#Class'],
            'http://www.w3.org/2000/01/rdf-schema#label': [{ '@value': 'Metal Component' }],
            'http://www.w3.org/2000/01/rdf-schema#subClassOf': [{ '@id': 'https://example.com/Component' }]
          },
          // Property for subclass
          {
            '@id': 'https://example.com/hasWeight',
            '@type': ['http://www.w3.org/1999/02/22-rdf-syntax-ns#Property'],
            'http://www.w3.org/2000/01/rdf-schema#label': [{ '@value': 'has weight' }],
            'http://www.w3.org/2000/01/rdf-schema#domain': [{ '@id': 'https://example.com/MetalComponent' }],
            'http://www.w3.org/2000/01/rdf-schema#range': [{ '@id': 'http://www.w3.org/2001/XMLSchema#decimal' }]
          }
        ]
      };
    });

    it('should transform ontology with classes into tree structure', () => {
      const result: TreeNode[] = service.transformOntologyToTree(mockOntology);

      expect(Array.isArray(result)).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);

      // Verify root class node
      const productNode = result.find(node => node.label === 'Product');
      expect(productNode).toBeTruthy();
      expect(productNode?.key).toBeDefined();
      expect(productNode?.data?.id).toBe('https://example.com/Product');
      expect(productNode?.leaf).toBeFalsy();
      expect(productNode?.selectable).toBeFalsy();
      expect(productNode?.children).toBeDefined();
    });

    it('should create children for class properties', () => {
      const result: TreeNode[] = service.transformOntologyToTree(mockOntology);
      const productNode = result.find(node => node.label === 'Product');

      expect(productNode?.children).toBeDefined();
      expect(productNode?.children?.length).toBeGreaterThan(0);

      // Check for simple property
      const nameProperty = productNode?.children?.find(child => child.label === 'has name');
      expect(nameProperty).toBeTruthy();
      expect(nameProperty?.leaf).toBeTruthy();
      expect(nameProperty?.selectable).toBeTruthy();
    });

    it('should handle container properties correctly', () => {
      const result: TreeNode[] = service.transformOntologyToTree(mockOntology);
      const productNode = result.find(node => node.label === 'Product');

      expect(productNode?.children).toBeDefined();

      const componentProperty = productNode?.children?.find(child => child.label === 'has components');
      expect(componentProperty).toBeTruthy();
      expect(componentProperty?.leaf).toBeFalsy();
      expect(componentProperty?.children?.length).toBeGreaterThan(0);

      // Check for subclass
      const metalComponent = componentProperty?.children?.find(child => child.label === 'Metal Component');
      expect(metalComponent).toBeTruthy();
    });

    it('should fall back to property grouping when no classes found', () => {
      // Create ontology with only properties, no classes
      const noClassOntology: OntologyJsonLd = {
        '@graph': [
          {
            '@id': 'https://example.com/simpleProperty',
            '@type': ['http://www.w3.org/1999/02/22-rdf-syntax-ns#Property'],
            'http://www.w3.org/2000/01/rdf-schema#label': [{ '@value': 'Simple Property' }],
            'http://www.w3.org/2000/01/rdf-schema#domain': [{ '@id': 'https://example.com/SomeClass' }]
          }
        ]
      };

      const result: TreeNode[] = service.transformOntologyToTree(noClassOntology);
      expect(Array.isArray(result)).toBeTruthy();
      // Should still create some structure even without classes
    });

    it('should handle empty ontology gracefully', () => {
      const emptyOntology: OntologyJsonLd = { '@graph': [] };
      const result: TreeNode[] = service.transformOntologyToTree(emptyOntology);

      expect(Array.isArray(result)).toBeTruthy();
      expect(result.length).toBe(0);
    });

    it('should handle ontology without @graph property', () => {
      const malformedOntology = {} as OntologyJsonLd;
      const result: TreeNode[] = service.transformOntologyToTree(malformedOntology);

      expect(Array.isArray(result)).toBeTruthy();
      expect(result.length).toBe(0);
    });

    it('should generate unique keys for each node', () => {
      const result: TreeNode[] = service.transformOntologyToTree(mockOntology);

      const allKeys: string[] = [];

      function collectKeys(nodes: TreeNode[]) {
        nodes.forEach(node => {
          allKeys.push(node.key!);
          if (node.children) {
            collectKeys(node.children);
          }
        });
      }

      collectKeys(result);

      // Check all keys are unique
      const uniqueKeys = new Set(allKeys);
      expect(uniqueKeys.size).toBe(allKeys.length);
    });

    it('should set appropriate icons for different node types', () => {
      const result: TreeNode[] = service.transformOntologyToTree(mockOntology);
      const productNode = result.find(node => node.label === 'Product');

      expect(productNode?.icon).toBe('pi pi-folder');

      if (productNode?.children) {
        const leafProperty = productNode.children.find(child => child.leaf);
        if (leafProperty) {
          expect(leafProperty.icon).toBeDefined();
        }

        const containerProperty = productNode.children.find(child => !child.leaf);
        if (containerProperty) {
          expect(containerProperty.icon).toBe('pi pi-folder-open');
        }
      }
    });

    it('should preserve node data structure correctly', () => {
      const result: TreeNode[] = service.transformOntologyToTree(mockOntology);
      const productNode = result.find(node => node.label === 'Product');

      expect(productNode?.data).toBeDefined();
      expect(productNode?.data?.id).toBe('https://example.com/Product');
      expect(productNode?.data?.type).toBeDefined();
      expect(Array.isArray(productNode?.data?.type)).toBeTruthy();
      expect(productNode?.data?.path).toBeDefined();
      expect(productNode?.data?.comment).toBe('A product class');
    });
  });
});
