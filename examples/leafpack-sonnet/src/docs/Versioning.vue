<script setup>
import CodeBlock from "../components/CodeBlock.vue"
import Callout from "../components/Callout.vue"
const yank = `leaf plugin yank @you/web-notes@0.2.0 --reason "Crashes on empty notes"`
const deprecate = `leaf plugin deprecate @you/web-notes --message "Use @you/notes-sync instead"`
</script>

<template>
  <div class="kt-prose">
    <p>Plugins follow semantic versioning. Leaf only upgrades a plugin automatically within the same major version.</p>

    <h2 id="choosing-a-version">Choosing a version number</h2>
    <table>
      <thead><tr><th>Change</th><th>Bump</th><th>Example</th></tr></thead>
      <tbody>
        <tr><td>Bug fix, no new permissions</td><td>patch</td><td><code>1.2.3</code> to <code>1.2.4</code></td></tr>
        <tr><td>New option or tool</td><td>minor</td><td><code>1.2.4</code> to <code>1.3.0</code></td></tr>
        <tr><td>Removed option, or any new permission</td><td>major</td><td><code>1.3.0</code> to <code>2.0.0</code></td></tr>
      </tbody>
    </table>
    <Callout type="danger" title="A new permission is always a major release">
      Leaf will not apply an upgrade that asks for more access than the installed version. People stay on the old version and see an "update needs approval" notice.
    </Callout>

    <h2 id="yanking-a-release">Yanking a release</h2>
    <p>Yanking hides a version from new installs but leaves existing ones working. Use it for releases that crash or leak data.</p>
    <CodeBlock :code="yank" lang="bash" />

    <h2 id="deprecating-a-plugin">Deprecating a plugin</h2>
    <p>Deprecation puts a notice on the listing and in the install prompt. Say what to use instead.</p>
    <CodeBlock :code="deprecate" lang="bash" />
    <Callout type="note" title="Deprecated is not deleted">
      Published versions stay available so that old agents keep building. A deprecated plugin drops out of featured lists and search ranking.
    </Callout>
  </div>
</template>
