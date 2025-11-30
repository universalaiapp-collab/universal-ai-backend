// scripts/walletDoctor.js
//
// Purpose:
//  - Scan all wallets and report any mismatches where
//    credits !== startingBalance + sum(ledger).
//  - Print suggested repairs (but do NOT modify DB).
//
// Usage:
//   node scripts/walletDoctor.js
//   MONGO_URI="mongodb://..." node scripts/walletDoctor.js
//
// Notes:
//  - startingBalance is read from wallet.startingBalance if present,
//    otherwise defaults to 10000 (change below if your real starting differs).
//  - Output is printed to stdout line-by-line; redirect to a log file if desired.

const mongoose = require('mongoose');

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/universal-ai';
const DEFAULT_STARTING_BALANCE = 10000; // adjust if your system used a different starting balance

(async function main() {
  try {
    await mongoose.connect(MONGO, {});
    const Wallet = mongoose.models.Wallet ||
      mongoose.model('Wallet', new mongoose.Schema({}, { strict: false }), 'wallets');

    console.log(`[walletDoctor] Connected to ${MONGO}`);
    console.log(`[walletDoctor] Starting audit at ${new Date().toISOString()}`);

    const cursor = Wallet.find().cursor();
    let total = 0;
    let mismatches = 0;

    for await (const w of cursor) {
      total++;
      const userId = w.userId || (w._id ? String(w._id) : `<no-id-${total}>`);
      const ledger = Array.isArray(w.ledger) ? w.ledger : [];
      const ledgerSum = ledger.reduce((s, e) => s + (Number(e && e.amount) || 0), 0);
      const starting = (w.startingBalance != null) ? Number(w.startingBalance) : DEFAULT_STARTING_BALANCE;
      const expected = Number((starting + ledgerSum).toFixed(12));
      const credits = Number((w.credits || 0).toFixed(12));

      if (Math.abs(credits - expected) > 1e-9) {
        mismatches++;
        const out = {
          userId,
          _id: w._id ? String(w._id) : undefined,
          credits,
          expected,
          ledgerSum,
          starting,
          ledgerCount: ledger.length
        };
        // Machine-friendly single-line JSON
        console.log(JSON.stringify({ type: 'MISMATCH', at: new Date().toISOString(), payload: out }));
        // Human-friendly suggestion
        console.log('[walletDoctor] SUGGESTION: To repair run: node scripts\\repairWalletCredits.js ' + userId);
      }
    }

    console.log(`[walletDoctor] Scan complete. wallets_scanned=${total} mismatches=${mismatches}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[walletDoctor] fatal error:', err && err.stack ? err.stack : err);
    try { await mongoose.disconnect(); } catch (_) {}
    process.exit(2);
  }
})();
