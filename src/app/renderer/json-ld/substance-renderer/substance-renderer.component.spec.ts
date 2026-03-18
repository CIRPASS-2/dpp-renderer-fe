import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EUDPP_NS } from '../../../common/cirpass-dpp-ontology';
import { JsonLdNode } from '../../rendering-models';
import { SubstanceRendererComponent } from './substance-renderer.component';

const NS = EUDPP_NS;

// Mock child component
@Component({
  selector: 'app-quantitative-property-renderer',
  template: '',
  standalone: true
})
class MockQuantitativePropertyRendererComponent { }

describe('SubstanceRendererComponent', () => {
  let component: SubstanceRendererComponent;
  let fixture: ComponentFixture<SubstanceRendererComponent>;

  const mockSubstanceNode: JsonLdNode = {
    '@id': 'https://example.com/substance/123',
    '@type': [`${NS}SubstanceOfConcern`],
    [`${NS}usualName`]: [{ '@value': 'Test Substance' }],
    [`${NS}nameCAS`]: [{ '@value': 'CAS Name Test' }],
    [`${NS}nameIUPAC`]: [{ '@value': 'IUPAC Name Test' }],
    [`${NS}numberCAS`]: [{ '@value': '123-45-6' }],
    [`${NS}numberEC`]: [{ '@value': '789-012-3' }],
    [`${NS}abbreviation`]: [{ '@value': 'TST' }],
    [`${NS}tradeName`]: [{ '@value': 'Trade Test' }],
    [`${NS}otherName`]: [{ '@value': 'Other Name 1' }, { '@value': 'Other Name 2' }],
    [`${NS}substanceLocation`]: [{ '@value': 'Component A' }],
    [`${NS}hasImpactOnEnvironment`]: [{ '@value': 'High environmental impact' }],
    [`${NS}hasImpactOnHumanHealth`]: [{ '@value': 'Moderate health impact' }],
    [`${NS}hasConcentration`]: [{ '@id': 'https://example.com/concentration/1' }],
    [`${NS}hasThreshold`]: [{ '@id': 'https://example.com/threshold/1' }],
    [`${NS}hasLifeCycleStage`]: [
      { [`${NS}value`]: [{ '@value': 'Manufacturing' }] },
      { '@id': 'https://example.com/stage#Usage' }
    ]
  };

  const mockRegularSubstance: JsonLdNode = {
    '@id': 'https://example.com/substance/456',
    '@type': [`${NS}Substance`],
    [`${NS}casName`]: [{ '@value': 'Regular Substance' }]
  };

  const mockConcentrationNode: JsonLdNode = {
    '@id': 'https://example.com/concentration/1',
    [`${NS}value`]: [{ '@value': '10.5' }],
    [`${NS}unit`]: [{ '@value': 'mg/kg' }]
  };

  const mockThresholdNode: JsonLdNode = {
    '@id': 'https://example.com/threshold/1',
    [`${NS}value`]: [{ '@value': '5.0' }],
    [`${NS}unit`]: [{ '@value': 'ppm' }]
  };

  const mockGraph = new Map<string, JsonLdNode>([
    ['https://example.com/concentration/1', mockConcentrationNode],
    ['https://example.com/threshold/1', mockThresholdNode]
  ]);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubstanceRendererComponent, MockQuantitativePropertyRendererComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(SubstanceRendererComponent);
    component = fixture.componentInstance;

    component.node = mockSubstanceNode;
    component.graph = mockGraph;
    component.ngOnChanges(); // Initialize resolvedNode
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnChanges', () => {
    it('should resolve node from graph when IRI-only', () => {
      const iriOnlyNode = { '@id': 'https://example.com/substance/resolved' };
      const resolvedNode = { '@id': 'https://example.com/substance/resolved', '@type': ['Substance'] };

      component.graph.set('https://example.com/substance/resolved', resolvedNode);
      component.node = iriOnlyNode;

      component.ngOnChanges();

      expect((component as any).resolvedNode).toBe(resolvedNode);
    });

    it('should use original node when not IRI-only', () => {
      component.ngOnChanges();
      expect((component as any).resolvedNode).toBe(mockSubstanceNode);
    });

    it('should fallback to original when not found in graph', () => {
      const iriOnlyNode = { '@id': 'https://example.com/unknown' };
      component.node = iriOnlyNode;

      component.ngOnChanges();

      expect((component as any).resolvedNode).toBe(iriOnlyNode);
    });
  });

  describe('isSoC getter', () => {
    it('should return true for SubstanceOfConcern', () => {
      component.ngOnChanges();
      expect(component.isSoC).toBe(true);
    });

    it('should return false for regular Substance', () => {
      component.node = mockRegularSubstance;
      component.ngOnChanges();
      expect(component.isSoC).toBe(false);
    });

    it('should return false when no @type', () => {
      component.node = { '@id': 'test' };
      component.ngOnChanges();
      expect(component.isSoC).toBe(false);
    });
  });

  describe('displayName getter', () => {
    beforeEach(() => {
      component.ngOnChanges();
    });

    it('should return usualName when available', () => {
      expect(component.displayName).toBe('Test Substance');
    });

    it('should fallback to casName when usualName not available', () => {
      const nodeWithoutUsual = { ...mockSubstanceNode };
      delete nodeWithoutUsual[`${NS}usualName`];
      component.node = nodeWithoutUsual;
      component.ngOnChanges();

      expect(component.displayName).toBe('CAS Name Test');
    });

    it('should fallback to iupacName when others not available', () => {
      const nodeWithoutNames: any = {
        ...mockSubstanceNode,
        [`${NS}nameIUPAC`]: [{ '@value': 'IUPAC Only' }]
      };
      delete nodeWithoutNames[`${NS}usualName`];
      delete nodeWithoutNames[`${NS}nameCAS`];
      component.node = nodeWithoutNames;
      component.ngOnChanges();

      expect(component.displayName).toBe('IUPAC Only');
    });

    it('should return default when no names available', () => {
      component.node = { '@id': 'test' };
      component.ngOnChanges();
      expect(component.displayName).toBe('Substance');
    });
  });

  describe('property getters', () => {
    beforeEach(() => {
      component.ngOnChanges();
    });

    it('should return correct property values', () => {
      expect(component.casNumber).toBe('123-45-6');
      expect(component.ecNumber).toBe('789-012-3');
      expect(component.abbreviation).toBe('TST');
      expect(component.iupacName).toBe('IUPAC Name Test');
      expect(component.casName).toBe('CAS Name Test');
      expect(component.tradeName).toBe('Trade Test');
      expect(component.location).toBe('Component A');
      expect(component.envImpact).toBe('High environmental impact');
      expect(component.healthImpact).toBe('Moderate health impact');
    });

    it('should return undefined for missing properties', () => {
      component.node = { '@id': 'empty' };
      component.ngOnChanges();

      expect(component.casNumber).toBeUndefined();
      expect(component.ecNumber).toBeUndefined();
      expect(component.abbreviation).toBeUndefined();
    });

    it('should return array of other names', () => {
      expect(component.otherNames).toEqual(['Other Name 1', 'Other Name 2']);
    });
  });

  describe('concentrationNodes getter', () => {
    beforeEach(() => {
      component.ngOnChanges();
    });

    it('should resolve concentration nodes from graph', () => {
      const nodes = component.concentrationNodes;
      expect(nodes.length).toBe(1);
      expect(nodes[0]).toBe(mockConcentrationNode);
    });

    it('should return unresolved nodes when not in graph', () => {
      const nodeWithUnknownConc = {
        ...mockSubstanceNode,
        [`${NS}hasConcentration`]: [{ '@id': 'https://unknown.com/conc' }]
      };
      component.node = nodeWithUnknownConc;
      component.ngOnChanges();

      const nodes = component.concentrationNodes;
      expect(nodes).toEqual([{ '@id': 'https://unknown.com/conc' }]);
    });
  });

  describe('thresholdNodes getter', () => {
    beforeEach(() => {
      component.ngOnChanges();
    });

    it('should resolve threshold nodes from graph', () => {
      const nodes = component.thresholdNodes;
      expect(nodes.length).toBe(1);
      expect(nodes[0]).toBe(mockThresholdNode);
    });
  });

  describe('lifeCycleStages getter', () => {
    beforeEach(() => {
      component.ngOnChanges();
    });

    it('should extract lifecycle stages', () => {
      const stages = component.lifeCycleStages;
      expect(stages).toEqual(['Manufacturing', 'Usage']);
    });

    it('should return empty array when no stages', () => {
      component.node = { '@id': 'no-stages' };
      component.ngOnChanges();

      expect(component.lifeCycleStages).toEqual([]);
    });

    it('should handle stages without value', () => {
      const nodeWithBadStage = {
        '@id': 'test',
        [`${NS}hasLifeCycleStage`]: [{ '@id': 'unknown://stage' }]
      };
      component.node = nodeWithBadStage;
      component.ngOnChanges();

      const stages = component.lifeCycleStages;
      expect(stages).toEqual(['unknown://stage']); // Actual behavior: split('#').pop() returns full string when no '#'
    });
  });

  describe('template integration', () => {
    beforeEach(() => {
      component.ngOnChanges();
    });

    it('should render component template without errors', () => {
      fixture.detectChanges();
      expect(fixture.nativeElement).toBeTruthy();
    });

    it('should display substance information in template', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.p-card')).toBeTruthy();
    });
  });
});
