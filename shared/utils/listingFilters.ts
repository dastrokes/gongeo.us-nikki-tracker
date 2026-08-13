export const LISTING_MISSING_FILTER_VALUE = '__missing__'

// Diagnostic UI switch. Matching remains available for direct __missing__ URLs.
export const SHOW_LISTING_MISSING_FILTER_OPTIONS = false

export const isListingMissingFilterValue = (value: unknown) =>
  value === LISTING_MISSING_FILTER_VALUE

export const isListingFieldMissing = (value: unknown) =>
  value === null ||
  value === undefined ||
  (typeof value === 'string' && value.trim().length === 0) ||
  (Array.isArray(value) && value.length === 0)
