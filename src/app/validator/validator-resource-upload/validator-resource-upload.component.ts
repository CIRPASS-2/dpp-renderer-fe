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

import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { PayloadType, ResourceMetadata, ResourceType, TemplateResourceMetadata } from '../validator-models';
import { ValidatorServiceService } from '../validator-service.service';

const TEMPLATE_PAYLOAD_TYPES = [
  { label: 'Turtle (.ttl)', value: 'turtle' },
  { label: 'RDF/XML', value: 'rdf_xml' },
  { label: 'RDF/JSON', value: 'rdf_json' },
  { label: 'N-Triples', value: 'n_triples' },
  { label: 'N-Quads', value: 'n_quads' },
  { label: 'Notation3', value: 'n3' },
];

const SCHEMA_PAYLOAD_TYPES = [
  { label: 'JSON', value: 'json' },
];

@Component({
  selector: 'app-validator-resource-upload',
  standalone: true,
  imports: [DialogModule, ReactiveFormsModule, InputTextModule, TextareaModule, SelectModule, ButtonModule],
  templateUrl: './validator-resource-upload.component.html',
  styleUrl: './validator-resource-upload.component.css',
})
export class ValidatorResourceUploadComponent implements OnChanges {

  @Input() visible = false;
  @Input() isTemplate = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() uploaded = new EventEmitter<void>();

  form!: FormGroup;
  payloadTypeOptions: { label: string; value: string }[] = [];
  selectedFile: File | null = null;
  uploading = false;
  errorMessage = '';

  constructor(private fb: FormBuilder, private validatorService: ValidatorServiceService) {
    this.buildForm();
  }

  ngOnChanges(): void {
    this.payloadTypeOptions = this.isTemplate ? TEMPLATE_PAYLOAD_TYPES : SCHEMA_PAYLOAD_TYPES;
    this.resetForm();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      version: ['', [Validators.required, Validators.pattern(/^\d+(\.\d+)*$/)]],
      description: [''],
      contextUri: [''],
      payloadType: [this.payloadTypeOptions.length === 1 ? this.payloadTypeOptions[0].value : null, Validators.required],
    });
  }

  private resetForm(): void {
    this.form.reset();
    this.selectedFile = null;
    this.errorMessage = '';
    this.uploading = false;
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  get resourceType(): ResourceType {
    return this.isTemplate ? 'template' : 'schema';
  }

  get f(): Record<string, AbstractControl> {
    return this.form.controls;
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || !this.selectedFile) {
      if (!this.selectedFile) this.errorMessage = 'Please select a file.';
      return;
    }
    this.errorMessage = '';
    this.uploading = true;

    const payloadType: PayloadType = this.f['payloadType'].value;
    const metadata: ResourceMetadata | TemplateResourceMetadata = this.isTemplate
      ? {
        metadataType: 'template',
        name: this.f['name'].value,
        version: this.f['version'].value,
        description: this.f['description'].value || undefined,
        contextUri: this.f['contextUri'].value || undefined,
      } as TemplateResourceMetadata
      : {
        metadataType: 'base',
        name: this.f['name'].value,
        version: this.f['version'].value,
        description: this.f['description'].value || undefined,
      };

    this.validatorService.addResource(payloadType, this.selectedFile, metadata).subscribe({
      next: () => {
        this.uploading = false;
        this.close();
        this.uploaded.emit();
      },
      error: (err) => {
        console.log('Upload error:', err);
        this.uploading = false;
        this.errorMessage = 'Upload failed. Please try again.';
      },
    });
  }

  close(): void {
    this.resetForm();
    this.visibleChange.emit(false);
  }
}
