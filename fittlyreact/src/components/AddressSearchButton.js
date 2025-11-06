import { useEffect } from "react";

export default function AddressSearchButton({ onSelected, className = "", style }) {
  useEffect(() => {
    const ID = "daum-postcode-script";
    if (document.getElementById(ID)) return;
    const s = document.createElement("script");
    s.id = ID;
    s.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    s.async = true;
    document.body.appendChild(s);
  }, []);

  const openPostcode = () => {
    if (!window.daum || !window.daum.Postcode) {
      alert("주소 검색 스크립트를 아직 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    new window.daum.Postcode({
      oncomplete: (data) => {
        const zonecode = data.zonecode;
        const addr = data.roadAddress || data.jibunAddress;
        onSelected?.({ zonecode, address1: addr });
      },
    }).open();
  };

  const classes = className.trim()
    ? className
    : "sc-btn sc-btn-outline zip-btn";

  return (
    <button type="button" onClick={openPostcode} className={classes} style={style}>
      주소 검색
    </button>
  );
}
