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