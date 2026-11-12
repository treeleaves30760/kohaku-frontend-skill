<script setup>
import CodeBlock from "../components/CodeBlock.vue"
import Callout from "../components/Callout.vue"

const init = `mkdir my-plugin && cd my-plugin
leaf plugin init
# creates leaf.plugin.json, src/index.js and a test`
const manifest = `{
  "name": "@you/web-notes",
  "version": "0.1.0",
  "category": "tools",
  "license": "MIT",
  "main": "src/index.js",
  "permissions": ["net.fetch", "memory.rw"],
  "hosts": ["api.notes.example"]
}`
const entry = `// src/index.js
export default function webNotes(ctx, options = {}) {
  ctx.tool("save_note", async ({ text }) => {
    const res = await ctx.fetch("https://api.notes.example/v1/notes", {
      method: "POST",
      body: JSON.stringify({ text, tag: options.tag ?? "agent" }),
    })
    return res.json()
  })
}`
const publish = `leaf plugin test
leaf plugin login
leaf plugin publish --dry-run
leaf plugin publish`
</script>

<template>
  <div class="kt-prose">
    <p>
      A Leafpack listing is a folder with a manifest, an entry file and a version number. This guide takes you from an empty
      directory to a published plugin that anyone can install with <code>leaf plugin add</code>.
    </p>

    <h2 id="before-you-start">Before you start</h2>
    <p>You need Leaf 0.14 or later, Node 20 or later and a Leafpack account. Publisher names are claimed on first publish and cannot be transferred.</p>

    <h2 id="create-the-package">Create the package</h2>
    <p>Run the generator in a new folder. It writes a manifest, an entry file and one test.</p>
    <CodeBlock :code="init" lang="bash" />

    <h3 id="write-the-manifest">Write the manifest</h3>
    <p>The manifest tells Leaf what the plugin is and what it may do. Every permission you list is shown to people before they install, so ask only for what you use.</p>
    <CodeBlock :code="manifest" lang="json" />
    <Callout type="warn" title="Undeclared access is blocked at runtime">
      If your code calls <code>ctx.fetch</code> for a host that is not in <code>hosts</code>, Leaf throws <code>PermissionError</code> and the run
      shows the blocked URL. Add the host to the manifest and publish a new version.
    </Callout>

    <h3 id="write-the-entry-file">Write the entry file</h3>
    <p>The entry file exports a function. Leaf calls it once per agent with a context object and the options the user passed to <code>agent.use</code>.</p>
    <CodeBlock :code="entry" lang="js" />

    <h2 id="check-the-limits">Check the limits</h2>
    <p>Leafpack rejects a release that goes over any of these. They apply to every plugin, verified or not.</p>
    <table>
      <thead><tr><th>Item</th><th>Limit</th><th>If you exceed it</th></tr></thead>
      <tbody>
        <tr><td>Package size (gzipped)</td><td>5 MB</td><td>Publish fails with <code>E_SIZE</code></td></tr>
        <tr><td>Name</td><td>3 to 40 characters, <code>a-z 0-9 -</code></td><td>Publish fails with <code>E_NAME</code></td></tr>
        <tr><td>Declared hosts</td><td>20</td><td>Move rarely used hosts into options</td></tr>
        <tr><td>Releases per day</td><td>10</td><td>Wait until the next UTC day</td></tr>
      </tbody>
    </table>

    <h2 id="test-and-publish">Test and publish</h2>
    <p>Run the tests, sign in, then do a dry run. The dry run prints the file list and the permissions exactly as people will see them.</p>
    <CodeBlock :code="publish" lang="bash" />
    <Callout type="tip" title="Dry runs are free">
      A dry run does not use up a release and does not reserve the version number. Run it as often as you like.
    </Callout>

    <h2 id="after-you-publish">After you publish</h2>
    <p>
      The listing appears within a minute. To get the verified badge, confirm your publisher identity in account settings; a reviewer then checks the
      manifest permissions against your code. Next, read <RouterLink to="/docs/versioning">Versions and deprecation</RouterLink> before shipping your second release.
    </p>
  </div>
</template>
