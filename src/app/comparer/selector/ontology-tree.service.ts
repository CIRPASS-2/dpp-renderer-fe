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

import { Injectable } from '@angular/core';
import { TreeNode } from 'primeng/api';
import {
  OntologyJsonLd,
  PropertyData,
  PropertyTreeNode,
  splitUri,
} from './ontology-tree.model';

/**
 * Service to transform ontology expanded JSON-LD into primeng multi level trees.
 */
@Injectable({
  providedIn: 'root'
})
export class OntologyTreeService {

  private nodeCounter = 0;

  private readonly RDF_TYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
  private readonly RDFS_LABEL = 'http://www.w3.org/2000/01/rdf-schema#label';
  private readonly RDFS_COMMENT = 'http://www.w3.org/2000/01/rdf-schema#comment';
  private readonly RDFS_DOMAIN = 'http://www.w3.org/2000/01/rdf-schema#domain';
  private readonly RDFS_RANGE = 'http://www.w3.org/2000/01/rdf-schema#range';
  private readonly RDFS_SUBCLASS = 'http://www.w3.org/2000/01/rdf-schema#subClassOf';

  private readonly RDFS_CLASS = 'http://www.w3.org/2000/01/rdf-schema#Class';
  private readonly OWL_CLASS = 'http://www.w3.org/2002/07/owl#Class';

  //  Array cache for extracted ontology nodes
  private allNodes: any[] = [];

  /**
   * Transform an expanded JSON-LD into a tree node
   */
  transformOntologyToTree(ontology: OntologyJsonLd): TreeNode[] {
    this.nodeCounter = 0;
    this.allNodes = this.extractExpandedNodes(ontology);

    console.log('Total nodes in ontology:', this.allNodes.length);

    console.log('First 3 nodes sample:');
    this.allNodes.slice(0, 3).forEach((node, i) => {
      console.log(`Node ${i}:`, {
        id: node['@id'],
        type: node['@type'],
        keys: Object.keys(node)
      });
    });

    //Counts @type nodes
    const nodesWithType = this.allNodes.filter(n => n['@type']);
    console.log(`Nodes with @type: ${nodesWithType.length}`);
    console.log('Calling filterByType with:');
    const classes = this.filterByType(this.allNodes, this.RDFS_CLASS, this.OWL_CLASS);
    console.log('Classes found after filter:', classes.length);

    if (classes.length > 0) {
      console.log('Class names:', classes.map(c => this.extractLocalName(c['@id'])));
    } else {
      console.log('No classes found! Doing manual search');

      const manualClasses = this.allNodes.filter(node => {
        const type = node['@type'];
        if (!type) return false;

        const typeArray = Array.isArray(type) ? type : [type];
        const hasClass = typeArray.some(t =>
          t === 'http://www.w3.org/2002/07/owl#Class' ||
          t === 'http://www.w3.org/2000/01/rdf-schema#Class'
        );

        if (hasClass) {
          console.log(`Found class manually: ${this.extractLocalName(node['@id'])}`);
        }

        return hasClass;
      });

      console.log(`Manual search found ${manualClasses.length} classes`);

      if (manualClasses.length > 0) {
        console.log('Manual class names:', manualClasses.map(c => this.extractLocalName(c['@id'])));
      }
    }

    const properties = this.allNodes.filter(node =>
      this.getValue(node, this.RDFS_DOMAIN).length > 0
    );
    console.log('Properties found:', properties.length);
    if (properties.length > 0) {
      console.log('Property names:', properties.map(p => this.extractLocalName(p['@id'])).slice(0, 10));
    }

    const tree: TreeNode[] = [];

    if (classes.length > 0) {
      classes.forEach(cls => {
        console.log(`Processing class: ${this.extractLocalName(cls['@id'])}`);
        const classNode = this.createClassNodeMultiLevel(cls, properties);
        if (classNode) tree.push(classNode);
      });
    } else {
      console.log('No classes found, falling back to property grouping');
      tree.push(...this.createPropertyGroupTree(properties));
    }

    console.log('Root nodes created:', tree.length);

    return tree;
  }


  private createClassNodeMultiLevel(cls: any, allProperties: any[]): TreeNode | null {
    const classId = cls['@id'];
    const label = this.getString(this.getValue(cls, this.RDFS_LABEL));

    console.log(`Creating class node: ${this.extractLocalName(classId)}`);

    const directProperties = allProperties.filter(prop => {
      const domains = this.getValue(prop, this.RDFS_DOMAIN);
      return domains.some(d => this.getId(d) === classId);
    });

    console.log(`Found ${directProperties.length} direct properties:`);
    directProperties.forEach(p => console.log(`  - ${this.extractLocalName(p['@id'])}`));

    if (directProperties.length === 0) return null;

    // Uses separate variable for simple properties and container properties
    const normalProps: any[] = [];
    const containerProps: any[] = [];

    console.log('Checking which properties are containers:');
    directProperties.forEach(prop => {
      const propName = this.extractLocalName(prop['@id']);
      const isContainer = this.isContainerProperty(prop);
      console.log(`  ${propName}: ${isContainer ? 'Container' : 'Normal'}`);

      if (isContainer) {
        containerProps.push(prop);
      } else {
        normalProps.push(prop);
      }
    });

    console.log(`Result: ${normalProps.length} normal, ${containerProps.length} containers`);

    // Creates child nodes. First normal properties then container properties
    const children: TreeNode[] = [];

    normalProps.forEach(prop => {
      children.push(this.createSimplePropertyNode(prop));
    });

    // Add expanded container properties (multi-level)
    containerProps.forEach(containerProp => {
      const containerNode = this.createContainerPropertyNode(containerProp);
      if (containerNode) children.push(containerNode);
    });

    return {
      key: this.generateKey(),
      label: label || this.extractLocalName(classId),
      data: {
        id: classId,
        type: this.getValue(cls, this.RDF_TYPE).map(t => this.getId(t) || ''),
        path: '',
        comment: this.getString(this.getValue(cls, this.RDFS_COMMENT))
      },
      children,
      leaf: false,
      selectable: false,
      expanded: false,
      icon: 'pi pi-folder'
    };
  }


  private isContainerProperty(prop: any): boolean {
    const propId = prop['@id'];
    const propName = this.extractLocalName(propId);
    console.log(`Checking if "${propName}" is container:`);
    console.log(`Property ID: ${propId}`);

    // STEP 1: Check range
    const ranges = this.getValue(prop, this.RDFS_RANGE);
    console.log(`Ranges found:`, ranges.length);
    if (ranges.length > 0) {
      console.log(`First range:`, ranges[0]);
    }

    if (ranges.length === 0) {
      return false;
    }

    // STEP 2: Extract range ID
    const rangeId = this.getId(ranges[0]);
    console.log(`Range ID extracted: ${rangeId}`);

    if (!rangeId) {
      console.log(`EXITING: Could not extract range ID`);
      return false;
    }

    // STEP 3: Find range class in ontology
    const rangeClass = this.allNodes.find(n => n['@id'] === rangeId);
    console.log(`Range class found in ontology: ${!!rangeClass}`);

    if (!rangeClass) {
      console.log(`EXITING: Range class not found in ontology`);
      console.log(`Looking for: ${rangeId}`);
      console.log(`Available classes:`, this.allNodes.filter(n => {
        const types = this.getValue(n, this.RDF_TYPE);
        return types.some(t => {
          const typeId = this.getId(t);
          return typeId === this.RDFS_CLASS || typeId === this.OWL_CLASS;
        });
      }).map(n => n['@id']));
      return false;
    }

    // STEP 4: Check if range is a class
    const rangeTypes = this.getValue(rangeClass, this.RDF_TYPE);
    console.log(`Range types:`, rangeTypes);
    console.log(`Range type IDs:`, rangeTypes.map(t => this.getId(t)));

    const isClass = rangeTypes.some(t => {
      const typeId = this.getId(t);
      const matches = typeId === this.RDFS_CLASS || typeId === this.OWL_CLASS;
      if (matches) {
        console.log(`Matched class type: ${typeId}`);
      }
      return matches;
    });

    console.log(`Is range a class? ${isClass}`);

    if (!isClass) {
      console.log(`EXITING: Range is not a class`);
      return false;
    }

    console.log(`STEP 5 - Calling findSubclasses for: ${this.extractLocalName(rangeId)}`);
    const subclasses = this.findSubclasses(rangeId);
    console.log(`Subclasses found: ${subclasses.length}`);

    if (subclasses.length > 0) {
      console.log(`Subclass names:`, subclasses.map(sc => this.extractLocalName(sc['@id'])).join(', '));
    }

    const isContainer = subclasses.length > 0;
    console.log(`Final result - Is container: ${isContainer}`);

    return isContainer;
  }


  private createContainerPropertyNode(containerProp: any): TreeNode | null {
    const propId = containerProp['@id'];
    const label = this.getString(this.getValue(containerProp, this.RDFS_LABEL));
    const localName = this.extractLocalName(propId);

    const ranges = this.getValue(containerProp, this.RDFS_RANGE);
    if (ranges.length === 0) return null;

    const rangeId = this.getId(ranges[0]);
    if (!rangeId) return null;

    const subclasses = this.findSubclasses(rangeId);
    if (subclasses.length === 0) return null;

    const children: TreeNode[] = [];
    subclasses.forEach(subclass => {
      const subclassNode = this.createSubclassNode(subclass, localName);
      if (subclassNode) children.push(subclassNode);
    });

    return {
      key: this.generateKey(),
      label: label || localName,
      data: {
        id: propId,
        type: this.getValue(containerProp, this.RDF_TYPE).map(t => this.getId(t) || ''),
        path: `/${localName}`,
        comment: this.getString(this.getValue(containerProp, this.RDFS_COMMENT))
      },
      children,
      leaf: false,
      selectable: false,
      expanded: false,
      icon: 'pi pi-folder-open'
    };
  }


  private createSubclassNode(subclass: any, containerPath: string): TreeNode | null {
    const classId = subclass['@id'];
    const label = this.getString(this.getValue(subclass, this.RDFS_LABEL));
    const className = this.extractLocalName(classId);

    const applicableProps = this.findPropertiesForClass(classId);
    if (applicableProps.length === 0) return null;

    const children: TreeNode[] = applicableProps.map(prop => {
      return this.createLeafPropertyNode(prop, containerPath, className);
    });

    return {
      key: this.generateKey(),
      label: label || className,
      data: {
        id: classId,
        type: this.getValue(subclass, this.RDF_TYPE).map(t => this.getId(t) || ''),
        path: `${containerPath}[${className}]`,
        comment: this.getString(this.getValue(subclass, this.RDFS_COMMENT))
      },
      children,
      leaf: false,
      selectable: false,
      expanded: false,
      icon: 'pi pi-box'
    };
  }


  private createLeafPropertyNode(prop: any, containerPath: string, typeName: string): PropertyTreeNode {
    const propId = prop['@id'];
    const label = this.getString(this.getValue(prop, this.RDFS_LABEL));
    const propName = this.extractLocalName(propId);

    const fullPath = `${containerPath}[*@type=${typeName}].${propName}`;

    const ranges = this.getValue(prop, this.RDFS_RANGE);
    const rangeType = ranges.length > 0 ? this.getId(ranges[0]) : undefined;
    const dataType = this.determineDataType(rangeType);

    // ── namespace / localName / uri ──────────────────────────────────────────
    const { namespace, localName } = splitUri(propId);

    return {
      key: this.generateKey(),
      label: label || propName,
      data: {
        id: propId,
        type: this.getValue(prop, this.RDF_TYPE).map(t => this.getId(t) || ''),
        path: fullPath,
        label: label || propName,
        range: rangeType,
        comment: this.getString(this.getValue(prop, this.RDFS_COMMENT)),
        dataType,
        // ── new fields ───────────────────────────────────────────────────────
        uri: propId,
        namespace,
        localName,
      },
      leaf: true,
      selectable: true,
      expanded: false,
      icon: this.getPropertyIcon(dataType, false)
    };
  }

  /**
   * Create a property path for simple properties (no container ones)
   */
  private createSimplePropertyNode(prop: any, parentPath: string = ''): PropertyTreeNode {
    const propId = prop['@id'];
    const label = this.getString(this.getValue(prop, this.RDFS_LABEL));
    const propLocalName = this.extractLocalName(propId);
    const path = parentPath ? `${parentPath}/${propLocalName}` : `${propLocalName}`;

    const ranges = this.getValue(prop, this.RDFS_RANGE);
    const rangeType = ranges.length > 0 ? this.getId(ranges[0]) : undefined;
    const dataType = this.determineDataType(rangeType);

    const domains = this.getValue(prop, this.RDFS_DOMAIN);
    const domain = domains.length > 0 ? this.getId(domains[0]) : undefined;

    // ── namespace / localName / uri ──────────────────────────────────────────
    const { namespace, localName } = splitUri(propId);

    return {
      key: this.generateKey(),
      label: label || propLocalName,
      data: {
        id: propId,
        type: this.getValue(prop, this.RDF_TYPE).map(t => this.getId(t) || ''),
        path,
        domain,
        range: rangeType,
        comment: this.getString(this.getValue(prop, this.RDFS_COMMENT)),
        dataType,
        // ── new fields ───────────────────────────────────────────────────────
        uri: propId,
        namespace,
        localName,
      },
      leaf: true,
      selectable: true,
      expanded: false,
      icon: this.getPropertyIcon(dataType, false)
    };
  }

  /**
   * Find all subclass of class (direct and indirect) recursively
   */
  private findSubclasses(baseClassId: string): any[] {
    console.log(`Finding all subclasses of ${this.extractLocalName(baseClassId)}`);

    const allSubclasses: any[] = [];
    const visited = new Set<string>();

    const findRecursive = (classId: string) => {
      const directSubclasses = this.allNodes.filter(node => {
        const subclassOf = this.getValue(node, this.RDFS_SUBCLASS);
        return subclassOf.some(sc => this.getId(sc) === classId);
      });

      directSubclasses.forEach(subclass => {
        const subclassId = subclass['@id'];

        if (visited.has(subclassId)) return;
        visited.add(subclassId);

        console.log(`Found subclass: ${this.extractLocalName(subclassId)}`);
        allSubclasses.push(subclass);
        findRecursive(subclassId);
      });
    };

    findRecursive(baseClassId);

    console.log(`Total subclasses found (recursive): ${allSubclasses.length}`);
    console.log(`Subclass names: ${allSubclasses.map(s => this.extractLocalName(s['@id'])).join(', ')}`);

    return allSubclasses;
  }


  private findPropertiesForClass(classId: string): any[] {
    return this.allNodes.filter(node => {
      const domains = this.getValue(node, this.RDFS_DOMAIN);
      if (domains.length === 0) return false;

      return domains.some(d => {
        const domainId = this.getId(d);
        return domainId && (domainId === classId || this.isSubclassOf(classId, domainId));
      });
    });
  }

  /**
   * Verify if classId is subclass of potentialSuperClass
   */
  private isSubclassOf(classId: string, potentialSuperClass: string): boolean {
    const classNode = this.allNodes.find(n => n['@id'] === classId);
    if (!classNode) return false;

    const superclasses = this.getValue(classNode, this.RDFS_SUBCLASS);
    for (const sc of superclasses) {
      const superId = this.getId(sc);
      if (superId === potentialSuperClass) return true;
      if (this.isSubclassOf(superId!, potentialSuperClass)) return true;
    }

    return false;
  }


  private createPropertyGroupTree(properties: any[]): TreeNode[] {
    const tree: TreeNode[] = [];
    const grouped = new Map<string, any[]>();
    const noDomain: any[] = [];

    properties.forEach(prop => {
      const domains = this.getValue(prop, this.RDFS_DOMAIN);
      if (domains.length > 0) {
        const domainId = this.getId(domains[0]);
        if (domainId) {
          if (!grouped.has(domainId)) grouped.set(domainId, []);
          grouped.get(domainId)!.push(prop);
        }
      } else {
        noDomain.push(prop);
      }
    });

    grouped.forEach((props, domainId) => {
      tree.push({
        key: this.generateKey(),
        label: this.extractLocalName(domainId),
        data: { id: domainId, type: ['domain'], path: '' },
        children: props.map(p => this.createSimplePropertyNode(p)),
        leaf: false,
        selectable: false,
        expanded: false,
        icon: 'pi pi-folder'
      });
    });

    if (noDomain.length > 0) {
      tree.push({
        key: this.generateKey(),
        label: 'Other Properties',
        data: { id: 'other', type: ['group'], path: '' },
        children: noDomain.map(p => this.createSimplePropertyNode(p)),
        leaf: false,
        selectable: false,
        expanded: false,
        icon: 'pi pi-folder'
      });
    }

    return tree;
  }


  private extractExpandedNodes(ontology: OntologyJsonLd): any[] {
    if (Array.isArray(ontology)) {
      return ontology;
    }

    if ('@graph' in ontology && Array.isArray(ontology['@graph'])) {
      return ontology['@graph'];
    }

    return [];
  }

  private filterByType(nodes: any[], ...types: string[]): any[] {
    console.log(`[filterByType] Filtering ${nodes.length} nodes for types:`, types);

    const filtered = nodes.filter(node => {
      const nodeTypes = this.getValue(node, this.RDF_TYPE);
      if (nodes.indexOf(node) < 3) {
        console.log(`[filterByType] Node ${nodes.indexOf(node)}:`);
        console.log(` ID: ${node['@id']}`);
        console.log(` getValue result:`, nodeTypes);
        console.log(` Raw @type:`, node[this.RDF_TYPE]);
      }

      const matches = types.some(type =>
        nodeTypes.some((nt: any) => {
          const ntId = this.getId(nt);
          const match = ntId === type;

          if (match && nodes.indexOf(node) < 3) {
            console.log(`matched ${ntId} === ${type}`);
          }

          return match;
        })
      );

      return matches;
    });

    console.log(`[DEBUG filterByType] Result: ${filtered.length} nodes matched\n`);
    return filtered;
  }


  private getValue(node: any, predicate: string): any[] {
    if (predicate === this.RDF_TYPE) {
      const typeValue = node['@type'];
      if (!typeValue) return [];
      return Array.isArray(typeValue) ? typeValue : [typeValue];
    }

    const value = node[predicate];
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }

  private getId(value: any): string | undefined {
    if (typeof value === 'string') return value;
    return value?.['@id'];
  }


  private getString(values: any[], preferredLang: string = 'en'): string | undefined {
    if (!values?.length) return undefined;

    for (const val of values) {
      if (val['@value'] && val['@language'] === preferredLang) {
        return val['@value'];
      }
    }

    for (const val of values) {
      if (val['@value'] && val['@language'] === 'it') {
        return val['@value'];
      }
    }

    const first = values[0];
    if (first['@value']) return first['@value'];
    if (typeof first === 'string') return first;

    return undefined;
  }


  private extractLocalName(uri: string): string {
    if (!uri) return 'unknown';
    const parts = uri.split(/[/#]/);
    return parts[parts.length - 1] || uri;
  }


  private determineDataType(rangeType?: string): string {
    if (!rangeType) return 'unknown';
    const lower = rangeType.toLowerCase();

    if (lower.includes('string')) return 'string';
    if (lower.includes('integer') || lower.includes('int')) return 'number';
    if (lower.includes('float') || lower.includes('double') || lower.includes('decimal')) return 'number';
    if (lower.includes('boolean')) return 'boolean';
    if (lower.includes('date')) return 'date';
    if (lower.includes('time')) return 'datetime';
    if (lower.includes('uri') || lower.includes('url')) return 'uri';

    return 'object';
  }


  private getPropertyIcon(dataType: string, hasChildren: boolean): string {
    if (hasChildren) return 'pi pi-folder';

    const icons: Record<string, string> = {
      'string': 'pi pi-align-left',
      'number': 'pi pi-hashtag',
      'boolean': 'pi pi-check-square',
      'date': 'pi pi-calendar',
      'datetime': 'pi pi-calendar',
      'uri': 'pi pi-link',
      'object': 'pi pi-box'
    };

    return icons[dataType] || 'pi pi-circle';
  }


  private generateKey(): string {
    return `node_${this.nodeCounter++}`;
  }

  extractSelectedPaths(selectedNodes: TreeNode[]): string[] {
    return selectedNodes
      .filter(node => node.leaf && node.data?.path)
      .map(node => node.data.path);
  }


  extractSelectedProperties(selectedNodes: TreeNode[]): PropertyData[] {
    return selectedNodes
      .filter(node => node.leaf && node.data)
      .map(node => node.data as PropertyData);
  }
}