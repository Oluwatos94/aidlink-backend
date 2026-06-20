# API Reference

Base URL: `/api/v1`

All endpoints require authentication unless stated otherwise.

## Search (`/api/v1/search`)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/campaigns` | Search campaigns with filtering, pagination and sorting |
| GET | `/donations` | Search donations with filtering, pagination and sorting |
| GET | `/beneficiaries` | Search beneficiaries with filtering, pagination, sorting and facets |
| GET | `/global` | Global search across all entities |
| GET | `/advanced` | Advanced search with entity-type filtering |

### `GET /search/beneficiaries`

**Access:** Private — `ADMIN` and `VERIFIER` roles only (returns beneficiary PII).
Other authenticated roles receive `403 Insufficient permissions`.

Search beneficiaries with advanced filtering, pagination, sorting, and faceted
aggregation. Results, the total count, and all facet aggregates are computed in a
single database transaction so the facets always reflect a consistent snapshot.

Facets use **drill-down semantics**: each facet is counted with its *own* active
filter removed, so the UI can show alternative values to pivot to (e.g. after
filtering `country=KE`, the `countries` facet still lists other countries). As a
result, a facet's counts sum to the total only when that dimension is unfiltered.

#### Query parameters

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| `q` | string | – | Free-text match on first name, last name, ID document number, phone number, and needs assessment |
| `country` | string | – | Filter by country |
| `city` | string | – | Filter by city |
| `needsCategory` | string | – | Filter by needs category |
| `verificationStatus` | enum | – | One of `PENDING`, `VERIFIED`, `REJECTED`, `SUSPENDED`, `ACTIVE` |
| `riskScoreMin` | int | – | Minimum risk score (inclusive) |
| `riskScoreMax` | int | – | Maximum risk score (inclusive) |
| `ageMin` | int | – | Minimum age in years (derived from date of birth) |
| `ageMax` | int | – | Maximum age in years (derived from date of birth) |
| `familySizeMin` | int | – | Minimum family size (inclusive) |
| `familySizeMax` | int | – | Maximum family size (inclusive) |
| `page` | int | `1` | Page number (min `1`) |
| `limit` | int | `20` | Page size (min `1`, max `100`) |
| `sortBy` | enum | `createdAt` | One of `relevance`, `createdAt`, `updatedAt`, `riskScore`, `age`, `familySize` |
| `sortOrder` | enum | `desc` | `asc` or `desc` |

Notes:
- `age` sorting is applied against `dateOfBirth` and inverted internally so that
  `sortOrder=desc` returns the oldest beneficiaries first.
- `relevance` currently falls back to recency (`createdAt`); there is no
  full-text relevance score yet.
- Range parameters are validated such that the `*Min` value must be less than or
  equal to the matching `*Max` value.

#### Response

```json
{
  "success": true,
  "data": [ /* Beneficiary[] */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  },
  "facets": {
    "countries": [{ "value": "KE", "count": 5 }],
    "cities": [{ "value": "Nairobi", "count": 3 }],
    "needsCategories": [{ "value": "FOOD", "count": 2 }],
    "verificationStatuses": [{ "value": "VERIFIED", "count": 4 }],
    "riskScoreRanges": [
      { "range": "0-25", "count": 0 },
      { "range": "26-50", "count": 0 },
      { "range": "51-75", "count": 0 },
      { "range": "76+", "count": 0 }
    ],
    "ageRanges": [
      { "range": "0-17", "count": 0 },
      { "range": "18-25", "count": 0 },
      { "range": "26-35", "count": 0 },
      { "range": "36-50", "count": 0 },
      { "range": "51-65", "count": 0 },
      { "range": "66+", "count": 0 }
    ],
    "familySizeRanges": [
      { "range": "1", "count": 0 },
      { "range": "2-3", "count": 0 },
      { "range": "4-5", "count": 0 },
      { "range": "6+", "count": 0 }
    ]
  }
}
```

#### Example

```
GET /api/v1/search/beneficiaries?country=KE&needsCategory=FOOD&ageMin=18&ageMax=40&riskScoreMin=50&sortBy=riskScore&sortOrder=desc&page=1&limit=20
```

#### Errors

| Status | Condition |
| --- | --- |
| `400` | Invalid search parameters (e.g. `ageMin` greater than `ageMax`, out-of-range values) |
| `401` | Missing or invalid authentication |
| `403` | Authenticated but not an `ADMIN`/`VERIFIER` |
| `429` | Rate limit exceeded |

#### Indexing / migration note

Beneficiary search relies on database indexes declared in `prisma/schema.prisma`:

- B-tree indexes on `country`, `city`, `riskScore`, `familySize`, `dateOfBirth`,
  `needsCategory`, plus composite `[country, city]` and `[status, country]`.
- GIN **trigram** indexes (`gin_trgm_ops`) on `firstName`, `lastName`,
  `idDocumentNumber`, `phoneNumber` so the `q` free-text search (`ILIKE '%term%'`)
  is index-backed instead of doing a sequential scan. These require the
  PostgreSQL `pg_trgm` extension, declared via the `postgresqlExtensions` preview
  feature.

Apply with a migration before deploying:

```bash
npx prisma migrate dev --name beneficiary_search_indexes
# (the generated migration includes CREATE EXTENSION IF NOT EXISTS pg_trgm)
```
