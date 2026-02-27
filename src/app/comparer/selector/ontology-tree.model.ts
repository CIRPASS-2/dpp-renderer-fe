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
     * E.g. "http://dpp.taltech.ee/EUDPP#productName"
     */
    uri?: string;

    /**
     * Vocab namespace: everything up to and including the last # or / in the URI.
     * E.g. "http://dpp.taltech.ee/EUDPP#"
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
 * "http://dpp.taltech.ee/EUDPP#productName"
 *   → { namespace: "http://dpp.taltech.ee/EUDPP#", localName: "productName" }
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