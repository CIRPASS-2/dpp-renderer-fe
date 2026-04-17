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

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AccordionModule } from 'primeng/accordion';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import {
  PagedResult,
  ResourceMetadata,
  ResourceSearchParams,
  ResourceType,
  TemplateResourceMetadata,
} from '../validator-models';
import { ValidatorResourceUploadComponent } from '../validator-resource-upload/validator-resource-upload.component';
import { ValidatorServiceService } from '../validator-service.service';

@Component({
  selector: 'app-validator-resources-table',
  standalone: true,
  imports: [TableModule, ButtonModule, TagModule, TooltipModule, ConfirmDialogModule,
    ValidatorResourceUploadComponent, AccordionModule, ReactiveFormsModule, InputTextModule],
  providers: [ConfirmationService],
  templateUrl: './validator-resources-table.component.html',
  styleUrl: './validator-resources-table.component.css',
})
export class ValidatorResourcesTableComponent implements OnInit {

  resType!: string;
  resourceType!: ResourceType;
  isTemplate = false;

  resources: ResourceMetadata[] = [];
  totalRecords = 0;
  loading = false;
  readonly pageSize = 10;
  showUploadDialog = false;
  currentSearchParams: ResourceSearchParams = { offset: 0, limit: 10 };

  searchForm!: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private validatorService: ValidatorServiceService,
    private confirmationService: ConfirmationService,
    private fb: FormBuilder,
  ) { }

  ngOnInit(): void {
    this.searchForm = this.fb.group({
      name: [''],
      version: [''],
      description: [''],
    });
    this.route.paramMap.subscribe(params => {
      this.resType = params.get('resType') ?? 'templates';
      this.resourceType = this.resType === 'templates' ? 'template' : 'schema';
      this.isTemplate = this.resType === 'templates';
      this.searchForm.reset();
      this.currentSearchParams = { offset: 0, limit: this.pageSize };
      this.load(this.currentSearchParams);
    });
  }

  search(): void {
    const { name, version, description } = this.searchForm.value;
    this.currentSearchParams = {
      offset: 0,
      limit: this.pageSize,
      name: name || undefined,
      version: version || undefined,
      description: description || undefined,
    };
    this.load(this.currentSearchParams);
  }

  clearSearch(): void {
    this.searchForm.reset();
    this.currentSearchParams = { offset: 0, limit: this.pageSize };
    this.load(this.currentSearchParams);
  }

  load(params: ResourceSearchParams): void {
    this.loading = true;
    this.validatorService.search(this.resourceType, params).subscribe({
      next: (result: PagedResult<ResourceMetadata>) => {
        this.resources = [...result.elements];
        this.totalRecords = result.totalElements;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  pageChange(event: { first: number; rows: number }): void {
    const params: ResourceSearchParams = {
      ...this.currentSearchParams,
      offset: event.first,
      limit: event.rows,
    };
    this.currentSearchParams = params;
    this.load(params);
  }

  view(resource: ResourceMetadata): void {
    this.router.navigate(
      ['/validator', this.resType, 'view', resource.id],
      { state: { metadata: resource } },
    );
  }

  confirmDelete(resource: ResourceMetadata): void {
    this.confirmationService.confirm({
      message: `Delete "${resource.name}" v${resource.version}?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.delete(resource),
    });
  }

  private delete(resource: ResourceMetadata): void {
    this.validatorService.deleteResource(this.resourceType, resource.id!).subscribe({
      next: () => this.load(this.currentSearchParams),
    });
  }

  asTemplate(r: ResourceMetadata): TemplateResourceMetadata {
    return r as TemplateResourceMetadata;
  }
}
