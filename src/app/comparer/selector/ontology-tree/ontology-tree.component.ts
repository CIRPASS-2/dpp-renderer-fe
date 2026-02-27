import {
  Component,
  EventEmitter,
  input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TreeNode } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { TreeModule } from 'primeng/tree';
import { ExtractorService } from '../../../common/comparison.service';
import {
  OntologyJsonLd,
  OntologyPath,
  PropertyData,
  PropertyPathsMap,
  PropertySelection,
} from '../ontology-tree.model';
import { OntologyTreeService } from '../ontology-tree.service';

// ─── Logical mapping models ───────────────────────────────────────────────────

/**
 * A single property dragged onto a logical field card.
 * Extends PropertyData with a UI-only mappingId for list tracking.
 */
export interface MappedProperty extends PropertyData {
  mappingId: string;
}

/**
 * A logical field card: user-defined name + list of mapped ontology properties.
 */
export interface LogicalField {
  id: string;
  logicalName: string;
  mappedProperties: MappedProperty[];
}

/**
 * The full mapping state emitted via fieldMappingChanged.
 *
 * propertyPaths mirrors ExtractionRequest.propertyPaths on the BE:
 *   Map<String, List<OntologyPath>> propertyPaths
 * where key = logical field name (card name).
 */
export interface FieldMapping {
  logicalFields: LogicalField[];
  propertyPaths: PropertyPathsMap;
}

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  standalone: true,
  selector: 'app-ontology-tree',
  templateUrl: './ontology-tree.component.html',
  styleUrls: ['./ontology-tree.component.css'],
  imports: [
    FormsModule,
    TreeModule,
    ButtonModule,
    // DragDropModule rimosso: usiamo HTML5 nativo
    ChipModule,
    TagModule,
    InputTextModule,
    TooltipModule,
    DialogModule,
  ]
})
export class OntologyTreeComponent implements OnInit, OnChanges {

  // ── Inputs ─────────────────────────────────────────────────────────────────

  ontology?: OntologyJsonLd;
  selectionMode = input<'single' | 'multiple' | 'checkbox' | null | undefined>('checkbox');
  showSearch = input<boolean>(true);
  showStats = input<boolean>(true);

  // ── Outputs ────────────────────────────────────────────────────────────────

  @Output() propertiesSelected = new EventEmitter<PropertySelection>();
  @Output() fieldMappingChanged = new EventEmitter<FieldMapping>();

  // ── Tree state ─────────────────────────────────────────────────────────────

  treeNodes: TreeNode[] = [];
  selectedNodes: TreeNode[] = [];
  filteredNodes: TreeNode[] = [];

  searchText = '';
  loading = false;

  ontologyUrl = '';
  loadingOntology = false;

  totalProperties = 0;
  selectedCount = 0;

  // ── Logical field mapping ──────────────────────────────────────────────────

  logicalFields: LogicalField[] = [];

  // ── Add field dialog ───────────────────────────────────────────────────────

  showAddFieldDialog = false;
  newFieldName = '';

  // ── Drag state ─────────────────────────────────────────────────────────────

  private draggedNode: TreeNode | null = null;
  dragOverCardId: string | null = null;

  // ── Constructor ────────────────────────────────────────────────────────────

  constructor(
    private ontologyService: OntologyTreeService,
    private extractorService: ExtractorService
  ) { }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void { this.buildTree(); }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['ontology'] && !changes['ontology'].firstChange) {
      this.buildTree();
      // logicalFields intentionally NOT cleared on ontology reload
    }
  }

  // ── Tree building ──────────────────────────────────────────────────────────

  private buildTree(): void {
    if (!this.ontology) return;
    this.loading = true;
    setTimeout(() => {
      try {
        this.treeNodes = this.ontologyService.transformOntologyToTree(this.ontology!);
        this.filteredNodes = [...this.treeNodes];
        this.calculateStats();
        this.expandToLevel(2);
      } catch (e) {
        console.error('Error building tree:', e);
      } finally {
        this.loading = false;
      }
    }, 0);
  }

  expandToLevel(maxLevel: number): void {
    this.expandToLevelRecursive(this.filteredNodes, maxLevel, 0);
  }

  private expandToLevelRecursive(nodes: TreeNode[], maxLevel: number, level: number): void {
    nodes.forEach(node => {
      node.expanded = level < maxLevel;
      if (node.children && level < maxLevel) {
        this.expandToLevelRecursive(node.children, maxLevel, level + 1);
      }
    });
  }

  private calculateStats(): void {
    this.totalProperties = this.countLeafNodes(this.treeNodes);
    this.selectedCount = this.selectedNodes.length;
  }

  private countLeafNodes(nodes: TreeNode[]): number {
    let c = 0;
    nodes.forEach(n => {
      if (n.leaf) c++;
      if (n.children) c += this.countLeafNodes(n.children);
    });
    return c;
  }

  // ── Tree selection ─────────────────────────────────────────────────────────

  onNodeSelect(_e: any): void { this.updateSelection(); }
  onNodeUnselect(_e: any): void { this.updateSelection(); }

  private updateSelection(): void {
    this.selectedCount = this.selectedNodes.length;
    this.propertiesSelected.emit({
      selectedPaths: this.ontologyService.extractSelectedPaths(this.selectedNodes),
      selectedProperties: this.ontologyService.extractSelectedProperties(this.selectedNodes),
    });
  }

  // ── Search ─────────────────────────────────────────────────────────────────

  onSearch(): void {
    if (!this.searchText?.trim()) {
      this.filteredNodes = [...this.treeNodes];
      return;
    }
    const q = this.searchText.toLowerCase().trim();
    this.filteredNodes = this.filterTree(this.treeNodes, q);
    this.expandAll();
  }

  private filterTree(nodes: TreeNode[], q: string): TreeNode[] {
    const result: TreeNode[] = [];
    nodes.forEach(node => {
      const match =
        node.label?.toLowerCase().includes(q) ||
        node.data?.path?.toLowerCase().includes(q) ||
        node.data?.comment?.toLowerCase().includes(q);
      const filteredChildren = node.children ? this.filterTree(node.children, q) : [];
      if (match || filteredChildren.length > 0) {
        result.push({ ...node, children: filteredChildren.length > 0 ? filteredChildren : node.children });
      }
    });
    return result;
  }

  expandAll(): void { this.expandRecursive(this.filteredNodes, true); }
  collapseAll(): void { this.expandRecursive(this.filteredNodes, false); }

  private expandRecursive(nodes: TreeNode[], expand: boolean): void {
    nodes.forEach(n => {
      n.expanded = expand;
      if (n.children) this.expandRecursive(n.children, expand);
    });
  }

  selectAll(): void {
    this.selectedNodes = this.getAllLeafNodes(this.filteredNodes);
    this.updateSelection();
  }

  clearSelection(): void {
    this.selectedNodes = [];
    this.updateSelection();
  }

  private getAllLeafNodes(nodes: TreeNode[]): TreeNode[] {
    const leaves: TreeNode[] = [];
    nodes.forEach(n => {
      if (n.leaf && n.selectable) leaves.push(n);
      if (n.children) leaves.push(...this.getAllLeafNodes(n.children));
    });
    return leaves;
  }

  // ── Drag & Drop (HTML5 nativo) ─────────────────────────────────────────────

  /**
   * Fired when the drag starts on a tree node.
   * Guarda subito i non-leaf: non devono essere draggabili.
   */
  onNodeDragStart(event: DragEvent, node: TreeNode): void {
    if (!node.leaf) {
      event.preventDefault();
      return;
    }
    event.stopPropagation();
    this.draggedNode = node;
    if (event.dataTransfer) {
      console.log(node?.data)
      event.dataTransfer.setData('text/plain', node?.data?.path);
      event.dataTransfer.effectAllowed = 'copy';
    }
  }

  /**
   * Fired when the drag ends (con o senza drop avvenuto).
   * Pulisce lo stato in ogni caso.
   */
  onNodeDragEnd(event: DragEvent): void {
    event.stopPropagation();
    this.draggedNode = null;
    this.dragOverCardId = null;
  }

  /**
   * dragenter sul card body.
   * DEVE chiamare preventDefault() per segnalare al browser che l'elemento
   * accetta il drop; senza, l'evento 'drop' non viene mai sparato.
   */
  onCardDragEnter(event: DragEvent, cardId: string): void {
    event.preventDefault();
    this.dragOverCardId = cardId;
  }

  /**
   * dragover sul card body.
   * CRITICO: preventDefault() è obbligatorio a ogni evento dragover,
   * altrimenti il browser reimposta l'effetto su 'none' e annulla il drop.
   */
  onCardDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
  }

  /**
   * dragleave sul card body.
   * Filtra i falsi dragleave causati dall'entrata in elementi figli:
   * se relatedTarget è ancora dentro il currentTarget, ignoriamo l'evento.
   */
  onCardDragLeave(event: DragEvent): void {
    const related = event.relatedTarget as Node | null;
    if (related && (event.currentTarget as HTMLElement).contains(related)) return;
    this.dragOverCardId = null;
  }

  /**
   * drop sul card body.
   * preventDefault() impedisce al browser di aprire il dato come link/testo.
   */
  onCardDrop(event: DragEvent, card: LogicalField): void {
    event.preventDefault();
    this.dragOverCardId = null;

    const node = this.draggedNode;
    this.draggedNode = null; // consuma subito per evitare doppi drop

    if (!node?.data) return;

    const property = this.ontologyService.extractSelectedProperties([node])[0] as PropertyData;
    if (!property) return;

    const duplicate = card.mappedProperties.some(p =>
      (p.uri && p.uri === property.uri) || (!p.uri && p.path === property.path)
    );
    if (duplicate) return;

    const mapped: MappedProperty = { ...property, mappingId: crypto.randomUUID() };
    card.mappedProperties = [...card.mappedProperties, mapped];
    this.emitFieldMapping();
  }

  // ── Logical field CRUD ─────────────────────────────────────────────────────

  openAddFieldDialog(): void {
    this.newFieldName = '';
    this.showAddFieldDialog = true;
  }

  confirmAddField(): void {
    const name = this.newFieldName.trim();
    if (!name) return;
    this.logicalFields = [
      ...this.logicalFields,
      { id: crypto.randomUUID(), logicalName: name, mappedProperties: [] },
    ];
    this.showAddFieldDialog = false;
    this.emitFieldMapping();
  }

  removeLogicalField(fieldId: string): void {
    this.logicalFields = this.logicalFields.filter(f => f.id !== fieldId);
    this.emitFieldMapping();
  }

  removeMappedProperty(field: LogicalField, mappingId: string): void {
    field.mappedProperties = field.mappedProperties.filter(p => p.mappingId !== mappingId);
    this.emitFieldMapping();
  }

  // ── FieldMapping emission ──────────────────────────────────────────────────

  private emitFieldMapping(): void {
    const propertyPaths: PropertyPathsMap = {};
    this.logicalFields.forEach(field => {
      propertyPaths[field.logicalName] = field.mappedProperties.map(
        (p): OntologyPath => ({
          namespace: p.namespace ?? '',
          path: p.path ?? '',
        })
      );
    });
    this.fieldMappingChanged.emit({ logicalFields: this.logicalFields, propertyPaths });
  }

  // ── Ontology URL loader ────────────────────────────────────────────────────

  onLoadOntologyFromUrl(): void {
    this.loadingOntology = true;
    this.extractorService.fetchOntology(this.ontologyUrl).subscribe({
      next: (data) => {
        this.ontology = data;
        this.buildTree();
        this.loadingOntology = false;
      },
      error: (err) => {
        console.error('Error loading ontology:', err);
        this.loadingOntology = false;
      },
    });
  }

  // ── Public helpers ─────────────────────────────────────────────────────────

  getSelectedCount(): number { return this.selectedCount; }
  getTotalCount(): number { return this.totalProperties; }
  hasSelection(): boolean { return this.selectedCount > 0; }
  hasLogicalFields(): boolean { return this.logicalFields.length > 0; }

  getSelectedPaths(): string[] { return this.ontologyService.extractSelectedPaths(this.selectedNodes); }
  getSelectedProperties(): PropertyData[] { return this.ontologyService.extractSelectedProperties(this.selectedNodes); }

  buildPropertyPathsMap(): PropertyPathsMap {
    const propertyPaths: PropertyPathsMap = {};
    this.logicalFields.forEach(field => {
      propertyPaths[field.logicalName] = field.mappedProperties.map(
        (p): OntologyPath => ({ namespace: p.namespace ?? '', path: p.path ?? '' })
      );
    });
    return propertyPaths;
  }

  getDataTypeSeverity(dt: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    switch (dt) {
      case 'string': return 'info';
      case 'number': return 'success';
      case 'boolean': return 'warn';
      case 'date':
      case 'datetime': return 'secondary';
      case 'object': return 'contrast';
      default: return 'secondary';
    }
  }

  removeSelectedNode(node: TreeNode): void {
    const i = this.selectedNodes.indexOf(node);
    if (i > -1) {
      this.selectedNodes.splice(i, 1);
      this.updateSelection();
    }
  }

  getPath(node: TreeNode): string {
    return node.data.path;
  }



}