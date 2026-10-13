const assert = require('assert');
const {
  CALIBRATION_ENGINE_VERSION,
  validateOutcomeRecord,
  dedupeVerifiedOutcomes,
  buildReliabilityReport,
  calibrationForPrediction,
  recordOutcome
} = require('../src/calibrationEngine');
const { diagnoseV3_6 } = require('../src/v3_6DiagnosticEngine');

assert.equal(CALIBRATION_ENGINE_VERSION, '3.6.0');
assert.equal(validateOutcomeRecord({}).ok, false);

const records = [];
for (let i = 0; i < 40; i++) {
  records.push({
    predictionId: `p-${i}`,
    failureModeId: 'dryer_heating_element',
    predictedProbability: i < 20 ? 0.8 : 0.7,
    outcome: i < 30 ? 'confirmed' : 'rejected',
    verificationStatus: 'verified',
    repairStatus: 'completed',
    outcomeSource: 'technician_verified'
  });
}
records.push(records[0]);
const deduped = dedupeVerifiedOutcomes(records);
assert.equal(deduped.accepted.length, 40);
assert.equal(deduped.rejected.length, 1);

const report = buildReliabilityReport(records);
assert.equal(report.status, 'calibration_ready');
assert.equal(report.statisticallyCalibrated, true);
assert.ok(report.brierScore >= 0);
assert.ok(report.logLoss >= 0);

const stats = require('../src/calibrationEngine').buildCalibrationStats(records);
const cal = calibrationForPrediction({ failureModeId: 'dryer_heating_element', predictedProbability: 0.8 }, stats);
assert.equal(cal.status, 'calibrated');
assert.equal(cal.calibrated, true);
assert.ok(cal.probability >= 0 && cal.probability <= 1);

const sparse = records.slice(0, 9);
const sparseStats = require('../src/calibrationEngine').buildCalibrationStats(sparse);
const provisional = calibrationForPrediction({ failureModeId: 'dryer_heating_element', predictedProbability: 0.8 }, sparseStats);
assert.equal(provisional.calibrated, false);
assert.equal(provisional.probability, 0.8);

const store = [];
assert.equal(recordOutcome(store, records[0]).accepted, true);
assert.equal(recordOutcome(store, records[0]).accepted, false);
assert.equal(recordOutcome(store, { ...records[1], outcomeSource: 'customer_guess', predictionId: 'bad-1' }).accepted, false);

const diagnosis = diagnoseV3_6('dryer', 'no_heat', {}, {}, records);
assert.equal(diagnosis.engineVersion, '3.6.0');
assert.ok(diagnosis.probabilityCalibration);
assert.ok(Array.isArray(diagnosis.probabilityCalibration.candidates));

console.log('FixIQ v3.6 probability calibration tests passed.');
