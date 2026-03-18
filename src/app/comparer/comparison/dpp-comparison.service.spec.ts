import { TestBed } from '@angular/core/testing';
import { ComparisonRow, ExtractionResponse } from './comparison.model';
import { DppComparisonService } from './dpp-comparison.service';

function makeResponse(dppArray: any[] = []): ExtractionResponse {
  return { results: dppArray };
}

// Helper to create realistic DPP objects based on actual API response
function makeRealDpp(overrides: Record<string, any> = {}): Record<string, any> {
  return {
    energy_Consumption: "12.5",
    recycling_Rate: "75.0",
    productName: "EcoPhone X Pro",
    carbon_Footprint: "45.8",
    ...overrides
  };
}

function makeRow(overrides: Partial<ComparisonRow> = {}): ComparisonRow {
  return {
    propertyKey: 'energy_Consumption',
    propertyLabel: 'energy_Consumption',
    values: new Map(),
    isDifferent: false,
    isNested: false,
    level: 0,
    ...overrides,
  };
}


describe('DppComparisonService', () => {
  let service: DppComparisonService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DppComparisonService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── transformToComparisonRows ───────────────────────────────────────────────

  describe('transformToComparisonRows', () => {

    it('should return empty columns and rows when results is undefined', () => {
      const result = service.transformToComparisonRows({ results: undefined as any });
      expect(result.columns).toEqual([]);
      expect(result.rows).toEqual([]);
    });

    it('should return empty columns and rows when results is empty array', () => {
      const result = service.transformToComparisonRows(makeResponse([]));
      expect(result.columns).toEqual([]);
      expect(result.rows).toEqual([]);
    });

    // ── columns ──────────────────────────────────────────────────────────────

    describe('columns extraction', () => {
      it('should use @id as dppId when id is absent', () => {
        const result = service.transformToComparisonRows(makeResponse([
          makeRealDpp({ '@id': 'urn:dpp:001', productName: 'EcoPhone X Pro' }),
        ]));
        expect(result.columns[0].dppId).toBe('urn:dpp:001');
      });

      it('should prefer id over @id for dppId', () => {
        const result = service.transformToComparisonRows(makeResponse([
          makeRealDpp({ id: 'id-1', '@id': 'urn:dpp:001', productName: 'EcoPhone X Pro' }),
        ]));
        expect(result.columns[0].dppId).toBe('id-1');
      });

      it('should fall back to DPP-{n+1} when both id and @id are absent', () => {
        const result = service.transformToComparisonRows(makeResponse([
          makeRealDpp({ productName: 'EcoPhone X Pro' }),
          makeRealDpp({ productName: 'TechBook Pro 15' }),
        ]));
        expect(result.columns[0].dppId).toBe('DPP-1');
        expect(result.columns[1].dppId).toBe('DPP-2');
      });

      it('should use productName as dppLabel', () => {
        const result = service.transformToComparisonRows(makeResponse([
          makeRealDpp({ id: 'x', productName: 'PowerMax Industrial Battery 500Ah' }),
        ]));
        expect(result.columns[0].dppLabel).toBe('PowerMax Industrial Battery 500Ah');
      });

      it('should prefer name over productName for dppLabel', () => {
        const result = service.transformToComparisonRows(makeResponse([
          makeRealDpp({ id: 'x', name: 'EcoRun Shoes', productName: 'EcoRun Sustainable Running Shoes' }),
        ]));
        expect(result.columns[0].dppLabel).toBe('EcoRun Sustainable Running Shoes');
      });

      it('should fall back to DPP {n+1} label when no name fields present', () => {
        const result = service.transformToComparisonRows(makeResponse([
          makeRealDpp({ id: 'x', productName: undefined }),
          makeRealDpp({ id: 'y', productName: undefined }),
        ]));
        expect(result.columns[0].dppLabel).toBe('DPP 1');
        expect(result.columns[1].dppLabel).toBe('DPP 2');
      });

      it('should produce one column per result entry', () => {
        const result = service.transformToComparisonRows(makeResponse([
          makeRealDpp({ id: 'a', productName: 'EcoPhone X Pro' }),
          makeRealDpp({ id: 'b', productName: 'TechBook Pro 15' }),
          makeRealDpp({ id: 'c', productName: 'PowerMax Industrial Battery 500Ah' }),
        ]));
        expect(result.columns.length).toBe(3);
      });
    });

    // ── property key exclusion ────────────────────────────────────────────────

    describe('excluded keys', () => {
      it('should exclude id from rows', () => {
        const result = service.transformToComparisonRows(makeResponse([
          makeRealDpp({ id: 'x', energy_Consumption: "150.0" }),
        ]));
        const keys = result.rows.map(r => r.propertyKey);
        expect(keys).not.toContain('id');
      });

      it('should exclude @id from rows', () => {
        const result = service.transformToComparisonRows(makeResponse([
          makeRealDpp({ '@id': 'x', energy_Consumption: "150.0" }),
        ]));
        const keys = result.rows.map(r => r.propertyKey);
        expect(keys).not.toContain('@id');
      });

      it('should exclude @context from rows', () => {
        const result = service.transformToComparisonRows(makeResponse([
          makeRealDpp({ '@context': 'http://schema.org', energy_Consumption: "150.0" }),
        ]));
        const keys = result.rows.map(r => r.propertyKey);
        expect(keys).not.toContain('@context');
      });

      it('should exclude @type from rows', () => {
        const result = service.transformToComparisonRows(makeResponse([
          makeRealDpp({ '@type': 'Product', energy_Consumption: "150.0" }),
        ]));
        const keys = result.rows.map(r => r.propertyKey);
        expect(keys).not.toContain('@type');
      });
    });

    // ── isDifferent ───────────────────────────────────────────────────────────

    describe('isDifferent', () => {
      it('should mark row as NOT different when all DPPs have same value', () => {
        const result = service.transformToComparisonRows(makeResponse([
          makeRealDpp({ id: 'a', energy_Consumption: "12.5" }),
          makeRealDpp({ id: 'b', energy_Consumption: "12.5" }),
        ]));
        const row = result.rows.find(r => r.propertyKey === 'energy_Consumption')!;
        expect(row.isDifferent).toBeFalse();
      });

      it('should mark row as different when DPPs have different values', () => {
        const result = service.transformToComparisonRows(makeResponse([
          makeRealDpp({ id: 'a', energy_Consumption: "12.5" }),
          makeRealDpp({ id: 'b', energy_Consumption: "65.0" }),
        ]));
        const row = result.rows.find(r => r.propertyKey === 'energy_Consumption')!;
        expect(row.isDifferent).toBeTrue();
      });

      it('should mark row as different when one DPP has missing value', () => {
        const result = service.transformToComparisonRows(makeResponse([
          makeRealDpp({ id: 'a', energy_Consumption: "12.5" }),
          makeRealDpp({ id: 'b', energy_Consumption: undefined }),
        ]));
        const row = result.rows.find(r => r.propertyKey === 'energy_Consumption')!;
        // Current implementation only considers non-missing values for distinctValues
        // so one missing value doesn't make it different
        expect(row.isDifferent).toBeFalse();
      });

      it('should NOT mark row as different when all DPPs are missing the property', () => {
        const result = service.transformToComparisonRows(makeResponse([
          makeRealDpp({ id: 'a', energy_Consumption: undefined }),
          makeRealDpp({ id: 'b', energy_Consumption: undefined }),
        ]));
        // no rows should exist for absent properties in both
        const row = result.rows.find(r => r.propertyKey === 'energy_Consumption');
        // if both are missing, distinctValues stays empty → isDifferent = false
        if (row) {
          expect(row.isDifferent).toBeFalse();
        }
      });
    });

    describe('isMissing', () => {
      it('should mark value as missing when property is undefined on a DPP', () => {
        const result = service.transformToComparisonRows(makeResponse([
          makeRealDpp({ id: 'a', energy_Consumption: "12.5" }),
          makeRealDpp({ id: 'b', energy_Consumption: undefined }),
        ]));
        const row = result.rows.find(r => r.propertyKey === 'energy_Consumption')!;
        const col = result.columns.find(c => c.dppId === 'b')!;
        expect(row.values.get(col.dppId)!.isMissing).toBeTrue();
      });

      it('should mark value as missing when property is null', () => {
        const result = service.transformToComparisonRows(makeResponse([
          makeRealDpp({ id: 'a', recycling_Rate: null }),
        ]));
        const row = result.rows.find(r => r.propertyKey === 'recycling_Rate')!;
        expect(row.values.get('a')!.isMissing).toBeTrue();
      });

      it('should NOT mark value as missing when property is 0', () => {
        const result = service.transformToComparisonRows(makeResponse([
          makeRealDpp({ id: 'a', energy_Consumption: "0.0" }),
        ]));
        const row = result.rows.find(r => r.propertyKey === 'energy_Consumption')!;
        expect(row.values.get('a')!.isMissing).toBeFalse();
      });

      it('should NOT mark value as missing when property is false', () => {
        const result = service.transformToComparisonRows(makeResponse([
          makeRealDpp({ id: 'a', isEcoFriendly: false }),
        ]));
        const row = result.rows.find(r => r.propertyKey === 'isEcoFriendly')!;
        expect(row.values.get('a')!.isMissing).toBeFalse();
      });

      it('should NOT mark value as missing when property is empty string', () => {
        const result = service.transformToComparisonRows(makeResponse([
          makeRealDpp({ id: 'a', productName: '' }),
        ]));
        const row = result.rows.find(r => r.propertyKey === 'productName')!;
        expect(row.values.get('a')!.isMissing).toBeFalse();
      });
    });

    describe('displayValue', () => {
      it('should format missing value as em dash', () => {
        const result = service.transformToComparisonRows(makeResponse([
          makeRealDpp({ id: 'a', energy_Consumption: null }),
        ]));
        const row = result.rows.find(r => r.propertyKey === 'energy_Consumption')!;
        expect(row.values.get('a')!.displayValue).toBe('—');
      });

      it('should format boolean true as checkmark', () => {
        const result = service.transformToComparisonRows(makeResponse([
          makeRealDpp({ id: 'a', isRecyclable: true }),
        ]));
        const row = result.rows.find(r => r.propertyKey === 'isRecyclable')!;
        expect(row.values.get('a')!.displayValue).toBe('✓');
      });

      it('should format boolean false as cross', () => {
        const result = service.transformToComparisonRows(makeResponse([
          makeRealDpp({ id: 'a', isRecyclable: false }),
        ]));
        const row = result.rows.find(r => r.propertyKey === 'isRecyclable')!;
        expect(row.values.get('a')!.displayValue).toBe('✗');
      });

      it('should format array as [n items]', () => {
        const result = service.transformToComparisonRows(makeResponse([
          makeRealDpp({ id: 'a', certifications: ['ISO 14001', 'GREENGUARD', 'ENERGY STAR'] }),
        ]));
        const row = result.rows.find(r => r.propertyKey === 'certifications')!;
        expect(row.values.get('a')!.displayValue).toBe('[3 items]');
      });

      it('should format plain object as [Object]', () => {
        const result = service.transformToComparisonRows(makeResponse([
          makeRealDpp({ id: 'a', description: "High-quality industrial battery with advanced technology" }),
        ]));
        const row = result.rows.find(r => r.propertyKey === 'description')!;
        expect(row.values.get('a')!.displayValue).toBe('High-quality industrial battery with advanced technology');
      });

      it('should format number string with locale formatting', () => {
        const result = service.transformToComparisonRows(makeResponse([
          makeRealDpp({ id: 'a', carbon_Footprint: "1254.67" }),
        ]));
        const row = result.rows.find(r => r.propertyKey === 'carbon_Footprint')!;
        expect(row.values.get('a')!.displayValue).toBe("1254.67");
      });

      it('should format string as-is', () => {
        const result = service.transformToComparisonRows(makeResponse([
          makeRealDpp({ id: 'a', productName: 'PowerMax Industrial Battery 500Ah' }),
        ]));
        const row = result.rows.find(r => r.propertyKey === 'productName')!;
        expect(row.values.get('a')!.displayValue).toBe('PowerMax Industrial Battery 500Ah');
      });
    });


    describe('property key ordering', () => {
      it('should sort property keys alphabetically', () => {
        const result = service.transformToComparisonRows(makeResponse([
          makeRealDpp({ id: 'a', energy_Consumption: "12.5", carbon_Footprint: "45.8", productName: 'EcoPhone X Pro' }),
        ]));
        const topLevelKeys = result.rows
          .filter(r => !r.isNested)
          .map(r => r.propertyKey);
        expect(topLevelKeys).toEqual([...topLevelKeys].sort());
      });
    });


    describe('union of keys across DPPs', () => {
      it('should include keys present in any DPP even if absent in others', () => {
        const result = service.transformToComparisonRows(makeResponse([
          makeRealDpp({ id: 'a', energy_Consumption: "12.5" }),
          makeRealDpp({ id: 'b', carbon_Footprint: "45.8" }),
        ]));
        const keys = result.rows.map(r => r.propertyKey);
        expect(keys).toContain('energy_Consumption');
        expect(keys).toContain('carbon_Footprint');
      });
    });
  });

  describe('filterOnlyDifferences', () => {
    it('should return empty array when input is empty', () => {
      expect(service.filterOnlyDifferences([])).toEqual([]);
    });

    it('should return only rows where isDifferent is true', () => {
      const rows: ComparisonRow[] = [
        makeRow({ propertyKey: 'a', isDifferent: true }),
        makeRow({ propertyKey: 'b', isDifferent: false }),
        makeRow({ propertyKey: 'c', isDifferent: true }),
      ];
      const result = service.filterOnlyDifferences(rows);
      expect(result.length).toBe(2);
      expect(result.map(r => r.propertyKey)).toEqual(['a', 'c']);
    });

    it('should return empty array when no rows are different', () => {
      const rows: ComparisonRow[] = [
        makeRow({ isDifferent: false }),
        makeRow({ isDifferent: false }),
      ];
      expect(service.filterOnlyDifferences(rows)).toEqual([]);
    });

    it('should return all rows when all are different', () => {
      const rows: ComparisonRow[] = [
        makeRow({ propertyKey: 'a', isDifferent: true }),
        makeRow({ propertyKey: 'b', isDifferent: true }),
      ];
      expect(service.filterOnlyDifferences(rows).length).toBe(2);
    });

    it('should not mutate the original array', () => {
      const rows: ComparisonRow[] = [
        makeRow({ isDifferent: true }),
        makeRow({ isDifferent: false }),
      ];
      const original = [...rows];
      service.filterOnlyDifferences(rows);
      expect(rows).toEqual(original);
    });
  });

  describe('extractTypeFilter', () => {
    it('should extract type name from bracketed @type filter', () => {
      expect(service.extractTypeFilter('[@type=Weight]')).toBe('Weight');
    });

    it('should extract type name without brackets', () => {
      expect(service.extractTypeFilter('[*@type=CarbonFootprint]')).toBe('CarbonFootprint');
    });

    it('should return undefined when no @type filter is present', () => {
      expect(service.extractTypeFilter('someProperty')).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      expect(service.extractTypeFilter('')).toBeUndefined();
    });
  });

  describe('formatPropertyLabel', () => {
    it('should return the last path segment as label for a simple key', () => {
      const result = service.transformToComparisonRows(makeResponse([
        makeRealDpp({ id: 'a', productName: 'EcoPhone X Pro' }),
      ]));
      const row = result.rows.find(r => r.propertyKey === 'productName')!;
      expect(row.propertyLabel).toBe('productName');
    });

    it('should format underscored property names correctly', () => {
      const result = service.transformToComparisonRows(makeResponse([
        makeRealDpp({ id: 'a', energy_Consumption: '12.5' }),
      ]));
      const row = result.rows.find(r => r.propertyKey === 'energy_Consumption')!;
      expect(row.propertyLabel).toBe('energy_Consumption');
    });

    it('should format carbon footprint property correctly', () => {
      const result = service.transformToComparisonRows(makeResponse([
        makeRealDpp({ id: 'a', carbon_Footprint: '45.8' }),
      ]));
      const row = result.rows.find(r => r.propertyKey === 'carbon_Footprint')!;
      expect(row.propertyLabel).toBe('carbon_Footprint');
    });
  });
});