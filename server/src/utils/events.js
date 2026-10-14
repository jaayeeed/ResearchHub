/**
 * Tiny in-process event bus so features stay decoupled (Maintainability NFR).
 * Example: when a profile changes, the recommendation module (FR-04) clears
 * its cache — without the profile code needing to know that module exists.
 *
 * Events:
 *   'profile:changed'  (userId)  — profile, skills or interests were updated
 */
const { EventEmitter } = require('events');

const events = new EventEmitter();
events.setMaxListeners(20);

module.exports = events;
