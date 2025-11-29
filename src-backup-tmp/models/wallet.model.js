"use strict";
// src/models/wallet.model.ts
// Robust in-memory Wallet model for local dev.
// Supports create, findOne(query).lean(), findById(id).lean(), findOneAndUpdate(query, update, options)
// Query supports simple operators: $gte, $lte, $gt, $lt, $eq
// Note: credits/reserved typed as 'any' to allow operator objects like { $gte: X }.
Object.defineProperty(exports, "__esModule", { value: true });
const store = new Map();
function genId() {
    return Math.floor(Math.random() * 1e9).toString();
}
function matchValue(fieldValue, queryValue) {
    if (queryValue === null || typeof queryValue !== "object") {
        return fieldValue === queryValue;
    }
    if (queryValue?.$gte !== undefined)
        return (fieldValue ?? 0) >= queryValue.$gte;
    if (queryValue?.$lte !== undefined)
        return (fieldValue ?? 0) <= queryValue.$lte;
    if (queryValue?.$gt !== undefined)
        return (fieldValue ?? 0) > queryValue.$gt;
    if (queryValue?.$lt !== undefined)
        return (fieldValue ?? 0) < queryValue.$lt;
    if (queryValue?.$eq !== undefined)
        return fieldValue === queryValue.$eq;
    // fallback shallow equality
    return fieldValue === queryValue;
}
function matches(doc, query) {
    for (const k of Object.keys(query)) {
        const qv = query[k];
        const fv = doc[k];
        if (!matchValue(fv, qv))
            return false;
    }
    return true;
}
function chainableLean(promise) {
    return {
        lean() {
            return promise;
        },
        then: (onfulfilled, onrejected) => promise.then(onfulfilled, onrejected),
        catch: (onrejected) => promise.catch(onrejected),
    };
}
const WalletModel = {
    async create(doc) {
        const id = doc._id ?? genId();
        const item = {
            _id: id,
            userId: doc.userId,
            credits: doc.credits ?? 0,
            reserved: doc.reserved ?? 0,
            ...doc,
        };
        store.set(id, item);
        return Promise.resolve(item);
    },
    // note: return type is any (chainable)
    findOne(query) {
        const p = (async () => {
            for (const v of store.values()) {
                if (matches(v, query))
                    return v;
            }
            return null;
        })();
        return chainableLean(p);
    },
    findById(id) {
        const p = (async () => {
            const v = store.get(id) ?? null;
            return v;
        })();
        return chainableLean(p);
    },
    async findOneAndUpdate(query, update, options) {
        let found = null;
        for (const v of store.values()) {
            if (matches(v, query)) {
                found = v;
                break;
            }
        }
        if (!found && options?.upsert) {
            const created = await WalletModel.create({ ...query, ...update });
            return created;
        }
        if (!found)
            return null;
        const updated = { ...found, ...update };
        store.set(updated._id, updated);
        return updated;
    },
    _dumpAll() {
        return Array.from(store.values());
    },
};
exports.default = WalletModel;
