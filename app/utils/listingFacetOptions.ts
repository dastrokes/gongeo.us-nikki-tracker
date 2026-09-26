import type { TreeSelectOption } from 'naive-ui'
import { h } from 'vue'

export const listingFacetOptionClass = (available: boolean) =>
  available ? undefined : 'opacity-45'

export const decorateListingFacetOptions = <
  T extends { value?: string | number; class?: string },
>(
  options: readonly T[],
  isAvailable: (value: string) => boolean
): T[] =>
  options
    .map((option) => ({
      ...option,
      class: listingFacetOptionClass(isAvailable(String(option.value ?? ''))),
    }))
    .sort(
      (left, right) =>
        Number(left.class === 'opacity-45') -
        Number(right.class === 'opacity-45')
    )

export const decorateListingSourceTreeOptions = (
  options: readonly TreeSelectOption[],
  availableSources: ReadonlySet<string> | null,
  availableDetails: ReadonlySet<string> | null
): TreeSelectOption[] =>
  options
    .map((option) => {
      const value = String(option.value ?? '')
      const available = !availableSources || availableSources.has(value)
      const children = option.children
        ?.map((child) => ({
          ...child,
          unavailable:
            !!availableDetails &&
            !availableDetails.has(String(child.value ?? '')),
        }))
        .sort(
          (left, right) =>
            Number(!!left.unavailable) - Number(!!right.unavailable)
        )

      return { ...option, children, unavailable: !available }
    })
    .sort(
      (left, right) => Number(!!left.unavailable) - Number(!!right.unavailable)
    )

export const renderListingSourceTreeLabel = ({
  option,
}: {
  option: TreeSelectOption
}) =>
  h(
    'span',
    { class: option.unavailable ? 'opacity-45' : undefined },
    String(option.label ?? '')
  )
