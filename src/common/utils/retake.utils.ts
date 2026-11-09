/**
 * "Retake until pass": once a learner has used every attempt the admin allowed
 * (`test.attempts`) without passing, they may keep starting new attempts until
 * one passes. A learner who has passed is held to the configured limit as before.
 *
 * On by default. Set RETAKE_UNTIL_PASS=false to enforce `test.attempts` strictly.
 */
export const isRetakeUntilPassEnabled = (): boolean =>
    String(process.env.RETAKE_UNTIL_PASS ?? 'true').toLowerCase() !== 'false';
