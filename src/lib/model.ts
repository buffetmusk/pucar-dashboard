export const INDIA_4W_FLEET = 75_000_000  // ~7.5 crore registered 4-wheelers in India

// ─── Inputs ────────────────────────────────────────────────────────────────

export interface ModelInputs {
  // Revenue
  subscriptionPrice: number
  totalPUCChecks: number
  pickupCharge: number
  firstPickupFree: boolean
  marketRatePerPUC: number
  pucFrequency: number

  // Costs
  cac: number
  partnerPUCCommission: number
  ownUnitCostPerPUC: number
  partnerTestsCount: number   // how many tests (per customer) go to partner PUC
  driverCostPerPickup: number
  floatReturnRate: number

  // Partner network
  partnerUnitsYear1: number          // partners active in Year 1
  partnerUnitsYear2: number          // partners active in Year 2
  partnerGrowthRateFromYear3: number // % growth per year from Year 3 onwards
  partnerTestsPerDayEach: number
  partnerOnboardingFee: number       // one-time fee charged to each new partner

  // Driver / ops
  driverPickupsPerDay: number
  driverMonthlyCost: number
  ownMachineSetupCost: number
  ownMachineCount: number        // how many own machines to deploy
  ownMachineTestsPerDay: number  // capacity per machine per working day

  // Forecast
  year1Subscribers: number
  annualGrowthRate: number
  avgTestsUsed: number
  forecastYears: number
}

export const DEFAULT_INPUTS: ModelInputs = {
  subscriptionPrice: 1000,
  totalPUCChecks: 10,
  pickupCharge: 90,
  firstPickupFree: true,
  marketRatePerPUC: 150,
  pucFrequency: 2,
  cac: 100,
  partnerPUCCommission: 100,
  ownUnitCostPerPUC: 30,
  partnerTestsCount: 4,   // min(avgTestsUsed=5, pucFreq=2 × years=2) = 4
  driverCostPerPickup: 70,
  floatReturnRate: 10,
  partnerUnitsYear1: 5,
  partnerUnitsYear2: 10,
  partnerGrowthRateFromYear3: 30,
  partnerTestsPerDayEach: 20,
  partnerOnboardingFee: 5000,
  driverPickupsPerDay: 12,
  driverMonthlyCost: 21500,
  ownMachineSetupCost: 400000,
  ownMachineCount: 1,
  ownMachineTestsPerDay: 50,
  year1Subscribers: 40,
  annualGrowthRate: 80,
  avgTestsUsed: 5,
  forecastYears: 5,
}

// ─── Per-customer unit economics ───────────────────────────────────────────

export interface UnitEcon {
  paidPickups: number
  pickupRevenue: number
  totalRevenue: number
  partnerTests: number
  ownTests: number
  pucCost: number
  driverCost: number
  totalCost: number
  floatIncome: number
  netProfit: number
  breakEvenPrice: number
  customerSaving: number
  marketCost: number
  pucarTotalCustomerPays: number
  lifetimeDurationYears: number
}

// Internal: compute economics without break-even (avoids recursion)
function computeNetProfit(inp: ModelInputs, U: number, subPrice: number): number {
  const paidPickups = inp.firstPickupFree ? Math.max(0, U - 1) : U
  const pickupRevenue = paidPickups * inp.pickupCharge
  const totalRevenue = subPrice + pickupRevenue
  const partnerTests = Math.min(U, inp.partnerTestsCount)
  const ownTests = U - partnerTests
  const pucCost = partnerTests * inp.partnerPUCCommission + ownTests * inp.ownUnitCostPerPUC
  const driverCost = U * inp.driverCostPerPickup
  const totalCost = inp.cac + pucCost + driverCost
  const lifetimeDurationYears = U / inp.pucFrequency
  const floatIncome = subPrice * (inp.floatReturnRate / 100) * lifetimeDurationYears / 2
  return totalRevenue + floatIncome - totalCost
}

// Binary search for the subscription price where netProfit = 0
function findBreakEvenPrice(inp: ModelInputs, U: number): number {
  let lo = 0, hi = 50000
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    if (computeNetProfit(inp, U, mid) > 0) hi = mid
    else lo = mid
  }
  return Math.round((lo + hi) / 2)
}

export function computeUnitEcon(inp: ModelInputs, overrideU?: number): UnitEcon {
  const U = overrideU ?? inp.avgTestsUsed
  const subPrice = inp.subscriptionPrice

  const paidPickups = inp.firstPickupFree ? Math.max(0, U - 1) : U
  const pickupRevenue = paidPickups * inp.pickupCharge
  const totalRevenue = subPrice + pickupRevenue

  const partnerTests = Math.min(U, inp.partnerTestsCount)
  const ownTests = U - partnerTests
  const pucCost = partnerTests * inp.partnerPUCCommission + ownTests * inp.ownUnitCostPerPUC
  const driverCost = U * inp.driverCostPerPickup
  const totalCost = inp.cac + pucCost + driverCost

  const lifetimeDurationYears = U / inp.pucFrequency
  const floatIncome = subPrice * (inp.floatReturnRate / 100) * lifetimeDurationYears / 2

  const netProfit = totalRevenue + floatIncome - totalCost

  const marketCost = inp.totalPUCChecks * inp.marketRatePerPUC
  const pucarTotalCustomerPays = subPrice + pickupRevenue
  const customerSaving = marketCost - pucarTotalCustomerPays

  const breakEvenPrice = findBreakEvenPrice(inp, U)

  return {
    paidPickups,
    pickupRevenue,
    totalRevenue,
    partnerTests,
    ownTests,
    pucCost,
    driverCost,
    totalCost,
    floatIncome,
    netProfit,
    breakEvenPrice,
    customerSaving,
    marketCost,
    pucarTotalCustomerPays,
    lifetimeDurationYears,
  }
}

// ─── Utilisation chart (profit per # tests used) ──────────────────────────

export interface UtilPoint {
  testsUsed: number
  netProfit: number
  breakEven: boolean
}

export function computeUtilCurve(inp: ModelInputs): UtilPoint[] {
  return Array.from({ length: inp.totalPUCChecks }, (_, i) => {
    const u = i + 1
    const econ = computeUnitEcon(inp, u)
    return { testsUsed: u, netProfit: econ.netProfit, breakEven: false }
  })
}

// ─── Cash balance per PUC event ────────────────────────────────────────────

export interface CashPoint {
  event: number
  balance: number
  phase: 'partner' | 'own'
}

export function computeCashflowPerPUC(inp: ModelInputs): CashPoint[] {
  const subPrice = inp.subscriptionPrice
  // first pickup is free of charge to customer, but PUCAR still pays driver
  let balance = subPrice - inp.cac
  const points: CashPoint[] = [{ event: 0, balance, phase: 'partner' }]

  for (let i = 1; i <= inp.totalPUCChecks; i++) {
    const phase: 'partner' | 'own' = i <= inp.partnerTestsCount ? 'partner' : 'own'
    const pucCost = phase === 'partner' ? inp.partnerPUCCommission : inp.ownUnitCostPerPUC
    const pickup = i === 1 && inp.firstPickupFree ? 0 : inp.pickupCharge
    balance = balance + pickup - pucCost - inp.driverCostPerPickup
    points.push({ event: i, balance, phase })
  }

  return points
}

// ─── Partner growth schedule ───────────────────────────────────────────────

export function getPartnersForYear(year: number, inp: ModelInputs): number {
  if (year <= 1) return inp.partnerUnitsYear1
  if (year === 2) return inp.partnerUnitsYear2
  const growthYears = year - 2
  return Math.round(inp.partnerUnitsYear2 * Math.pow(1 + inp.partnerGrowthRateFromYear3 / 100, growthYears))
}

// ─── Year-by-year cohort forecast ──────────────────────────────────────────

export interface YearlyRow {
  year: number
  newSubs: number
  activeSubs: number
  subRevenue: number
  pickupRevenue: number
  floatIncome: number
  partnerOnboardingRevenue: number
  cacSpend: number
  pucCost: number
  driverCost: number
  machineCapex: number       // ownMachineSetupCost deducted in launch year, else 0
  ebitda: number
  bankBalance: number
}

export function computeYearlyForecast(inp: ModelInputs): YearlyRow[] {
  const rows: YearlyRow[] = []
  let bankBalance = 0
  const lifetimeYears = inp.avgTestsUsed / inp.pucFrequency

  // Year in which PUCAR's own machine is needed (first cohort reaches own-unit tests)
  const needsOwnMachine = inp.partnerTestsCount < inp.avgTestsUsed
  const machineLaunchYear = needsOwnMachine
    ? Math.max(1, Math.floor(inp.partnerTestsCount / inp.pucFrequency) + 1)
    : null

  // Track partners onboarded so far to compute new additions each year
  let prevPartners = 0

  for (let y = 1; y <= inp.forecastYears; y++) {
    const partners = getPartnersForYear(y, inp)
    const newSubs = Math.round(inp.year1Subscribers * partners * Math.pow(1 + inp.annualGrowthRate / 100, y - 1))
    const subRevenue = newSubs * inp.subscriptionPrice
    const cacSpend = newSubs * inp.cac

    let totalPickupRevenue = 0
    let totalPartnerTestsDemand = 0
    let totalOwnTestsDemand = 0
    let totalDriverCost = 0
    let totalActiveSubs = 0

    for (let s = 1; s <= y; s++) {
      const cohortPartners = getPartnersForYear(s, inp)
      const cohortSize = Math.round(inp.year1Subscribers * cohortPartners * Math.pow(1 + inp.annualGrowthRate / 100, s - 1))
      const age = y - s

      if (age >= lifetimeYears) continue

      totalActiveSubs += cohortSize

      const testsAtStartOfYear = Math.min(inp.avgTestsUsed, inp.pucFrequency * age)
      const testsAtEndOfYear = Math.min(inp.avgTestsUsed, inp.pucFrequency * (age + 1))
      const testsThisYear = testsAtEndOfYear - testsAtStartOfYear

      if (testsThisYear <= 0) continue

      for (let t = 1; t <= testsThisYear; t++) {
        const testNum = testsAtStartOfYear + t
        const isPaidPickup = !(inp.firstPickupFree && testNum === 1)
        if (isPaidPickup) totalPickupRevenue += cohortSize * inp.pickupCharge
      }

      for (let t = 0; t < testsThisYear; t++) {
        const testNum = testsAtStartOfYear + t + 1
        if (testNum <= inp.partnerTestsCount) {
          totalPartnerTestsDemand += cohortSize
        } else {
          totalOwnTestsDemand += cohortSize
        }
      }

      totalDriverCost += cohortSize * testsThisYear * inp.driverCostPerPickup
    }

    // Capacity-constrained own machine allocation — overflow spills back to partner rate
    const workingDaysPerYear = 312
    const machineDeployed = machineLaunchYear !== null && y >= machineLaunchYear
    const ownCapacity = machineDeployed ? inp.ownMachineCount * inp.ownMachineTestsPerDay * workingDaysPerYear : 0
    const actualOwnTests = Math.min(totalOwnTestsDemand, ownCapacity)
    const overflow = totalOwnTestsDemand - actualOwnTests
    const totalPucCost =
      actualOwnTests * inp.ownUnitCostPerPUC +
      (totalPartnerTestsDemand + overflow) * inp.partnerPUCCommission

    // Partner onboarding revenue — new partners per the growth schedule
    const scheduledPartners = getPartnersForYear(y, inp)
    const newPartners = Math.max(0, scheduledPartners - prevPartners)
    const partnerOnboardingRevenue = newPartners * inp.partnerOnboardingFee
    prevPartners = scheduledPartners

    // Own machine capex — all machines deployed in launch year
    const machineCapex = machineLaunchYear === y ? inp.ownMachineCount * inp.ownMachineSetupCost : 0

    const floatIncome = bankBalance * (inp.floatReturnRate / 100)
    const totalRevenue = subRevenue + totalPickupRevenue + floatIncome + partnerOnboardingRevenue
    const totalCost = cacSpend + totalPucCost + totalDriverCost + machineCapex
    const ebitda = totalRevenue - totalCost

    bankBalance = bankBalance + ebitda

    rows.push({
      year: y,
      newSubs,
      activeSubs: totalActiveSubs,
      subRevenue,
      pickupRevenue: totalPickupRevenue,
      floatIncome,
      partnerOnboardingRevenue,
      cacSpend,
      pucCost: totalPucCost,
      driverCost: totalDriverCost,
      machineCapex,
      ebitda,
      bankBalance,
    })
  }

  return rows
}

// ─── Scenario lines (bank balance per utilisation scenario) ────────────────

export interface ScenarioLine {
  label: string
  testsUsed: number
  data: { year: number; bankBalance: number }[]
}

export function computeScenarios(inp: ModelInputs): ScenarioLine[] {
  const scenarios = [1, 2, 3, 5, 7, 10].filter(u => u <= inp.totalPUCChecks)
  return scenarios.map(u => ({
    label: `${u} test${u > 1 ? 's' : ''}`,
    testsUsed: u,
    data: computeYearlyForecast({ ...inp, avgTestsUsed: u }).map(r => ({
      year: r.year,
      bankBalance: r.bankBalance,
    })),
  }))
}

// ─── Driver efficiency ─────────────────────────────────────────────────────

export interface DriverMetrics {
  trueDriverCostPerPickup: number
  pickupMargin: number
  maxCustomersPerDriver: number
  driversNeededByYear: { year: number; drivers: number }[]
}

export function computeDriverMetrics(inp: ModelInputs, yearlyRows: YearlyRow[]): DriverMetrics {
  const workingDaysPerMonth = 26
  const trueDriverCostPerPickup = inp.driverMonthlyCost / (inp.driverPickupsPerDay * workingDaysPerMonth)
  const pickupMargin = inp.pickupCharge - trueDriverCostPerPickup
  const maxCustomersPerDriver = (inp.driverPickupsPerDay * workingDaysPerMonth * 12) / inp.pucFrequency

  const driversNeededByYear = yearlyRows.map(row => ({
    year: row.year,
    drivers: Math.ceil(row.activeSubs / maxCustomersPerDriver),
  }))

  return { trueDriverCostPerPickup, pickupMargin, maxCustomersPerDriver, driversNeededByYear }
}

// ─── Partner network capacity ──────────────────────────────────────────────

export interface PartnerYearRow {
  year: number
  partners: number           // scheduled partners for this year
  activeSubs: number
  dailyDemand: number        // PUC tests needed per day
  totalDailyCapacity: number // partners × partnerTestsPerDayEach
  utilisationPct: number     // dailyDemand / totalDailyCapacity × 100
  partnersNeeded: number     // ceil(dailyDemand / partnerTestsPerDayEach)
  surplus: number            // totalDailyCapacity - dailyDemand (positive = headroom)
}

export interface PartnerNetworkMetrics {
  totalDailyCapacity: number
  maxSubscribersSupported: number  // how many subs current partners can serve
  yearRows: PartnerYearRow[]
}

export function computePartnerNetwork(inp: ModelInputs, yearlyRows: YearlyRow[]): PartnerNetworkMetrics {
  const workingDaysPerYear = 312
  const year1Capacity = inp.partnerUnitsYear1 * inp.partnerTestsPerDayEach
  const maxSubscribersSupported = Math.floor((year1Capacity * workingDaysPerYear) / inp.pucFrequency)

  const yearRows: PartnerYearRow[] = yearlyRows.map(r => {
    const partners = getPartnersForYear(r.year, inp)
    const totalDailyCapacity = partners * inp.partnerTestsPerDayEach
    const testsPerYear = r.activeSubs * inp.pucFrequency
    const dailyDemand = testsPerYear / workingDaysPerYear
    const utilisationPct = totalDailyCapacity > 0 ? (dailyDemand / totalDailyCapacity) * 100 : Infinity
    const partnersNeeded = Math.ceil(dailyDemand / inp.partnerTestsPerDayEach)
    const surplus = totalDailyCapacity - dailyDemand
    return { year: r.year, partners, activeSubs: r.activeSubs, dailyDemand, totalDailyCapacity, utilisationPct, partnersNeeded, surplus }
  })

  return { totalDailyCapacity: year1Capacity, maxSubscribersSupported, yearRows }
}

// ─── Own machine trigger ────────────────────────────────────────────────────

export interface MachineMetrics {
  savingPerPUC: number
  pucsToRecoverMachine: number
  subscribersNeeded: number
}

export function computeMachineMetrics(inp: ModelInputs): MachineMetrics {
  const savingPerPUC = inp.partnerPUCCommission - inp.ownUnitCostPerPUC
  const totalSetupCost = inp.ownMachineCount * inp.ownMachineSetupCost
  const pucsToRecoverMachine = savingPerPUC > 0 ? Math.ceil(totalSetupCost / savingPerPUC) : Infinity
  const subscribersNeeded = isFinite(pucsToRecoverMachine)
    ? Math.ceil(pucsToRecoverMachine / inp.pucFrequency)
    : Infinity

  return { savingPerPUC, pucsToRecoverMachine, subscribersNeeded }
}

// ─── Own machine scaling analysis ─────────────────────────────────────────

export interface MachineScalingPoint {
  machineCount: number
  totalCapex: number
  finalBankBalance: number
  yearlyData: { year: number; bankBalance: number; ebitda: number }[]
}

export function computeOwnMachineScaling(inp: ModelInputs): MachineScalingPoint[] {
  return [0, 1, 2, 3, 5, 8, 10].map(n => {
    const rows = computeYearlyForecast({ ...inp, ownMachineCount: n })
    const totalCapex = rows.reduce((s, r) => s + r.machineCapex, 0)
    return {
      machineCount: n,
      totalCapex,
      finalBankBalance: rows[rows.length - 1]?.bankBalance ?? 0,
      yearlyData: rows.map(r => ({ year: r.year, bankBalance: r.bankBalance, ebitda: r.ebitda })),
    }
  })
}

// ─── Partner vs Own-machine comparison ────────────────────────────────────

interface ComparisonScenario {
  label: 'partner' | 'own'
  unit: UnitEcon
  yearly: YearlyRow[]
  finalBankBalance: number
  totalMachineCapex: number
}

interface ComparisonVerdict {
  perCustomerWinner: 'partner' | 'own' | 'tie'
  perCustomerProfitDelta: number
  longTermWinner: 'partner' | 'own' | 'tie'
  finalBalanceDelta: number
  crossoverYear: number | null
  capexRecovered: boolean
  savingPerPUC: number
  summary: string
}

export interface ModelComparisonData {
  partner: ComparisonScenario
  own: ComparisonScenario
  verdict: ComparisonVerdict
}

export function computeModelComparison(inp: ModelInputs): ModelComparisonData {
  const partnerInp: ModelInputs = { ...inp, partnerTestsCount: inp.avgTestsUsed, ownMachineCount: 0 }
  const ownInp: ModelInputs = { ...inp, partnerTestsCount: 0, ownMachineCount: Math.max(1, inp.ownMachineCount) }

  const partnerUnit = computeUnitEcon(partnerInp)
  const ownUnit = computeUnitEcon(ownInp)

  const partnerYearly = computeYearlyForecast(partnerInp)
  const ownYearly = computeYearlyForecast(ownInp)

  const partnerFinal = partnerYearly[partnerYearly.length - 1]?.bankBalance ?? 0
  const ownFinal = ownYearly[ownYearly.length - 1]?.bankBalance ?? 0
  const totalMachineCapex = ownYearly.reduce((s, r) => s + r.machineCapex, 0)

  const partner: ComparisonScenario = { label: 'partner', unit: partnerUnit, yearly: partnerYearly, finalBankBalance: partnerFinal, totalMachineCapex: 0 }
  const own: ComparisonScenario = { label: 'own', unit: ownUnit, yearly: ownYearly, finalBankBalance: ownFinal, totalMachineCapex }

  const savingPerPUC = inp.partnerPUCCommission - inp.ownUnitCostPerPUC
  const profitDelta = ownUnit.netProfit - partnerUnit.netProfit
  const perCustomerWinner: ComparisonVerdict['perCustomerWinner'] =
    profitDelta > 1 ? 'own' : profitDelta < -1 ? 'partner' : 'tie'

  const finalBalanceDelta = ownFinal - partnerFinal
  const longTermWinner: ComparisonVerdict['longTermWinner'] =
    finalBalanceDelta > 1000 ? 'own' : finalBalanceDelta < -1000 ? 'partner' : 'tie'

  // Crossover: first year own balance overtakes partner and stays ahead
  let crossoverYear: number | null = null
  if (ownYearly[0]?.bankBalance >= partnerYearly[0]?.bankBalance) {
    crossoverYear = ownYearly[0].year
  } else {
    for (let i = 1; i < ownYearly.length; i++) {
      if ((ownYearly[i]?.bankBalance ?? -Infinity) >= (partnerYearly[i]?.bankBalance ?? Infinity)) {
        crossoverYear = ownYearly[i].year
        break
      }
    }
  }

  const capexRecovered = crossoverYear !== null && ownFinal > 0

  let summary: string
  if (savingPerPUC <= 0) {
    summary = `Own machine costs ₹${Math.abs(savingPerPUC)} more per test than partner — partner model wins unconditionally at current rates.`
  } else if (longTermWinner === 'own' && capexRecovered) {
    summary = `Own machine saves ₹${savingPerPUC}/test vs partner commission. Capex is recovered by Year ${crossoverYear} and ends ₹${Math.abs(Math.round(finalBalanceDelta)).toLocaleString('en-IN')} ahead overall.`
  } else if (perCustomerWinner === 'own' && longTermWinner !== 'own') {
    summary = `Own machine is cheaper per test (saves ₹${savingPerPUC}/test) but the ₹${totalMachineCapex.toLocaleString('en-IN')} capex isn't fully recovered within the forecast horizon — partner model has more cash at year-end.`
  } else if (longTermWinner === 'partner') {
    summary = `Partner model ends ₹${Math.abs(Math.round(finalBalanceDelta)).toLocaleString('en-IN')} ahead. Capex cost outweighs per-test savings at current subscriber volumes.`
  } else {
    summary = `Both models produce similar outcomes. Adjust subscription price, machine count, or forecast years to see a clear winner.`
  }

  const verdict: ComparisonVerdict = { perCustomerWinner, perCustomerProfitDelta: profitDelta, longTermWinner, finalBalanceDelta, crossoverYear, capexRecovered, savingPerPUC, summary }

  return { partner, own, verdict }
}

// ─── Top-level compute ─────────────────────────────────────────────────────

export interface ComputedAll {
  unit: UnitEcon
  utilCurve: UtilPoint[]
  cashflow: CashPoint[]
  yearly: YearlyRow[]
  scenarios: ScenarioLine[]
  driver: DriverMetrics
  machine: MachineMetrics
  partnerNetwork: PartnerNetworkMetrics
  machineScaling: MachineScalingPoint[]
  comparison: ModelComparisonData
  ltv: number
  cacPaybackMonths: number
  peakActiveSubs: number
  peakYear: number
  marketPenetrationPct: number
}

export function computeAll(inp: ModelInputs): ComputedAll {
  const unit = computeUnitEcon(inp)
  const utilCurve = computeUtilCurve(inp)
  const cashflow = computeCashflowPerPUC(inp)
  const yearly = computeYearlyForecast(inp)
  const scenarios = computeScenarios(inp)
  const driver = computeDriverMetrics(inp, yearly)
  const machine = computeMachineMetrics(inp)
  const partnerNetwork = computePartnerNetwork(inp, yearly)
  const machineScaling = computeOwnMachineScaling(inp)
  const comparison = computeModelComparison(inp)

  const ltv = unit.totalRevenue + unit.floatIncome
  const annualRevenuePerCustomer = ltv / unit.lifetimeDurationYears
  const cacPaybackMonths = annualRevenuePerCustomer > 0
    ? Math.round((inp.cac / annualRevenuePerCustomer) * 12 * 10) / 10
    : Infinity

  const peakRow = yearly.reduce((best, r) => r.activeSubs > best.activeSubs ? r : best, yearly[0] ?? { activeSubs: 0, year: 1 })
  const peakActiveSubs = peakRow?.activeSubs ?? 0
  const peakYear = peakRow?.year ?? 1
  const marketPenetrationPct = (peakActiveSubs / INDIA_4W_FLEET) * 100

  return { unit, utilCurve, cashflow, yearly, scenarios, driver, machine, partnerNetwork, machineScaling, comparison, ltv, cacPaybackMonths, peakActiveSubs, peakYear, marketPenetrationPct }
}
