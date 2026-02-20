import { NgClass, NgStyle } from '@angular/common';
import { Component, EventEmitter, input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ExtractorService } from '../../../common/comparison.service';
import { PropertySelection } from '../../selector/ontology-tree.model';
import { ComparisonRow, DppColumn, ExtractionResponse } from '../comparison.model';
import { DppComparisonService } from '../dpp-comparison.service';
@Component({
  selector: 'app-dpp-comparison',
  templateUrl: './dpp-comparison.component.html',
  imports: [BadgeModule, ButtonModule, TableModule, TagModule, ProgressSpinnerModule, NgClass, NgStyle],
  styleUrls: ['./dpp-comparison.component.css']
})
export class DppComparisonComponent implements OnInit, OnChanges {

  comparisonData = input<ExtractionResponse>()

  columns: DppColumn[] = [];
  rows: ComparisonRow[] = [];
  displayedRows: ComparisonRow[] = [];

  @Output()
  onRunComparison: EventEmitter<void> = new EventEmitter<void>()

  dppUris = input<string[]>()

  selectedProperties = input<PropertySelection>()

  showOnlyDifferences = false;
  loading = false;

  constructor(private comparisonService: DppComparisonService, private extractorService: ExtractorService) { }

  ngOnInit(): void {
    this.processData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['comparisonData'] && !changes['comparisonData'].firstChange) {
      this.processData();
    }
  }

 
  private processData(): void {
    if (!this.comparisonData()) {
      return;
    }

    this.loading = true;

    setTimeout(() => {
      const transformed = this.comparisonService.transformToComparisonRows(this.comparisonData()!);
      this.columns = transformed.columns;
      this.rows = transformed.rows;
      this.applyFilters();
      this.loading = false;
    }, 0);
  }


  private applyFilters(): void {
    if (this.showOnlyDifferences) {
      this.displayedRows = this.comparisonService.filterOnlyDifferences(this.rows);
    } else {
      this.displayedRows = [...this.rows];
    }
  }


  onToggleDifferences(): void {
    this.showOnlyDifferences = !this.showOnlyDifferences;
    this.applyFilters();
  }


  getCellClass(row: ComparisonRow, dppId: string): string {
    const propertyValue = row.values.get(dppId);

    if (!propertyValue) {
      return '';
    }

    const classes: string[] = [];

    if (propertyValue.isMissing) {
      classes.push('cell-missing');
    } else if (row.isDifferent) {
      classes.push('cell-different');
    }

    if (row.isNested) {
      classes.push('cell-nested');
    }

    return classes.join(' ');
  }


  getPropertyLabelStyle(row: ComparisonRow): any {
    if (row.isNested && row.level) {
      return {
        'padding-left': `${row.level * 20}px`
      };
    }
    return {};
  }

 
  getPropertyIcon(row: ComparisonRow): string {
    return row.isNested ? 'pi pi-angle-right' : '';
  }


  exportToCSV(): void {
    const csvRows: string[] = [];

    const header = ['Property', ...this.columns.map(col => col.dppLabel)];
    csvRows.push(header.join(','));

    this.displayedRows.forEach(row => {
      const rowData = [
        row.propertyLabel,
        ...this.columns.map(col => {
          const propValue = row.values.get(col.dppId);
          return propValue ? `"${propValue.displayValue}"` : '""';
        })
      ];
      csvRows.push(rowData.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `dpp-comparison-${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }


  getDifferencesBadgeSeverity(): "info" | "success" | "warn" | "danger" | "secondary" | "contrast" {
    const differentCount = this.rows.filter(r => r.isDifferent).length;
    const totalCount = this.rows.length;
    const ratio = differentCount / totalCount;

    if (ratio > 0.5) return 'danger';
    if (ratio > 0.3) return 'warn';
    return 'info';
  }


  getDifferencesCount(): number {
    return this.rows.filter(r => r.isDifferent).length;
  }

  runComparison() {
    this.onRunComparison.emit()
  }
}