// Temporary diagnostic: no imports, so a missing log means the platform never invoked it.
export default async (request: Request) => {
  console.log('schedule-probe invoked', await request.text())
  return new Response(null, { status: 204 })
}
