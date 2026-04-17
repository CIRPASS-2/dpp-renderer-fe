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
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { ValidatorServiceService } from '../validator-service.service';
import { ValidatorResourceUploadComponent } from './validator-resource-upload.component';

describe('ValidatorResourceUploadComponent', () => {
  let component: ValidatorResourceUploadComponent;
  let fixture: ComponentFixture<ValidatorResourceUploadComponent>;
  let validatorServiceSpy: jasmine.SpyObj<ValidatorServiceService>;

  beforeEach(async () => {
    validatorServiceSpy = jasmine.createSpyObj('ValidatorServiceService', ['addResource']);

    await TestBed.configureTestingModule({
      imports: [ValidatorResourceUploadComponent, NoopAnimationsModule],
      providers: [
        { provide: ValidatorServiceService, useValue: validatorServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ValidatorResourceUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── ngOnChanges / isTemplate ───────────────────────────────────────────────

  describe('isTemplate=false (schema)', () => {
    beforeEach(() => {
      component.isTemplate = false;
      component.ngOnChanges();
    });

    it('should expose only JSON payload type', () => {
      expect(component.payloadTypeOptions.length).toBe(1);
      expect(component.payloadTypeOptions[0].value).toBe('json');
    });

    it('should set resourceType to schema', () => {
      expect(component.resourceType).toBe('schema');
    });
  });

  describe('isTemplate=true (template)', () => {
    beforeEach(() => {
      component.isTemplate = true;
      component.ngOnChanges();
    });

    it('should expose turtle, rdf_xml, rdf_json, n_triples, n_quads, n3', () => {
      const values = component.payloadTypeOptions.map(o => o.value);
      expect(values).toContain('turtle');
      expect(values).toContain('rdf_xml');
      expect(values).toContain('rdf_json');
      expect(values).toContain('n_triples');
      expect(values).toContain('n_quads');
      expect(values).toContain('n3');
      expect(values).not.toContain('json');
    });

    it('should set resourceType to template', () => {
      expect(component.resourceType).toBe('template');
    });
  });

  // ── form validation ────────────────────────────────────────────────────────

  describe('form validation', () => {
    it('should be invalid when empty', () => {
      expect(component.form.invalid).toBeTrue();
    });

    it('should be invalid when name is missing', () => {
      component.form.patchValue({ version: '1.0', payloadType: 'json' });
      expect(component.form.get('name')!.invalid).toBeTrue();
    });

    it('should be invalid for version with non-semver pattern', () => {
      component.form.patchValue({ name: 'n', version: 'abc', payloadType: 'json' });
      expect(component.form.get('version')!.invalid).toBeTrue();
    });

    it('should accept valid semver versions', () => {
      component.form.patchValue({ name: 'n', version: '1.2.3', payloadType: 'json' });
      expect(component.form.get('version')!.valid).toBeTrue();
    });

    it('should be valid when all required fields are filled', () => {
      component.form.patchValue({ name: 'my-schema', version: '1.0', payloadType: 'json' });
      expect(component.form.valid).toBeTrue();
    });
  });

  // ── onFileChange ───────────────────────────────────────────────────────────

  describe('onFileChange', () => {
    it('should set selectedFile from input event', () => {
      const file = new File(['content'], 'schema.json', { type: 'application/json' });
      const inputEl = document.createElement('input');
      Object.defineProperty(inputEl, 'files', { value: [file] });
      const event = { target: inputEl } as unknown as Event;

      component.onFileChange(event);

      expect(component.selectedFile).toBe(file);
    });

    it('should set selectedFile to null when no file selected', () => {
      const inputEl = document.createElement('input');
      Object.defineProperty(inputEl, 'files', { value: [] });
      const event = { target: inputEl } as unknown as Event;

      component.onFileChange(event);

      expect(component.selectedFile).toBeNull();
    });
  });

  // ── submit ─────────────────────────────────────────────────────────────────

  describe('submit', () => {
    const file = new File(['{}'], 'schema.json', { type: 'application/json' });

    it('should not call service if form is invalid', () => {
      component.submit();
      expect(validatorServiceSpy.addResource).not.toHaveBeenCalled();
    });

    it('should set errorMessage if no file selected', () => {
      component.form.patchValue({ name: 'n', version: '1.0', payloadType: 'json' });
      component.selectedFile = null;
      component.submit();

      expect(component.errorMessage).toBeTruthy();
      expect(validatorServiceSpy.addResource).not.toHaveBeenCalled();
    });

    it('should call addResource with correct args on valid submission', () => {
      validatorServiceSpy.addResource.and.returnValue(of(42));
      component.form.patchValue({ name: 'my-schema', version: '1.0', payloadType: 'json' });
      component.selectedFile = file;
      component.submit();

      expect(validatorServiceSpy.addResource).toHaveBeenCalledWith(
        'json',
        file,
        jasmine.objectContaining({ name: 'my-schema', version: '1.0', metadataType: 'base' }),
      );
    });

    it('should include contextUri in metadata when isTemplate=true', () => {
      validatorServiceSpy.addResource.and.returnValue(of(5));
      component.isTemplate = true;
      component.ngOnChanges();
      component.form.patchValue({
        name: 'my-template',
        version: '1.0',
        payloadType: 'turtle',
        contextUri: 'https://example.com/ctx',
      });
      component.selectedFile = file;
      component.submit();

      expect(validatorServiceSpy.addResource).toHaveBeenCalledWith(
        'turtle',
        file,
        jasmine.objectContaining({
          metadataType: 'template',
          contextUri: 'https://example.com/ctx',
        }),
      );
    });

    it('should emit uploaded and close on success', () => {
      validatorServiceSpy.addResource.and.returnValue(of(1));
      component.form.patchValue({ name: 'n', version: '1.0', payloadType: 'json' });
      component.selectedFile = file;

      const uploadedSpy = jasmine.createSpy('uploaded');
      const visibleChangeSpy = jasmine.createSpy('visibleChange');
      component.uploaded.subscribe(uploadedSpy);
      component.visibleChange.subscribe(visibleChangeSpy);

      component.submit();

      expect(uploadedSpy).toHaveBeenCalled();
      expect(visibleChangeSpy).toHaveBeenCalledWith(false);
    });

    it('should set errorMessage on upload failure', () => {
      validatorServiceSpy.addResource.and.returnValue(throwError(() => new Error('500')));
      component.form.patchValue({ name: 'n', version: '1.0', payloadType: 'json' });
      component.selectedFile = file;
      component.submit();

      expect(component.errorMessage).toBeTruthy();
      expect(component.uploading).toBeFalse();
    });
  });

  // ── close ──────────────────────────────────────────────────────────────────

  describe('close', () => {
    it('should reset form and emit visibleChange(false)', () => {
      component.form.patchValue({ name: 'test', version: '1.0', payloadType: 'json' });
      const visibleChangeSpy = jasmine.createSpy('visibleChange');
      component.visibleChange.subscribe(visibleChangeSpy);

      component.close();

      expect(component.form.value['name']).toBeNull();
      expect(component.selectedFile).toBeNull();
      expect(visibleChangeSpy).toHaveBeenCalledWith(false);
    });
  });
});
