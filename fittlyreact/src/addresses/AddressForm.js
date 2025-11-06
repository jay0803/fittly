import React, { useEffect, useRef, useState } from "react";

const EMPTY = { name: "", phone: "", zipcode: "", address1: "", address2: "" };
const phoneNormalize = (v) => String(v || "").replace(/[^\d-]/g, "");
const zipNormalize   = (v) => String(v || "").replace(/[^\d]/g, "");

export default function AddressForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(EMPTY);
  const [errs, setErrs] = useState({});
  const postcodeReady = useRef(false);
  const refs = {
    name: useRef(null),
    phone: useRef(null),
    zipcode: useRef(null),
    address1: useRef(null),
    address2: useRef(null),
  };

  useEffect(() => { setForm(initial ?? EMPTY); setErrs({}); }, [initial]);
  useEffect(() => {
    if (window.daum?.Postcode) { postcodeReady.current = true; return; }
    const s = document.createElement("script");
    s.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    s.async = true;
    s.onload = () => { postcodeReady.current = true; };
    document.body.appendChild(s);
  }, []);

  const change = (e) => {
    const { name, value } = e.target;
    let v = value;
    if (name === "phone") v = phoneNormalize(v);
    if (name === "zipcode") v = zipNormalize(v);
    setForm((p) => ({ ...p, [name]: v }));
    setErrs((p) => ({ ...p, [name]: "" }));
  };

  const openPostcode = () => {
    if (!postcodeReady.current) return;
    new window.daum.Postcode({
      oncomplete: (data) => {
        setForm((p) => ({
          ...p,
          zipcode: data.zonecode || "",
          address1: data.roadAddress || data.address || "",
        }));
        setErrs((p) => ({ ...p, zipcode: "", address1: "" }));
        requestAnimationFrame(() => refs.address2.current?.focus());
      },
    }).open();
  };

  const validate = (f) => {
    const e = {};
    const name     = String(f.name || "").trim();
    const phoneRaw = phoneNormalize(f.phone);
    const zipRaw   = zipNormalize(f.zipcode);
    const addr1    = String(f.address1 || "").trim();
    const addr2    = String(f.address2 || "").trim();

    if (!name) e.name = "수령인을 입력해주세요.";
    else if (name.length < 2) e.name = "수령인은 2자 이상 입력하세요.";

    if (!phoneRaw) e.phone = "전화번호를 입력해주세요.";
    else {
      const ok = /^01[0-9]-?\d{3,4}-?\d{4}$/.test(phoneRaw) || /^\d{10,11}$/.test(phoneRaw);
      if (!ok) e.phone = "전화번호 형식을 확인하세요. 예: 010-1234-5678";
    }

    if (!zipRaw) e.zipcode = "우편번호를 입력해주세요.";
    else if (zipRaw.length !== 5) e.zipcode = "우편번호 5자리를 입력하세요.";

    if (!addr1) e.address1 = "주소를 입력해주세요.";

    if (!addr2) e.address2 = "상세주소를 입력해주세요.";
    else if (addr2.length < 2) e.address2 = "상세주소를 2자 이상 입력하세요.";

    return e;
  };

  const focusFirstError = (key) => {
    const el = refs[key]?.current;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => {
      try { el.focus({ preventScroll: true }); } catch { el.focus(); }
    }, 200);
  };

  const submit = (e) => {
    e.preventDefault();
    const next = validate(form);
    if (Object.keys(next).length) {
      setErrs(next);
      const first = ["name","phone","zipcode","address1","address2"].find(k => next[k]);
      if (first) focusFirstError(first);
      return;
    }
    onSubmit?.({
      name: form.name.trim(),
      phone: phoneNormalize(form.phone),
      zipcode: zipNormalize(form.zipcode),
      address1: form.address1.trim(),
      address2: form.address2.trim(),
    });
  };

  return (
    <form className="my-form" onSubmit={submit} noValidate>
      <div className="mp-grid onecol">
        <label>
          수령인
          <input
            ref={refs.name}
            name="name"
            value={form.name}
            onChange={change}
            placeholder="수령인"
            aria-invalid={!!errs.name}
            className={errs.name ? "invalid" : ""}
          />
          {errs.name && <small className="form-error">{errs.name}</small>}
        </label>

        <label>
          전화번호
          <input
            ref={refs.phone}
            name="phone"
            value={form.phone}
            onChange={change}
            placeholder="010-1234-5678"
            aria-invalid={!!errs.phone}
            className={errs.phone ? "invalid" : ""}
          />
        {errs.phone && <small className="form-error">{errs.phone}</small>}
        </label>

        <div className="full">
          <div className="mp-grid" style={{ gridTemplateColumns: "1fr auto", gap: 10 }}>
            <label style={{ margin: 0 }}>
              우편번호
              <input
                ref={refs.zipcode}
                name="zipcode"
                value={form.zipcode}
                onChange={change}
                placeholder="우편번호"
                aria-invalid={!!errs.zipcode}
                className={errs.zipcode ? "invalid" : ""}
              />
              {errs.zipcode && <small className="form-error">{errs.zipcode}</small>}
            </label>
            <button type="button" className="btn btn-postcode" onClick={openPostcode}>주소찾기</button>
          </div>
        </div>

        <label className="full">
          주소
          <input
            ref={refs.address1}
            name="address1"
            value={form.address1}
            onChange={change}
            placeholder="도로명/지번 주소"
            aria-invalid={!!errs.address1}
            className={errs.address1 ? "invalid" : ""}
          />
          {errs.address1 && <small className="form-error">{errs.address1}</small>}
        </label>

        <label className="full">
          상세주소
          <input
            ref={refs.address2}
            name="address2"
            value={form.address2}
            onChange={change}
            placeholder="동/호수 등 상세 주소"
            aria-invalid={!!errs.address2}
            className={errs.address2 ? "invalid" : ""}
          />
          {errs.address2 && <small className="form-error">{errs.address2}</small>}
        </label>
        <button type="submit" className="btn primary block">저장</button>
      </div>
    </form>
  );
}
