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
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ResourceMetadata, ResourceType, TemplateResourceMetadata } from '../validator-models';
import { ValidatorServiceService } from '../validator-service.service';

@Component({
  selector: 'app-validator-resource-view',
  standalone: true,
  imports: [ButtonModule, TagModule],
  templateUrl: './validator-resource-view.component.html',
  styleUrl: './validator-resource-view.component.css',
})
export class ValidatorResourceViewComponent implements OnInit {

  metadata: ResourceMetadata | null = null;
  content = '';
  loading = false;
  resType!: string;
  resourceType!: ResourceType;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private validatorService: ValidatorServiceService,
  ) { }

  ngOnInit(): void {
    this.resType = this.route.snapshot.paramMap.get('resType') ?? 'templates';
    this.resourceType = this.resType === 'templates' ? 'template' : 'schema';
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const state = history.state as { metadata?: ResourceMetadata };
    if (state?.metadata) {
      this.metadata = state.metadata;
    }
    this.loadContent(id);
  }

  loadContent(id: number): void {
    this.loading = true;
    this.validatorService.getResourceById(this.resourceType, id).subscribe({
      next: content => {
        this.content = this.isTemplate ? content : this.prettyJson(content);
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  private prettyJson(raw: string): string {
    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return raw;
    }
  }

  get isTemplate(): boolean {
    return this.resType === 'templates';
  }

  get templateMeta(): TemplateResourceMetadata {
    return this.metadata as TemplateResourceMetadata;
  }

  back(): void {
    this.router.navigate(['/validator', this.resType]);
  }
}
