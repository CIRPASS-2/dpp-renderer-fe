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

import { Pipe, PipeTransform } from '@angular/core';
import { CLASS_LABELS, PROPERTY_LABELS } from './cirpass-dpp-ontology';

/** Convert camelCase / snake_case / kebab-case to Title Case */
export function prettify(raw: string): string {

  // strip namespace prefix
  const local = raw.includes('#') ? raw.split('#').pop()! : raw.split('/').pop()!;
  return local
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

@Pipe({ name: 'label', standalone: true })
export class LabelPipe implements PipeTransform {
  transform(uri: string): string {
    return PROPERTY_LABELS[uri] ?? CLASS_LABELS[uri] ?? prettify(uri);
  }
}