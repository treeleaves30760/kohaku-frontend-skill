// Fake registry client. Every call is async with real latency so the loading
// states are real; `fail` and `delay` come from the URL (?fail=1, ?delay=5000)
// so error and loading states can be linked and screenshotted.
import { plugins } from "../data/plugins.js"

const sleep = (ms, signal) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms)
    signal?.addEventListener("abort", () => {
      clearTimeout(t)
      reject(new DOMException("Aborted", "AbortError"))
    })
  })

const clone = (x) => JSON.parse(JSON.stringify(x))

async function request(path, { fail, delay, signal } = {}) {
  await sleep(delay ?? 450 + Math.random() * 350, signal)
  if (fail) throw new Error(`GET ${path} → 503 Service Unavailable (registry.leafpack.dev is in maintenance)`)
}

export async function listPlugins(opts) {
  await request("/v1/plugins", opts)
  return clone(plugins)
}

export async function getPlugin(id, opts) {
  await request(`/v1/plugins/${id}`, opts)
  const p = plugins.find((x) => x.id === id)
  return p ? clone(p) : null
}

/** Read the simulation params from a route query. */
export const simOpts = (query) => ({
  fail: query.fail === "1",
  delay: query.delay != null ? Number(query.delay) : undefined,
})
