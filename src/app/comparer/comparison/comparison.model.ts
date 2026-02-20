export interface ExtractionRequest {
  ontologyUrl: string
  fallbackNsURI: string
  dppUrls: string[]
  propertyPaths: string[]
}

export interface ExtractionResponse {
  results: any[]
}

export interface ComparisonResult {
  results: any[]
}

export interface ComparisonRow {
  propertyKey: string;
  propertyLabel: string;
  values: Map<string, PropertyValue>;
  isDifferent: boolean;
  isNested?: boolean;
  level?: number;
  parentKey?: string;
}

export interface PropertyValue {
  value: any;
  isDifferent: boolean;
  isMissing: boolean;
  displayValue: string;
}

export interface DppColumn {
  dppId: string;
  dppLabel: string;
}