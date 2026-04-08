<template>
  <div class="space-y-8">
    <section>
      <n-tree
        block-line
        expand-on-click
        :data="referenceTree"
      />
    </section>

    <section>
      <n-tree
        block-line
        expand-on-click
        :data="sharedTermsTree"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
  import type { ItemSearchField } from '#shared/types/itemSearch'
  import type { TreeOption } from 'naive-ui'
  import { getItemTagFeedbackFields } from '#shared/utils/feedback'
  import {
    getItemSearchAttributeValues,
    getItemSearchFieldLabelKey,
    getItemSearchTaxonomyItemTypes,
    getItemSearchTaxonomyTree,
    humanizeItemSearchToken,
    normalizeItemSearchItemType,
  } from '#shared/utils/itemSearch'

  const { t, te } = useI18n()
  const { translateFilterToken } = useFilterToken()

  const preferredItemTypeOrder = [
    'hair',
    'dresses',
    'outerwear',
    'tops',
    'bottoms',
    'socks',
    'shoes',
    'hairAccessories',
    'headwear',
    'earrings',
    'neckwear',
    'bracelets',
    'rings',
    'gloves',
    'chokers',
    'chestAccessories',
    'pendants',
    'backpieces',
    'armDecorations',
    'handhelds',
    'faceDecorations',
    'bodyPaint',
    'baseMakeup',
    'eyebrows',
    'eyelashes',
    'contactLenses',
    'lips',
    'fullMakeup',
    'skinTones',
  ] as const

  const sharedDetailFields = [
    'pattern',
    'material',
    'structure',
    'ornament',
  ] as const satisfies readonly ItemSearchField[]

  const preferredItemTypeOrderMap = new Map(
    preferredItemTypeOrder.map((itemType, index) => [itemType, index])
  )

  const getItemTypeLabel = (itemType: string) => {
    const normalizedType = normalizeItemSearchItemType(itemType)
    const key = `type.${normalizedType}`
    const translated = t(key)
    return translated !== key
      ? translated
      : humanizeItemSearchToken(normalizedType)
  }

  const buildFieldLabel = (field: string) =>
    t(getItemSearchFieldLabelKey(field))
  const buildTaxonomyFieldLabel = () =>
    `${buildFieldLabel('category')} / ${buildFieldLabel('subcategory')}`

  const withCount = (label: string, count: number) => `${label} (${count})`

  const buildValueLabel = (
    field: ItemSearchField,
    value: string,
    itemType?: string | null
  ) => {
    const translatedValue = translateFilterToken(field, value, itemType)
    const noteKey = `feedback.guidelines.term_notes.${field}.${value}`
    return te(noteKey) ? `${translatedValue}: ${t(noteKey)}` : translatedValue
  }

  const orderedGuideItemTypes = computed(() =>
    [...getItemSearchTaxonomyItemTypes()].sort((left, right) => {
      const leftRank =
        preferredItemTypeOrderMap.get(normalizeItemSearchItemType(left)) ??
        Number.MAX_SAFE_INTEGER
      const rightRank =
        preferredItemTypeOrderMap.get(normalizeItemSearchItemType(right)) ??
        Number.MAX_SAFE_INTEGER

      if (leftRank !== rightRank) {
        return leftRank - rightRank
      }

      return getItemTypeLabel(left).localeCompare(
        getItemTypeLabel(right),
        undefined,
        {
          sensitivity: 'base',
        }
      )
    })
  )

  const buildTaxonomyFieldNode = (itemType: string): TreeOption | null => {
    const taxonomy = getItemSearchTaxonomyTree(itemType)
    const categoryNodes: TreeOption[] = taxonomy.categories.map(
      (categoryNode) => ({
        key: `${itemType}:${categoryNode.category}`,
        label: withCount(
          translateFilterToken('category', categoryNode.category, itemType),
          categoryNode.subcategories.length
        ),
        children: categoryNode.subcategories.map((subcategory) => ({
          key: `${itemType}:${categoryNode.category}:${subcategory}`,
          label: translateFilterToken('subcategory', subcategory, itemType),
        })),
      })
    )

    if (taxonomy.ungroupedSubcategories.length > 0) {
      categoryNodes.push({
        key: `${itemType}:other-subcategories`,
        label: withCount(
          t('feedback.guidelines.other_subcategories'),
          taxonomy.ungroupedSubcategories.length
        ),
        children: taxonomy.ungroupedSubcategories.map((subcategory) => ({
          key: `${itemType}:other-subcategories:${subcategory}`,
          label: translateFilterToken('subcategory', subcategory, itemType),
        })),
      })
    }

    if (categoryNodes.length === 0) {
      return null
    }

    return {
      key: `${itemType}:taxonomy`,
      label: buildTaxonomyFieldLabel(),
      children: categoryNodes,
    }
  }

  const buildFieldNode = (
    itemType: string,
    field: ItemSearchField
  ): TreeOption => {
    const values = getItemSearchAttributeValues(field, itemType)

    if (values.length === 0) {
      return {
        key: `${itemType}:${field}`,
        label: withCount(buildFieldLabel(field), 0),
      }
    }

    return {
      key: `${itemType}:${field}`,
      label: withCount(buildFieldLabel(field), values.length),
      children: values.map((value) => ({
        key: `${itemType}:${field}:${value}`,
        label: buildValueLabel(field, value, itemType),
      })),
    }
  }

  const referenceTree = computed<TreeOption[]>(() =>
    orderedGuideItemTypes.value
      .map((itemType) => {
        const taxonomyNode = buildTaxonomyFieldNode(itemType)
        const fieldNodes = getItemTagFeedbackFields(itemType)
          .filter(
            (field): field is ItemSearchField =>
              field !== 'category' &&
              field !== 'subcategory' &&
              !sharedDetailFields.includes(field)
          )
          .map((field) => buildFieldNode(itemType, field))

        const children = taxonomyNode
          ? [taxonomyNode, ...fieldNodes]
          : fieldNodes

        if (children.length === 0) {
          return null
        }

        return {
          key: itemType,
          label: getItemTypeLabel(itemType),
          children,
        }
      })
      .filter((node): node is TreeOption => Boolean(node))
  )

  const sharedTermsTree = computed<TreeOption[]>(() =>
    sharedDetailFields.map((field) => {
      const values = getItemSearchAttributeValues(field)

      if (values.length === 0) {
        return {
          key: `shared:${field}`,
          label: withCount(buildFieldLabel(field), 0),
        }
      }

      return {
        key: `shared:${field}`,
        label: withCount(buildFieldLabel(field), values.length),
        children: values.map((value) => ({
          key: `shared:${field}:${value}`,
          label: buildValueLabel(field, value),
        })),
      }
    })
  )
</script>
