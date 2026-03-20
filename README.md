# DPP Renderer Fe

Frontend application for visualizing, searching, and comparing Digital Product Passport (DPP) data with specialized rendering for the CIRPASS-2 ontology.

Main functions are:
- **DPP visualization**: Renders DPPs in JSON or JSON-LD format with specialized components for CIRPASS-2 ontology entities.  
- **DPP comparison**: Side-by-side comparison of multiple DPPs with difference highlighting and tabular view.
- **DPP search**: Advanced search over indexed DPP data with dynamic filtering capabilities.
- **QR code scanning**: Direct import of DPPs via mobile camera scanning.

© CIRPASS-2 Consortium, 2024-2027

<img width="832" height="128" alt="image" src="https://raw.githubusercontent.com/CIRPASS-2/assets/main/images/cc-commons.png" />

The CIRPASS-2 project receives funding under the European Union's DIGITAL EUROPE PROGRAMME under GA No 101158775.

> **Important disclaimer:**
> All software and artifacts produced by the CIRPASS-2 consortium are designed for exploration and are provided for information purposes only. They should not be interpreted as being complete, exhaustive, or normative. The CIRPASS-2 consortium partners are not liable for any damage that could result from making use of this information.
>
> Technical interpretations of the European Digital Product Passport system expressed in these artifacts are those of the author(s) only and do not necessarily reflect those of the European Union, European Commission, or the European Health and Digital Executive Agency (HADEA). Neither the European Union, the European Commission nor the granting authority can be held responsible for them. These interpretations should not be understood as reflecting those of CEN-CENELEC JTC 24.

## Overview

This Angular application provides a comprehensive frontend for Digital Product Passport (DPP) data visualization and management. It connects to CIRPASS-2 backend services to retrieve, search, and compare DPPs while offering specialized rendering components for the CIRPASS-2 ontology.

### Key Features

- **Dual-mode JSON-LD rendering**: Specialized components for CIRPASS-2 ontology entities with universal fallback for unknown vocabularies.
- **Ontology-aware visualization**: Purpose-built renderers for Products, Actors, Facilities, Substances, LCA data, Documents, and Quantitative Properties.
- **Advanced DPP comparison**: Multi-DPP tabular comparison with ontology-based property extraction and difference highlighting.
- **Dynamic search interface**: Auto-configured search forms based on backend capabilities with filter operators and pagination.
- **QR code integration**: Mobile-friendly QR scanning for direct DPP import and visualization.
- **OpenID Connect authentication** with role-based access control.
- **Responsive design** built with Angular 17+ and PrimeNG components.

### JSON-LD Rendering Architecture

The application operates in **two distinct rendering modes**:

#### 1. **Ontology-Compliant Mode**
When the DPP document complies with the CIRPASS-2 core ontology, specialized renderer components provide optimized visualization:

- **[ProductRendererComponent](src/app/renderer/json-ld/product-renderer/)**: Product metadata, identifiers, dimensions
- **[ActorRendererComponent](src/app/renderer/json-ld/actor-renderer/)**: Legal/natural persons, economic roles, facilities
- **[SubstanceRendererComponent](src/app/renderer/json-ld/substance-renderer/)**: Chemical substances, substances of concern, regulatory data  
- **[FacilityRendererComponent](src/app/renderer/json-ld/facility-renderer/)**: Manufacturing facilities, locations, certifications
- **[LcaRendererComponent](src/app/renderer/json-ld/lca-renderer/)**: Environmental impact data, carbon footprints, life cycle assessments
- **[DocumentRendererComponent](src/app/renderer/json-ld/document-renderer/)**: Digital instructions, compliance documents, certificates
- **[QuantitativePropertyRendererComponent](src/app/renderer/json-ld/quantitative-property-renderer/)**: Measurements with units, thresholds, ranges
- **[DppInfoRendererComponent](src/app/renderer/json-ld/dpp-info-renderer/)**: DPP administrative metadata, status, validity
- **[ClassificationCodeRendererComponent](src/app/renderer/json-ld/clasification-code-renderer/)**: HS codes, ECLASS codes, taxonomic identifiers

#### 2. **Abstract Mode (Universal Fallback)**
When the vocabulary is unknown or unsupported, the **[AbstractRendererComponent](src/app/renderer/json-ld/abstract-renderer/)** provides:

- **Universal property extraction**: Automatic discovery and rendering of all JSON-LD properties
- **Circular reference prevention**: Intelligent traversal with visited node tracking  
- **Ontology-agnostic labels**: Human-readable property names via ontology registry
- **Hierarchical visualization**: Multi-level nested property support

## Table of Contents

- [Overview](#overview)
    - [Key Features](#key-features)
    - [JSON-LD Rendering Architecture](#json-ld-rendering-architecture)
- [Quick Start](#quick-start)
    - [Prerequisites](#prerequisites)
    - [Install Dependencies](#install-dependencies)
    - [Development Server](#development-server)
    - [Building](#building)
    - [Using Docker](#using-docker)
- [Configuration](#configuration)
    - [Environment Configuration](#environment-configuration)
    - [Backend Services](#backend-services)
    - [Configuration Examples](#configuration-examples)
- [Features & Components](#features--components)
    - [DPP Visualization](#dpp-visualization)
    - [DPP Search](#dpp-search)
    - [DPP Comparison](#dpp-comparison)
    - [QR Code Scanner](#qr-code-scanner)
- [Backend API Integration](#backend-api-integration)
    - [Used Endpoints](#used-endpoints)
    - [Authentication](#authentication)
- [Deployment](#deployment)
    - [Docker Deployment](#docker-deployment)
    - [Kubernetes Deployment](#kubernetes-deployment)
- [Authentication & Authorization](#authentication--authorization)
- [License](#license)
- [Contributing](#contributing)
- [Support](#support)

## Quick Start

### Prerequisites

- **Node.js** 18+ 
- **npm** 9+
- **Angular CLI** 17+
- Access to CIRPASS-2 backend services (DPP Renderer BE, DPP Data Extractor)
- Optional: OpenID Connect provider (e.g., Keycloak)

### Install Dependencies

```bash
npm install
```

### Development Server

```bash
ng serve
```

Navigate to `http://localhost:4200/`. The application will automatically reload when you change source files.

### Building

```bash
# Development build
ng build

# Production build  
ng build --configuration production
```

Build artifacts will be stored in the `dist/` directory.

### Using Docker

```bash
# Build image
docker build -t dpp-renderer .

# Run container
docker run -p 4200:80 dpp-renderer
```

## Configuration

### Environment Configuration

The application uses dynamic environment configuration via `assets/env.js`, allowing runtime configuration without rebuilding the application.

#### Core Configuration Variables

| Variable          | Description                     | Default                                 |
|-------------------|---------------------------------|-----------------------------------------|
| `backendUrl`      | DPP Renderer Backend API URL    | `http://localhost:8085`                 |
| `capabilitiesUrl` | DPP Data Extractor API URL      | `http://localhost:8084`                 |
| `oidcIssuer`      | OpenID Connect issuer URL       | `http://localhost:8180/realms/cirpass-2`|
| `oidcClientId`    | OIDC client identifier          | `web-portal-fe`                         |
| `oidcHttps`       | Force HTTPS for OIDC            | `true`                                  |

#### Environment Files

**Development (`assets/env.js`):**
```javascript
(function (window) {
  window['env'] = window['env'] || {};
  window['env']['backendUrl'] = 'http://localhost:8085';
  window['env']['capabilitiesUrl'] = 'http://localhost:8084';
  window['env']['oidcIssuer'] = 'http://localhost:8180/realms/cirpass-2';
  window['env']['oidcClientId'] = 'web-portal-fe';
  window['env']['oidcHttps'] = false;
})(this);
```

**Production (`assets/env.template.js`):**
```javascript
(function (window) {
  window['env'] = window['env'] || {};
  window['env']['production'] = `${PRODUCTION}`;
  window['env']['backendUrl'] = '${BACKEND_URL}';
  window['env']['capabilitiesUrl'] = '${CAPABILITIES_URL}';
  window['env']['oidcIssuer'] = '${OIDC_ISSUER}';
  window['env']['oidcClientId'] = '${OIDC_CLIENT_ID}';
  window['env']['oidcHttps'] = '${OIDC_HTTPS}';
})(this);
```

### Backend Services

The application requires two backend services:

#### 1. **DPP Renderer Backend** (`backendUrl`)
- **Fetch API**: DPP retrieval and format conversion
- **Comparison API**: Multi-DPP property extraction and comparison  
- **Search API**: DPP search with filtering and pagination

#### 2. **DPP Data Extractor** (`capabilitiesUrl`)  
- **Capabilities API**: Available search fields and filter operators
- **Configuration API**: Runtime search configuration management

### Configuration Examples

#### Docker Compose

```yaml
version: '3.8'

services:
  dpp-renderer:
    image: dpp-renderer:latest
    ports:
      - "4200:80"
    environment:
      BACKEND_URL: "https://api.example.com"
      CAPABILITIES_URL: "https://capabilities.example.com" 
      OIDC_ISSUER: "https://auth.example.com/realms/cirpass"
      OIDC_CLIENT_ID: "dpp-renderer-client"
      OIDC_HTTPS: "true"
    volumes:
      - ./env.js:/usr/share/nginx/html/assets/env.js:ro
    depends_on:
      - dpp-renderer-be
      - data-extractor

  dpp-renderer-be:
    image: ghcr.io/cirpass-2/dpp-renderer-be:latest
    ports:
      - "8085:8080"
    environment:
      QUARKUS_DATASOURCE_REACTIVE_URL: "vertx-reactive:postgresql://postgres:5432/dpp"
      QUARKUS_DATASOURCE_USERNAME: "dpp_user"
      QUARKUS_DATASOURCE_PASSWORD: "${DB_PASSWORD}"
      QUARKUS_OIDC_AUTH_SERVER_URL: "https://auth.example.com/realms/cirpass"
      QUARKUS_OIDC_CLIENT_ID: "dpp-backend"
      QUARKUS_OIDC_CREDENTIALS_SECRET: "${BACKEND_SECRET}"

  data-extractor:
    image: ghcr.io/cirpass-2/dpp-data-extractor:latest
    ports:
      - "8084:8080"
    environment:
      QUARKUS_DATASOURCE_REACTIVE_URL: "vertx-reactive:postgresql://postgres:5432/extractor" 
      QUARKUS_DATASOURCE_USERNAME: "extractor_user"
      QUARKUS_DATASOURCE_PASSWORD: "${DB_PASSWORD}"

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: dpp
      POSTGRES_USER: dpp_user
      POSTGRES_PASSWORD: "${DB_PASSWORD}"
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  postgres-data:
```

#### Kubernetes Deployment

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: dpp-renderer-config
data:
  env.js: |
    (function (window) {
      window['env'] = window['env'] || {};
      window['env']['backendUrl'] = 'https://api.cluster.local';
      window['env']['capabilitiesUrl'] = 'https://capabilities.cluster.local';
      window['env']['oidcIssuer'] = 'https://auth.cluster.local/realms/cirpass';
      window['env']['oidcClientId'] = 'dpp-renderer-k8s';
      window['env']['oidcHttps'] = 'true';
    })(this);

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: dpp-renderer
spec:
  replicas: 3
  selector:
    matchLabels:
      app: dpp-renderer
  template:
    metadata:
      labels:
        app: dpp-renderer
    spec:
      containers:
      - name: dpp-renderer
        image: dpp-renderer:latest
        ports:
        - containerPort: 80
        volumeMounts:
        - name: config
          mountPath: /usr/share/nginx/html/assets/env.js
          subPath: env.js
      volumes:
      - name: config
        configMap:
          name: dpp-renderer-config

---
apiVersion: v1  
kind: Service
metadata:
  name: dpp-renderer-service
spec:
  selector:
    app: dpp-renderer
  ports:
  - port: 80
    targetPort: 80
  type: ClusterIP
```

## Features & Components

### DPP Visualization

The core visualization engine supports multiple input formats and provides specialized rendering for CIRPASS-2 ontology entities.

#### Supported Input Formats

- **JSON**: Direct JSON structure visualization
- **JSON-LD**: Ontology-aware rendering with specialized components
- **RDF formats**: Automatic conversion to JSON-LD (RDF-XML, Turtle, N3, N-Quads, N-Triples) performed by the backend.

#### Rendering Components

**Main Controller:**
- **[DppViewerComponent](src/app/renderer/dpp-viewer/)**: URL input, QR scanning, format detection, rendering orchestration

**Format-Specific Renderers:**
- **[PlainJsonRendererComponent](src/app/renderer/json/plain-json-rendering/)**: Generic JSON structure visualization
- **[DppRendererComponent](src/app/renderer/json-ld/dpp-renderer/)**: JSON-LD orchestrator with ontology awareness

**Ontology-Specialized Renderers:** (See [JSON-LD Rendering Architecture](#json-ld-rendering-architecture))

### DPP Search

Advanced search interface with dynamic form generation based on backend capabilities.

#### Components

- **[SearchFieldComponent](src/app/search/search-field/)**: Individual search field with type-specific input controls
- **[SearchFiltersComponent](src/app/search/search-filters/)**: Filter management with logical operators
- **[SearchResultsComponent](src/app/search/search-results/)**: Paginated results with action buttons

#### Search Features

- **Dynamic field discovery**: Backend-driven search form configuration
- **Type-aware filtering**: String, decimal, integer, boolean operations 
- **Logical operators**: EQ, GT, GTE, LT, LTE, LIKE support
- **Quick actions**: Direct navigation to DPP viewer from results

#### Supported Filter Operations

| Field Type | Available Operators  | Example                   |
|------------|----------------------|---------------------------|
| STRING     | EQ, LIKE             | `'EcoPhone'`, `'%Phone%'` |
| DECIMAL    | EQ, GT, GTE, LT, LTE | `45.8`, `> 100.0`         |  
| INTEGER    | EQ, GT, GTE, LT, LTE | `2024`, `>= 2020`         |
| BOOLEAN    | EQ                   | `true`, `false`           |

### DPP Comparison

Multi-DPP comparison with property extraction and tabular visualization.

#### Components

- **[ComparerStepperComponent](src/app/comparer/comparer-stepper/)**: Step-by-step comparison wizard
- **[OntologyTreeComponent](src/app/comparer/selector/ontology-tree/)**: Property selection via ontology tree
- **[DppComparisonComponent](src/app/comparer/comparison/dpp-comparison/)**: Tabular comparison view with difference highlighting
- **[DppUrisComponent](src/app/comparer/comparison/dpp-uris/)**: DPP URL input and management

#### Comparison Features

- **Property path extraction**: Configurable JSON-LD property traversal  
- **Difference highlighting**: Visual emphasis on differing values across DPPs
- **Ontology-aware**: Leverage semantic types for intelligent property matching
- **Export capabilities**: Table data export and sharing options
- **Filter differences**: Option to show only properties with differing values

#### Property Path Syntax

```
hasProperty[*@type=CarbonFootprint].numericalValue
```

| Component                  | Description                           |
|----------------------------|---------------------------------------|
| `hasProperty`              | RDF property to navigate from root    |
| `[*@type=CarbonFootprint]` | Filter: only nodes with matching type |
| `.numericalValue`          | Target property within matched node   |

### QR Code Scanner

Mobile-optimized QR code scanning for direct DPP import.

#### Components

- **[ScannerComponent](src/app/common/scanner/)**: QR scanner with camera access and result handling

#### Scanner Features

- **Camera integration**: Access device camera for QR scanning
- **Direct navigation**: Seamless transition from scan to DPP viewer
- **Error handling**: User-friendly error messages for scan failures

## Backend API Integration

### Used Endpoints

#### DPP Renderer Backend (`backendUrl`)

**Fetch API:**
```http
GET /fetch/v1?url={dppUrl}
```
- Retrieves DPP from decentralized repository
- Returns JSON or expanded JSON-LD based on source format
- Supports all RDF serializations with on-the-fly conversion

**Search API:**
```http
POST /search/v1
Content-Type: application/json

{
  "filters": [
    { "property": "productName", "op": "LIKE", "literal": "'EcoPhone'" },
    { "property": "carbonFootprint", "op": "GT", "literal": "40.0" }
  ],
  "offset": 0,
  "limit": 20
}
```

**Comparison API:**
```http
POST /comparison/v1
Content-Type: application/json

{
  "dppUrls": ["http://dpp1.example.com", "http://dpp2.example.com"],
  "propertyPaths": {
    "productName": [
      { "namespace": "http://dpp.taltech.ee/EUDPP#", "path": "productName" }
    ],
    "carbonFootprint": [
      { "namespace": "http://dpp.taltech.ee/EUDPP#", "path": "hasProperty[*@type=CarbonFootprint].numericalValue" }
    ]
  }
}
```

#### DPP Data Extractor (`capabilitiesUrl`)

**Capabilities API:**
```http
GET /capabilities/v1
```
Returns available search fields:
```json
[
  { "fieldName": "productName", "targetType": "STRING" },  
  { "fieldName": "carbonFootprint", "targetType": "DECIMAL" },
  { "fieldName": "carbonFootprintUom", "targetType": "STRING", "dependsOn": "carbonFootprint" }
]
```

### Authentication

All backend requests include OpenID Connect Bearer tokens:

```http
Authorization: Bearer <access_token>
```

## Authentication

The application uses **OpenID Connect (OIDC)** for authentication with support for multiple identity providers.

### Configuration

OIDC configuration is managed via environment variables:

```javascript
window['env']['oidcIssuer'] = 'https://auth.example.com/realms/cirpass-2';
window['env']['oidcClientId'] = 'dpp-renderer-client';
window['env']['oidcHttps'] = 'true';
```

## License

This project is licensed under the Apache License 2.0.

```
Copyright 2024-2027 CIRPASS-2

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

## Contributing

Contributions are welcome. To contribute:

1. **Open a Pull Request** on GitHub with your changes.
2. **Include tests** for all modifications:
    - Bug fixes must include tests that verify the fix.
    - New features must include comprehensive test coverage.
    - UI changes should include component tests.
3. **Request a review** from the maintainers.
4. Ensure all existing tests pass and that the code follows the project's coding standards.
5. **Update documentation** for significant changes.

### Development Guidelines

- **Angular style guide**: Follow official Angular coding conventions
- **Component architecture**: Use standalone components with modern Angular patterns
- **Testing**: Maintain test coverage above 80% for critical paths
- **Accessibility**: Ensure WCAG 2.1 AA compliance
- **Performance**: Follow Angular performance best practices

All contributions will be reviewed before being merged.

## Support

For questions, issues, or support requests, please contact: **marco.volpini@extrared.it**

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
