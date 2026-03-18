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
