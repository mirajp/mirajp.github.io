/// <reference types="vite/client" />

import manifestData from "../fixtures/manifest.json";

export interface FixtureExpectation {
  remove: string[];
  preserve: string[];
}

export interface FixtureManifestEntry {
  path: string;
  tags: string[];
  source: string;
  malformed?: boolean;
  sanitization: FixtureExpectation;
}

export interface FixtureManifest {
  version: number;
  fixtures: FixtureManifestEntry[];
}

export const fixtureManifest = manifestData as FixtureManifest;

export const fixtureModules = import.meta.glob<string>("../fixtures/**/*.svg", {
  eager: true,
  query: "?raw",
  import: "default",
});

export function fixtureModulePath(entry: FixtureManifestEntry): string {
  return `../fixtures/${entry.path}`;
}

export function getFixtureSource(entry: FixtureManifestEntry): string {
  const source = fixtureModules[fixtureModulePath(entry)];
  if (source === undefined) {
    throw new Error(`Fixture listed in manifest is missing: ${entry.path}`);
  }
  return source;
}

export function validateFixtureManifest(
  manifest: FixtureManifest,
  availablePaths: Iterable<string>,
): string[] {
  const available = new Set(availablePaths);
  const errors: string[] = [];
  const seen = new Set<string>();

  if (manifest.version !== 1) {
    errors.push(`Unsupported fixture manifest version: ${manifest.version}`);
  }

  for (const [index, entry] of manifest.fixtures.entries()) {
    const label = `fixtures[${index}]`;
    if (
      !entry.path ||
      !/^(corpus|security)\/[a-z0-9-]+\.svg$/.test(entry.path)
    ) {
      errors.push(`${label} has an invalid fixture path: ${entry.path}`);
    } else {
      if (seen.has(entry.path)) {
        errors.push(`${label} duplicates fixture path: ${entry.path}`);
      }
      seen.add(entry.path);
      if (!available.has(fixtureModulePath(entry))) {
        errors.push(`${label} points to a missing file: ${entry.path}`);
      }
    }

    if (!Array.isArray(entry.tags) || entry.tags.length === 0) {
      errors.push(`${label} must declare at least one tag`);
    }
    if (!entry.source.trim()) {
      errors.push(`${label} must describe its source`);
    }
    if (
      typeof entry.malformed !== "undefined" &&
      typeof entry.malformed !== "boolean"
    ) {
      errors.push(`${label} malformed must be a boolean when specified`);
    }
    if (
      !entry.sanitization ||
      !Array.isArray(entry.sanitization.remove) ||
      !Array.isArray(entry.sanitization.preserve)
    ) {
      errors.push(
        `${label} must declare sanitization remove and preserve expectations`,
      );
    }
  }

  return errors;
}
