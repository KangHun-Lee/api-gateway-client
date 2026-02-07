// 타입스크립트
interface CpuPerformance {
  maker: string
  model: string
  modelCoefficient: number
  generationCoefficient: number
  gradeCoefficient: number
}

interface memoryPerformance {
  model: string
  capacity: number
  memoryCoefficient: number
}

interface InstallInfoData {
  id: number
  cpu: string
  memory: string
}

export interface CpumemoryScore {
  id: number
  cpuName: string
  cpuModel: string
  memory: string
  cpuScore: number
  memoryScore: number
  totalScore: number
  unitCount: number
}

// maker : 제조사 / modelCoefficient : 모델계수 / generationCoefficient : 세대계수 / gradeCoefficient : 등급계수
const cpuPerformances: CpuPerformance[] = [
  // Intel - Desktop
  {
    maker: 'Intel',
    model: 'Celeron',
    modelCoefficient: 0.4,
    generationCoefficient: 0.1,
    gradeCoefficient: 0.5
  },
  {
    maker: 'Intel',
    model: 'Pentium',
    modelCoefficient: 0.6,
    generationCoefficient: 0.2,
    gradeCoefficient: 0.5
  },
  {
    maker: 'Intel',
    model: 'i3',
    modelCoefficient: 0.8,
    generationCoefficient: 0.3,
    gradeCoefficient: 0.7
  },
  {
    maker: 'Intel',
    model: 'i5',
    modelCoefficient: 1,
    generationCoefficient: 0.5,
    gradeCoefficient: 0.7
  },
  {
    maker: 'Intel',
    model: 'i7',
    modelCoefficient: 1.7,
    generationCoefficient: 0.7,
    gradeCoefficient: 0.7
  },
  {
    maker: 'Intel',
    model: 'i9',
    modelCoefficient: 2.5,
    generationCoefficient: 0.9,
    gradeCoefficient: 0.7
  },

  // Intel - Workstation
  {
    maker: 'Intel',
    model: 'E3',
    modelCoefficient: 1,
    generationCoefficient: 0.5,
    gradeCoefficient: 0.7
  },
  {
    maker: 'Intel',
    model: 'E5',
    modelCoefficient: 1.7,
    generationCoefficient: 0.7,
    gradeCoefficient: 0.7
  },
  {
    maker: 'Intel',
    model: 'E7',
    modelCoefficient: 2.5,
    generationCoefficient: 0.9,
    gradeCoefficient: 0.7
  },
  {
    maker: 'Intel',
    model: 'W',
    modelCoefficient: 1.5,
    generationCoefficient: 1.2,
    gradeCoefficient: 0.7
  },
  {
    maker: 'Intel',
    model: 'Xeon(R) Bronze',
    modelCoefficient: 0.8,
    generationCoefficient: 0.4,
    gradeCoefficient: 0.7
  },
  {
    maker: 'Intel',
    model: 'Xeon(R) Silver',
    modelCoefficient: 1.2,
    generationCoefficient: 1,
    gradeCoefficient: 1.5
  },
  {
    maker: 'Intel',
    model: 'Xeon(R) Gold',
    modelCoefficient: 1.2,
    generationCoefficient: 1.6,
    gradeCoefficient: 2
  },
  {
    maker: 'Intel',
    model: 'Xeon(R) Platinum',
    modelCoefficient: 1.2,
    generationCoefficient: 2.4,
    gradeCoefficient: 5
  },

  // AMD
  {
    maker: 'AMD',
    model: 'Athlon',
    modelCoefficient: 0.6,
    generationCoefficient: 0.9,
    gradeCoefficient: 0.7
  },
  {
    maker: 'AMD',
    model: 'Ryzen 3',
    modelCoefficient: 0.7,
    generationCoefficient: 0.4,
    gradeCoefficient: 0.7
  },
  {
    maker: 'AMD',
    model: 'Ryzen 5',
    modelCoefficient: 1,
    generationCoefficient: 0.6,
    gradeCoefficient: 0.7
  },
  {
    maker: 'AMD',
    model: 'Ryzen 7',
    modelCoefficient: 1.7,
    generationCoefficient: 0.8,
    gradeCoefficient: 0.7
  },
  {
    maker: 'AMD',
    model: 'Ryzen 9',
    modelCoefficient: 2.5,
    generationCoefficient: 1,
    gradeCoefficient: 0.7
  }
]

// memory : 램용량 / memoryCoefficient : 램점수 계수
const memoryPerformances: memoryPerformance[] = [
  { model: '2GB', capacity: 2, memoryCoefficient: 0.1 },
  { model: '3GB', capacity: 3, memoryCoefficient: 0.1 },
  { model: '4GB', capacity: 4, memoryCoefficient: 0.5 },
  { model: '5GB', capacity: 5, memoryCoefficient: 0.5 },
  { model: '6GB', capacity: 6, memoryCoefficient: 0.8 },
  { model: '7GB', capacity: 7, memoryCoefficient: 0.8 },
  { model: '8GB', capacity: 8, memoryCoefficient: 1 },
  { model: '9GB', capacity: 9, memoryCoefficient: 1 },
  { model: '10GB', capacity: 10, memoryCoefficient: 1.2 },
  { model: '11GB', capacity: 11, memoryCoefficient: 1.2 },
  { model: '12GB', capacity: 12, memoryCoefficient: 1.3 },
  { model: '13GB', capacity: 13, memoryCoefficient: 1.3 },
  { model: '14GB', capacity: 14, memoryCoefficient: 1.4 },
  { model: '15GB', capacity: 15, memoryCoefficient: 1.4 },
  { model: '16GB', capacity: 16, memoryCoefficient: 1.5 },
  { model: '17GB', capacity: 17, memoryCoefficient: 1.5 },
  { model: '18GB', capacity: 18, memoryCoefficient: 1.6 },
  { model: '19GB', capacity: 19, memoryCoefficient: 1.6 },
  { model: '20GB', capacity: 20, memoryCoefficient: 1.6 },
  { model: '21GB', capacity: 21, memoryCoefficient: 1.6 },
  { model: '22GB', capacity: 22, memoryCoefficient: 1.7 },
  { model: '23GB', capacity: 23, memoryCoefficient: 1.7 },
  { model: '24GB', capacity: 24, memoryCoefficient: 1.7 },
  { model: '25GB', capacity: 25, memoryCoefficient: 1.7 },
  { model: '26GB', capacity: 26, memoryCoefficient: 1.8 },
  { model: '27GB', capacity: 27, memoryCoefficient: 1.8 },
  { model: '28GB', capacity: 28, memoryCoefficient: 1.8 },
  { model: '29GB', capacity: 29, memoryCoefficient: 1.8 },
  { model: '30GB', capacity: 30, memoryCoefficient: 1.9 },
  { model: '31GB', capacity: 31, memoryCoefficient: 1.9 },
  { model: '32GB', capacity: 32, memoryCoefficient: 2 }
]

function GetCpuScore(props: InstallInfoData): {
  cpuName: string
  cpuModel: string
  cpuScore: number
} {
  let cpuScore = 0
  const cpuName = props.cpu
  const cpuCoefficient = cpuPerformances.find((item) => cpuName.includes(item.model))

  if (cpuCoefficient) {
    let cpuModel = ''
    let generationValue = 1
    let gradeValue = 1
    const cpuArray = cpuName.split(' ')

    if (cpuCoefficient.maker === 'Intel') {
      // Intel Maker인 경우
      const isXeonCpu = cpuName.includes('Xeon(R)')

      if (isXeonCpu) {
        // workstation cpu
        if (cpuName.includes('-')) {
          // E, W 시리즈
          cpuModel = cpuArray.find((item) => item.includes(cpuCoefficient.model)) || ''
          const cpuParts = cpuModel.split('-')
          cpuParts[1] = cpuParts[1].match(/\d+/)?.[0] || '' // \d+는 숫자(0-9)의 연속을 의미합니다. (숫자만 가져오기)
          gradeValue = (Math.floor(parseInt(cpuParts[1]) / 10) % 10) + 1 // 십의자리 = 등급 (0부터 시작하므로 + 1 추가)

          // 세대 수 가져오기
          const generation = cpuArray.find((item) => item.toLowerCase().includes('v'))
          if (generation) {
            generationValue = parseInt(generation.match(/\d+/)?.[0] || '0') + 1 // (v숫자값 + 1) = 세대수
          } else {
            generationValue = 2 // v 없는 경우 2세대
          }
        } else {
          // 스케일러블(Broze, Silver, Gold, Platinum) 시리즈
          cpuModel = cpuCoefficient.model
        }
      } else {
        // desktop cpu
        // '-' 있는 모델은 추가 parse
        cpuModel = cpuArray.find((item) => item.includes(cpuCoefficient.model)) || ''
        if (cpuModel.includes('-')) {
          // Intel Desktop CPU인 경우
          // cpuParts[0] : 모델, cpuParts[1] : 세대 및 등급
          const cpuParts = cpuModel.split('-')
          cpuParts[1] = cpuParts[1].match(/\d+/)?.[0] || '' // \d+는 숫자(0-9)의 연속을 의미합니다. (숫자만 가져오기)

          if (cpuParts[1].length >= 5) {
            // 세대수가 10세대 이상인 경우
            generationValue = parseInt(cpuParts[1].slice(0, 2)) // 세대 값
            gradeValue = parseInt(cpuParts[1].slice(2, 3)) // 등급 값
          } else {
            generationValue = parseInt(cpuParts[1].slice(0, 1)) // 세대 값
            gradeValue = parseInt(cpuParts[1].slice(1, 2)) // 등급 값
          }
        }
      }
    } else if (cpuCoefficient.maker === 'AMD') {
      // AMD Maker인 경우
      const startIndex = cpuArray.indexOf('Ryzen')

      if (cpuName.includes(' PRO ')) {
        cpuModel = `${cpuArray[startIndex]} ${cpuArray[startIndex + 1]} ${cpuArray[startIndex + 3]}` // Ryzen PRO 타입은 제외
      } else {
        cpuModel = `${cpuArray[startIndex]} ${cpuArray[startIndex + 1]} ${cpuArray[startIndex + 2]}`
      }

      // cpuParts[0] : 모델, cpuParts[1] : 모델종류, cpuParts[2] : 세대 및 등급
      const cpuParts = cpuModel.split(' ')
      cpuParts[2] = cpuParts[2].match(/\d+/)?.[0] || '' // \d+는 숫자(0-9)의 연속을 의미합니다. (숫자만 가져오기)
      generationValue = parseInt(cpuParts[2].slice(0, 1)) // 세대 값
      gradeValue = parseInt(cpuParts[2].slice(1, 2)) // 등급 값
    }

    cpuScore =
      cpuCoefficient.modelCoefficient +
      generationValue * cpuCoefficient.generationCoefficient +
      gradeValue * cpuCoefficient.gradeCoefficient * 10

    return { cpuName: cpuName, cpuModel: cpuModel, cpuScore: cpuScore }
  } else {
    return { cpuName: cpuName, cpuModel: '미지정', cpuScore: cpuScore }
  }
}

function GetmemoryScore(props: InstallInfoData): { memory: string; memoryScore: number } {
  let memoryScore = 0
  const memoryName = props.memory
  if (memoryName) {
    const capacity = parseInt(memoryName.match(/\d+/)?.[0] || '0')
    const memoryPerformance = memoryPerformances.find((item) => capacity === item.capacity)
    if (memoryPerformance) {
      memoryScore = memoryPerformance.memoryCoefficient
    } else {
      const maxmemory = memoryPerformances.reduce((maxmemory, currentmemory) => {
        return currentmemory.capacity > maxmemory.capacity ? currentmemory : maxmemory
      }, memoryPerformances[0])

      if (capacity && capacity > maxmemory.capacity) {
        memoryScore = maxmemory.memoryCoefficient
      }
    }
  }

  return { memory: props.memory, memoryScore: memoryScore }
}

export function AnalyzeInstallInfo(rawDatas: InstallInfoData[]): CpumemoryScore[] {
  const cpumemoryScores: CpumemoryScore[] = rawDatas.map((data) => {
    const { cpuName, cpuModel, cpuScore } = GetCpuScore(data)
    const { memory, memoryScore } = GetmemoryScore(data)
    const id = data.id

    return {
      id,
      cpuName,
      cpuModel,
      memory,
      cpuScore,
      memoryScore,
      totalScore:
        isNaN(Math.round(cpuScore * memoryScore * 100)) ||
        Math.round(cpuScore * memoryScore * 100) === undefined
          ? 0
          : Math.round(cpuScore * memoryScore * 100),
      unitCount: 0 // 초기화
    }
  })

  cpumemoryScores.sort((a, b) => a.totalScore - b.totalScore)

  const unitCounts: Record<string, number> = {}
  cpumemoryScores.forEach((data) => {
    const key = `${data.cpuModel} ${data.memory}`

    unitCounts[key] = (unitCounts[key] || 0) + 1
  })

  const seenKeys = new Set<string>()
  const result: CpumemoryScore[] = cpumemoryScores
    .map((data) => {
      const key = `${data.cpuModel} ${data.memory}`
      if (!seenKeys.has(key)) {
        seenKeys.add(key)

        return {
          id: data.id,
          cpuName: data.cpuName,
          cpuModel: data.cpuModel,
          memory: data.memory,
          totalScore: data.totalScore,
          cpuScore: data.cpuScore,
          memoryScore: data.memoryScore,
          unitCount: unitCounts[key]
        }
      }
      return null
    })
    .filter((item): item is CpumemoryScore => item !== null)

  console.log('cpuName : cpu의 전체명')
  console.log('cpuModel : cpu의 모델명')
  console.log('memory : memory용량')
  console.log('totalScore : (cpuScore * memoryScore) * 10')
  console.log('cpuScore : (모델계수 + 세대계수 + 등급계수) * 100')
  console.log('memoryScore : 램용량계수')
  console.log('unitCount : cpuModel의 사용개수')

  return result
}
