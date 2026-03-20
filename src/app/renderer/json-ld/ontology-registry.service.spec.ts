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
import { OntologyRegistryService } from './ontology-registry.service';

describe('OntologyRegistryService', () => {
  let service: OntologyRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OntologyRegistryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('resolveCategory', () => {
    it('should return direct category from CLASS_RENDER_REGISTRY', () => {
      const testTypes = ['https://w3id.org/eudpp#DPP'];
      const result = service.resolveCategory(testTypes);
      expect(result).toBe('dpp');
    });

    it('should return inherited category from ancestors', () => {
      // Height inherits from ProductDimension -> QuantitativeProperty -> Property
      // It should resolve to 'quantitative-property' category
      const result = service.resolveCategory(['https://w3id.org/eudpp#Height']);
      expect(result).toBe('quantitative-property');
    });

    it('should return "abstract" when no category is found', () => {
      const unknownTypes = ['https://unknown.com/UnknownType'];
      const result = service.resolveCategory(unknownTypes);
      expect(result).toBe('abstract');
    });

    it('should return first matching category from multiple types', () => {
      const multipleTypes = [
        'https://unknown.com/UnknownType',
        'https://w3id.org/eudpp#Product',
        'https://w3id.org/eudpp#DPP'
      ];
      const result = service.resolveCategory(multipleTypes);
      expect(result).toBe('product'); // First match
    });

    it('should handle empty types array', () => {
      const result = service.resolveCategory([]);
      expect(result).toBe('abstract');
    });
  });

  describe('isInstanceOf', () => {
    it('should return true for direct type match', () => {
      const nodeTypes = ['https://w3id.org/eudpp#Product'];
      const typeUri = 'https://w3id.org/eudpp#Product';
      const result = service.isInstanceOf(nodeTypes, typeUri);
      expect(result).toBeTruthy();
    });

    it('should return true for ancestor type match', () => {
      const nodeTypes = ['https://w3id.org/eudpp#Height'];
      const typeUri = 'https://w3id.org/eudpp#ProductDimension';
      const result = service.isInstanceOf(nodeTypes, typeUri);
      expect(result).toBeTruthy();
    });

    it('should return false when no match found', () => {
      const nodeTypes = ['https://w3id.org/eudpp#Product'];
      const typeUri = 'https://w3id.org/eudpp#Actor';
      const result = service.isInstanceOf(nodeTypes, typeUri);
      expect(result).toBeFalsy();
    });

    it('should handle empty nodeTypes array', () => {
      const result = service.isInstanceOf([], 'https://w3id.org/eudpp#Product');
      expect(result).toBeFalsy();
    });

    it('should handle multiple node types', () => {
      const nodeTypes = [
        'https://w3id.org/eudpp#Actor',
        'https://w3id.org/eudpp#Height'
      ];
      const typeUri = 'https://w3id.org/eudpp#QuantitativeProperty';
      const result = service.isInstanceOf(nodeTypes, typeUri);
      expect(result).toBeTruthy();
    });

    it('should handle node types without ancestors', () => {
      const nodeTypes = ['https://unknown.com/UnknownType'];
      const typeUri = 'https://w3id.org/eudpp#Product';
      const result = service.isInstanceOf(nodeTypes, typeUri);
      expect(result).toBeFalsy();
    });
  });

  describe('getAncestors', () => {
    it('should return ancestors array when exists', () => {
      const typeUri = 'https://w3id.org/eudpp#Height';
      const ancestors = service.getAncestors(typeUri);
      expect(Array.isArray(ancestors)).toBeTruthy();
      expect(ancestors.length).toBeGreaterThan(0);
      expect(ancestors).toContain('https://w3id.org/eudpp#ProductDimension');
      expect(ancestors).toContain('https://w3id.org/eudpp#QuantitativeProperty');
      expect(ancestors).toContain('https://w3id.org/eudpp#Property');
    });

    it('should return empty array when no ancestors exist', () => {
      const typeUri = 'https://w3id.org/eudpp#Product';
      const ancestors = service.getAncestors(typeUri);
      expect(ancestors).toEqual([]);
    });

    it('should handle null/undefined gracefully', () => {
      const ancestors = service.getAncestors('');
      expect(ancestors).toEqual([]);
    });
  });

  describe('getLabel', () => {
    it('should return property label when available', () => {
      const propertyUri = 'https://w3id.org/eudpp#uniqueProductID';
      const label = service.getLabel(propertyUri);
      expect(label).toBe('Unique Product ID');
    });

    it('should return class label when available', () => {
      const classUri = 'https://w3id.org/eudpp#Product';
      const label = service.getLabel(classUri);
      expect(label).toBe('Product');
    });

    it('should return formatted local name when no label exists', () => {
      const unknownUri = 'https://example.com/myPropertyName';
      const label = service.getLabel(unknownUri);
      expect(label).toBe('My Property Name');
    });

    it('should format camelCase URIs correctly', () => {
      const camelCaseUri = 'https://example.com/myVeryLongPropertyName';
      const label = service.getLabel(camelCaseUri);
      expect(label).toBe('My Very Long Property Name');
    });

    it('should format underscore URIs correctly', () => {
      const underscoreUri = 'https://example.com/my_property_name';
      const label = service.getLabel(underscoreUri);
      expect(label).toBe('My Property Name');
    });

    it('should format dash URIs correctly', () => {
      const dashUri = 'https://example.com/my-property-name';
      const label = service.getLabel(dashUri);
      expect(label).toBe('My Property Name');
    });

    it('should handle fragment URIs correctly', () => {
      const fragmentUri = 'https://example.com/ontology#myProperty';
      const label = service.getLabel(fragmentUri);
      expect(label).toBe('My Property');
    });

    it('should handle empty or simple URIs', () => {
      expect(service.getLabel('simple')).toBe('Simple');
      expect(service.getLabel('ALLCAPS')).toBe('ALLCAPS');
      expect(service.getLabel('lowercase')).toBe('Lowercase');
    });
  });
});
