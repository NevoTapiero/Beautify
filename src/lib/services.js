import { SERVICES } from "../data/mock";

let SERVICE_INDEX = [...SERVICES];

export const setServiceIndex = (list) => { SERVICE_INDEX = [...list, ...SERVICES]; };
export const svc = (id) => SERVICE_INDEX.find((s) => s.id === id);
