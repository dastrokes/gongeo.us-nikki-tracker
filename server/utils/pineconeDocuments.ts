type PineconeDocument = Record<string, unknown> & {
  _id?: string | number
  _score?: number
}

type PineconeScoreBy =
  | { type: 'text'; field: string; query: string }
  | { type: 'dense_vector'; field: string; values: number[] }

const DOCUMENT_API_VERSION = '2026-01.alpha'
const INFERENCE_API_VERSION = '2026-04'
const EMBED_MODEL = 'multilingual-e5-large'
const TRANSIENT_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504])
const MAX_RETRIES = 2
const RETRY_BASE_DELAY_MS = 150
const RRF_RANK_CONSTANT = 60
const RRF_LEXICAL_WEIGHT = 2
const RRF_DENSE_WEIGHT = 1

export const resolvePineconeBaseUrl = (host: string) => {
  const normalized = host.trim().replace(/\/$/, '')
  return /^https?:\/\//i.test(normalized) ? normalized : `https://${normalized}`
}

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

const requestPinecone = async (
  url: string,
  init: RequestInit,
  context: string
) => {
  let attempt = 0

  while (true) {
    let response: Response
    try {
      response = await fetch(url, init)
    } catch (error: unknown) {
      if (attempt >= MAX_RETRIES) throw error
      await sleep(RETRY_BASE_DELAY_MS * Math.pow(2, attempt))
      attempt += 1
      continue
    }

    if (response.ok) return response

    if (attempt < MAX_RETRIES && TRANSIENT_STATUS_CODES.has(response.status)) {
      await sleep(RETRY_BASE_DELAY_MS * Math.pow(2, attempt))
      attempt += 1
      continue
    }

    const message = await response.text().catch(() => '')
    throw new Error(
      `${context} failed with ${response.status} ${response.statusText}${message ? `: ${message}` : ''}`
    )
  }
}

export const embedPineconeTexts = async ({
  apiKey,
  texts,
  inputType,
}: {
  apiKey: string
  texts: string[]
  inputType: 'passage' | 'query'
}) => {
  const response = await requestPinecone(
    'https://api.pinecone.io/embed',
    {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json',
        'X-Pinecone-Api-Version': INFERENCE_API_VERSION,
      },
      body: JSON.stringify({
        model: EMBED_MODEL,
        parameters: { input_type: inputType, truncate: 'END' },
        inputs: texts.map((text) => ({ text })),
      }),
    },
    'Pinecone embedding'
  )
  const payload = (await response.json()) as {
    data?: Array<{ values?: unknown }>
  }
  const vectors = Array.isArray(payload.data)
    ? payload.data.map((entry) => entry.values)
    : []

  if (
    vectors.length !== texts.length ||
    vectors.some(
      (values) =>
        !Array.isArray(values) ||
        values.some((value) => typeof value !== 'number')
    )
  ) {
    throw new Error(
      `Pinecone returned ${vectors.length} embeddings for ${texts.length} inputs`
    )
  }

  return vectors as number[][]
}

export const searchPineconeDocuments = async ({
  apiKey,
  host,
  namespace,
  scoreBy,
  topK,
  filter,
  includeFields,
}: {
  apiKey: string
  host: string
  namespace: string
  scoreBy: PineconeScoreBy
  topK: number
  filter?: unknown
  includeFields: string[]
}) => {
  const response = await requestPinecone(
    `${resolvePineconeBaseUrl(host)}/namespaces/${encodeURIComponent(namespace)}/documents/search`,
    {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json',
        'X-Pinecone-Api-Version': DOCUMENT_API_VERSION,
      },
      body: JSON.stringify({
        score_by: [scoreBy],
        top_k: topK,
        include_fields: includeFields,
        ...(filter ? { filter } : {}),
      }),
    },
    `Pinecone document search namespace ${namespace}`
  )
  const payload = (await response.json()) as { matches?: PineconeDocument[] }
  return Array.isArray(payload.matches) ? payload.matches : []
}

export const fetchPineconeDocumentEmbedding = async ({
  apiKey,
  host,
  namespace,
  id,
}: {
  apiKey: string
  host: string
  namespace: string
  id: string
}) => {
  const response = await requestPinecone(
    `${resolvePineconeBaseUrl(host)}/namespaces/${encodeURIComponent(namespace)}/documents/fetch`,
    {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json',
        'X-Pinecone-Api-Version': DOCUMENT_API_VERSION,
      },
      body: JSON.stringify({ ids: [id], include_fields: ['embedding'] }),
    },
    `Pinecone document fetch namespace ${namespace} id ${id}`
  )
  const payload = (await response.json()) as {
    documents?: Record<string, { embedding?: unknown }>
  }
  const embedding = payload.documents?.[id]?.embedding
  return Array.isArray(embedding) &&
    embedding.every((value) => typeof value === 'number')
    ? embedding
    : null
}

export const upsertPineconeDocuments = async ({
  apiKey,
  host,
  namespace,
  documents,
}: {
  apiKey: string
  host: string
  namespace: string
  documents: PineconeDocument[]
}) => {
  await requestPinecone(
    `${resolvePineconeBaseUrl(host)}/namespaces/${encodeURIComponent(namespace)}/documents/upsert`,
    {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json',
        'X-Pinecone-Api-Version': DOCUMENT_API_VERSION,
      },
      body: JSON.stringify({ documents }),
    },
    `Pinecone document upsert namespace ${namespace}`
  )
}

export const fusePineconeDocumentMatches = ({
  lexicalMatches,
  denseMatches,
  limit,
}: {
  lexicalMatches: PineconeDocument[]
  denseMatches: PineconeDocument[]
  limit: number
}) => {
  const matchesById = new Map<
    string,
    { match: PineconeDocument; score: number }
  >()

  const addMatches = (matches: PineconeDocument[], weight: number) => {
    matches.forEach((match, index) => {
      const id = String(match._id ?? '')
      if (!id) return

      const current = matchesById.get(id) ?? { match, score: 0 }
      current.score += weight / (RRF_RANK_CONSTANT + index + 1)
      matchesById.set(id, current)
    })
  }

  addMatches(lexicalMatches, RRF_LEXICAL_WEIGHT)
  addMatches(denseMatches, RRF_DENSE_WEIGHT)

  return Array.from(matchesById.values())
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ match, score }) => ({ ...match, _score: score }))
}
