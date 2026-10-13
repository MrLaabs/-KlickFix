// FixIQ v3.6 - Real Probability Calibration Framework
// Calibration is learned ONLY from verified repair outcomes.
// Until sufficient verified data exists, probabilities remain provisional.

const CALIBRATION_ENGINE_VERSION = '3.6.0';
const DEFAULT_PRIOR = 0.5;
const DEFAULT_STRENGTH = 20;
const MIN_GLOBAL_OUTCOMES = 30;
const MIN_BIN_OUTCOMES = 10;
const BIN_COUNT = 10;

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function finite(n) { return Number.isFinite(Number(n)); }
function normalizeId(v) { return String(v ?? '').trim(); }

function binForProbability(p) {
  const n = clamp(Number(p), 0, 0.999999999);
  return Math.min(BIN_COUNT - 1, Math.floor(n * BIN_COUNT));
}

function isVerifiedOutcome(record) {
  return !!record &&
    normalizeId(record.predictionId) !== '' &&
    normalizeId(record.failureModeId) !== '' &&
    finite(record.predictedProbability) &&
    Number(record.predictedProbability) >= 0 && Number(record.predictedProbability) <= 1 &&
    (record.outcome === 'confirmed' || record.outcome === 'rejected') &&
    record.verificationStatus === 'verified' &&
    record.repairStatus === 'completed' &&
    record.outcomeSource !== 'customer_guess';
}

function validateOutcomeRecord(record) {
  const errors = [];
  if (!record || typeof record !== 'object') errors.push('record must be an object');
  if (!normalizeId(record?.predictionId)) errors.push('predictionId is required');
  if (!normalizeId(record?.failureModeId)) errors.push('failureModeId is required');
  if (!finite(record?.predictedProbability) || Number(record.predictedProbability) < 0 || Number(record.predictedProbability) > 1) errors.push('predictedProbability must be between 0 and 1');
  if (!['confirmed', 'rejected'].includes(record?.outcome)) errors.push('outcome must be confirmed or rejected');
  if (record?.verificationStatus !== 'verified') errors.push('verificationStatus must be verified');
  if (record?.repairStatus !== 'completed') errors.push('repairStatus must be completed');
  return { ok: errors.length === 0, errors };
}

function dedupeVerifiedOutcomes(records) {
  const seen = new Set();
  const accepted = [];
  const rejected = [];
  for (const record of records || []) {
    const validation = validateOutcomeRecord(record);
    const id = normalizeId(record?.predictionId);
    if (!validation.ok) { rejected.push({ record, reason: validation.errors }); continue; }
    if (seen.has(id)) { rejected.push({ record, reason: ['duplicate predictionId'] }); continue; }
    seen.add(id);
    accepted.push(record);
  }
  return { accepted, rejected };
}

function betaPosterior(successes, failures, priorMean = DEFAULT_PRIOR, priorStrength = DEFAULT_STRENGTH) {
  const alpha = Math.max(0.0001, priorMean * priorStrength);
  const beta = Math.max(0.0001, (1 - priorMean) * priorStrength);
  return {
    alpha: alpha + successes,
    beta: beta + failures,
    mean: (alpha + successes) / (alpha + beta + successes * 0 + failures * 0)
  };
}

function buildCalibrationStats(records) {
  const { accepted, rejected } = dedupeVerifiedOutcomes(records);
  const byFailure = new Map();
  const byFailureBin = new Map();
  let totalConfirmed = 0;

  for (const r of accepted) {
    const confirmed = r.outcome === 'confirmed';
    if (confirmed) totalConfirmed++;
    const failureId = normalizeId(r.failureModeId);
    if (!byFailure.has(failureId)) byFailure.set(failureId, { outcomes: 0, confirmed: 0 });
    const f = byFailure.get(failureId);
    f.outcomes++;
    if (confirmed) f.confirmed++;

    const bin = binForProbability(r.predictedProbability);
    const key = `${failureId}::${bin}`;
    if (!byFailureBin.has(key)) byFailureBin.set(key, { failureModeId: failureId, bin, outcomes: 0, confirmed: 0, predictedSum: 0 });
    const b = byFailureBin.get(key);
    b.outcomes++;
    if (confirmed) b.confirmed++;
    b.predictedSum += Number(r.predictedProbability);
  }

  return {
    acceptedCount: accepted.length,
    rejectedCount: rejected.length,
    confirmedCount: totalConfirmed,
    byFailure,
    byFailureBin,
    rejected
  };
}

function posteriorMean(successes, failures, priorMean = DEFAULT_PRIOR, priorStrength = DEFAULT_STRENGTH) {
  const alpha = priorMean * priorStrength;
  const beta = (1 - priorMean) * priorStrength;
  return (alpha + successes) / (alpha + beta + successes + failures);
}

function calibrationForPrediction(prediction, stats, options = {}) {
  const minGlobal = options.minGlobalOutcomes ?? MIN_GLOBAL_OUTCOMES;
  const minBin = options.minBinOutcomes ?? MIN_BIN_OUTCOMES;
  const priorStrength = options.priorStrength ?? DEFAULT_STRENGTH;
  const failureId = normalizeId(prediction.failureModeId);
  const raw = clamp(Number(prediction.predictedProbability), 0, 1);
  const failure = stats.byFailure.get(failureId);
  const bin = binForProbability(raw);
  const bucket = stats.byFailureBin.get(`${failureId}::${bin}`);

  if (!failure || failure.outcomes < minGlobal || !bucket || bucket.outcomes < minBin) {
    return {
      probability: raw,
      status: 'provisional',
      calibrated: false,
      reason: 'Insufficient verified outcomes for statistically defensible calibration.',
      sampleSize: bucket?.outcomes || failure?.outcomes || 0,
      requiredGlobalOutcomes: minGlobal,
      requiredBinOutcomes: minBin
    };
  }

  const empirical = posteriorMean(bucket.confirmed, bucket.outcomes - bucket.confirmed, raw, priorStrength);
  const sampleWeight = bucket.outcomes / (bucket.outcomes + priorStrength);
  const calibrated = clamp(raw * (1 - sampleWeight) + empirical * sampleWeight, 0.001, 0.999);

  return {
    probability: calibrated,
    rawProbability: raw,
    empiricalProbability: empirical,
    status: 'calibrated',
    calibrated: true,
    sampleSize: bucket.outcomes,
    failureModeSampleSize: failure.outcomes,
    bin,
    sampleWeight
  };
}

function buildReliabilityReport(records, options = {}) {
  const stats = buildCalibrationStats(records);
  const bins = Array.from({ length: BIN_COUNT }, (_, bin) => {
    const rows = [];
    for (const bucket of stats.byFailureBin.values()) if (bucket.bin === bin) rows.push(bucket);
    const outcomes = rows.reduce((n, r) => n + r.outcomes, 0);
    const confirmed = rows.reduce((n, r) => n + r.confirmed, 0);
    const predictedSum = rows.reduce((n, r) => n + r.predictedSum, 0);
    return {
      bin,
      lowerBound: bin / BIN_COUNT,
      upperBound: (bin + 1) / BIN_COUNT,
      outcomes,
      observedRate: outcomes ? confirmed / outcomes : null,
      meanPredictedProbability: outcomes ? predictedSum / outcomes : null
    };
  });

  let brierSum = 0;
  let logLossSum = 0;
  for (const r of dedupeVerifiedOutcomes(records).accepted) {
    const p = clamp(Number(r.predictedProbability), 0.000001, 0.999999);
    const y = r.outcome === 'confirmed' ? 1 : 0;
    brierSum += (p - y) ** 2;
    logLossSum += -(y * Math.log(p) + (1 - y) * Math.log(1 - p));
  }
  const n = stats.acceptedCount;
  const global = stats.acceptedCount ? posteriorMean(stats.confirmedCount, stats.acceptedCount - stats.confirmedCount) : null;
  const enough = stats.acceptedCount >= (options.minGlobalOutcomes ?? MIN_GLOBAL_OUTCOMES);

  return {
    engineVersion: CALIBRATION_ENGINE_VERSION,
    status: enough ? 'calibration_ready' : 'data_collection',
    statisticallyCalibrated: enough,
    acceptedOutcomes: stats.acceptedCount,
    rejectedOutcomes: stats.rejectedCount,
    verifiedConfirmationRate: n ? stats.confirmedCount / n : null,
    smoothedGlobalRate: global,
    brierScore: n ? brierSum / n : null,
    logLoss: n ? logLossSum / n : null,
    reliabilityBins: bins,
    failureModes: Array.from(stats.byFailure.entries()).map(([failureModeId, s]) => ({
      failureModeId,
      outcomes: s.outcomes,
      confirmed: s.confirmed,
      observedRate: s.outcomes ? s.confirmed / s.outcomes : null,
      readyForCalibration: s.outcomes >= (options.minGlobalOutcomes ?? MIN_GLOBAL_OUTCOMES)
    }))
  };
}

function calibrateRankedCandidates(candidates, records, options = {}) {
  const stats = buildCalibrationStats(records);
  const calibrated = (candidates || []).map(candidate => {
    const result = calibrationForPrediction({ failureModeId: candidate.id, predictedProbability: candidate.probability / 100 }, stats, options);
    return { ...candidate, rawProbability: candidate.probability, calibratedProbability: Math.round(result.probability * 100), calibration: result };
  });
  // Calibrated values are descriptive probability estimates; ranking is still based on the engine's evidence score.
  return calibrated;
}

function recordOutcome(outcomeStore, record) {
  const validation = validateOutcomeRecord(record);
  if (!validation.ok) return { accepted: false, errors: validation.errors };
  if (!isVerifiedOutcome(record)) return { accepted: false, errors: ['outcome is not eligible for calibration'] };
  const exists = (outcomeStore || []).some(r => r.predictionId === record.predictionId);
  if (exists) return { accepted: false, errors: ['duplicate predictionId'] };
  outcomeStore.push({ ...record });
  return { accepted: true, record };
}

module.exports = {
  CALIBRATION_ENGINE_VERSION,
  MIN_GLOBAL_OUTCOMES,
  MIN_BIN_OUTCOMES,
  BIN_COUNT,
  isVerifiedOutcome,
  validateOutcomeRecord,
  dedupeVerifiedOutcomes,
  buildCalibrationStats,
  calibrationForPrediction,
  buildReliabilityReport,
  calibrateRankedCandidates,
  recordOutcome,
  binForProbability
};
