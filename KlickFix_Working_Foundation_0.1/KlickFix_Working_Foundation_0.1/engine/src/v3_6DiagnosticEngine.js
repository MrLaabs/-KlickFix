// FixIQ Engine v3.6 - Probability Calibration Integration
const { diagnoseV3_5 } = require('./v3_5DiagnosticEngine');
const {
  CALIBRATION_ENGINE_VERSION,
  calibrateRankedCandidates,
  buildReliabilityReport,
  validateOutcomeRecord,
  recordOutcome
} = require('./calibrationEngine');

function diagnoseV3_6(appliance, symptom, answers = {}, context = {}, outcomeRecords = []) {
  const base = diagnoseV3_5(appliance, symptom, answers, context);
  const candidates = calibrateRankedCandidates(base?.probability?.candidates || [], outcomeRecords, context.calibrationOptions || {});
  const top = candidates[0] || null;
  const calibratedAvailable = candidates.some(c => c.calibration?.calibrated);
  return {
    ...base,
    engineVersion: CALIBRATION_ENGINE_VERSION,
    probabilityCalibration: {
      status: calibratedAvailable ? 'calibrated_available' : 'provisional_data_collection',
      candidates,
      topDiagnosis: top,
      rule: 'Probabilities are calibrated only from verified completed repair outcomes; otherwise FixIQ preserves provisional evidence-based probabilities.'
    }
  };
}

module.exports = {
  diagnoseV3_6,
  buildReliabilityReport,
  validateOutcomeRecord,
  recordOutcome,
  CALIBRATION_ENGINE_VERSION
};
