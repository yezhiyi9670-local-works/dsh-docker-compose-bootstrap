#!/usr/bin/env node
/**
 * Fail-closed build-time patch for the shipped Web client bundle.
 *
 * `dsh-client-ui-settings` picks the settings persistence mode from the
 * browser's own page authority:
 *
 *   const persistence = ctx.remote.$host.isLoopback ? "host" : "memory";
 *
 * A client that reaches the Host through a declared trusted authority (LAN IP,
 * reverse proxy, tunnel) is classified non-loopback, which leaves the settings
 * mirror terminally unavailable and every settings surface inert
 * ("settings are unavailable in this browser"). This script rewrites exactly
 * that expression to the unconditional Host mode, so the served bundle works
 * for every authenticated browser without any client-side setup.
 *
 * Strictness: the target path must be the expected package and version, the
 * expression and its call-site anchor must each occur exactly once, and the
 * rewrite is verified before anything is written. Any deviation aborts the
 * image build instead of guessing.
 *
 * Usage:
 *   node patch-settings-persistence.mjs <path/to/dsh-client-ui-settings/lib/client.js>
 *
 * Env:
 *   DSH_SETTINGS_CLIENT_VERSION  optional exact package version to require.
 */

import { readFileSync, writeFileSync, renameSync, statSync, realpathSync } from 'node:fs'
import { dirname, join } from 'node:path'

const expectedName = '@deepseek-ai/dsh-client-ui-settings'
const expectedSuffix = '/@deepseek-ai/dsh-client-ui-settings/lib/client.js'
const expectedVersion = process.env.DSH_SETTINGS_CLIENT_VERSION ?? ''
const oldText = 'const persistence = ctx.remote.$host.isLoopback ? "host" : "memory";'
const newText = 'const persistence = "host";'
const anchor = 'new SettingsDescribeMirror(ctx, persistence);'

/** Print one reason and abort the build. */
function fail(message) {
  console.error(`patch-settings-persistence: ${message}`)
  process.exit(1)
}

const targetArg = process.argv[2]
if (targetArg === undefined || targetArg === '') {
  fail('usage: node patch-settings-persistence.mjs <path/to/dsh-client-ui-settings/lib/client.js>')
}

let target
try {
  target = realpathSync(targetArg)
} catch (error) {
  fail(`cannot resolve ${targetArg}: ${error.message}`)
}
if (!target.endsWith(expectedSuffix)) {
  fail(`refusing to patch unexpected path ${target}`)
}
if (!statSync(target).isFile()) {
  fail(`${target} is not a regular file`)
}

let manifest
try {
  manifest = JSON.parse(readFileSync(join(dirname(target), '..', 'package.json'), 'utf8'))
} catch (error) {
  fail(`cannot read the package manifest beside ${target}: ${error.message}`)
}
if (manifest.name !== expectedName) {
  fail(`unexpected package ${JSON.stringify(manifest.name)} (expected ${JSON.stringify(expectedName)})`)
}
if (expectedVersion !== '' && manifest.version !== expectedVersion) {
  fail(`unexpected package version ${JSON.stringify(manifest.version)} (expected ${JSON.stringify(expectedVersion)})`)
}

const source = readFileSync(target, 'utf8')
const count = (haystack, needle) => haystack.split(needle).length - 1
const occurrences = count(source, oldText)
if (occurrences !== 1) {
  fail(`expected exactly one persistence expression in ${target}, found ${occurrences}`)
}
if (count(source, anchor) !== 1) {
  fail(`expected exactly one SettingsDescribeMirror call site in ${target}`)
}

const patched = source.replace(oldText, newText)
if (count(patched, oldText) !== 0 || count(patched, newText) !== 1 || count(patched, anchor) !== 1) {
  fail('rewrite verification failed')
}
if (patched.length === source.length) {
  fail('rewrite did not change the artifact length; the served revision would not move')
}

const temporary = `${target}.patch.tmp`
writeFileSync(temporary, patched)
renameSync(temporary, target)
console.error(`patch-settings-persistence: patched ${target}`)
