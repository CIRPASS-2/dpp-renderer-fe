import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JsonLdNode } from '../../rendering-models';
import { DocumentRendererComponent } from './document-renderer.component';

describe('DocumentRendererComponent', () => {
  let component: DocumentRendererComponent;
  let fixture: ComponentFixture<DocumentRendererComponent>;

  const mockDocumentNode: JsonLdNode = {
    '@id': 'https://example.com/document/123',
    '@type': ['https://w3id.org/eudpp#Document'],
    'https://w3id.org/eudpp#description': [{ '@value': 'User manual for EcoSmart device' }],
    'https://w3id.org/eudpp#webLink': [{ '@value': 'https://example.com/manual.pdf' }],
    'https://w3id.org/eudpp#contentType': [{ '@value': 'application/pdf' }],
    'https://w3id.org/eudpp#value': [{ '@value': 'Manual content example' }]
  };

  const mockInstructionNode: JsonLdNode = {
    '@id': 'https://example.com/instruction/456',
    '@type': ['https://w3id.org/eudpp#DigitalInstruction'],
    'https://w3id.org/eudpp#description': [{ '@value': 'Assembly instructions' }],
    'https://w3id.org/eudpp#webLink': [{ '@value': 'https://example.com/assembly.html' }]
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentRendererComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(DocumentRendererComponent);
    component = fixture.componentInstance;
    component.node = mockDocumentNode;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should extract document properties correctly', () => {
    expect(component.description).toBe('User manual for EcoSmart device');
    expect(component.webLink).toBe('https://example.com/manual.pdf');
    expect(component.contentType).toBe('application/pdf');
    expect(component.value).toBe('Manual content example');
  });

  it('should identify regular document correctly', () => {
    expect(component.isInstruction).toBe(false);
    expect(component.typeName).toBe('Document');
    expect(component.icon).toBe('📄');
  });

  it('should identify digital instruction correctly', () => {
    component.node = mockInstructionNode;
    expect(component.isInstruction).toBe(true);
    expect(component.typeName).toBe('Digital Instruction');
    expect(component.icon).toBe('📋');
  });
});
