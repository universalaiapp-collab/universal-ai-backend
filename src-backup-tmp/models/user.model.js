"use strict";
// src/models/user.model.ts
// In-memory User model with findOne, findById, create, and chainable .lean()
Object.defineProperty(exports, "__esModule", { value: true });
const userStore = new Map();
function genIdUser() {
    return Math.floor(Math.random() * 1e9).toString();
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
const UserModel = {
    async create(doc) {
        const id = doc._id ?? genIdUser();
        const user = { _id: id, ...doc };
        userStore.set(id, user);
        return Promise.resolve(user);
    },
    findOne(query) {
        const p = (async () => {
            for (const v of userStore.values()) {
                let ok = true;
                for (const k of Object.keys(query)) {
                    if (v[k] !== query[k]) {
                        ok = false;
                        break;
                    }
                }
                if (ok)
                    return v;
            }
            return null;
        })();
        return chainableLean(p);
    },
    findById(id) {
        const p = (async () => userStore.get(id) ?? null)();
        return chainableLean(p);
    },
    _dumpAll() {
        return Array.from(userStore.values());
    },
};
exports.default = UserModel;
