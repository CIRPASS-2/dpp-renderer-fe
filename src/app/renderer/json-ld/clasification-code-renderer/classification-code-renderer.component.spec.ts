import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JsonLdNode } from '../../rendering-models';
import { ClassificationCodeRendererComponent } from './classification-code-renderer.component';

describe('ClassificationCodeRendererComponent', () => {
  let component: ClassificationCodeRendererComponent;
  let fixture: ComponentFixture<ClassificationCodeRendererComponent>;

  const mockClassificationCodeNode: JsonLdNode = {
    '@id': 'https://example.com/classification/CN1234',
    '@type': ['https://w3id.org/eudpp#ClassificationCode'],
    'https://w3id.org/eudpp#codeValue': [{ '@value': '1234567890' }],
    'https://w3id.org/eudpp#codeSet': [{ '@value': 'CN' }],
    'https://w3id.org/eudpp#dictionaryReference': [{ '@value': 'Combined Nomenclature' }]
  };

  const mockMinimalNode: JsonLdNode = {
    '@id': 'https://example.com/classification/minimal',
    '@type': ['https://w3id.org/eudpp#ClassificationCode'],
    'https://w3id.org/eudpp#codeValue': [{ '@value': '999' }]
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClassificationCodeRendererComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ClassificationCodeRendererComponent);
    component = fixture.componentInstance;
    component.node = mockClassificationCodeNode;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should extract code value correctly', () => {
    expect(component.codeValue).toBe('1234567890');
  });

  it('should extract code set correctly', () => {
    expect(component.codeSet).toBe('CN');
  });

  it('should extract dictionary reference correctly', () => {
    expect(component.dictRef).toBe('Combined Nomenclature');
  });

  it('should handle missing optional properties', () => {
    component.node = mockMinimalNode;
    fixture.detectChanges();

    expect(component.codeValue).toBe('999');
    expect(component.codeSet).toBeUndefined();
    expect(component.dictRef).toBeUndefined();
  });
});
