import { Component, EventEmitter, input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TreeNode } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { TreeModule } from 'primeng/tree';
import { ExtractorService } from '../../../common/comparison.service';
import { OntologyJsonLd, PropertyData, PropertySelection } from '../ontology-tree.model';
import { OntologyTreeService } from '../ontology-tree.service';

@Component({
  standalone: true,
  selector: 'app-ontology-tree',
  templateUrl: './ontology-tree.component.html',
  styleUrls: ['./ontology-tree.component.css'],
  imports: [FormsModule, TreeModule, ButtonModule, ChipModule, TagModule, InputTextModule, TooltipModule]
})
export class OntologyTreeComponent implements OnInit, OnChanges {

  ontology?: OntologyJsonLd
  selectionMode = input<"single" | "multiple" | "checkbox" | null | undefined>('checkbox');
  showSearch = input<boolean>(true);
  showStats = input<boolean>(true);

  @Output()
  propertiesSelected: EventEmitter<PropertySelection> = new EventEmitter<PropertySelection>()

  treeNodes: TreeNode[] = [];
  selectedNodes: TreeNode[] = [];
  filteredNodes: TreeNode[] = [];

  searchText = '';
  loading = false;

  ontologyUrl = '';
  loadingOntology = false;

  totalProperties = 0;
  selectedCount = 0;

  constructor(private ontologyService: OntologyTreeService, private extractorService: ExtractorService) { }

  ngOnInit(): void {
    this.buildTree();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['ontology'] && !changes['ontology'].firstChange) {
      this.buildTree();
    }
  }


  private buildTree(): void {
    if (!this.ontology) return;

    this.loading = true;

    setTimeout(() => {
      try {
        this.treeNodes = this.ontologyService.transformOntologyToTree(this.ontology!);
        this.filteredNodes = [...this.treeNodes];
        this.calculateStats();
        this.expandToLevel(2);

        this.loading = false;
      } catch (error) {
        console.error('Error building tree:', error);
        this.loading = false;
      }
    }, 0);
  }

  /**
   * Expand till the level passed as a parameter
   */
  expandToLevel(maxLevel: number): void {
    this.expandToLevelRecursive(this.filteredNodes, maxLevel, 0);
  }


  private expandToLevelRecursive(nodes: TreeNode[], maxLevel: number, currentLevel: number): void {
    nodes.forEach(node => {
      node.expanded = currentLevel < maxLevel;
      if (node.children && currentLevel < maxLevel) {
        this.expandToLevelRecursive(node.children, maxLevel, currentLevel + 1);
      }
    });
  }


  private calculateStats(): void {
    this.totalProperties = this.countLeafNodes(this.treeNodes);
    this.selectedCount = this.selectedNodes.length;
  }


  private countLeafNodes(nodes: TreeNode[]): number {
    let count = 0;
    nodes.forEach(node => {
      if (node.leaf) {
        count++;
      }
      if (node.children) {
        count += this.countLeafNodes(node.children);
      }
    });
    return count;
  }


  onNodeSelect(event: any): void {
    this.updateSelection();
  }


  onNodeUnselect(event: any): void {
    this.updateSelection();
  }


  private updateSelection(): void {
    this.selectedCount = this.selectedNodes.length;

    const paths = this.ontologyService.extractSelectedPaths(this.selectedNodes);
    const properties = this.ontologyService.extractSelectedProperties(this.selectedNodes);

    const selection: PropertySelection = {
      selectedPaths: paths,
      selectedProperties: properties
    };

    this.propertiesSelected.emit(selection);
  }


  onSearch(): void {
    if (!this.searchText || this.searchText.trim() === '') {
      this.filteredNodes = [...this.treeNodes];
      return;
    }

    const searchLower = this.searchText.toLowerCase().trim();
    this.filteredNodes = this.filterTree(this.treeNodes, searchLower);

    if (this.searchText) {
      this.expandAll();
    }
  }


  private filterTree(nodes: TreeNode[], searchText: string): TreeNode[] {
    const filtered: TreeNode[] = [];

    nodes.forEach(node => {
      const labelMatch = node.label?.toLowerCase().includes(searchText);
      const pathMatch = node.data?.path?.toLowerCase().includes(searchText);
      const commentMatch = node.data?.comment?.toLowerCase().includes(searchText);

      let filteredChildren: TreeNode[] = [];
      if (node.children) {
        filteredChildren = this.filterTree(node.children, searchText);
      }

      if (labelMatch || pathMatch || commentMatch || filteredChildren.length > 0) {
        const clonedNode = { ...node };
        if (filteredChildren.length > 0) {
          clonedNode.children = filteredChildren;
        }
        filtered.push(clonedNode);
      }
    });

    return filtered;
  }


  expandAll(): void {
    this.expandRecursive(this.filteredNodes, true);
  }


  collapseAll(): void {
    this.expandRecursive(this.filteredNodes, false);
  }


  private expandRecursive(nodes: TreeNode[], isExpand: boolean): void {
    nodes.forEach(node => {
      node.expanded = isExpand;
      if (node.children) {
        this.expandRecursive(node.children, isExpand);
      }
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
    nodes.forEach(node => {
      if (node.leaf && node.selectable) {
        leaves.push(node);
      }
      if (node.children) {
        leaves.push(...this.getAllLeafNodes(node.children));
      }
    });
    return leaves;
  }

  getSelectedCount(): number {
    return this.selectedCount;
  }


  getTotalCount(): number {
    return this.totalProperties;
  }


  hasSelection(): boolean {
    return this.selectedCount > 0;
  }


  getSelectedPaths(): string[] {
    return this.ontologyService.extractSelectedPaths(this.selectedNodes);
  }


  getSelectedProperties(): PropertyData[] {
    return this.ontologyService.extractSelectedProperties(this.selectedNodes);
  }


  getDataTypeSeverity(dataType: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
    switch (dataType) {
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
    const index = this.selectedNodes.indexOf(node);
    if (index > -1) {
      this.selectedNodes.splice(index, 1);
      this.updateSelection();
    }
  }


  onLoadOntologyFromUrl(): void {
    this.loadingOntology = true;
    this.extractorService.fetchOntology(this.ontologyUrl)
      .subscribe({
        next: (data) => {
          this.ontology = data
          this.buildTree()
          this.loadingOntology = false
        },
        error: (error) => {
          console.error('Error loading ontology:', error);
          this.loadingOntology = false;
        }
      })
  }
}