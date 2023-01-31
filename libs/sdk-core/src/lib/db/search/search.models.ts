import type { ExtractedDataTypes, ResourceProperties } from '../kb';
import type { FIELD_TYPE, FieldId, IResource, RelationEntityType, RelationType } from '../resource';

export type ResourceStatus = 'PENDING' | 'PROCESSED' | 'ERROR';

export type SortOrder = 'asc' | 'desc';

export interface SortOption {
  field: 'created' | 'modified' | 'title';
  limit?: number;
  order?: SortOrder;
}

export interface SearchOptions {
  // non API-official options
  inTitleOnly?: boolean;

  // API options
  highlight?: boolean;
  faceted?: string[];
  filters?: string[];
  sort?: SortOption;
  page_number?: number;
  page_size?: number;
  max_score?: number;
  range_creation_start?: string;
  range_creation_end?: string;
  range_modification_start?: string;
  range_modification_end?: string;
  show?: ResourceProperties[];
  extracted?: ExtractedDataTypes[];
  field_type?: FIELD_TYPE[];
  shards?: string[];
  with_status?: ResourceStatus;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Search {
  export enum Features {
    PARAGRAPH = 'paragraph',
    DOCUMENT = 'document',
    RELATIONS = 'relations',
    VECTOR = 'vector',
  }

  export enum ResourceFeatures {
    PARAGRAPH = 'paragraph',
    RELATIONS = 'relations',
    VECTOR = 'vector',
  }

  export interface Results {
    error?: boolean;
    resources?: { [id: string]: IResource };
    sentences?: Sentences;
    paragraphs?: Paragraphs;
    fulltext?: Fulltext;
    relations?: Relations;
    shards?: string[];
  }

  export interface Pagination {
    total: number;
    page_number: number;
    page_size: number;
    next_page: boolean;
  }

  export interface SmartResult extends IResource {
    paragraphs?: SmartParagraph[];
    field?: FieldId;
  }

  export interface SmartParagraph extends Paragraph {
    sentences?: Sentence[];
  }

  export interface Suggestions {
    error?: boolean;
    paragraphs?: Paragraphs;
  }

  export interface Sentences extends Pagination {
    results: Sentence[];
    facets: FacetsResult;
  }

  export interface Fulltext extends Pagination {
    results: FulltextResource[];
    facets: FacetsResult;
  }

  export interface Paragraphs extends Pagination {
    results: Paragraph[];
    facets: FacetsResult;
  }

  export interface Relations {
    entities: {
      [key: string]: {
        related_to: Relation[];
      };
    };
  }

  export interface Relation {
    entity: string;
    entity_type: RelationEntityType;
    relation: RelationType;
    relation_label: string;
    direction: 'in' | 'out';
  }

  export interface FacetsResult {
    [key: string]: any;
  }

  export interface Paragraph {
    score: number;
    rid: string;
    field_type: string;
    field: string;
    text: string;
    labels: string[];
    start_seconds?: number[];
    end_seconds?: number[];
    position?: { page_number: number; start: number; end: number; index: number };
  }

  export interface Sentence {
    score: number;
    rid: string;
    field_type: string;
    field: string;
    text: string;
    position?: { page_number?: number; start: number; end: number; index: number };
  }

  export interface FulltextResource {
    score: number;
    rid: string;
    field_type: string;
    field: string;
  }
}
