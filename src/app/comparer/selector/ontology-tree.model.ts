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

export type OntologyJsonLd = OntologyNode[] | OntologyGraphWrapper;

export interface OntologyGraphWrapper {
    '@graph': OntologyNode[];
}

export interface OntologyNode {
    '@id': string;
    [predicateUri: string]: any;
}

export interface LocalizedString {
    '@language': string;
    '@value': string;
}

export interface Reference {
    '@id': string;
}

export interface PropertyTreeNode {
    key: string;
    label: string;
    data: PropertyData;
    children?: PropertyTreeNode[];
    leaf: boolean;
    selectable: boolean;
    expanded?: boolean;
    icon?: string;
}

export interface PropertyData {
    id: string;
    type: string[];
    path: string;

    label?: string;
    domain?: string;
    range?: string;
    comment?: string;
    isRequired?: boolean;
    dataType?: string;

    /**
     * Full RDF URI of the property (= @id of the ontology node).
     * E.g. "https://w3id.org/eudpp#productName"
     */
    uri?: string;

    /**
     * Vocab namespace: everything up to and including the last # or / in the URI.
     * E.g. "https://w3id.org/eudpp#"
     * Maps directly to OntologyPath.namespace in the ExtractionRequest sent to the BE.
     */
    namespace?: string;

    /**
     * Local name of the property within its namespace.
     * E.g. "productName"
     */
    localName?: string;
}

export interface PropertySelection {
    selectedPaths: string[];
    selectedProperties: PropertyData[];
}

// ─── BE payload types ─────────────────────────────────────────────────────────

/**
 * Mirrors the BE record:
 *   public record OntologyPath(String namespace, String path) {}
 */
export interface OntologyPath {
    namespace: string;
    path: string;
}

/**
 * Mirrors ExtractionRequest.propertyPaths:
 *   Map<String, List<OntologyPath>> propertyPaths
 * Key = logical field name (card name).
 */
export interface PropertyPathsMap {
    [logicalName: string]: OntologyPath[];
}

// ─── URI split utility ────────────────────────────────────────────────────────

/**
 * Splits a full RDF URI into namespace (with trailing # or /) and localName.
 *
 * "https://w3id.org/eudpp#productName"
 *   → { namespace: "https://w3id.org/eudpp#", localName: "productName" }
 *
 * "https://example.org/textile/fabricName"
 *   → { namespace: "https://example.org/textile/", localName: "fabricName" }
 */
export function splitUri(uri: string): { namespace: string; localName: string } {
    if (!uri) return { namespace: '', localName: '' };
    const hashIdx = uri.lastIndexOf('#');
    if (hashIdx !== -1) {
        return {
            namespace: uri.substring(0, hashIdx + 1),
            localName: uri.substring(hashIdx + 1),
        };
    }
    const slashIdx = uri.lastIndexOf('/');
    if (slashIdx !== -1) {
        return {
            namespace: uri.substring(0, slashIdx + 1),
            localName: uri.substring(slashIdx + 1),
        };
    }
    return { namespace: '', localName: uri };
}