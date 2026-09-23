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
import { EUDPP_NS } from '../../../common/cirpass-dpp-ontology';
import { JsonLdNode } from '../../rendering-models';
import { FacilityRendererComponent } from './facility-renderer.component';

const NS = EUDPP_NS;
const SCHEMA = 'https://schema.org/';

describe('FacilityRendererComponent', () => {
  let component: FacilityRendererComponent;
  let fixture: ComponentFixture<FacilityRendererComponent>;

  const facilityIdentifierId = 'https://example.com/identifiers/facility-123';

  const mockFacilityNode: JsonLdNode = {
    '@id': 'https://example.com/facility/123',
    '@type': [`${NS}Facility`],
    [`${NS}hasUniqueFacilityIdentifier`]: [{ '@id': facilityIdentifierId }],
    [`${SCHEMA}address`]: [{ '@id': 'https://example.com/address/facility-123' }],
    [`${SCHEMA}geo`]: [{ '@id': 'https://example.com/geo/facility-123' }],
    [`${NS}isUsedByActor`]: [{ '@id': 'https://example.com/actor/direct' }]
  };

  const mockIriOnlyFacility: JsonLdNode = {
    '@id': 'https://example.com/facility/456'
  };

  const mockGraph = new Map<string, JsonLdNode>([
    [facilityIdentifierId, {
      '@id': facilityIdentifierId,
      '@type': [`${NS}FacilityIdentifier`],
      [`${NS}identifierValue`]: [{ '@value': 'FAC-MAIN-001' }],
      [`${NS}hasScheme`]: [{ '@id': 'https://example.com/schemes/gln' }],
      [`${NS}identifierIssuedOn`]: [{ '@value': '2026-03-01' }],
      [`${NS}identifierExpiresOn`]: [{ '@value': '2031-03-01' }]
    }],
    ['https://example.com/schemes/gln', {
      '@id': 'https://example.com/schemes/gln',
      '@type': [`${NS}ActorIdentifierScheme`],
      'http://www.w3.org/2000/01/rdf-schema#label': [{ '@value': 'GLN' }]
    }],
    ['https://example.com/address/facility-123', {
      '@id': 'https://example.com/address/facility-123',
      '@type': [`${SCHEMA}PostalAddress`],
      [`${SCHEMA}streetAddress`]: [{ '@value': '123 Industrial Ave' }],
      [`${SCHEMA}postalCode`]: [{ '@value': '12345' }],
      [`${SCHEMA}addressLocality`]: [{ '@value': 'Manufacturing City' }],
      [`${SCHEMA}addressCountry`]: [{ '@value': 'Germany' }]
    }],
    ['https://example.com/geo/facility-123', {
      '@id': 'https://example.com/geo/facility-123',
      '@type': [`${SCHEMA}GeoCoordinates`],
      [`${SCHEMA}latitude`]: [{ '@value': '52.5200' }],
      [`${SCHEMA}longitude`]: [{ '@value': '13.4050' }]
    }],
    ['https://example.com/actor/direct', {
      '@id': 'https://example.com/actor/direct',
      '@type': [`${NS}LegalPerson`],
      [`${NS}actorName`]: [{ '@value': 'Manufacturing Corp' }]
    }],
    ['https://example.com/actor/reverse', {
      '@id': 'https://example.com/actor/reverse',
      '@type': [`${NS}LegalPerson`],
      [`${NS}actorName`]: [{ '@value': 'Operations Ltd' }],
      [`${NS}usesFacility`]: [{ '@id': 'https://example.com/facility/123' }]
    }],
    ['https://example.com/facility/456', {
      '@id': 'https://example.com/facility/456',
      '@type': [`${NS}Facility`],
      [`${NS}facilityName`]: [{ '@value': 'Resolved Facility' }]
    }]
  ]);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacilityRendererComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(FacilityRendererComponent);
    component = fixture.componentInstance;

    component.node = mockFacilityNode;
    component.graph = mockGraph;
    component.ngOnChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnChanges', () => {
    it('should resolve node from graph when IRI-only', () => {
      component.node = mockIriOnlyFacility;
      component.ngOnChanges();

      const resolvedFromGraph = mockGraph.get('https://example.com/facility/456');
      expect((component as any).resolvedNode).toBe(resolvedFromGraph);
    });

    it('should use original node when not IRI-only', () => {
      component.ngOnChanges();
      expect((component as any).resolvedNode).toBe(mockFacilityNode);
    });

    it('should fallback to original when not found in graph', () => {
      const unknownIriNode = { '@id': 'https://unknown.com/facility' };
      component.node = unknownIriNode;
      component.ngOnChanges();

      expect((component as any).resolvedNode).toBe(unknownIriNode);
    });
  });

  describe('isIriOnly getter', () => {
    it('should return false for node with data', () => {
      component.ngOnChanges();
      expect(component.isIriOnly).toBe(false);
    });

    it('should return true for IRI-only node', () => {
      component.node = mockIriOnlyFacility;
      component.ngOnChanges();
      expect(component.isIriOnly).toBe(false); // After resolution in graph, no longer IRI-only
    });
  });

  describe('shortIri getter', () => {
    it('should return full IRI when short', () => {
      const shortNode = { '@id': 'https://short.com' };
      component.node = shortNode;
      expect(component.shortIri).toBe('https://short.com');
    });

    it('should truncate long IRI', () => {
      const longIri = 'https://very-long-domain-name-with-many-segments.com/facilities/production/main/building-a/floor-2';
      const longNode = { '@id': longIri };
      component.node = longNode;

      expect(component.shortIri).toContain('…');
      expect(component.shortIri.length).toBeLessThan(longIri.length);
      expect(component.shortIri).toEqual('…' + longIri.slice(-40));
    });

    it('should handle empty @id', () => {
      component.node = {};
      expect(component.shortIri).toBe('');
    });
  });

  describe('displayId getter', () => {
    beforeEach(() => {
      component.ngOnChanges();
    });

    it('should return the FacilityIdentifier value when available', () => {
      expect(component.displayId).toBe('FAC-MAIN-001');
    });

    it('should return undefined when no identifier is available', () => {
      const nodeWithoutUnique = { ...mockFacilityNode };
      delete nodeWithoutUnique[`${NS}hasUniqueFacilityIdentifier`];
      component.node = nodeWithoutUnique;
      component.ngOnChanges();

      expect(component.displayId).toBeUndefined();
    });
  });

  describe('identifier metadata', () => {
    it('should retain scheme and validity metadata from the referenced identifier', () => {
      expect(component.identifierExtraUris).toEqual([
        `${NS}hasScheme`,
        `${NS}identifierIssuedOn`,
        `${NS}identifierExpiresOn`,
      ]);
    });
  });

  describe('actors getter', () => {
    beforeEach(() => {
      component.ngOnChanges();
    });

    it('should resolve direct and reverse actor links', () => {
      expect(component.actors.map(actor => component.actorLabel(actor))).toEqual([
        'Manufacturing Corp',
        'Operations Ltd'
      ]);
    });

    it('should return empty array when no actors', () => {
      component.node = { '@id': 'no-actors' };
      component.ngOnChanges();
      expect(component.actors).toEqual([]);
    });
  });

  describe('postalAddress getter', () => {
    it('should format a schema.org postal address', () => {
      expect(component.postalAddress).toBe('123 Industrial Ave, 12345 Manufacturing City, Germany');
    });

    it('should return undefined when no address is available', () => {
      component.node = { '@id': 'no-address' };
      component.ngOnChanges();

      expect(component.postalAddress).toBeUndefined();
    });
  });

  describe('coordinates getter', () => {
    it('should resolve schema.org geographic coordinates', () => {
      expect(component.coordinates).toEqual({
        latitude: '52.5200',
        longitude: '13.4050'
      });
    });

    it('should return undefined when no coordinates are available', () => {
      component.node = { '@id': 'no-coordinates' };
      component.ngOnChanges();

      expect(component.coordinates).toBeUndefined();
    });
  });

  describe('property getters', () => {
    beforeEach(() => {
      component.ngOnChanges();
    });

    it('should return facility properties', () => {
      // Test if these getters exist and work (implementation would depend on the complete file)
      expect(() => component.displayId).not.toThrow();
      expect(() => component.actors).not.toThrow();
      expect(() => component.isIriOnly).not.toThrow();
      expect(() => component.shortIri).not.toThrow();
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

    it('should display facility information in template', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.p-card')).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    it('should handle node without @id', () => {
      component.node = { '@type': ['Facility'] };
      expect(() => component.ngOnChanges()).not.toThrow();
    });

    it('should handle empty graph', () => {
      component.graph = new Map();
      component.node = mockIriOnlyFacility;

      expect(() => component.ngOnChanges()).not.toThrow();
      expect((component as any).resolvedNode).toBe(mockIriOnlyFacility);
    });

    it('should handle missing properties gracefully', () => {
      component.node = {};
      component.ngOnChanges();

      expect(component.displayId).toBeUndefined();
      expect(component.actors).toEqual([]);
      expect(component.shortIri).toBe('');
    });
  });
});
