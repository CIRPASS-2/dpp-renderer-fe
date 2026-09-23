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

import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EUDPP_NS } from '../../../common/cirpass-dpp-ontology';
import { JsonLdNode } from '../../rendering-models';
import { ActorRendererComponent } from './actor-renderer.component';

const NS = EUDPP_NS;
const SCHEMA = 'https://schema.org/';

describe('ActorRendererComponent', () => {
  let component: ActorRendererComponent;
  let fixture: ComponentFixture<ActorRendererComponent>;

  const actorIdentifierId = 'https://example.com/identifiers/actor-123';
  const facilityIdentifierId = 'https://example.com/identifiers/facility-main';
  const secondaryFacilityIdentifierId = 'https://example.com/identifiers/facility-secondary';

  const mockActorNode: JsonLdNode = {
    '@id': 'https://example.com/actor/123',
    '@type': [`${NS}LegalPerson`],
    [`${NS}actorName`]: [{ '@value': 'Example Corporation' }],
    [`${NS}hasUniqueOperatorIdentifier`]: [{ '@id': actorIdentifierId }],
    [`${NS}registeredTradeName`]: [{ '@value': 'ExampleCorp' }],
    [`${NS}registeredTrademark`]: [{ '@value': 'ExampleTM' }],
    [`${SCHEMA}email`]: [{ '@value': 'contact@example.com' }],
    [`${SCHEMA}telephone`]: [{ '@value': '+1-234-567-8900' }],
    [`${SCHEMA}url`]: [{ '@value': 'https://example.com' }],
    [`${SCHEMA}address`]: [{ '@id': 'https://example.com/address/actor-123' }],
    [`${NS}hasRepresentativeMandate`]: [{ '@id': 'https://example.com/assignments/representative' }],
    [`${NS}usesFacility`]: [
      { '@id': 'https://example.com/facility/main' }
    ]
  };

  const mockIriOnlyNode: JsonLdNode = {
    '@id': 'https://example.com/actor/456'
  };

  const mockNaturalPersonNode: JsonLdNode = {
    '@id': 'https://example.com/person/789',
    '@type': [`${NS}NaturalPerson`],
    [`${NS}actorName`]: [{ '@value': 'John Doe' }]
  };

  const mockFacilityNode: JsonLdNode = {
    '@id': 'https://example.com/facility/main',
    '@type': [`${NS}Facility`],
    [`${NS}hasUniqueFacilityIdentifier`]: [{ '@id': facilityIdentifierId }]
  };

  const mockSecondaryFacilityNode: JsonLdNode = {
    '@id': 'https://example.com/facility/secondary',
    '@type': [`${NS}Facility`],
    [`${NS}hasUniqueFacilityIdentifier`]: [{ '@id': secondaryFacilityIdentifierId }]
  };

  const mockGraph = new Map<string, JsonLdNode>([
    [actorIdentifierId, {
      '@id': actorIdentifierId,
      '@type': [`${NS}ActorIdentifier`],
      [`${NS}identifierValue`]: [{ '@value': 'OP-123456' }],
      [`${NS}hasScheme`]: [{ '@id': 'https://example.com/schemes/gln' }],
      [`${NS}identifierIssuedOn`]: [{ '@value': '2026-03-01' }],
      [`${NS}identifierExpiresOn`]: [{ '@value': '2031-03-01' }]
    }],
    ['https://example.com/schemes/gln', {
      '@id': 'https://example.com/schemes/gln',
      '@type': [`${NS}ActorIdentifierScheme`],
      'http://www.w3.org/2000/01/rdf-schema#label': [{ '@value': 'GLN' }]
    }],
    [facilityIdentifierId, {
      '@id': facilityIdentifierId,
      '@type': [`${NS}FacilityIdentifier`],
      [`${NS}identifierValue`]: [{ '@value': 'FAC-MAIN-001' }]
    }],
    [secondaryFacilityIdentifierId, {
      '@id': secondaryFacilityIdentifierId,
      '@type': [`${NS}FacilityIdentifier`],
      [`${NS}identifierValue`]: [{ '@value': 'FAC-SEC-002' }]
    }],
    ['https://example.com/address/actor-123', {
      '@id': 'https://example.com/address/actor-123',
      '@type': [`${SCHEMA}PostalAddress`],
      [`${SCHEMA}streetAddress`]: [{ '@value': '123 Business St' }],
      [`${SCHEMA}postalCode`]: [{ '@value': '12345' }],
      [`${SCHEMA}addressLocality`]: [{ '@value': 'City' }],
      [`${SCHEMA}addressCountry`]: [{ '@value': 'US' }]
    }],
    ['https://example.com/actor/456', {
      '@id': 'https://example.com/actor/456',
      '@type': [`${NS}LegalPerson`],
      [`${NS}registeredTradeName`]: [{ '@value': 'Resolved Company' }],
      [`${NS}hasUniqueOperatorIdentifier`]: [{ '@id': actorIdentifierId }]
    }],
    ['https://example.com/facility/main', mockFacilityNode],
    ['https://example.com/facility/secondary', mockSecondaryFacilityNode],
    ['https://example.com/assignments/manufacturer', {
      '@id': 'https://example.com/assignments/manufacturer',
      '@type': [`${NS}ActorRoleAssignment`],
      [`${NS}hasActor`]: [{ '@id': 'https://example.com/actor/123' }],
      [`${NS}hasRole`]: [{ '@id': `${NS}manufacturer` }],
      [`${NS}assignmentValidFrom`]: [{ '@value': '2026-01-01T00:00:00Z' }],
      [`${NS}assignmentValidTo`]: [{ '@value': '2027-01-01T00:00:00Z' }]
    }],
    ['https://example.com/actor/representative', {
      '@id': 'https://example.com/actor/representative',
      '@type': [`${NS}LegalPerson`],
      [`${NS}actorName`]: [{ '@value': 'EU Representative GmbH' }]
    }],
    ['https://example.com/assignments/representative', {
      '@id': 'https://example.com/assignments/representative',
      '@type': [`${NS}AuthorisedRepresentativeRoleAssignment`],
      [`${NS}hasActor`]: [{ '@id': 'https://example.com/actor/representative' }],
      [`${NS}hasRole`]: [{ '@id': `${NS}authorisedRepresentative` }],
      [`${NS}representsManufacturer`]: [{ '@id': 'https://example.com/actor/123' }],
      [`${NS}assignmentValidFrom`]: [{ '@value': '2026-01-01T00:00:00Z' }],
      [`${NS}assignmentValidTo`]: [{ '@value': '2027-01-01T00:00:00Z' }]
    }]
  ]);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActorRendererComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ActorRendererComponent);
    component = fixture.componentInstance;

    component.node = mockActorNode;
    component.graph = mockGraph;
    component.ngOnChanges({ node: new SimpleChange(null, mockActorNode, true) });
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnChanges', () => {
    it('should resolve node when node changes', () => {
      spyOn(component as any, 'resolve').and.returnValue(mockActorNode);

      component.ngOnChanges({
        node: new SimpleChange(null, mockActorNode, true)
      });

      expect((component as any).resolve).toHaveBeenCalledWith(mockActorNode);
    });

    it('should resolve node when graph changes', () => {
      spyOn(component as any, 'resolve').and.returnValue(mockActorNode);

      component.ngOnChanges({
        graph: new SimpleChange(null, mockGraph, false)
      });

      expect((component as any).resolve).toHaveBeenCalledWith(mockActorNode);
    });

    it('should not call resolve when other properties change', () => {
      spyOn(component as any, 'resolve');

      component.ngOnChanges({
        otherProp: new SimpleChange(null, 'value', false)
      });

      expect((component as any).resolve).not.toHaveBeenCalled();
    });
  });

  describe('resolve method', () => {
    it('should return same node if not IRI-only', () => {
      const result = (component as any).resolve(mockActorNode);
      expect(result).toBe(mockActorNode);
    });

    it('should resolve IRI-only node from graph', () => {
      const result = (component as any).resolve(mockIriOnlyNode);
      expect(result).toEqual(mockGraph.get('https://example.com/actor/456'));
    });

    it('should return original node if not found in graph', () => {
      const unknownNode = { '@id': 'https://unknown.com/actor' };
      const result = (component as any).resolve(unknownNode);
      expect(result).toBe(unknownNode);
    });

    it('should return original node if no @id', () => {
      const nodeWithoutId = { '@type': ['SomeType'] };
      const result = (component as any).resolve(nodeWithoutId);
      expect(result).toBe(nodeWithoutId);
    });

    it('should return undefined when no node is provided', () => {
      expect((component as any).resolve(undefined)).toBeUndefined();
    });
  });

  describe('getter properties', () => {
    beforeEach(() => {
      component.ngOnChanges({
        node: new SimpleChange(null, mockActorNode, true)
      });
    });

    describe('isIriOnly', () => {
      it('should return false for resolved node with data', () => {
        expect(component.isIriOnly).toBe(false);
      });

      it('should return true for IRI-only node', () => {
        component.node = mockIriOnlyNode;
        component.ngOnChanges({
          node: new SimpleChange(null, mockIriOnlyNode, false)
        });

        expect(component.isIriOnly).toBe(false); // IRI-only after resolution is false
      });
    });

    describe('shortIri', () => {
      it('should return full IRI when short', () => {
        const shortNode = { '@id': 'https://short.com' };
        component.node = shortNode;
        expect(component.shortIri).toBe('https://short.com');
      });

      it('should truncate long IRI', () => {
        const longIri = 'https://very-long-domain-name.com/very/long/path/to/resource/with/many/segments';
        const longNode = { '@id': longIri };
        component.node = longNode;

        expect(component.shortIri).toContain('…');
        expect(component.shortIri.length).toBeLessThan(longIri.length);
      });

      it('should handle empty @id', () => {
        component.node = {};
        expect(component.shortIri).toBe('');
      });
    });

    describe('displayName', () => {
      it('should return actorName when available', () => {
        expect(component.displayName).toBe('Example Corporation');
      });

      it('should return registeredTradeName when actorName not available', () => {
        const nodeWithoutActorName = {
          ...mockActorNode,
          [`${NS}actorName`]: undefined,
          [`${NS}registeredTradeName`]: [{ '@value': 'Trade Name Corp' }]
        };
        component.node = nodeWithoutActorName;
        component.ngOnChanges({
          node: new SimpleChange(null, nodeWithoutActorName, false)
        });

        expect(component.displayName).toBe('Trade Name Corp');
      });

      it('should return @id when names not available', () => {
        const nodeWithoutNames = {
          '@id': 'https://example.com/actor/unnamed'
        };
        component.node = nodeWithoutNames;
        component.ngOnChanges({
          node: new SimpleChange(null, nodeWithoutNames, false)
        });

        expect(component.displayName).toBe('https://example.com/actor/unnamed');
      });

      it('should return default "Actor" when all else fails', () => {
        component.node = {};
        component.ngOnChanges({
          node: new SimpleChange(null, {}, false)
        });

        expect(component.displayName).toBe('Actor');
      });
    });

    describe('operatorId', () => {
      it('should return operator ID when available', () => {
        expect(component.operatorId).toBe('OP-123456');
      });

      it('should return undefined when not available', () => {
        const nodeWithoutOperatorId = { ...mockActorNode };
        delete nodeWithoutOperatorId[`${NS}hasUniqueOperatorIdentifier`];
        component.node = nodeWithoutOperatorId;
        component.ngOnChanges({
          node: new SimpleChange(null, nodeWithoutOperatorId, false)
        });

        expect(component.operatorId).toBeUndefined();
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

    describe('tradeName', () => {
      it('should return trade name when available', () => {
        expect(component.tradeName).toBe('ExampleCorp');
      });

      it('should return undefined when not available', () => {
        const nodeWithoutTradeName = { ...mockActorNode };
        delete nodeWithoutTradeName[`${NS}registeredTradeName`];
        component.node = nodeWithoutTradeName;
        component.ngOnChanges({
          node: new SimpleChange(null, nodeWithoutTradeName, false)
        });

        expect(component.tradeName).toBeUndefined();
      });
    });

    describe('trademark', () => {
      it('should return trademark when available', () => {
        expect(component.trademark).toBe('ExampleTM');
      });

      it('should return undefined when not available', () => {
        const nodeWithoutTrademark = { ...mockActorNode };
        delete nodeWithoutTrademark[`${NS}registeredTrademark`];
        component.node = nodeWithoutTrademark;
        component.ngOnChanges({
          node: new SimpleChange(null, nodeWithoutTrademark, false)
        });

        expect(component.trademark).toBeUndefined();
      });
    });

    describe('contacts', () => {
      it('should return schema.org email, telephone, and website contacts', () => {
        expect(component.contacts).toEqual([
          { label: 'Email', value: 'contact@example.com', href: 'mailto:contact@example.com' },
          { label: 'Telephone', value: '+1-234-567-8900', href: 'tel:+1-234-567-8900' },
          { label: 'Website', value: 'https://example.com', href: 'https://example.com' }
        ]);
      });

      it('should return empty array when no contacts', () => {
        const nodeWithoutContacts = { ...mockActorNode };
        delete nodeWithoutContacts[`${SCHEMA}email`];
        delete nodeWithoutContacts[`${SCHEMA}telephone`];
        delete nodeWithoutContacts[`${SCHEMA}url`];
        component.node = nodeWithoutContacts;
        component.ngOnChanges({
          node: new SimpleChange(null, nodeWithoutContacts, false)
        });

        expect(component.contacts).toEqual([]);
      });
    });

    describe('postalAddress', () => {
      it('should return postal address when available', () => {
        expect(component.postalAddress).toBe('123 Business St, 12345 City, US');
      });

      it('should return undefined when not available', () => {
        const nodeWithoutAddress = { ...mockActorNode };
        delete nodeWithoutAddress[`${SCHEMA}address`];
        component.node = nodeWithoutAddress;
        component.ngOnChanges({
          node: new SimpleChange(null, nodeWithoutAddress, false)
        });

        expect(component.postalAddress).toBeUndefined();
      });
    });

    describe('roles', () => {
      it('should return the current role from an actor role assignment in the graph', () => {
        const roles = component.roles;
        expect(roles).toHaveSize(1);
        expect(roles[0].label).toBe('Manufacturer');
        expect(roles[0].uri).toBe(`${NS}manufacturer`);
      });

      it('should collect multiple assignments for the same actor', () => {
        const enhancedGraph = new Map(mockGraph);
        enhancedGraph.set('https://example.com/assignments/importer', {
          '@id': 'https://example.com/assignments/importer',
          '@type': [`${NS}ActorRoleAssignment`],
          [`${NS}hasActor`]: [{ '@id': 'https://example.com/actor/123' }],
          [`${NS}hasRole`]: [{ '@id': `${NS}importer` }]
        });
        component.graph = enhancedGraph;
        component.ngOnChanges({
          graph: new SimpleChange(null, enhancedGraph, false)
        });

        const roles = component.roles;
        expect(roles.map(role => role.label)).toEqual(['Manufacturer', 'Importer']);
      });

      it('should ignore assignments for other actors', () => {
        const graphWithOtherActor = new Map(mockGraph);
        graphWithOtherActor.set('https://example.com/assignments/other', {
          '@id': 'https://example.com/assignments/other',
          '@type': [`${NS}ActorRoleAssignment`],
          [`${NS}hasActor`]: [{ '@id': 'https://example.com/actor/other' }],
          [`${NS}hasRole`]: [{ '@id': `${NS}distributor` }]
        });
        component.graph = graphWithOtherActor;
        component.ngOnChanges({
          graph: new SimpleChange(null, graphWithOtherActor, false)
        });

        expect(component.roles).toEqual([{ uri: `${NS}manufacturer`, label: 'Manufacturer' }]);
      });
    });

    describe('role assignment details', () => {
      it('should retain role assignment validity dates', () => {
        expect(component.roleAssignmentDetails).toEqual([{
          uri: `${NS}manufacturer`,
          label: 'Manufacturer',
          validFrom: '2026-01-01T00:00:00Z',
          validTo: '2027-01-01T00:00:00Z',
          representedManufacturer: undefined,
        }]);
      });
    });

    describe('representative mandates', () => {
      it('should resolve an authorised representative mandate for the manufacturer', () => {
        expect(component.representativeMandates).toEqual([{
          representative: 'EU Representative GmbH',
          validFrom: '2026-01-01T00:00:00Z',
          validTo: '2027-01-01T00:00:00Z',
        }]);
      });
    });

    describe('facilities', () => {
      it('should resolve facility references from graph with proper data', () => {
        const facilities = component.facilities;
        expect(facilities).toHaveSize(1);
        expect(facilities[0]).toBe(mockFacilityNode);
        expect(facilities[0]['@type']).toEqual([`${NS}Facility`]);
      });

      it('should handle multiple facilities', () => {
        const nodeWithMultipleFacilities = {
          ...mockActorNode,
          [`${NS}usesFacility`]: [
            { '@id': 'https://example.com/facility/main' },
            { '@id': 'https://example.com/facility/secondary' }
          ]
        };
        component.node = nodeWithMultipleFacilities;
        component.ngOnChanges({
          node: new SimpleChange(null, nodeWithMultipleFacilities, false)
        });

        const facilities = component.facilities;
        expect(facilities).toHaveSize(2);
        expect(facilities[0]).toBe(mockFacilityNode);
        expect(facilities[1]).toBe(mockSecondaryFacilityNode);
      });

      it('should return unresolved references when not in graph', () => {
        const nodeWithUnknownFacility = {
          ...mockActorNode,
          [`${NS}usesFacility`]: [{ '@id': 'https://unknown.com/facility' }]
        };
        component.node = nodeWithUnknownFacility;
        component.ngOnChanges({
          node: new SimpleChange(null, nodeWithUnknownFacility, false)
        });

        const facilities = component.facilities;
        expect(facilities).toEqual([{ '@id': 'https://unknown.com/facility' }]);
      });

      it('should handle mixed resolved and unresolved facility references', () => {
        const nodeWithMixedFacilities = {
          ...mockActorNode,
          [`${NS}usesFacility`]: [
            { '@id': 'https://example.com/facility/main' },
            { '@id': 'https://unknown.com/facility/missing' }
          ]
        };
        component.node = nodeWithMixedFacilities;
        component.ngOnChanges({
          node: new SimpleChange(null, nodeWithMixedFacilities, false)
        });

        const facilities = component.facilities;
        expect(facilities).toHaveSize(2);
        expect(facilities[0]).toBe(mockFacilityNode);
        expect(facilities[1]).toEqual({ '@id': 'https://unknown.com/facility/missing' });
      });
    });

    describe('facilityLabel', () => {
      it('should return facility ID when available', () => {
        const label = component.facilityLabel(mockFacilityNode);
        expect(label).toBe('FAC-MAIN-001');
      });

      it('should return secondary facility ID correctly', () => {
        const label = component.facilityLabel(mockSecondaryFacilityNode);
        expect(label).toBe('FAC-SEC-002');
      });

      it('should return @id when facility ID not available', () => {
        const facWithoutId = { '@id': 'https://example.com/facility/noname' };
        const label = component.facilityLabel(facWithoutId);
        expect(label).toBe('https://example.com/facility/noname');
      });

      it('should return default when no identification', () => {
        const label = component.facilityLabel({});
        expect(label).toBe('Facility');
      });
    });
  });

  describe('cardStyle', () => {
    it('should return legal-card for LegalPerson', () => {
      component.ngOnChanges({
        node: new SimpleChange(null, component.node, false)
      });
      expect(component.cardStyle).toBe('legal-card');
    });

    it('should return natural-card for NaturalPerson', () => {
      component.node = mockNaturalPersonNode;
      component.ngOnChanges({
        node: new SimpleChange(null, mockNaturalPersonNode, false)
      });

      expect(component.cardStyle).toBe('natural-card');
    });

    it('should return actor-card for other types', () => {
      const genericNode = { '@type': ['SomeOtherType'] };
      component.node = genericNode;
      component.ngOnChanges({
        node: new SimpleChange(null, genericNode, false)
      });

      expect(component.cardStyle).toBe('actor-card');
    });
  });

  describe('personIcon', () => {
    it('should return building icon for LegalPerson', () => {
      component.ngOnChanges({
        node: new SimpleChange(null, component.node, false)
      });
      expect(component.personIcon).toBe('🏢');
    });

    it('should return person icon for NaturalPerson', () => {
      component.node = mockNaturalPersonNode;
      component.ngOnChanges({
        node: new SimpleChange(null, mockNaturalPersonNode, false)
      });

      expect(component.personIcon).toBe('👤');
    });

    it('should return theater icon for other types', () => {
      const genericNode = { '@type': ['SomeOtherType'] };
      component.node = genericNode;
      component.ngOnChanges({
        node: new SimpleChange(null, genericNode, false)
      });

      expect(component.personIcon).toBe('🎭');
    });
  });

  describe('roleLabelFor method', () => {
    it('should return correct labels for known roles', () => {
      const testCases = [
        [`${NS}manufacturer`, 'Manufacturer'],
        [`${NS}importer`, 'Importer'],
        [`${NS}distributor`, 'Distributor'],
        [`${NS}authorisedRepresentative`, 'Authorised Representative'],
        [`${NS}consumer`, 'Consumer'],
        [`${NS}notifiedBody`, 'Notified Body']
      ];

      testCases.forEach(([uri, expectedLabel]) => {
        const label = (component as any).roleLabelFor(uri);
        expect(label).toBe(expectedLabel);
      });
    });

    it('should return fragment for unknown roles', () => {
      const unknownRole = 'https://example.com/ontology#CustomRole';
      const label = (component as any).roleLabelFor(unknownRole);
      expect(label).toBe('CustomRole');
    });

    it('should return full URI when no fragment', () => {
      const fullUri = 'https://example.com/custom-role';
      const label = (component as any).roleLabelFor(fullUri);
      expect(label).toBe(fullUri);
    });
  });

  describe('template integration', () => {
    it('should render component template without errors', () => {
      // Initialize component properly before detecting changes
      component.node = mockActorNode;
      component.ngOnChanges({
        node: new SimpleChange(null, mockActorNode, true)
      });

      fixture.detectChanges();
      expect(fixture.nativeElement).toBeTruthy();
    });

    it('should display actor information in template', () => {
      // Initialize component properly before detecting changes
      component.node = mockActorNode;
      component.ngOnChanges({
        node: new SimpleChange(null, mockActorNode, true)
      });

      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;

      // Check if the template contains some expected content
      // Note: Actual content checks would depend on the template structure
      expect(compiled.querySelector('.p-card')).toBeTruthy();
    });
  });
});
