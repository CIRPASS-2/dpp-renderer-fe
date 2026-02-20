
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
    domain?: string;
    range?: string;
    comment?: string;
    isRequired?: boolean;
    dataType?: string;
}

export interface PropertySelection {
    selectedPaths: string[];
    selectedProperties: PropertyData[];
}