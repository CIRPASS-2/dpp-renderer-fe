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

export type ResourceType = 'template' | 'schema';

/**
 * Mime-style payload type accepted by the backend upload endpoint.
 * Mirrors the Java {@code PayloadType} enum.
 */
export type PayloadType =
    | 'json'
    | 'json_ld'
    | 'turtle'
    | 'rdf_xml'
    | 'rdf_json'
    | 'n_triples'
    | 'n_quads'
    | 'n3';

export interface ResourceMetadata {
    id?: number;
    metadataType: 'base' | 'template';
    name: string;
    description?: string;
    version: string;
}

export interface TemplateResourceMetadata extends ResourceMetadata {
    metadataType: 'template';
    contextUri: string;
}

export interface ResourceSearchParams {
    name?: string;
    description?: string;
    version?: string;
    offset?: number;
    limit?: number;
}

export interface PagedResult<T> {
    elements: T[];
    totalElements: number;
    pageSize: number;
}
