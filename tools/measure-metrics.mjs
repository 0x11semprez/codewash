// Measures the code metrics of docs/DEBT.md (section 3 and "Final metrics") in one command.
// Usage:
//   npm run metrics                                  measure the working tree
//   npm run metrics -- --ref a4f337f                 measure a commit (the received version is a4f337f)
//   npm run metrics -- --skip-coverage --json        skip the test run, print JSON
// Coverage, test count and ESLint with the project config are measured on the working tree only:
// an old commit has no tests and no matching ESLint config.
// jscpd and madge run through npx with pinned versions, so the numbers stay comparable.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';

const JSCPD = 'jscpd@4.3.0';
const MADGE = 'madge@8.0.0';
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const args = process.argv.slice(2);
const option = (name) => {
    const index = args.indexOf(name);
    return index === -1 ? null : args[index + 1];
};
const ref = option('--ref');
const skipCoverage = args.includes('--skip-coverage') || Boolean(ref);
const asJson = args.includes('--json');

const run = (command, commandArgs, cwd) => {
    const result = spawnSync(command, commandArgs, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    if (result.error) throw result.error;
    return result;
};

const temp = mkdtempSync(join(tmpdir(), 'codewash-metrics-'));
const cleanup = () => rmSync(temp, { recursive: true, force: true });

// The tree to measure: the working tree, or a copy of a commit made with git archive.
let root = REPO;
if (ref) {
    root = join(temp, 'tree');
    run('mkdir', ['-p', root]);
    const archive = run('sh', ['-c', `git archive "${ref}" | tar -x -C "${root}"`], REPO);
    if (archive.status !== 0) {
        cleanup();
        throw new Error(`git archive ${ref} failed: ${archive.stderr}`);
    }
}

const walk = (dir) =>
    existsSync(dir)
        ? readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
              const path = join(dir, entry.name);
              return entry.isDirectory() ? walk(path) : [path];
          })
        : [];

const isTest = (path) => path.includes(`${sep}__tests__${sep}`) || /\.test\.[jt]sx?$/.test(path);
const isMacMetadata = (path) => path.split(sep).at(-1).startsWith('._');

// Source files: .js and .jsx under src/, without tests. Same scope as the baseline.
const sourceFiles = walk(join(root, 'src'))
    .filter((path) => /\.(js|jsx)$/.test(path) && !isTest(path) && !isMacMetadata(path))
    .sort();
const electronFiles = walk(join(root, 'electron')).filter((path) => path.endsWith('.cjs') && !isMacMetadata(path));
const testFiles = walk(join(root, 'src')).filter((path) => /\.(js|jsx)$/.test(path) && isTest(path));
const rel = (path) => relative(root, path);
const read = (path) => readFileSync(path, 'utf8');
const countLines = (text) => (text.match(/\n/g) || []).length; // same as wc -l

// Decision points, counted with a regex on the raw text: if, for, while, case, catch, &&, ||, ?? and ?.
// It also counts matches in strings and comments, so it is an estimate. It is the same counter for both trees.
const DECISION_POINTS = /\b(?:if|for|while)\s*\(|\bcase\b|\bcatch\b|&&|\|\||\?\?|\?(?![.?:])/g;
const countDecisionPoints = (text) => (text.match(DECISION_POINTS) || []).length;

// Direct calls to the random source and the clock, outside the two modules that wrap them (ADR-008).
const DIRECT_IO = /Math\.random\(\)|Date\.now\(\)|new Date\(/g;
const WRAPPERS = [join('src', 'utils', 'random.js'), join('src', 'utils', 'clock.js')];

const files = sourceFiles.map((path) => {
    const text = read(path);
    return {
        path: rel(path),
        lines: countLines(text),
        decisionPoints: countDecisionPoints(text),
        directIo: WRAPPERS.includes(rel(path)) ? 0 : (text.match(DIRECT_IO) || []).length,
    };
});
const bySize = [...files].sort((a, b) => b.lines - a.lines);
const byComplexity = [...files].sort((a, b) => b.decisionPoints - a.decisionPoints);
const sum = (key) => files.reduce((total, file) => total + file[key], 0);

// Per-function cyclomatic complexity with the ESLint "complexity" rule and a neutral config,
// so an old commit is parsed the same way as today.
const complexityLinter = new ESLint({
    cwd: root,
    overrideConfigFile: true,
    overrideConfig: [
        {
            files: ['**/*.{js,jsx}'],
            languageOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                parserOptions: { ecmaFeatures: { jsx: true } },
            },
            rules: { complexity: ['warn', 0] },
        },
    ],
});
const functionScores = (await complexityLinter.lintFiles(sourceFiles)).flatMap((result) =>
    result.messages
        .filter((message) => message.ruleId === 'complexity')
        .map((message) => ({
            path: rel(result.filePath),
            line: message.line,
            score: Number(message.message.match(/complexity of (\d+)/)?.[1] ?? 0),
            name: message.message.replace(/ has a complexity.*$/, ''),
        })),
);
functionScores.sort((a, b) => b.score - a.score);

// ESLint with the project config, as in `npm run lint`. Working tree only.
let lint = null;
if (!ref) {
    const results = await new ESLint({ cwd: root }).lintFiles(['src/']);
    lint = {
        errors: results.reduce((total, result) => total + result.errorCount, 0),
        warnings: results.reduce((total, result) => total + result.warningCount, 0),
    };
}

// Duplication with jscpd, same options as the baseline. Tests are left out.
const jscpdOut = join(temp, 'jscpd');
run(
    'npx',
    [
        '--yes',
        JSCPD,
        '--min-lines',
        '5',
        '--min-tokens',
        '50',
        '--format',
        'javascript,jsx',
        '--ignore',
        '**/__tests__/**,**/*.test.*,**/._*',
        '--reporters',
        'json',
        '--output',
        jscpdOut,
        '--silent',
        'src',
    ],
    root,
);
const jscpd = JSON.parse(read(join(jscpdOut, 'jscpd-report.json')));
const duplication = {
    clones: jscpd.statistics.total.clones,
    duplicatedLines: jscpd.statistics.total.duplicatedLines,
    percentage: jscpd.statistics.total.percentage,
    pairs: jscpd.duplicates.map(
        (clone) =>
            `${clone.firstFile.name}:${clone.firstFile.start} = ${clone.secondFile.name}:${clone.secondFile.start} (${clone.lines} lines)`,
    ),
};

// Dead files with madge: files that nothing imports. main.jsx is the entry point, and files
// loaded by import.meta.glob are used even if no import names them.
const madge = run(
    'npx',
    ['--yes', MADGE, '--orphans', '--json', '--extensions', 'js,jsx', '--exclude', '__tests__|\\.test\\.', 'src'],
    root,
);
const globDirs = sourceFiles.flatMap((path) =>
    [...read(path).matchAll(/import\.meta\.glob\(\s*['"]([^'"]+)['"]/g)].map(([, pattern]) =>
        relative(join(root, 'src'), resolve(dirname(path), dirname(pattern))),
    ),
);
const orphans = JSON.parse(madge.stdout || '[]');
const deadFiles = orphans.filter(
    (path) => path !== 'main.jsx' && !globDirs.includes(dirname(path)) && /\.(js|jsx)$/.test(path),
);

// Coverage and test count from Vitest. Working tree only.
let coverage = null;
let tests = null;
if (!skipCoverage) {
    const coverageDir = join(temp, 'coverage');
    const resultsFile = join(temp, 'vitest.json');
    const vitest = run(
        'npx',
        [
            'vitest',
            'run',
            '--coverage',
            '--coverage.reporter=json-summary',
            `--coverage.reportsDirectory=${coverageDir}`,
            '--reporter=json',
            `--outputFile=${resultsFile}`,
        ],
        root,
    );
    if (existsSync(join(coverageDir, 'coverage-summary.json'))) {
        const { total } = JSON.parse(read(join(coverageDir, 'coverage-summary.json')));
        coverage = Object.fromEntries(
            ['lines', 'statements', 'functions', 'branches'].map((key) => [key, total[key].pct]),
        );
    }
    if (existsSync(resultsFile)) {
        const results = JSON.parse(read(resultsFile));
        tests = { files: results.numTotalTestSuites, tests: results.numTotalTests, failed: results.numFailedTests };
    }
    if (vitest.status !== 0) console.error('Vitest exited with an error. Check `npm run test:coverage`.');
}

// Files tracked by git, to count the macOS metadata files the baseline found in the repository.
const trackedFiles = run('git', ref ? ['ls-tree', '-r', '--name-only', ref] : ['ls-files'], REPO)
    .stdout.split('\n')
    .filter(Boolean)
    .map((path) => path.split('/').join(sep));
const pkg = JSON.parse(read(join(root, 'package.json')));
const metrics = {
    tree: ref ?? 'working tree',
    sourceFiles: files.length,
    electronFiles: electronFiles.length,
    sourceLines: sum('lines'),
    largestFiles: bySize.slice(0, 3).map(({ path, lines }) => ({ path, lines })),
    filesOver300Lines: files.filter((file) => file.lines > 300).length,
    decisionPoints: {
        total: sum('decisionPoints'),
        top: byComplexity.slice(0, 3).map(({ path, decisionPoints }) => ({ path, decisionPoints })),
    },
    functionComplexity: {
        max: functionScores[0] ?? null,
        over10: functionScores.filter((fn) => fn.score > 10).length,
        over20: functionScores.filter((fn) => fn.score > 20).length,
        functions: functionScores.length,
    },
    duplication,
    deadFiles,
    directRandomAndClockCalls: sum('directIo'),
    testFiles: testFiles.length,
    tests,
    coverage,
    lint,
    macMetadataFiles: trackedFiles.filter((path) => isMacMetadata(path)).length,
    dependencies: Object.keys(pkg.dependencies ?? {}).length,
    devDependencies: Object.keys(pkg.devDependencies ?? {}).length,
};
cleanup();

if (asJson) {
    console.log(JSON.stringify(metrics, null, 2));
} else {
    const top = (list, key) => list.map((item) => `${item.path} (${item[key]})`).join(', ');
    const fn = metrics.functionComplexity.max;
    const rows = [
        ['Source files (src, .js/.jsx, no tests)', metrics.sourceFiles],
        ['Electron files (.cjs)', metrics.electronFiles],
        ['Source lines', metrics.sourceLines],
        ['Largest files', top(metrics.largestFiles, 'lines')],
        ['Files over 300 lines', metrics.filesOver300Lines],
        ['Decision points, total (regex counter)', metrics.decisionPoints.total],
        ['Decision points, top files', top(metrics.decisionPoints.top, 'decisionPoints')],
        ['Most complex function (ESLint complexity)', fn ? `${fn.score}: ${fn.name}, ${fn.path}:${fn.line}` : '-'],
        [
            'Functions with complexity over 10 / over 20 (of all functions)',
            `${metrics.functionComplexity.over10} / ${metrics.functionComplexity.over20} (of ${metrics.functionComplexity.functions})`,
        ],
        [
            'Duplication (jscpd)',
            `${duplication.clones} clones, ${duplication.duplicatedLines} lines (${duplication.percentage}%)`,
        ],
        ['Dead files (madge orphans)', deadFiles.length ? deadFiles.join(', ') : '0'],
        ['Direct Math.random() / Date.now() / new Date( calls', metrics.directRandomAndClockCalls],
        ['Test files', metrics.testFiles],
        ['Tests', tests ? `${tests.tests} (${tests.failed} failed)` : 'not run'],
        [
            'Coverage (lines / statements / functions / branches)',
            coverage
                ? `${coverage.lines}% / ${coverage.statements}% / ${coverage.functions}% / ${coverage.branches}%`
                : 'not run',
        ],
        ['ESLint (project config): errors / warnings', lint ? `${lint.errors} / ${lint.warnings}` : 'not run'],
        ['macOS metadata files (._*)', metrics.macMetadataFiles],
        ['Dependencies / dev dependencies', `${metrics.dependencies} / ${metrics.devDependencies}`],
    ];
    console.log(`Metrics for ${metrics.tree}\n`);
    console.log('| Metric | Value |\n|--------|-------|');
    rows.forEach(([name, value]) => console.log(`| ${name} | ${value} |`));
    if (duplication.pairs.length) console.log(`\nClones:\n${duplication.pairs.map((pair) => `- ${pair}`).join('\n')}`);
}
