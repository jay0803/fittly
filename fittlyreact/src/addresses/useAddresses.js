import { useCallback, useEffect, useState } from "react";
import { addressApi } from "./addressApi.js";

export default function useAddresses() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setErr("");
      const data = await addressApi.list();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr("주소 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const add = useCallback(async (dto) => {
    await addressApi.create(dto);
    await reload();
  }, [reload]);

  const update = useCallback(async (id, dto) => {
    await addressApi.update(id, dto);
    await reload();
  }, [reload]);

  const remove = useCallback(async (id) => {
    await addressApi.remove(id);
    setItems(prev => prev.filter(x => x.id !== id));
  }, []);

  const setDefault = useCallback(async (id) => {
    await addressApi.setDefault(id);
    await reload();
  }, [reload]);

  return { items, loading, err, add, update, remove, setDefault, reload };
}
