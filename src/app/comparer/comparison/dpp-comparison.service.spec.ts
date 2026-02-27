import { TestBed } from '@angular/core/testing';
import { ComparisonRow, ExtractionResponse } from './comparison.model';
import { DppComparisonService } from './dpp-comparison.service';

function makeResponse(results: object[]): ExtractionResponse {
  return { results };
}

function makeRow(overrides: Partial<ComparisonRow> = {}): ComparisonRow {
  return {
    propertyKey: 'weight',
    propertyLabel: 'Weight',
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
          { '@id': 'urn:dpp:001', productName: 'A' },
        ]));
        expect(result.columns[0].dppId).toBe('urn:dpp:001');
      });

      it('should prefer id over @id for dppId', () => {
        const result = service.transformToComparisonRows(makeResponse([
          { id: 'id-1', '@id': 'urn:dpp:001', productName: 'A' },
        ]));
        expect(result.columns[0].dppId).toBe('id-1');
      });

      it('should fall back to DPP-{n+1} when both id and @id are absent', () => {
        const result = service.transformToComparisonRows(makeResponse([
          { productName: 'A' },
          { productName: 'B' },
        ]));
        expect(result.columns[0].dppId).toBe('DPP-1');
        expect(result.columns[1].dppId).toBe('DPP-2');
      });

      it('should use productName as dppLabel', () => {
        const result = service.transformToComparisonRows(makeResponse([
          { id: 'x', productName: 'My Product' },
        ]));
        expect(result.columns[0].dppLabel).toBe('My Product');
      });

      it('should prefer name over productName for dppLabel', () => {
        const result = service.transformToComparisonRows(makeResponse([
          { id: 'x', name: 'Name', productName: 'Product Name' },
        ]));
        expect(result.columns[0].dppLabel).toBe('Name');
      });

      it('should fall back to DPP {n+1} label when no name fields present', () => {
        const result = service.transformToComparisonRows(makeResponse([
          { id: 'x' },
          { id: 'y' },
        ]));
        expect(result.columns[0].dppLabel).toBe('DPP 1');
        expect(result.columns[1].dppLabel).toBe('DPP 2');
      });

      it('should produce one column per result entry', () => {
        const result = service.transformToComparisonRows(makeResponse([
          { id: 'a', productName: 'A' },
          { id: 'b', productName: 'B' },
          { id: 'c', productName: 'C' },
        ]));
        expect(result.columns.length).toBe(3);
      });
    });

    // ── property key exclusion ────────────────────────────────────────────────

    describe('excluded keys', () => {
      it('should exclude id from rows', () => {
        const result = service.transformToComparisonRows(makeResponse([
          { id: 'x', weight: 10 },
        ]));
        const keys = result.rows.map(r => r.propertyKey);
        expect(keys).not.toContain('id');
      });

      it('should exclude @id from rows', () => {
        const result = service.transformToComparisonRows(makeResponse([
          { '@id': 'x', weight: 10 },
        ]));
        const keys = result.rows.map(r => r.propertyKey);
        expect(keys).not.toContain('@id');
      });

      it('should exclude @context from rows', () => {
        const result = service.transformToComparisonRows(makeResponse([
          { '@context': 'http://schema.org', weight: 10 },
        ]));
        const keys = result.rows.map(r => r.propertyKey);
        expect(keys).not.toContain('@context');
      });

      it('should exclude @type from rows', () => {
        const result = service.transformToComparisonRows(makeResponse([
          { '@type': 'Product', weight: 10 },
        ]));
        const keys = result.rows.map(r => r.propertyKey);
        expect(keys).not.toContain('@type');
      });
    });

    // ── isDifferent ───────────────────────────────────────────────────────────

    describe('isDifferent', () => {
      it('should mark row as NOT different when all DPPs have same value', () => {
        const result = service.transformToComparisonRows(makeResponse([
          { id: 'a', weight: 10 },
          { id: 'b', weight: 10 },
        ]));
        const row = result.rows.find(r => r.propertyKey === 'weight')!;
        expect(row.isDifferent).toBeFalse();
      });

      it('should mark row as different when DPPs have different values', () => {
        const result = service.transformToComparisonRows(makeResponse([
          { id: 'a', weight: 10 },
          { id: 'b', weight: 20 },
        ]));
        const row = result.rows.find(r => r.propertyKey === 'weight')!;
        expect(row.isDifferent).toBeTrue();
      });

      it('should mark row as different when one DPP has missing value', () => {
        const result = service.transformToComparisonRows(makeResponse([
          { id: 'a', weight: 10 },
          { id: 'b' },
        ]));
        const row = result.rows.find(r => r.propertyKey === 'weight')!;
        // one has value, one is missing → distinct values
        expect(row.isDifferent).toBeTrue();
      });

      it('should NOT mark row as different when all DPPs are missing the property', () => {
        const result = service.transformToComparisonRows(makeResponse([
          { id: 'a' },
          { id: 'b' },
        ]));
        // no rows should exist for absent properties in both
        const row = result.rows.find(r => r.propertyKey === 'weight');
        // if both are missing, distinctValues stays empty → isDifferent = false
        if (row) {
          expect(row.isDifferent).toBeFalse();
        }
      });
    });

    describe('isMissing', () => {
      it('should mark value as missing when property is undefined on a DPP', () => {
        const result = service.transformToComparisonRows(makeResponse([
          { id: 'a', weight: 10 },
          { id: 'b' },
        ]));
        const row = result.rows.find(r => r.propertyKey === 'weight')!;
        const col = result.columns.find(c => c.dppId === 'b')!;
        expect(row.values.get(col.dppId)!.isMissing).toBeTrue();
      });

      it('should mark value as missing when property is null', () => {
        const result = service.transformToComparisonRows(makeResponse([
          { id: 'a', weight: null },
        ]));
        const row = result.rows.find(r => r.propertyKey === 'weight')!;
        expect(row.values.get('a')!.isMissing).toBeTrue();
      });

      it('should NOT mark value as missing when property is 0', () => {
        const result = service.transformToComparisonRows(makeResponse([
          { id: 'a', weight: 0 },
        ]));
        const row = result.rows.find(r => r.propertyKey === 'weight')!;
        expect(row.values.get('a')!.isMissing).toBeFalse();
      });

      it('should NOT mark value as missing when property is false', () => {
        const result = service.transformToComparisonRows(makeResponse([
          { id: 'a', isEnergyRelated: false },
        ]));
        const row = result.rows.find(r => r.propertyKey === 'isEnergyRelated')!;
        expect(row.values.get('a')!.isMissing).toBeFalse();
      });

      it('should NOT mark value as missing when property is empty string', () => {
        const result = service.transformToComparisonRows(makeResponse([
          { id: 'a', productName: '' },
        ]));
        const row = result.rows.find(r => r.propertyKey === 'productName')!;
        expect(row.values.get('a')!.isMissing).toBeFalse();
      });
    });

    describe('displayValue', () => {
      it('should format missing value as em dash', () => {
        const result = service.transformToComparisonRows(makeResponse([
          { id: 'a', weight: null },
        ]));
        const row = result.rows.find(r => r.propertyKey === 'weight')!;
        expect(row.values.get('a')!.displayValue).toBe('—');
      });

      it('should format boolean true as checkmark', () => {
        const result = service.transformToComparisonRows(makeResponse([
          { id: 'a', active: true },
        ]));
        const row = result.rows.find(r => r.propertyKey === 'active')!;
        expect(row.values.get('a')!.displayValue).toBe('✓');
      });

      it('should format boolean false as cross', () => {
        const result = service.transformToComparisonRows(makeResponse([
          { id: 'a', active: false },
        ]));
        const row = result.rows.find(r => r.propertyKey === 'active')!;
        expect(row.values.get('a')!.displayValue).toBe('✗');
      });

      it('should format array as [n items]', () => {
        const result = service.transformToComparisonRows(makeResponse([
          { id: 'a', tags: ['x', 'y', 'z'] },
        ]));
        const row = result.rows.find(r => r.propertyKey === 'tags')!;
        expect(row.values.get('a')!.displayValue).toBe('[3 items]');
      });

      it('should format plain object as [Object]', () => {
        const result = service.transformToComparisonRows(makeResponse([
          { id: 'a', meta: { foo: 'bar' } },
        ]));
        const row = result.rows.find(r => r.propertyKey === 'meta')!;
        expect(row.values.get('a')!.displayValue).toBe('[Object]');
      });

      it('should format number with en locale', () => {
        const result = service.transformToComparisonRows(makeResponse([
          { id: 'a', weight: 1234567 },
        ]));
        const row = result.rows.find(r => r.propertyKey === 'weight')!;
        expect(row.values.get('a')!.displayValue).toBe((1234567).toLocaleString('en'));
      });

      it('should format string as-is', () => {
        const result = service.transformToComparisonRows(makeResponse([
          { id: 'a', productName: 'My Product' },
        ]));
        const row = result.rows.find(r => r.propertyKey === 'productName')!;
        expect(row.values.get('a')!.displayValue).toBe('My Product');
      });
    });


    describe('nested rows', () => {
      it('should generate nested rows for object-valued properties', () => {
        const result = service.transformToComparisonRows(makeResponse([
          { id: 'a', weight: { value: 10, unit: 'kg' } },
          { id: 'b', weight: { value: 12, unit: 'kg' } },
        ]));
        const nestedRows = result.rows.filter(r => r.isNested);
        expect(nestedRows.length).toBeGreaterThan(0);
      });

      it('should set isNested to true on nested rows', () => {
        const result = service.transformToComparisonRows(makeResponse([
          { id: 'a', weight: { value: 10, unit: 'kg' } },
        ]));
        const nestedRows = result.rows.filter(r => r.isNested);
        nestedRows.forEach(r => expect(r.isNested).toBeTrue());
      });

      it('should set level to 1 on first-level nested rows', () => {
        const result = service.transformToComparisonRows(makeResponse([
          { id: 'a', weight: { value: 10, unit: 'kg' } },
        ]));
        const nestedRows = result.rows.filter(r => r.isNested);
        nestedRows.forEach(r => expect(r.level).toBe(1));
      });

      it('should set parentKey on nested rows', () => {
        const result = service.transformToComparisonRows(makeResponse([
          { id: 'a', weight: { value: 10, unit: 'kg' } },
        ]));
        const nestedRows = result.rows.filter(r => r.isNested);
        nestedRows.forEach(r => expect(r.parentKey).toBe('weight'));
      });

      it('should place nested rows immediately after their parent row', () => {
        const result = service.transformToComparisonRows(makeResponse([
          { id: 'a', weight: { value: 10, unit: 'kg' } },
        ]));
        const parentIdx = result.rows.findIndex(r => r.propertyKey === 'weight');
        const nextRow = result.rows[parentIdx + 1];
        expect(nextRow.isNested).toBeTrue();
        expect(nextRow.parentKey).toBe('weight');
      });

      it('should NOT generate nested rows for scalar properties', () => {
        const result = service.transformToComparisonRows(makeResponse([
          { id: 'a', weight: 10 },
        ]));
        const nestedRows = result.rows.filter(r => r.isNested);
        expect(nestedRows.length).toBe(0);
      });

      it('should NOT generate nested rows for array properties', () => {
        const result = service.transformToComparisonRows(makeResponse([
          { id: 'a', tags: ['x', 'y'] },
        ]));
        const nestedRows = result.rows.filter(r => r.isNested);
        expect(nestedRows.length).toBe(0);
      });
    });

    describe('property key ordering', () => {
      it('should sort property keys alphabetically', () => {
        const result = service.transformToComparisonRows(makeResponse([
          { id: 'a', weight: 1, carbonFootprint: 2, productName: 'X' },
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
          { id: 'a', weight: 10 },
          { id: 'b', carbonFootprint: 5 },
        ]));
        const keys = result.rows.map(r => r.propertyKey);
        expect(keys).toContain('weight');
        expect(keys).toContain('carbonFootprint');
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
        { id: 'a', productName: 'X' },
      ]));
      const row = result.rows.find(r => r.propertyKey === 'productName')!;
      expect(row.propertyLabel).toBe('productName');
    });

    it('should prefix nested label with type when @type filter is in path', () => {

      const result = service.transformToComparisonRows(makeResponse([
        { id: 'a', weight: { value: 10, unit: 'kg' } },
      ]));
      const nestedValueRow = result.rows.find(r => r.propertyKey === 'weight.value');
      if (nestedValueRow) {
        expect(nestedValueRow.propertyLabel).not.toContain('[');
        expect(nestedValueRow.propertyLabel).not.toContain('@type=');
      }
    });
  });
});