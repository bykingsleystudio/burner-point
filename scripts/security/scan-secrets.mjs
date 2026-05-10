#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const binaryExtensions = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.pdf', '.zip', '.gz',
  '.mp4', '.mov', '.mp3', '.wav', '.ttf', '.otf', '.woff', '.woff2',
]);

const ignoredPaths = [
  /^package-lock\.json$/,
  /^apps\/[^/]+\/package-lock\.json$/,
  /^docs\/.*\.png$/,
  /^\.env$/,
  /^\.env\.local$/,
  /^\.env\.sentry-build-plugin$/,
  /(^|\/)\.env$/,
  /(^|\/)\.env\.local$/,
  /(^|\/)\.env\..*\.local$/,
  /(^|\/)\.env\.sentry-build-plugin$/,
];

const ignoredDirectories = new Set([
  '.git',
  '.next',
  '.turbo',
  '.vercel',
  'android',
  'build',
  'coverage',
  'dist',
  'ios',
  'node_modules',
  'out',
]);

const placeholderPattern = /(REPLACE_ME|PLACEHOLDER|EXAMPLE|example\.com|localhost|127\.0\.0\.1|YOUR_|test_|dummy|changeme|PASSWORD@HOST|HOST:6379|noreply@burnerpoint\.app)/i;

const detectors = [
  { name: 'private-key-block', regex: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/ },
  { name: 'github-token', regex: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{30,}\b/ },
  { name: 'github-fine-grained-token', regex: /\bgithub_pat_[A-Za-z0-9_]{40,}\b/ },
  { name: 'openai-api-key', regex: /\bsk-[A-Za-z0-9]{32,}\b/ },
  { name: 'resend-api-key', regex: /\bre_[A-Za-z0-9]{24,}\b/ },
  { name: 'slack-token', regex: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/ },
  { name: 'stripe-or-paystack-secret', regex: /\b(?:sk_live|sk_test|paystack_sk|PAYSTACK_SECRET_KEY=sk)_[A-Za-z0-9]{16,}\b/ },
  { name: 'jwt-literal', regex: /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\b/ },
  { name: 'database-url-with-password', regex: /postgres(?:ql)?:\/\/[^:\s]+:[^@\s]+@[^/\s]+\/[^\s'"]+/i },
  { name: 'secret-assignment-literal', regex: /\b(?:SECRET|TOKEN|API_KEY|PRIVATE_KEY|PASSWORD|AUTH_TOKEN)\b\s*[:=]\s*["'][^"']{12,}["']/i },
];

const envSubstitutionPattern =
  /\b(?:SECRET|TOKEN|API_KEY|PRIVATE_KEY|PASSWORD|AUTH_TOKEN)\b\s*[:=]\s*["']env\([^)]+\)["']/i;

const listed = spawnSync('git', ['ls-files', '-z'], { encoding: 'buffer' });
const usedGit = listed.status === 0;
const rawFiles = usedGit
  ? listed.stdout.toString('utf8').split('\0').filter(Boolean)
  : listWorkspaceFiles(process.cwd());

if (!usedGit) {
  console.warn('git ls-files unavailable; falling back to workspace scan with runtime/secret directories excluded.');
}

const files = rawFiles
  .filter((file) => !ignoredPaths.some((pattern) => pattern.test(file.replace(/\\/g, '/'))))
  .filter((file) => !binaryExtensions.has(extname(file).toLowerCase()))
  .filter((file) => existsSync(file));

const findings = [];

for (const file of files) {
  let content;
  try {
    content = readFileSync(file, 'utf8');
  } catch {
    continue;
  }

  const lines = content.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (placeholderPattern.test(line)) return;
    if (envSubstitutionPattern.test(line)) return;
    for (const detector of detectors) {
      detector.regex.lastIndex = 0;
      if (detector.regex.test(line)) {
        findings.push({
          file,
          line: index + 1,
          detector: detector.name,
        });
      }
    }
  });
}

if (findings.length) {
  console.error('Potential committed secrets found. Values are intentionally not printed:');
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} [${finding.detector}]`);
  }
  process.exit(1);
}

console.log(`Secret scan passed: ${files.length} ${usedGit ? 'tracked' : 'workspace'} text files checked; no high-confidence secret patterns found.`);

function listWorkspaceFiles(root) {
  const files = [];
  const visit = (dir) => {
    for (const entry of readdirSync(dir)) {
      if (ignoredDirectories.has(entry)) continue;
      const absolute = join(dir, entry);
      const rel = relative(root, absolute).replace(/\\/g, '/');
      if (ignoredPaths.some((pattern) => pattern.test(rel))) continue;
      const stat = statSync(absolute);
      if (stat.isDirectory()) {
        visit(absolute);
      } else if (stat.isFile()) {
        files.push(rel);
      }
    }
  };
  visit(root);
  return files;
}
