// src/models/user.model.ts
// In-memory User model with findOne, findById, create, and chainable .lean()

type UserDoc = {
  _id: string;
  email?: string;
  name?: string;
  [k: string]: any;
};

const userStore = new Map<string, UserDoc>();

function genIdUser() {
  return Math.floor(Math.random() * 1e9).toString();
}

function chainableLean<T>(promise: Promise<T>) {
  return {
    lean() {
      return promise;
    },
    then: (onfulfilled: any, onrejected?: any) => promise.then(onfulfilled, onrejected),
    catch: (onrejected: any) => promise.catch(onrejected),
  } as any;
}

const UserModel = {
  async create(doc: Partial<UserDoc>) {
    const id = doc._id ?? genIdUser();
    const user = { _id: id, ...doc } as UserDoc;
    userStore.set(id, user);
    return Promise.resolve(user);
  },

  findOne(query: Partial<UserDoc>) {
    const p = (async () => {
      for (const v of userStore.values()) {
        let ok = true;
        for (const k of Object.keys(query)) {
          if ((v as any)[k] !== (query as any)[k]) {
            ok = false;
            break;
          }
        }
        if (ok) return v;
      }
      return null;
    })();
    return chainableLean(p);
  },

  findById(id: string) {
    const p = (async () => userStore.get(id) ?? null)();
    return chainableLean(p);
  },

  _dumpAll() {
    return Array.from(userStore.values());
  },
};

export default UserModel;
