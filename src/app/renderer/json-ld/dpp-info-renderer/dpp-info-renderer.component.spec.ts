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
import { DppInfoRendererComponent } from './dpp-info-renderer.component';

const NS = EUDPP_NS;

describe('DppInfoRendererComponent', () => {
  let component: DppInfoRendererComponent;
  let fixture: ComponentFixture<DppInfoRendererComponent>;

  const dppIdentifierId = 'https://example.com/identifiers/dpp-123';

  const mockDppNode: JsonLdNode = {
    '@id': 'https://example.com/dpp/123',
    '@type': [`${NS}DPP`],
    [`${NS}hasDigitalProductPassportId`]: [{ '@id': dppIdentifierId }],
    [`${NS}dppStatus`]: [{ '@value': 'Active' }],
    [`${NS}granularity`]: [{ '@value': 'item' }]
  };

  const mockGraph = new Map<string, JsonLdNode>([
    [dppIdentifierId, {
      '@id': dppIdentifierId,
      '@type': [`${NS}DPPIdentifier`],
      [`${NS}identifierValue`]: [{ '@value': 'DPP-123-456' }],
      [`${NS}hasScheme`]: [{ '@id': 'https://example.com/schemes/dpp' }],
      [`${NS}identifierIssuedOn`]: [{ '@value': '2026-03-01' }],
      [`${NS}identifierExpiresOn`]: [{ '@value': '2031-03-01' }]
    }],
    ['https://example.com/schemes/dpp', {
      '@id': 'https://example.com/schemes/dpp',
      '@type': [`${NS}IdentifierScheme`],
      'http://www.w3.org/2000/01/rdf-schema#label': [{ '@value': 'DPP URI Scheme' }]
    }]
  ]);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DppInfoRendererComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(DppInfoRendererComponent);
    component = fixture.componentInstance;
    component.node = mockDppNode;
    component.graph = mockGraph;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should extract DPP ID correctly', () => {
    expect(component.dppId).toBe('DPP-123-456');
  });

  it('should extract status correctly', () => {
    expect(component.status).toBe('Active');
  });

  it('should determine status severity correctly', () => {
    expect(component.statusSeverity).toBe('success');
  });

  it('should include DPP granularity in metadata', () => {
    expect(component.metaFields).toContain({ uri: `${NS}granularity`, value: 'item' });
  });

  it('should retain scheme and validity metadata from the referenced identifier', () => {
    expect(component.identifierExtraUris).toEqual([
      `${NS}hasScheme`,
      `${NS}identifierIssuedOn`,
      `${NS}identifierExpiresOn`,
    ]);
  });

  it('should map archived and inactive statuses to warning', () => {
    component.node = { ...mockDppNode, [`${NS}dppStatus`]: [{ '@value': 'Archived' }] };
    expect(component.statusSeverity).toBe('warning');

    component.node = { ...mockDppNode, [`${NS}dppStatus`]: [{ '@value': 'Inactive' }] };
    expect(component.statusSeverity).toBe('warning');
  });

  it('should map invalid status to danger', () => {
    component.node = { ...mockDppNode, [`${NS}dppStatus`]: [{ '@value': 'Invalid' }] };
    expect(component.statusSeverity).toBe('danger');
  });
});
