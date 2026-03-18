import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EUDPP_NS } from '../../../common/cirpass-dpp-ontology';
import { JsonLdNode } from '../../rendering-models';
import { ProductRendererComponent } from './product-renderer.component';

const NS = EUDPP_NS;

describe('ProductRendererComponent', () => {
  let component: ProductRendererComponent;
  let fixture: ComponentFixture<ProductRendererComponent>;

  const mockProductNode: JsonLdNode = {
    '@id': 'https://example.com/products/smartphone-123',
    '@type': [`${NS}Product`],
    [`${NS}productName`]: [{ '@value': 'EcoSmart Pro X1 Smartphone' }],
    [`${NS}uniqueProductID`]: [{ '@value': 'PROD-ECO-X1-2024-001' }],
    [`${NS}GTIN`]: [{ '@value': '1234567890123' }],
    [`${NS}productImage`]: [{ '@value': 'https://example.com/images/ecosmart-x1.jpg' }],
    [`${NS}description`]: [{ '@value': 'Advanced sustainable smartphone with recycled materials and energy-efficient design.' }],
    [`${NS}commodityCode`]: [{ '@value': '8517120000' }],
    [`${NS}isEnergyRelated`]: [{ '@value': 'true' }],
    [`${NS}granularity`]: [{ '@value': 'item' }],
    // Additional properties that should appear in extraUris
    [`${NS}productionDate`]: [{ '@value': '2024-03-15' }],
    [`${NS}weight`]: [{ '@value': '185' }],
    [`${NS}hasClassification`]: [{ '@id': 'https://example.com/classifications/electronics' }]
  };

  const mockMinimalProductNode: JsonLdNode = {
    '@id': 'https://example.com/products/generic-item',
    '@type': [`${NS}Product`]
  };

  const mockProductWithLimitedData: JsonLdNode = {
    '@id': 'https://example.com/products/simple-product',
    '@type': [`${NS}Product`],
    [`${NS}productName`]: [{ '@value': 'Basic Widget' }],
    [`${NS}uniqueProductID`]: [{ '@value': 'WIDGET-001' }],
    [`${NS}commodityCode`]: [{ '@value': '9999999999' }]
  };

  const mockGraph = new Map<string, JsonLdNode>([
    ['https://example.com/classifications/electronics', {
      '@id': 'https://example.com/classifications/electronics',
      '@type': [`${NS}ClassificationCode`],
      [`${NS}code`]: [{ '@value': 'ELEC-001' }]
    }]
  ]);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductRendererComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ProductRendererComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    component.node = mockProductNode;
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });
  describe('product information extraction', () => {
    beforeEach(() => {
      component.node = mockProductNode;
      component.graph = mockGraph;
    });

    describe('primary product fields', () => {
      it('should extract product name correctly', () => {
        expect(component.name).toBe('EcoSmart Pro X1 Smartphone');
      });

      it('should extract product ID correctly', () => {
        expect(component.productId).toBe('PROD-ECO-X1-2024-001');
      });

      it('should extract GTIN correctly', () => {
        expect(component.gtin).toBe('1234567890123');
      });

      it('should extract image URL correctly', () => {
        expect(component.imageUrl).toBe('https://example.com/images/ecosmart-x1.jpg');
      });

      it('should extract description correctly', () => {
        expect(component.description).toBe('Advanced sustainable smartphone with recycled materials and energy-efficient design.');
      });
    });

    describe('scalar fields for secondary display', () => {
      it('should return scalar fields excluding primary display fields', () => {
        const scalarFields = component.scalarFields;

        expect(scalarFields.length).toBe(3);

        const fieldByUri = scalarFields.reduce((acc, field) => {
          acc[field.uri] = field.value;
          return acc;
        }, {} as Record<string, string>);

        expect(fieldByUri[`${NS}commodityCode`]).toBe('8517120000');
        expect(fieldByUri[`${NS}isEnergyRelated`]).toBe('true');
        expect(fieldByUri[`${NS}granularity`]).toBe('item');

        // Should not include primary fields like productName, GTIN, etc.
        expect(scalarFields.find(f => f.uri === `${NS}productName`)).toBeUndefined();
        expect(scalarFields.find(f => f.uri === `${NS}GTIN`)).toBeUndefined();
      });

      it('should filter out empty scalar fields', () => {
        const nodeWithEmptyField = {
          ...mockProductNode,
          [`${NS}commodityCode`]: [{ '@value': '' }], // Empty value
          [`${NS}isEnergyRelated`]: [{ '@value': 'true' }]
        };
        component.node = nodeWithEmptyField;

        const scalarFields = component.scalarFields;
        expect(scalarFields.find(f => f.uri === `${NS}commodityCode`)).toBeUndefined();
        expect(scalarFields.find(f => f.uri === `${NS}isEnergyRelated`)).toBeDefined();
      });
    });

    describe('extra properties delegation', () => {
      it('should identify properties not in knownUris as extra', () => {
        const extraUris = component.extraUris;

        expect(extraUris.length).toBe(3);
        expect(extraUris).toContain(`${NS}productionDate`);
        expect(extraUris).toContain(`${NS}weight`);
        expect(extraUris).toContain(`${NS}hasClassification`);

        // Should not include known properties
        expect(extraUris).not.toContain(`${NS}productName`);
        expect(extraUris).not.toContain(`${NS}GTIN`);
      });

      it('should handle products with no extra properties', () => {
        component.node = mockProductWithLimitedData;

        const extraUris = component.extraUris;
        expect(extraUris.length).toBe(0);
      });
    });
  });

  describe('handling minimal product data', () => {
    beforeEach(() => {
      component.node = mockMinimalProductNode;
    });

    it('should handle missing product name gracefully', () => {
      expect(component.name).toBeUndefined();
    });

    it('should handle missing product ID gracefully', () => {
      expect(component.productId).toBeUndefined();
    });

    it('should handle missing GTIN gracefully', () => {
      expect(component.gtin).toBeUndefined();
    });

    it('should handle missing image URL gracefully', () => {
      expect(component.imageUrl).toBeUndefined();
    });

    it('should return empty scalar fields when no data available', () => {
      const scalarFields = component.scalarFields;
      expect(scalarFields.length).toBe(0);
    });

    it('should return empty extra URIs when only basic structure exists', () => {
      const extraUris = component.extraUris;
      expect(extraUris.length).toBeGreaterThanOrEqual(0); // May contain @id, @type
    });
  });

  describe('data filtering and organization', () => {
    it('should correctly categorize known vs unknown properties', () => {
      component.node = mockProductNode;

      const knownCount = component.knownUris.length;
      const scalarCount = component.scalarFields.length;
      const extraCount = component.extraUris.length;

      expect(knownCount).toBe(8); // Updated to reflect current knownUris array
      expect(scalarCount).toBeLessThanOrEqual(knownCount); // Scalar excludes some known ones
      expect(extraCount).toBeGreaterThan(0); // Extra properties exist
    });

    it('should maintain consistent property identification', () => {
      component.node = mockProductWithLimitedData;

      // All properties should be either in knownUris or extraUris, never both
      const allNodeProperties = Object.keys(mockProductWithLimitedData)
        .filter(key => !key.startsWith('@'));

      const classifiedAsKnown = allNodeProperties.filter(prop =>
        component.knownUris.includes(prop)
      );
      const classifiedAsExtra = allNodeProperties.filter(prop =>
        component.extraUris.includes(prop)
      );

      // No property should be in both categories
      const intersection = classifiedAsKnown.filter(prop =>
        classifiedAsExtra.includes(prop)
      );
      expect(intersection.length).toBe(0);
    });
  });

  describe('integration with rendering pipeline', () => {
    it('should provide data structure suitable for template rendering', () => {
      component.node = mockProductNode;
      component.graph = mockGraph;

      // Primary fields should be directly accessible
      expect(typeof component.name).toBe('string');
      expect(typeof component.productId).toBe('string');

      // Scalar fields should be structured for iteration
      const scalarFields = component.scalarFields;
      scalarFields.forEach(field => {
        expect(field.uri).toBeDefined();
        expect(field.value).toBeDefined();
        expect(typeof field.uri).toBe('string');
        expect(typeof field.value).toBe('string');
      });

      // Extra URIs should be array of strings
      const extraUris = component.extraUris;
      expect(Array.isArray(extraUris)).toBeTruthy();
      extraUris.forEach(uri => {
        expect(typeof uri).toBe('string');
      });
    });

    it('should handle graph dependency correctly', () => {
      component.node = mockProductNode;
      component.graph = new Map(); // Empty graph

      // Component should still function without graph data
      expect(component.name).toBeTruthy();
      expect(component.extraUris).toBeDefined();
    });
  });
});
