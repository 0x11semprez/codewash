import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const read = (file) => readFileSync(join(import.meta.dirname, '..', file), 'utf8')

const staticImports = (source) =>
  [...source.matchAll(/^import\s.+?from\s+['"](.+?)['"]/gm)].map((match) => match[1])

describe('performance regression guard', () => {
  it('keeps drawers and modals out of the startup import graph of App', () => {
    const imports = staticImports(read('App.jsx'))
    const deferred = ['SettingsDrawer', 'CosmeticsDrawer', 'MenuDrawer', 'ResetModal', 'BugReportModal']
    deferred.forEach((name) => {
      expect(imports.some((path) => path.endsWith(name))).toBe(false)
      expect(read('App.jsx')).toMatch(new RegExp(`const ${name} = lazy\\(\\(\\) => import\\(`))
    })
  })

  it('keeps each mini-game in its own lazy chunk', () => {
    const source = read('components/skills/SkillCard.jsx')
    const imports = staticImports(source)
    ;['Memory', 'Pattern', 'Math', 'Writing', 'Reading', 'Cleaning'].forEach((name) => {
      expect(imports.some((path) => path.includes(`${name}Game`))).toBe(false)
      expect(source).toMatch(new RegExp(`const ${name}Game = lazy\\(\\(\\) => import\\(`))
    })
  })

  it('loads global styles from the loading gate instead of the App render', () => {
    expect(read('App.jsx')).not.toMatch(/GlobalStyles/)
    expect(read('components/LoadingGate.jsx')).toMatch(/import\('\.\/ui\/GlobalStyles\.css'\)/)
  })

  it('lazy-loads images by default', () => {
    expect(read('components/ui/SafeImage.jsx')).toMatch(/loading = 'lazy'/)
  })
})
