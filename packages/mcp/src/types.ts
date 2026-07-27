import { HttpMethod } from '@tswagger/types';

export type GeneratableHttpMethod = Extract<HttpMethod, 'get' | 'put' | 'post' | 'delete'>;

export type CommonDocumentInput = {
  input: string;
  cwd?: string;
};

export type OperationFilterInput = CommonDocumentInput & {
  tags?: string[];
  paths?: string[];
  methods?: HttpMethod[];
};

export type OperationSearchInput = CommonDocumentInput & {
  query: string;
  limit?: number;
};

export type OperationDetailInput = CommonDocumentInput & {
  path: string;
  method: HttpMethod;
};

export type GenerateMode = 'types' | 'services' | 'all';

export type GeneratePreviewInput = OperationFilterInput & {
  methods?: GeneratableHttpMethod[];
  mode?: GenerateMode;
  translate?: boolean;
  cacheDir?: string;
};

export type GenerateInput = GeneratePreviewInput & {
  output: string;
  overwrite?: boolean;
};

export type OperationSummary = {
  tag: string;
  method: HttpMethod;
  path: string;
  operationId?: string;
  summary?: string;
  description?: string;
  hasParameters: boolean;
  hasResponseSchema: boolean;
};

export type ToolSuccess<T> = {
  text: string;
  data: T;
};
