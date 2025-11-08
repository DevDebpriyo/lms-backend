"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FREE_PLAN_LIMIT = void 0;
exports.currentMonthWindow = currentMonthWindow;
exports.countCharsFromBody = countCharsFromBody;
exports.remainingAfter = remainingAfter;
exports.FREE_PLAN_LIMIT = 50000; // characters per calendar month
function currentMonthWindow(reference = new Date()) {
    const start = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() + 1, 1, 0, 0, 0, 0));
    return { start, end };
}
function countCharsFromBody(body) {
    // Sum lengths of all string fields in the payload (shallow + nested)
    const seen = new Set();
    function walk(val) {
        if (val == null)
            return 0;
        if (typeof val === 'string')
            return [...val].length; // Unicode code points
        if (typeof val !== 'object')
            return 0;
        if (seen.has(val))
            return 0;
        seen.add(val);
        if (Array.isArray(val))
            return val.reduce((sum, v) => sum + walk(v), 0);
        return Object.values(val).reduce((sum, v) => sum + walk(v), 0);
    }
    return walk(body);
}
function remainingAfter(limit, used, nextCount) {
    const rem = limit - used - nextCount;
    return rem > 0 ? rem : 0;
}
