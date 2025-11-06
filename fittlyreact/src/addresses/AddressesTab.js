import React, { useMemo, useState } from "react";
import useAddresses from "../../addresses/useAddresses";
import AddressForm from "../../addresses/AddressForm";
import { getAuth } from "../../auth";

export default function AddressesTab() {
  const { items, loading, err, add, update, remove, setDefault } = useAddresses();
  const [editing, setEditing] = useState(null);

  const userLabel = useMemo(() => {
    const a = getAuth?.();
    return a?.loginId ?? a?.id ?? "guest";
  }, []);

  const handleAdd = async (dto) => {
    await add(dto);
    setEditing(null);
  };
  const handleUpdate = async (dto) => {
    await update(editing.id, dto);
    setEditing(null);
  };

  return (
    <>
      <section className="my-card my-section addr-list-card">
        <h2>배송지 관리</h2>

        {loading && <div className="empty">불러오는 중…</div>}
        {err && <div className="error">{String(err)}</div>}
        {!loading && items.length === 0 && (
          <div className="empty">등록된 배송지가 없습니다.</div>
        )}

        {!loading && items.length > 0 && (
          <ul className="addr-list">
            {items.map((a) => (
              <li key={a.id} className={`addr-item ${a.isDefault ? "is-default" : ""}`}>
                <div className="addr-head">
                  <strong className="receiver">{a.name}</strong>
                  {a.isDefault && <span className="badge">기본</span>}
                </div>

                <div className="addr-body">
                  <div className="line">{a.phone}</div>
                  <div className="line">({a.zipcode}) {a.address1} {a.address2}</div>
                </div>

                <div className="addr-actions">
                  {!a.isDefault && (
                    <button type="button" className="btn" onClick={() => setDefault(a.id)}>
                      기본설정
                    </button>
                  )}
                  <button type="button" className="btn" onClick={() => setEditing(a)}>
                    수정
                  </button>
                  <button
                    type="button"
                    className="btn danger"
                    onClick={() => remove(a.id)}
                  >
                    삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="my-card my-section addr-create">
        <h2>{editing ? "배송지 수정" : "배송지 추가"}</h2>
        <AddressForm
          initial={editing ?? undefined}
          onSubmit={editing ? handleUpdate : handleAdd}
          onCancel={() => setEditing(null)}
        />
      </section>
    </>
  );
}
