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
import { EventRendererComponent } from './event-renderer.component';

const NS = EUDPP_NS;

describe('EventRendererComponent', () => {
  let component: EventRendererComponent;
  let fixture: ComponentFixture<EventRendererComponent>;

  const eventNode: JsonLdNode = {
    '@id': 'https://example.com/events/transformation-1',
    '@type': [`${NS}TransformationEvent`],
    [`${NS}eventIdentifier`]: [{ '@value': 'urn:epc:id:event:transformation-1' }],
    [`${NS}eventTime`]: [{ '@value': '2026-03-06T10:00:00Z' }],
    [`${NS}hasActionType`]: [{ '@id': `${NS}ADD` }],
    [`${NS}hasBusinessStep`]: [{ '@id': `${NS}packing` }],
    [`${NS}hasInputObjectContext`]: [{ '@id': 'https://example.com/identifiers/input-1' }],
  };

  const graph = new Map<string, JsonLdNode>([
    [`${NS}ADD`, {
      '@id': `${NS}ADD`,
      '@type': [`${NS}ActionType`],
      'http://www.w3.org/2000/01/rdf-schema#label': [{ '@value': 'ADD' }],
    }],
    [`${NS}packing`, {
      '@id': `${NS}packing`,
      '@type': [`${NS}BusinessStep`],
      'http://www.w3.org/2000/01/rdf-schema#label': [{ '@value': 'packing' }],
    }],
    ['https://example.com/identifiers/input-1', {
      '@id': 'https://example.com/identifiers/input-1',
      '@type': [`${NS}InstanceIdentifier`],
      [`${NS}instanceIdentifierValue`]: [{ '@value': 'urn:epc:id:sgtin:4012345.011111.9876' }],
    }],
  ]);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventRendererComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EventRendererComponent);
    component = fixture.componentInstance;
    component.node = eventNode;
    component.graph = graph;
    component.ngOnChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should summarize shared event metadata using resolved labels', () => {
    expect(component.title).toBe('Transformation Event');
    expect(component.eventId).toBe('urn:epc:id:event:transformation-1');

    const action = component.summaryFields.find(field => field.uri === `${NS}hasActionType`);
    const businessStep = component.summaryFields.find(field => field.uri === `${NS}hasBusinessStep`);

    expect(action?.values).toEqual([{ text: 'ADD', href: `${NS}ADD` }]);
    expect(businessStep?.values).toEqual([{ text: 'packing', href: `${NS}packing` }]);
  });

  it('should delegate event-specific contexts to the abstract renderer', () => {
    expect(component.extraUris).toContain(`${NS}hasInputObjectContext`);
  });

  it('should render the summary and nested context without errors', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Transformation Event');
    expect(compiled.textContent).toContain('urn:epc:id:sgtin:4012345.011111.9876');
  });
});