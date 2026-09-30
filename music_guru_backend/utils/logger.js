const info = (msg, ...args) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, ...args);
const error = (msg, ...args) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, ...args);
const warn = (msg, ...args) => console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`, ...args);

module.exports = {
  info,
  error,
  warn
};
