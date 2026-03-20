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
import { JsonLdNode } from '../../rendering-models';
import { DppInfoRendererComponent } from './dpp-info-renderer.component';

describe('DppInfoRendererComponent', () => {
  let component: DppInfoRendererComponent;
  let fixture: ComponentFixture<DppInfoRendererComponent>;

  const mockDppNode: JsonLdNode = {
    '@id': 'https://example.com/dpp/123',
    '@type': ['https://w3id.org/eudpp#DPP'],
    'https://w3id.org/eudpp#uniqueDPPID': [{ '@value': 'DPP-123-456' }],
    'https://w3id.org/eudpp#status': [{ '@value': 'active' }],
    'https://w3id.org/eudpp#schemaVersion': [{ '@value': '1.0.0' }]
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DppInfoRendererComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(DppInfoRendererComponent);
    component = fixture.componentInstance;
    component.node = mockDppNode;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should extract DPP ID correctly', () => {
    expect(component.dppId).toBe('DPP-123-456');
  });

  it('should extract status correctly', () => {
    expect(component.status).toBe('active');
  });

  it('should determine status severity correctly', () => {
    expect(component.statusSeverity).toBe('success');
  });
});
