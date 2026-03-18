import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { TreeNode } from 'primeng/api';
import { of } from 'rxjs';
import { ExtractorService } from '../../../common/comparison.service';
import { OntologyJsonLd } from '../ontology-tree.model';
import { OntologyTreeService } from '../ontology-tree.service';
import { LogicalField, OntologyTreeComponent } from './ontology-tree.component';

describe('OntologyTreeComponent', () => {
  let component: OntologyTreeComponent;
  let fixture: ComponentFixture<OntologyTreeComponent>;
  let ontologyServiceSpy: jasmine.SpyObj<OntologyTreeService>;
  let extractorServiceSpy: jasmine.SpyObj<ExtractorService>;

  const mockTreeNodes: TreeNode[] = [
    {
      key: '1',
      label: 'Product',
      data: { id: 'https://example.com/Product', type: ['Class'] },
      children: [
        {
          key: '1-1',
          label: 'name',
          data: {
            id: 'https://example.com/name',
            path: '/Product[*@type=Product].name',
            namespace: 'https://example.com/',
            localName: 'name',
            dataType: 'string'
          },
          leaf: true
        }
      ],
      leaf: false,
      expanded: true
    }
  ];

  const mockOntology: OntologyJsonLd = {
    '@graph': [
      {
        '@id': 'https://example.com/Product',
        '@type': ['http://www.w3.org/2000/01/rdf-schema#Class'],
        'http://www.w3.org/2000/01/rdf-schema#label': [{ '@value': 'Product' }]
      }
    ]
  };

  beforeEach(async () => {
    const ontologyServiceSpyObj = jasmine.createSpyObj('OntologyTreeService', [
      'transformOntologyToTree', 'extractSelectedPaths', 'extractSelectedProperties'
    ]);
    const extractorServiceSpyObj = jasmine.createSpyObj('ExtractorService', ['fetchOntology']);

    ontologyServiceSpyObj.transformOntologyToTree.and.returnValue(mockTreeNodes);
    ontologyServiceSpyObj.extractSelectedPaths.and.returnValue(['/Product[*@type=Product].name']);
    ontologyServiceSpyObj.extractSelectedProperties.and.returnValue([
      {
        id: 'https://example.com/name',
        path: '/Product[*@type=Product].name',
        namespace: 'https://example.com/',
        localName: 'name',
        dataType: 'string'
      }
    ]);
    extractorServiceSpyObj.fetchOntology.and.returnValue(of(mockOntology));

    await TestBed.configureTestingModule({
      imports: [OntologyTreeComponent, ReactiveFormsModule],
      providers: [
        { provide: OntologyTreeService, useValue: ontologyServiceSpyObj },
        { provide: ExtractorService, useValue: extractorServiceSpyObj }
      ]
    })
      .compileComponents();

    ontologyServiceSpy = TestBed.inject(OntologyTreeService) as jasmine.SpyObj<OntologyTreeService>;
    extractorServiceSpy = TestBed.inject(ExtractorService) as jasmine.SpyObj<ExtractorService>;
    fixture = TestBed.createComponent(OntologyTreeComponent);
    component = fixture.componentInstance;
    component.ontology = mockOntology;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should build tree on init with ontology', fakeAsync(() => {
    component.ontology = mockOntology;

    component.ngOnInit();
    tick(); // Advance the setTimeout in buildTree()

    expect(ontologyServiceSpy.transformOntologyToTree).toHaveBeenCalledWith(mockOntology);
    expect(component.treeNodes).toEqual(mockTreeNodes);
    expect(component.filteredNodes).toEqual(mockTreeNodes);
  }));

  it('should calculate stats correctly', () => {
    component.treeNodes = mockTreeNodes;
    (component as any).calculateStats();

    expect(component.totalProperties).toBe(1);
  });

  it('should filter tree nodes when searching', () => {
    component.treeNodes = mockTreeNodes;
    component.filteredNodes = [...mockTreeNodes];
    component.searchText = 'Product';

    component.onSearch();

    expect(component.filteredNodes.length).toBeGreaterThan(0);
  });

  it('should clear search and show all nodes', () => {
    component.treeNodes = mockTreeNodes;
    component.searchText = '';

    component.onSearch();

    expect(component.filteredNodes).toEqual(mockTreeNodes);
  });

  it('should update selection count when nodes are selected', () => {
    component.selectedNodes = [mockTreeNodes[0].children![0]];
    (component as any).updateSelection();

    expect(component.selectedCount).toBe(1);
  });

  it('should emit properties selection when selection changes', () => {
    spyOn(component.propertiesSelected, 'emit');
    component.selectedNodes = [mockTreeNodes[0].children![0]];

    (component as any).updateSelection();

    expect(component.propertiesSelected.emit).toHaveBeenCalledWith({
      selectedPaths: ['/Product[*@type=Product].name'],
      selectedProperties: jasmine.any(Array)
    });
  });

  it('should handle expand all operation', () => {
    component.filteredNodes = mockTreeNodes;

    component.expandAll();

    expect(component.filteredNodes[0].expanded).toBe(true);
  });

  it('should handle collapse all operation', () => {
    component.filteredNodes = mockTreeNodes;
    component.filteredNodes[0].expanded = true;

    component.collapseAll();

    expect(component.filteredNodes[0].expanded).toBe(false);
  });

  it('should load ontology from URL', () => {
    component.ontologyUrl = 'https://example.com/ontology.jsonld';

    component.onLoadOntologyFromUrl();

    expect(extractorServiceSpy.fetchOntology).toHaveBeenCalledWith('https://example.com/ontology.jsonld');
    expect(component.ontology).toBe(mockOntology);
  });

  it('should add logical field correctly', () => {
    component.newFieldName = 'Test Field';

    component.confirmAddField();

    expect(component.logicalFields.length).toBe(1);
    expect(component.logicalFields[0].logicalName).toBe('Test Field');
    // confirmAddField() does not reset newFieldName in the actual implementation
    expect(component.newFieldName).toBe('Test Field');
    expect(component.showAddFieldDialog).toBe(false);
  });

  it('should remove logical field correctly', () => {
    const testField: LogicalField = { id: 'test-1', logicalName: 'Test', mappedProperties: [] };
    component.logicalFields = [testField];

    component.removeLogicalField('test-1');

    expect(component.logicalFields.length).toBe(0);
  });

  it('should get correct selected count', () => {
    component.selectedCount = 5;

    expect(component.getSelectedCount()).toBe(5);
  });

  it('should calculate total count correctly', () => {
    component.totalProperties = 10;

    expect(component.getTotalCount()).toBe(10);
  });

  it('should detect if has selection', () => {
    component.selectedNodes = [mockTreeNodes[0]];
    component.selectedCount = component.selectedNodes.length;
    expect(component.hasSelection()).toBe(true);

    component.selectedNodes = [];
    component.selectedCount = component.selectedNodes.length;
    expect(component.hasSelection()).toBe(false);
  });

  it('should detect if has logical fields', () => {
    component.logicalFields = [{ id: 'test', logicalName: 'Test', mappedProperties: [] }];
    expect(component.hasLogicalFields()).toBe(true);

    component.logicalFields = [];
    expect(component.hasLogicalFields()).toBe(false);
  });
});
