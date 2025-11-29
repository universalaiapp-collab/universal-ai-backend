// src/models/wallet.model.ts
// Robust in-memory Wallet model for local dev.
// Supports create, findOne(query).lean(), findById(id).lean(), findOneAndUpdate(query, update, options)
// Query supports simple operators: $gte, $lte, $gt, $lt, $eq
// Note: credits/reserved typed as 'any' to allow operator objects like { $gte: X }.

type WalletDoc = {
  _id: string;
  userId?: string;
  credits?: any;   // allow operator objects
  reserved?: any;  // allow operator objects
  [k: string]: any;
};

const store = new Map<string, WalletDoc>();

function genId() {
  return Math.floor(Math.random() * 1e9).toString();
}

function matchValue(fieldValue: any, queryValue: any): boolean {
  if (queryValue === null || typeof queryValue !== "object") {
    return fieldValue === queryValue;
  }
  if (queryValue?.$gte !== undefined) return (fieldValue ?? 0) >= queryValue.$gte;
  if (queryValue?.$lte !== undefined) return (fieldValue ?? 0) <= queryValue.$lte;
  if (queryValue?.$gt !== undefined) return (fieldValue ?? 0) > queryValue.$gt;
  if (queryValue?.$lt !== undefined) return (fieldValue ?? 0) < queryValue.$lt;
  if (queryValue?.$eq !== undefined) return fieldValue === queryValue.$eq;
  // fallback shallow equality
  return fieldValue === queryValue;
}

function matches(doc: WalletDoc, query: Partial<WalletDoc>): boolean {
  for (const k of Object.keys(query)) {
    const qv = (query as any)[k];
    const fv = (doc as any)[k];
    if (!matchValue(fv, qv)) return false;
  }
  return true;
}

function chainableLean<T>(promise: Promise<T>) {
  return {
    lean() {
      return promise;
    },
    then: (onfulfilled: any, onrejected?: any) => (promise as any).then(onfulfilled, onrejected),
    catch: (onrejected: any) => (promise as any).catch(onrejected),
  } as any;
}

const WalletModel = {
  async create(doc: Partial<WalletDoc>) {
    const id = doc._id ?? genId();
    const item: WalletDoc = {
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
  findOne(query: Partial<WalletDoc>): any {
    const p = (async () => {
      for (const v of store.values()) {
        if (matches(v, query)) return v;
      }
      return null;
    })();
    return chainableLean(p);
  },

  findById(id: string): any {
    const p = (async () => {
      const v = store.get(id) ?? null;
      return v;
    })();
    return chainableLean(p);
  },

  async findOneAndUpdate(query: Partial<WalletDoc>, update: Partial<WalletDoc>, options?: { new?: boolean; upsert?: boolean }) {
    let found: WalletDoc | null = null;
    for (const v of store.values()) {
      if (matches(v, query)) {
        found = v;
        break;
      }
    }
    if (!found && options?.upsert) {
      const created = await WalletModel.create({ ...(query as any), ...(update as any) });
      return created;
    }
    if (!found) return null;
    const updated = { ...found, ...(update as any) };
    store.set(updated._id, updated);
    return updated;
  },

  _dumpAll() {
    return Array.from(store.values());
  },
};

export default WalletModel;
