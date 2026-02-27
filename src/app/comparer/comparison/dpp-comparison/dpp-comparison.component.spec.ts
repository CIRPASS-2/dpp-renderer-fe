import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ExtractorService } from '../../../common/comparison.service';
import { ComparisonRow, DppColumn, ExtractionResponse } from '../comparison.model';
import { DppComparisonService } from '../dpp-comparison.service';
import { DppComparisonComponent } from './dpp-comparison.component';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeExtractionResponse(overrides: Partial<ExtractionResponse> = {}): ExtractionResponse {
  return {
    results: [],
    ...overrides,
  };
}

function makeColumn(id: string, label: string): DppColumn {
  return { dppId: id, dppLabel: label };
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

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockColumns: DppColumn[] = [makeColumn('dpp-1', 'Product A'), makeColumn('dpp-2', 'Product B')];

const mockRows: ComparisonRow[] = [
  makeRow({ propertyKey: 'weight', propertyLabel: 'Weight', isDifferent: false }),
  makeRow({ propertyKey: 'carbonFootprint', propertyLabel: 'Carbon Footprint', isDifferent: true }),
  makeRow({ propertyKey: 'energy', propertyLabel: 'Energy', isDifferent: true }),
];

const mockComparisonService = {
  transformToComparisonRows: jasmine.createSpy('transformToComparisonRows').and.returnValue({
    columns: mockColumns,
    rows: mockRows,
  }),
  filterOnlyDifferences: jasmine.createSpy('filterOnlyDifferences').and.callFake(
    (rows: ComparisonRow[]) => rows.filter(r => r.isDifferent)
  ),
};

const mockExtractorService = {};

describe('DppComparisonComponent', () => {
  let component: DppComparisonComponent;
  let fixture: ComponentFixture<DppComparisonComponent>;

  beforeEach(async () => {
    mockComparisonService.transformToComparisonRows.calls.reset();
    mockComparisonService.filterOnlyDifferences.calls.reset();

    await TestBed.configureTestingModule({
      imports: [
        DppComparisonComponent,
        BadgeModule,
        ButtonModule,
        TableModule,
        TagModule,
        ProgressSpinnerModule,
      ],
      providers: [
        { provide: DppComparisonService, useValue: mockComparisonService },
        { provide: ExtractorService, useValue: mockExtractorService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DppComparisonComponent);
    component = fixture.componentInstance;
  });

  describe('initialisation', () => {
    it('should create', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should not call transformToComparisonRows when comparisonData is undefined on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(mockComparisonService.transformToComparisonRows).not.toHaveBeenCalled();
    }));

    it('should call transformToComparisonRows when comparisonData is set before init', fakeAsync(() => {
      const response = makeExtractionResponse({ results: [] });
      fixture.componentRef.setInput('comparisonData', response);
      fixture.detectChanges();
      tick();
      expect(mockComparisonService.transformToComparisonRows).toHaveBeenCalledWith(response);
    }));

    it('should populate columns and rows after processData', fakeAsync(() => {
      fixture.componentRef.setInput('comparisonData', makeExtractionResponse());
      fixture.detectChanges();
      tick();
      expect(component.columns).toEqual(mockColumns);
      expect(component.rows).toEqual(mockRows);
    }));

    it('should set displayedRows to all rows when showOnlyDifferences is false', fakeAsync(() => {
      fixture.componentRef.setInput('comparisonData', makeExtractionResponse());
      fixture.detectChanges();
      tick();
      expect(component.displayedRows).toEqual(mockRows);
    }));

    it('should set loading to false after processData completes', fakeAsync(() => {
      fixture.componentRef.setInput('comparisonData', makeExtractionResponse());
      fixture.detectChanges();
      tick();
      expect(component.loading).toBeFalse();
    }));
  });

  describe('ngOnChanges', () => {
    it('should NOT re-process on first change (handled by ngOnInit)', fakeAsync(() => {
      fixture.componentRef.setInput('comparisonData', makeExtractionResponse());
      fixture.detectChanges();
      tick();
      const callCount = mockComparisonService.transformToComparisonRows.calls.count();

      // simulate a second change
      fixture.componentRef.setInput('comparisonData', makeExtractionResponse({ results: [{ id: 'x' }] }));
      fixture.detectChanges();
      tick();

      expect(mockComparisonService.transformToComparisonRows.calls.count()).toBeGreaterThan(callCount);
    }));

    it('should re-process when comparisonData changes after first render', fakeAsync(() => {
      fixture.componentRef.setInput('comparisonData', makeExtractionResponse());
      fixture.detectChanges();
      tick();
      mockComparisonService.transformToComparisonRows.calls.reset();

      const newResponse = makeExtractionResponse({ results: [{ id: 'new' }] });
      fixture.componentRef.setInput('comparisonData', newResponse);
      fixture.detectChanges();
      tick();

      expect(mockComparisonService.transformToComparisonRows).toHaveBeenCalledWith(newResponse);
    }));
  });

  describe('onToggleDifferences', () => {
    beforeEach(fakeAsync(() => {
      fixture.componentRef.setInput('comparisonData', makeExtractionResponse());
      fixture.detectChanges();
      tick();
    }));

    it('should toggle showOnlyDifferences from false to true', () => {
      expect(component.showOnlyDifferences).toBeFalse();
      component.onToggleDifferences();
      expect(component.showOnlyDifferences).toBeTrue();
    });

    it('should toggle showOnlyDifferences back to false on second call', () => {
      component.onToggleDifferences();
      component.onToggleDifferences();
      expect(component.showOnlyDifferences).toBeFalse();
    });

    it('should call filterOnlyDifferences when toggled to true', () => {
      component.onToggleDifferences();
      expect(mockComparisonService.filterOnlyDifferences).toHaveBeenCalledWith(mockRows);
    });

    it('should set displayedRows to only different rows when toggled on', () => {
      component.onToggleDifferences();
      expect(component.displayedRows).toEqual(mockRows.filter(r => r.isDifferent));
    });

    it('should restore all rows when toggled back off', () => {
      component.onToggleDifferences();
      component.onToggleDifferences();
      expect(component.displayedRows).toEqual(mockRows);
    });
  });

  describe('getCellClass', () => {
    it('should return empty string when no value for dppId', () => {
      const row = makeRow({ values: new Map() });
      expect(component.getCellClass(row, 'dpp-1')).toBe('');
    });

    it('should include cell-missing when property is missing', () => {
      const row = makeRow({
        values: new Map([['dpp-1', { value: null, isMissing: true, isDifferent: false, displayValue: '—' }]]),
      });
      expect(component.getCellClass(row, 'dpp-1')).toContain('cell-missing');
    });

    it('should include cell-different when row isDifferent and value is not missing', () => {
      const row = makeRow({
        isDifferent: true,
        values: new Map([['dpp-1', { value: '10kg', isMissing: false, isDifferent: true, displayValue: '10kg' }]]),
      });
      expect(component.getCellClass(row, 'dpp-1')).toContain('cell-different');
    });

    it('should NOT include cell-different when value is missing even if row isDifferent', () => {
      const row = makeRow({
        isDifferent: true,
        values: new Map([['dpp-1', { value: null, isMissing: true, isDifferent: false, displayValue: '—' }]]),
      });
      const cls = component.getCellClass(row, 'dpp-1');
      expect(cls).toContain('cell-missing');
      expect(cls).not.toContain('cell-different');
    });

    it('should include cell-nested when row isNested', () => {
      const row = makeRow({
        isNested: true,
        level: 1,
        values: new Map([['dpp-1', { value: 'x', isMissing: false, isDifferent: false, displayValue: 'x' }]]),
      });
      expect(component.getCellClass(row, 'dpp-1')).toContain('cell-nested');
    });

    it('should return multiple classes combined', () => {
      const row = makeRow({
        isDifferent: true,
        isNested: true,
        level: 1,
        values: new Map([['dpp-1', { value: 'x', isMissing: false, isDifferent: true, displayValue: 'x' }]]),
      });
      const cls = component.getCellClass(row, 'dpp-1');
      expect(cls).toContain('cell-different');
      expect(cls).toContain('cell-nested');
    });
  });

  describe('getPropertyLabelStyle', () => {
    it('should return empty object for non-nested rows', () => {
      const row = makeRow({ isNested: false });
      expect(component.getPropertyLabelStyle(row)).toEqual({});
    });

    it('should return empty object for nested row without level', () => {
      const row = makeRow({ isNested: true, level: undefined });
      expect(component.getPropertyLabelStyle(row)).toEqual({});
    });

    it('should return padding-left based on level for nested rows', () => {
      const row = makeRow({ isNested: true, level: 1 });
      expect(component.getPropertyLabelStyle(row)).toEqual({ 'padding-left': '20px' });
    });

    it('should scale padding-left with level', () => {
      const row = makeRow({ isNested: true, level: 3 });
      expect(component.getPropertyLabelStyle(row)).toEqual({ 'padding-left': '60px' });
    });
  });

  describe('getPropertyIcon', () => {
    it('should return angle-right icon for nested rows', () => {
      expect(component.getPropertyIcon(makeRow({ isNested: true }))).toBe('pi pi-angle-right');
    });

    it('should return empty string for non-nested rows', () => {
      expect(component.getPropertyIcon(makeRow({ isNested: false }))).toBe('');
    });
  });


  describe('getDifferencesCount', () => {
    it('should return 0 when rows is empty', () => {
      component.rows = [];
      expect(component.getDifferencesCount()).toBe(0);
    });

    it('should count only rows where isDifferent is true', fakeAsync(() => {
      fixture.componentRef.setInput('comparisonData', makeExtractionResponse());
      fixture.detectChanges();
      tick();
      // mockRows has 2 different rows out of 3
      expect(component.getDifferencesCount()).toBe(2);
    }));
  });


  describe('getDifferencesBadgeSeverity', () => {
    it('should return info when differences ratio <= 0.3', () => {
      component.rows = [
        makeRow({ isDifferent: true }),
        makeRow({ isDifferent: false }),
        makeRow({ isDifferent: false }),
        makeRow({ isDifferent: false }),
      ];
      expect(component.getDifferencesBadgeSeverity()).toBe('info');
    });

    it('should return warn when differences ratio is between 0.3 and 0.5', () => {
      component.rows = [
        makeRow({ isDifferent: true }),
        makeRow({ isDifferent: true }),
        makeRow({ isDifferent: false }),
        makeRow({ isDifferent: false }),
        makeRow({ isDifferent: false }),
      ];
      expect(component.getDifferencesBadgeSeverity()).toBe('warn');
    });

    it('should return danger when differences ratio > 0.5', () => {
      component.rows = [
        makeRow({ isDifferent: true }),
        makeRow({ isDifferent: true }),
        makeRow({ isDifferent: true }),
        makeRow({ isDifferent: false }),
      ];
      expect(component.getDifferencesBadgeSeverity()).toBe('danger');
    });

    it('should return info when rows is empty (ratio = NaN, falls through to info)', () => {
      component.rows = [];
      expect(component.getDifferencesBadgeSeverity()).toBe('info');
    });
  });


  describe('runComparison', () => {
    it('should emit onRunComparison event', () => {
      const spy = jasmine.createSpy('onRunComparison');
      component.onRunComparison.subscribe(spy);
      component.runComparison();
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });


  describe('exportToCSV', () => {
    beforeEach(fakeAsync(() => {
      fixture.componentRef.setInput('comparisonData', makeExtractionResponse());
      fixture.detectChanges();
      tick();
    }));

    it('should create and click a download link', () => {
      const linkSpy = jasmine.createSpyObj('a', ['click', 'setAttribute', 'style']);
      linkSpy.style = {};
      spyOn(document, 'createElement').and.returnValue(linkSpy);
      spyOn(document.body, 'appendChild');
      spyOn(document.body, 'removeChild');
      spyOn(URL, 'createObjectURL').and.returnValue('blob:fake');

      component.exportToCSV();

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(linkSpy.setAttribute).toHaveBeenCalledWith('href', 'blob:fake');
      expect(linkSpy.setAttribute).toHaveBeenCalledWith('download', jasmine.stringMatching(/dpp-comparison-\d+\.csv/));
      expect(linkSpy.click).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalledWith(linkSpy);
    });

    it('should include header row with Property and column labels', () => {
      let capturedBlob: Blob | undefined;
      spyOn(URL, 'createObjectURL').and.callFake((blob: Blob) => {
        capturedBlob = blob;
        return 'blob:fake';
      });
      const linkSpy = jasmine.createSpyObj('a', ['click', 'setAttribute']);
      linkSpy.style = {};
      spyOn(document, 'createElement').and.returnValue(linkSpy);
      spyOn(document.body, 'appendChild');
      spyOn(document.body, 'removeChild');

      component.exportToCSV();

      capturedBlob!.text().then(text => {
        const lines = text.split('\n');
        expect(lines[0]).toContain('Property');
        expect(lines[0]).toContain('Product A');
        expect(lines[0]).toContain('Product B');
      });
    });
  });
});