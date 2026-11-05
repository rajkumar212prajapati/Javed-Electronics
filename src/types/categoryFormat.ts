import { ProductCategory } from './index';

export type CategoryFormatFieldType = 'text' | 'number' | 'select' | 'textarea';

export type CategoryFormatFieldGroup = 'identity' | 'technical' | 'compliance' | 'other';

export interface CategoryFormatField {
  id: string;
  key: string;
  label: string;
  type: CategoryFormatFieldType;
  required: boolean;
  placeholder?: string;
  sampleValue?: string;
  options?: string[]; // Used when type === 'select'
  unit?: string; // e.g. 'Inch', 'Watt', 'Volt', 'Months'
  group: CategoryFormatFieldGroup;
}

export interface CategoryListingFormat {
  id: string;
  categoryId: ProductCategory;
  categoryName: string;
  subCategoryId?: string;
  subCategoryName?: string;
  formatTitle: string;
  description: string;
  defaultHsnCode: string;
  defaultGstRate: number;
  fields: CategoryFormatField[];
  isActive: boolean;
  updatedAt: string;
  updatedBy: string;
}

