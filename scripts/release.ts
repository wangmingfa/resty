#!/usr/bin/env bun
/**
 * 发布脚本：自动打 tag 并推送，触发 GitHub Actions release workflow
 *
 * 用法：
 *   bun run scripts/release.ts                           # 交互式选择版本和发布类型
 *   bun run scripts/release.ts --canary                  # 跳过类型选择，直接 canary
 *   bun run scripts/release.ts --stable                  # 跳过类型选择，直接 stable
 *   bun run scripts/release.ts --version 1.2.3           # 跳过版本选择，直接指定
 */

import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import select from '@inquirer/select'
import confirm from '@inquirer/confirm'

const ROOT = resolve(import.meta.dir, '..')

// 解析命令行参数
const args = process.argv.slice(2)
const versionArgIdx = args.indexOf('--version')
const explicitVersion = versionArgIdx !== -1 ? args[versionArgIdx + 1] : null

// 读取当前版本（从 package.json）
function getCurrentVersion(): string {
  const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'))
  return pkg.version as string
}

// 将新版本写回 package.json
function writeVersion(newVersion: string) {
  const pkgPath = resolve(ROOT, 'package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
  pkg.version = newVersion
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, '\t')}\n`)
}

// 计算各升级方案
function bumpVersions(current: string): { major: string; minor: string; patch: string } {
  const [major, minor, patch] = current.split('.').map(Number)
  return {
    major: `${major + 1}.0.0`,
    minor: `${major}.${minor + 1}.0`,
    patch: `${major}.${minor}.${patch + 1}`,
  }
}

// 交互：选择发布类型
async function promptReleaseType(): Promise<boolean> {
  const result = await select({
    message: '选择发布类型',
    choices: [
      { name: 'stable', value: 'stable' },
      { name: 'canary', value: 'canary' },
    ],
  })
  return result === 'canary'
}

// 交互：选择版本升级
async function promptVersion(current: string): Promise<string> {
  const { major, minor, patch } = bumpVersions(current)
  const result = await select({
    message: `选择版本升级方式（当前：${current}）`,
    choices: [
      { name: `patch  ${current} → ${patch}`, value: patch },
      { name: `minor  ${current} → ${minor}`, value: minor },
      { name: `major  ${current} → ${major}`, value: major },
    ],
  })
  return result
}

// 获取最新的 canary 编号（基于已有 tag）
function getNextCanaryNum(baseVersion: string): number {
  try {
    const tags = execSync('git tag --list', { encoding: 'utf-8' })
    const prefix = `v${baseVersion}-canary.`
    const nums = tags
      .split('\n')
      .filter((t) => t.startsWith(prefix))
      .map((t) => Number.parseInt(t.replace(prefix, ''), 10))
      .filter((n) => !Number.isNaN(n))
    return nums.length > 0 ? Math.max(...nums) + 1 : 1
  } catch {
    return 1
  }
}

// 检查工作区是否干净
function checkCleanWorkspace() {
  const status = execSync('git status --porcelain', { encoding: 'utf-8' }).trim()
  if (status) {
    console.error('❌ 工作区有未提交的改动，请先 commit 或 stash：')
    console.error(status)
    process.exit(1)
  }
}

// 执行命令并打印
function run(cmd: string) {
  console.log(`> ${cmd}`)
  execSync(cmd, { stdio: 'inherit' })
}

// 主流程
checkCleanWorkspace()

// 1. 选择发布类型
const isCanary = args.includes('--canary') || args.includes('--stable')
  ? args.includes('--canary')
  : await promptReleaseType()

// 2. 选择版本号
const currentVersion = getCurrentVersion()

// 检查是否存在任何已发布的 tag
const hasAnyTag = execSync('git tag --list', { encoding: 'utf-8' }).trim().length > 0
const firstRelease = !hasAnyTag

let newVersion: string
if (explicitVersion) {
  newVersion = explicitVersion
} else if (firstRelease) {
  newVersion = '0.0.1'
  console.log('\n🎉 首次发布，版本自动设为 0.0.1')
} else {
  newVersion = await promptVersion(currentVersion)
}

// 3. 写回 package.json（仅当版本有变化时）
if (newVersion !== currentVersion) {
  writeVersion(newVersion)
  console.log(`\n📝 package.json 版本已更新：${currentVersion} → ${newVersion}`)
  // 自动 commit 版本变更
  run(`git add package.json`)
  run(`git commit -m "chore: bump version to ${newVersion}"`)
}

// 4. 生成 tag
let tag: string
if (isCanary) {
  const canaryNum = getNextCanaryNum(newVersion)
  tag = `v${newVersion}-canary.${canaryNum}`
} else {
  tag = `v${newVersion}`
}

// 5. 检查 tag 是否已存在
const existingTags = execSync('git tag --list', { encoding: 'utf-8' })
if (existingTags.split('\n').includes(tag)) {
  console.error(`❌ Tag ${tag} 已存在，请选择更高版本后重试`)
  process.exit(1)
}

// 打印发布信息并确认
console.log('\n─────────────────────────────────')
console.log(`  类型     : ${isCanary ? 'canary' : 'stable'}`)
console.log(`  版本     : ${newVersion}${!firstRelease && newVersion !== currentVersion ? ` (原 ${currentVersion})` : ''}`)
console.log(`  Tag      : ${tag}`)
console.log(`  分支     : ${execSync('git branch --show-current', { encoding: 'utf-8' }).trim()}`)
console.log('─────────────────────────────────\n')

const confirmed = await confirm({ message: '确认发布？', default: true })
if (!confirmed) {
  console.log('🚫 已取消发布')
  process.exit(0)
}

console.log(`\n🚀 开始发布 ${tag}...\n`)

run(`git tag ${tag}`)
run(`git push origin HEAD`)
run(`git push origin ${tag}`)

console.log(`\n✅ Tag ${tag} 已推送，GitHub Actions 将自动开始构建和发布`)
console.log(`   查看进度：https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]//;s/.git$//')/actions`)
