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
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { JsonObject, JsonValue } from '../../rendering-models';
import { PlainJsonRendererComponent } from './plain-json-renderer.component';

describe('PlainJsonRenderingComponent', () => {
  let component: PlainJsonRendererComponent;
  let fixture: ComponentFixture<PlainJsonRendererComponent>;

  const mockSimpleObject: JsonObject = {
    name: 'Test Product',
    price: 99.99,
    inStock: true,
    category: null
  };

  const mockNestedObject: JsonObject = {
    product: {
      id: 123,
      details: {
        weight: '2.5kg',
        dimensions: '10x20x30'
      }
    },
    tags: ['electronics', 'gadget'],
    reviews: [
      { rating: 5, comment: 'Great product' },
      { rating: 4, comment: 'Good value' }
    ],
    metadata: {
      created: '2024-01-01',
      modified: '2024-01-15'
    }
  };

  const mockArrayData: JsonObject[] = [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' }
  ];

  const mockMixedArray = [
    'string',
    123,
    { object: 'value' },
    null,
    true
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlainJsonRendererComponent],
      providers: [provideNoopAnimations()]
    })
      .compileComponents();

    fixture = TestBed.createComponent(PlainJsonRendererComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    component.data = mockSimpleObject;
    expect(component).toBeTruthy();
  });

  describe('Input properties', () => {
    it('should accept JsonObject data', () => {
      component.data = mockSimpleObject;
      expect(component.data).toBe(mockSimpleObject);
    });

    it('should accept JsonObject[] data', () => {
      component.data = mockArrayData;
      expect(component.data).toBe(mockArrayData);
    });

    it('should have default values for optional inputs', () => {
      component.data = mockSimpleObject;
      expect(component.panelLabel).toBeUndefined();
      expect(component.collapsed).toBe(false);
      expect(component.depth).toBe(0);
    });

    it('should accept custom values for optional inputs', () => {
      component.data = mockSimpleObject;
      component.panelLabel = 'Test Panel';
      component.collapsed = true;
      component.depth = 5;

      expect(component.panelLabel).toBe('Test Panel');
      expect(component.collapsed).toBe(true);
      expect(component.depth).toBe(5);
    });
  });

  describe('entries getter', () => {
    it('should process simple object data', () => {
      component.data = mockSimpleObject;
      const entries = component.entries;

      expect(entries.length).toBe(4);

      const nameEntry = entries.find(e => e.key === 'name');
      expect(nameEntry?.kind).toBe('primitive');
      expect(nameEntry?.primitiveValue).toBe('Test Product');

      const priceEntry = entries.find(e => e.key === 'price');
      expect(priceEntry?.kind).toBe('primitive');
      expect(priceEntry?.primitiveValue).toBe('99.99');

      const stockEntry = entries.find(e => e.key === 'inStock');
      expect(stockEntry?.kind).toBe('primitive');
      expect(stockEntry?.primitiveValue).toBe('true');

      const categoryEntry = entries.find(e => e.key === 'category');
      expect(categoryEntry?.kind).toBe('primitive');
      expect(categoryEntry?.primitiveValue).toBe('null');
    });

    it('should wrap array data in items property', () => {
      component.data = mockArrayData;
      const entries = component.entries;

      expect(entries.length).toBe(1);
      expect(entries[0].key).toBe('items');
      expect(entries[0].kind).toBe('array-of-objects');
      expect(entries[0].objectItems).toEqual(mockArrayData);
    });

    it('should handle nested objects', () => {
      component.data = mockNestedObject;
      const entries = component.entries;

      const productEntry = entries.find(e => e.key === 'product');
      expect(productEntry?.kind).toBe('object');
      expect(productEntry?.objectValue).toEqual(mockNestedObject['product'] as JsonObject);

      const metadataEntry = entries.find(e => e.key === 'metadata');
      expect(metadataEntry?.kind).toBe('object');
      expect(metadataEntry?.objectValue).toEqual(mockNestedObject['metadata'] as JsonObject);
    });

    it('should handle array of primitives', () => {
      const dataWithPrimitiveArray = { tags: ['tag1', 'tag2', 'tag3'] };
      component.data = dataWithPrimitiveArray;
      const entries = component.entries;

      const tagsEntry = entries.find(e => e.key === 'tags');
      expect(tagsEntry?.kind).toBe('array-of-primitives');
      expect(tagsEntry?.primitiveItems).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should handle array of objects', () => {
      component.data = mockNestedObject;
      const entries = component.entries;

      const reviewsEntry = entries.find(e => e.key === 'reviews');
      expect(reviewsEntry?.kind).toBe('array-of-objects');
      expect(reviewsEntry?.objectItems).toEqual(mockNestedObject['reviews'] as JsonObject[]);
    });

    it('should handle mixed arrays', () => {
      const dataWithMixedArray = { mixed: mockMixedArray };
      component.data = dataWithMixedArray;
      const entries = component.entries;

      const mixedEntry = entries.find(e => e.key === 'mixed');
      expect(mixedEntry?.kind).toBe('mixed-array');
      expect(mixedEntry?.mixedItems as any).toEqual(mockMixedArray);
    });

    it('should handle empty arrays', () => {
      const dataWithEmptyArray = { empty: [] };
      component.data = dataWithEmptyArray;
      const entries = component.entries;

      const emptyEntry = entries.find(e => e.key === 'empty');
      expect(emptyEntry?.kind).toBe('array-of-primitives');
      expect(emptyEntry?.primitiveItems).toEqual([]);
    });
  });

  describe('resolve method', () => {
    it('should resolve primitive values', () => {
      const stringResult = (component as any).resolve('key', 'value');
      expect(stringResult.kind).toBe('primitive');
      expect(stringResult.primitiveValue).toBe('value');

      const numberResult = (component as any).resolve('key', 42);
      expect(numberResult.kind).toBe('primitive');
      expect(numberResult.primitiveValue).toBe('42');

      const boolResult = (component as any).resolve('key', false);
      expect(boolResult.kind).toBe('primitive');
      expect(boolResult.primitiveValue).toBe('false');

      const nullResult = (component as any).resolve('key', null);
      expect(nullResult.kind).toBe('primitive');
      expect(nullResult.primitiveValue).toBe('null');
    });

    it('should resolve object values', () => {
      const obj = { nested: 'value' };
      const result = (component as any).resolve('key', obj);

      expect(result.kind).toBe('object');
      expect(result.objectValue).toBe(obj);
    });

    it('should resolve array of primitives', () => {
      const primitives = ['a', 'b', null, 123, true];
      const result = (component as any).resolve('key', primitives);

      expect(result.kind).toBe('array-of-primitives');
      expect(result.primitiveItems).toEqual(['a', 'b', 'null', '123', 'true']);
    });

    it('should resolve array of objects', () => {
      const objects = [{ id: 1 }, { id: 2 }];
      const result = (component as any).resolve('key', objects);

      expect(result.kind).toBe('array-of-objects');
      expect(result.objectItems).toBe(objects);
    });

    it('should resolve mixed arrays', () => {
      const mixed = ['string', { object: 'value' }, 123];
      const result = (component as any).resolve('key', mixed);

      expect(result.kind).toBe('mixed-array');
      expect(result.mixedItems).toBe(mixed);
    });

    it('should handle empty arrays as primitive arrays', () => {
      const result = (component as any).resolve('key', []);

      expect(result.kind).toBe('array-of-primitives');
      expect(result.primitiveItems).toEqual([]);
    });
  });

  describe('formatPrimitive method', () => {
    it('should format null as string', () => {
      const result = (component as any).formatPrimitive(null);
      expect(result).toBe('null');
    });

    it('should format booleans correctly', () => {
      const trueResult = (component as any).formatPrimitive(true);
      const falseResult = (component as any).formatPrimitive(false);

      expect(trueResult).toBe('true');
      expect(falseResult).toBe('false');
    });

    it('should format numbers and strings as strings', () => {
      const numberResult = (component as any).formatPrimitive(42.5);
      const stringResult = (component as any).formatPrimitive('hello');

      expect(numberResult).toBe('42.5');
      expect(stringResult).toBe('hello');
    });
  });

  describe('utility methods', () => {
    describe('isMixedPrimitive', () => {
      it('should return true for primitives', () => {
        expect(component.isMixedPrimitive('string')).toBe(true);
        expect(component.isMixedPrimitive(123)).toBe(true);
        expect(component.isMixedPrimitive(true)).toBe(true);
        expect(component.isMixedPrimitive(null)).toBe(true);
      });

      it('should return false for objects and arrays', () => {
        expect(component.isMixedPrimitive({})).toBe(false);
        expect(component.isMixedPrimitive([])).toBe(false);
        expect(component.isMixedPrimitive({ key: 'value' })).toBe(false);
      });
    });

    describe('formatMixed', () => {
      it('should format primitive values', () => {
        expect(component.formatMixed('string')).toBe('string');
        expect(component.formatMixed(123)).toBe('123');
        expect(component.formatMixed(true)).toBe('true');
        expect(component.formatMixed(null)).toBe('null');
      });

      it('should JSON stringify objects', () => {
        const obj = { key: 'value', num: 42 };
        const result = component.formatMixed(obj);
        expect(result).toBe(JSON.stringify(obj));
      });

      it('should JSON stringify arrays', () => {
        const arr = [1, 'two', { three: 3 }];
        const result = component.formatMixed(arr);
        expect(result).toBe(JSON.stringify(arr));
      });
    });

    describe('asObject', () => {
      it('should cast JsonValue to JsonObject', () => {
        const value: JsonValue = { key: 'value' };
        const result = component.asObject(value);
        expect(result).toBe(value);
        expect(typeof result).toBe('object');
      });
    });

    describe('tracking methods', () => {
      it('should track by key', () => {
        const entry = { key: 'testKey', kind: 'primitive' as const };
        const result = component.trackByKey(0, entry);
        expect(result).toBe('testKey');
      });

      it('should track by index', () => {
        const result = component.trackByIndex(5);
        expect(result).toBe(5);
      });
    });
  });

  describe('depth management', () => {
    it('should not be too deep at default depth', () => {
      component.data = mockSimpleObject;
      component.depth = 0;
      expect(component.isTooDeep).toBe(false);
    });

    it('should be too deep at max depth', () => {
      component.data = mockSimpleObject;
      component.depth = 15; // MAX_DEPTH
      expect(component.isTooDeep).toBe(true);
    });

    it('should not be too deep just under max depth', () => {
      component.data = mockSimpleObject;
      component.depth = 14; // MAX_DEPTH - 1
      expect(component.isTooDeep).toBe(false);
    });

    it('should be too deep beyond max depth', () => {
      component.data = mockSimpleObject;
      component.depth = 20; // > MAX_DEPTH
      expect(component.isTooDeep).toBe(true);
    });
  });

  describe('constants', () => {
    it('should have MAX_DEPTH constant', () => {
      expect((PlainJsonRendererComponent as any).MAX_DEPTH).toBe(15);
    });
  });

  describe('template integration', () => {
    beforeEach(() => {
      component.data = mockSimpleObject;
    });

    it('should render component template without errors', () => {
      fixture.detectChanges();
      expect(fixture.nativeElement).toBeTruthy();
    });

    it('should render fieldset when not collapsed', () => {
      component.data = mockNestedObject; // Use nested object that contains objects
      component.collapsed = false;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('p-fieldset')).toBeTruthy();
    });

    it('should handle complex nested data rendering', () => {
      component.data = mockNestedObject;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled).toBeTruthy();
      // Template should render without throwing errors
    });

    it('should handle array data rendering', () => {
      component.data = mockArrayData;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    it('should handle empty object', () => {
      component.data = {};
      const entries = component.entries;
      expect(entries).toEqual([]);
    });

    it('should handle object with undefined values', () => {
      const dataWithUndefined = { key: undefined };
      component.data = dataWithUndefined as any;
      const entries = component.entries;

      const entry = entries.find(e => e.key === 'key');
      expect(entry?.primitiveValue).toBe('undefined');
    });

    it('should handle deeply nested structures', () => {
      const deepObject = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: 'deep value'
              }
            }
          }
        }
      };

      component.data = deepObject;
      component.depth = 0;

      expect(() => {
        const entries = component.entries;
        entries.forEach(entry => {
          if (entry.kind === 'object') {
            expect(entry.objectValue).toBeDefined();
          }
        });
      }).not.toThrow();
    });

    it('should handle arrays with null values', () => {
      const dataWithNullArray = { nulls: [null, null, null] };
      component.data = dataWithNullArray;
      const entries = component.entries;

      const nullsEntry = entries.find(e => e.key === 'nulls');
      expect(nullsEntry?.kind).toBe('array-of-primitives');
      expect(nullsEntry?.primitiveItems).toEqual(['null', 'null', 'null']);
    });
  });
});
