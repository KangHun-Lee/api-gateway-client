import { readFile, writeFile } from 'fs/promises'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// ESM에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// package.json 경로
const packageJsonPath = join(__dirname, './package.json')

// package.json 읽기
const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'))

// version.txt 파일 생성
const versionFilePath = join(__dirname, './public/version.txt')

try {
  await writeFile(versionFilePath, packageJson.version, 'utf8')
  console.log(`Version file created at ${versionFilePath}: ${packageJson.version}`)
} catch (error) {
  console.error('Failed to create version file:', error)
}
