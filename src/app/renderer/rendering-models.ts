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

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | JsonObject;

export type JsonObject = { [key: string]: JsonValue };



export interface JsonLdValue {
  '@value': string | number | boolean;
  '@type'?: string;
  '@language'?: string;
}

export interface JsonLdNodeRef {
  '@id': string;
}

export interface JsonLdNode {
  '@id'?: string;
  '@type'?: string[];
  [property: string]: JsonLdPropertyValue | string[] | string | undefined;
}

export type JsonLdPropertyValue = Array<JsonLdValue | JsonLdNodeRef | JsonLdNode>;

export type ExpandedJsonLd = JsonLdNode[];


export function isJsonLdValue(v: unknown): v is JsonLdValue {
  return typeof v === 'object' && v !== null && '@value' in v;
}

export function isJsonLdNodeRef(v: unknown): v is JsonLdNodeRef {
  return typeof v === 'object' && v !== null && '@id' in v && !('@value' in v);
}

export function isJsonLdNode(v: unknown): v is JsonLdNode {
  return typeof v === 'object' && v !== null && !('@value' in v);
}

export function isIriOnlyRef(node: JsonLdNode): boolean {
  const keys = Object.keys(node).filter(k => k !== '@id' && k !== '@type');
  return keys.length === 0 && (!node['@type'] || node['@type'].length === 0);
}

export function extractString(
  node: JsonLdNode,
  propertyUri: string,
): string | undefined {
  const arr = node[propertyUri] as JsonLdPropertyValue | undefined;
  if (!Array.isArray(arr) || arr.length === 0) return undefined;
  const first = arr[0];
  if (isJsonLdValue(first)) return String(first['@value']);
  return undefined;
}

export function extractStrings(
  node: JsonLdNode,
  propertyUri: string,
): string[] {
  const arr = node[propertyUri] as JsonLdPropertyValue | undefined;
  if (!Array.isArray(arr)) return [];
  return arr
    .filter(isJsonLdValue)
    .map(v => String(v['@value']));
}

export function extractNumber(
  node: JsonLdNode,
  propertyUri: string,
): number | undefined {
  const arr = node[propertyUri] as JsonLdPropertyValue | undefined;
  if (!Array.isArray(arr) || arr.length === 0) return undefined;
  const first = arr[0];
  if (isJsonLdValue(first)) {
    const n = Number(first['@value']);
    return isNaN(n) ? undefined : n;
  }
  return undefined;
}

export function extractNodes(
  node: JsonLdNode,
  propertyUri: string,
): JsonLdNode[] {
  const arr = node[propertyUri] as JsonLdPropertyValue | undefined;
  if (!Array.isArray(arr)) return [];
  return arr.filter(isJsonLdNode) as JsonLdNode[];
}

export function extractPropertyUris(node: JsonLdNode): string[] {
  return Object.keys(node).filter(k => k !== '@id' && k !== '@type');
}