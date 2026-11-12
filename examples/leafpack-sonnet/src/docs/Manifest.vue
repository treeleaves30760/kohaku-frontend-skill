<script setup>
import Callout from "../components/Callout.vue"
</script>

<template>
  <div class="kt-prose">
    <p>The manifest is a JSON file named <code>leaf.plugin.json</code> at the root of the package.</p>

    <h2 id="fields">Fields</h2>
    <table>
      <thead><tr><th>Field</th><th>Type</th><th>Required</th><th>Notes</th></tr></thead>
      <tbody>
        <tr><td><code>name</code></td><td>string</td><td>yes</td><td>Scoped: <code>@publisher/name</code></td></tr>
        <tr><td><code>version</code></td><td>semver</td><td>yes</td><td>Must be higher than the last release</td></tr>
        <tr><td><code>category</code></td><td>string</td><td>yes</td><td>tools, memory, models, channels, observability or safety</td></tr>
        <tr><td><code>license</code></td><td>SPDX id</td><td>yes</td><td>Shown on the listing</td></tr>
        <tr><td><code>main</code></td><td>path</td><td>yes</td><td>Entry file, relative to the package root</td></tr>
        <tr><td><code>permissions</code></td><td>string[]</td><td>no</td><td>Defaults to none</td></tr>
        <tr><td><code>hosts</code></td><td>string[]</td><td>with <code>net.fetch</code></td><td>Wildcards allowed at the start: <code>*.example.com</code></td></tr>
      </tbody>
    </table>

    <h2 id="permissions">Permissions</h2>
    <table>
      <thead><tr><th>Id</th><th>Grants</th></tr></thead>
      <tbody>
        <tr><td><code>net.fetch</code></td><td>Outbound HTTPS to the declared hosts</td></tr>
        <tr><td><code>fs.read</code> / <code>fs.write</code></td><td>Files inside the agent workspace</td></tr>
        <tr><td><code>shell.exec</code></td><td>Start processes on the host</td></tr>
        <tr><td><code>memory.rw</code></td><td>Read and write the agent memory store</td></tr>
        <tr><td><code>secrets.read</code></td><td>Read tokens from the agent keychain</td></tr>
        <tr><td><code>events.emit</code></td><td>Write trace and usage events</td></tr>
      </tbody>
    </table>
    <Callout type="note" title="Listing shows what the manifest says">
      Leafpack builds the Permissions tab straight from this file. If the manifest and the code disagree, the code loses: undeclared access is blocked.
    </Callout>
  </div>
</template>
