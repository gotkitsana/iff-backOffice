// src/types/query.ts
export interface ProductQueryParams {
  category?: 'fish' | 'food' | 'microorganism'
  saleType?: SaleFoodType
  status?: 'available' | 'sold' | 'all'
  sku?: string
  brand?: string
  lotNumber?: string
  priceMin?: number
  priceMax?: number
  page?: number
  limit?: number
}

export type SaleFoodType = 'wholesale' | 'retail' | null
