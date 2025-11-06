
import { http } from "../lib/http";

export const addressApi = {
  list: () => http.get("/addresses"),
  create: (dto) => http.post("/addresses", dto),
  update: (id, dto) => http.put(`/addresses/${id}`, dto),
  remove: (id) => http.delete(`/addresses/${id}`),
  setDefault: (id) => http.patch(`/addresses/${id}/default`)
};
