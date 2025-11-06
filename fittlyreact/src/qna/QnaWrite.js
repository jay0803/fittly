import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { http } from "../lib/http";
import "../css/Qna.css";
import OrderSelectModal from "./OrderSelectModal";

const MAIN_CATEGORIES = [
  { key: "배송", label: "배송", subs: ["예약배송", "배송기타", "배송일정"] },
  { key: "주문결제", label: "주문/결제", subs: ["결제수단", "주문결제기타", "주문변경"] },
  { key: "취소교환환불", label: "취소/교환/환불", subs: ["주문취소", "교환", "환불"] },
  { key: "회원정보", label: "회원정보", subs: ["가입", "로그인", "탈퇴"] },
  { key: "상품확인", label: "상품확인", subs: ["상품문의", "불량하자", "AS"] },
  { key: "서비스", label: "서비스", subs: ["후기", "고객센터", "서비스기타", "이벤트"] },
];

const REQUIRE_ORDER_SUBS = ["주문변경", "주문취소", "교환", "환불", "상품문의", "불량하자", "AS"];
const REQUIRE_PRODUCT_SUBS = ["상품문의", "불량하자", "AS"];

export default function QnaWrite() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [params] = useSearchParams();
  const isEdit = Boolean(id);
  const preOrderUid = params.get("orderUid") || "";
  const preProductId = params.get("productId") || "";
  const [mainCat, setMainCat] = useState("");
  const [subCat, setSubCat] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [secret, setSecret] = useState(false);
  const [orderUid, setOrderUid] = useState(preOrderUid);
  const [orderItems, setOrderItems] = useState([]);
  const [productId, setProductId] = useState(preProductId ? Number(preProductId) : null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  useEffect(() => {
    if (!isEdit) return;

    async function fetchQnaDetail() {
      try {
        const q = await http.get(`/api/qna/${id}`);
        setMainCat(q.category || "");
        setSubCat(q.subcategory || "");
        setTitle(q.title || "");
        setContent(q.content || "");
        setOrderUid(q.orderUid || "");
        setSecret(q.secret || false);
        if (q.productId) setProductId(q.productId ?? null);
        if (q.imageUrl) setPreview(q.imageUrl);

        if (q.orderUid && REQUIRE_PRODUCT_SUBS.includes(q.subcategory)) {
          try {
            const res = await http.get(`/api/user/orders/${q.orderUid}/items`);
            const items = Array.isArray(res)
              ? res
              : Array.isArray(res?.data)
              ? res.data
              : [];
            setOrderItems(items);
            console.log("✅ 불러온 주문상품 목록:", items);
          } catch (err) {
            console.warn("주문 상품 목록 불러오기 실패:", err);
          }
        }
      } catch (err) {
        console.error("문의글 조회 실패:", err);
        alert("문의글 조회 중 오류가 발생했습니다.");
      }
    }

    fetchQnaDetail();
  }, [isEdit, id]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!mainCat || !subCat) return alert("문의 유형을 선택해주세요.");
    if (REQUIRE_ORDER_SUBS.includes(subCat) && !orderUid)
      return alert("해당 카테고리는 주문번호 선택이 필수입니다.");
    if (REQUIRE_PRODUCT_SUBS.includes(subCat) && !productId)
      return alert("해당 문의 유형은 상품 선택이 필요합니다.");
    if (!title.trim()) return alert("제목을 입력해주세요.");
    if (!content.trim()) return alert("내용을 입력해주세요.");

    const formData = new FormData();
    formData.append(
      "dto",
      new Blob(
        [
          JSON.stringify({
            id : id,  // 251022_영미
            category: mainCat,
            subcategory: subCat,
            title,
            content,
            orderUid,
            productId,
            secret,
          }),
        ],
        { type: "application/json" }
      )
    );
    console.log('file777:: ', file);
    if (file) formData.append("file", file);

    try {
      if (isEdit) {
        await http.post(`/api/qna/${id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("문의가 수정되었습니다.");
      } else {
        await http.post("/api/qna", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("문의가 등록되었습니다.");
      }
      navigate("/my?tab=qna");
    } catch (err) {
      console.error(err);
      alert(isEdit ? "문의 수정에 실패했습니다." : "문의 등록에 실패했습니다.");
    }
  }

  return (
    <div className="qna-write-wrapper">
      <h2 className="qna-title">{isEdit ? "1:1 문의 수정" : "1:1 문의 작성"}</h2>

      <div className="qna-cat-tabs">
        {MAIN_CATEGORIES.map((c) => (
          <button
            key={c.key}
            className={`cat-btn ${mainCat === c.key ? "active" : ""}`}
            type="button"
            disabled={isEdit}
            onClick={() => {
              setMainCat(c.key);
              if (!isEdit) {
                setSubCat("");
                setOrderUid("");
                setOrderItems([]);
                setProductId(null);
              }
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {mainCat && (
        <div className="qna-subcat">
          <select
            value={subCat}
            disabled={isEdit}
            onChange={(e) => {
              const v = e.target.value;
              setSubCat(v);
              if (!isEdit) {
                setOrderUid("");
                setOrderItems([]);
                setProductId(null);
              }
            }}
          >
            <option value="">문의 유형을 선택해주세요</option>
            {MAIN_CATEGORIES.find((c) => c.key === mainCat)?.subs.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="qna-field">
        <label>제목 *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력해주세요"
        />
      </div>

      {REQUIRE_ORDER_SUBS.includes(subCat) && (
        <div className="qna-field">
          <label>주문번호 *</label>
          <div className="order-select">
            <input
              type="text"
              value={orderUid}
              readOnly
              placeholder="주문번호를 선택해주세요"
              className="order-input"
            />
            {!isEdit && (
              <button
                type="button"
                className="order-btn"
                onClick={() => setShowOrderModal(true)}
              >
                조회
              </button>
            )}
          </div>
        </div>
      )}

      {orderUid && REQUIRE_PRODUCT_SUBS.includes(subCat) && (
        <div className="qna-field">
          <label>상품 선택 *</label>
          <select
            value={productId || ""}
            onChange={(e) =>
              setProductId(e.target.value ? Number(e.target.value) : null)
            }
          >
            <option value="">상품을 선택하세요</option>
            {orderItems.map((it) => (
              <option key={it.productId} value={it.productId}>
                {it.productName} (x{it.quantity})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="qna-field">
        <label>내용</label>
        <textarea
          rows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="문의 내용을 작성해주세요."
        />
      </div>

      <div className="qna-field">
        <label>첨부 이미지</label>
        <input type="file" accept="image/*" onChange={handleFileChange} />
        {preview && <img src={preview} alt="preview" className="qna-preview" />}
      </div>

      <div className="qna-field">
        <label>비밀글 설정</label>
        <label className="secret-checkbox">
          <input
            type="checkbox"
            checked={secret}
            onChange={(e) => setSecret(e.target.checked)}
          />
          <span>작성자와 관리자만 볼 수 있습니다.</span>
        </label>
      </div>

      <div className="qna-actions">
        <button type="button" className="btn cancel" onClick={() => navigate("/my")}>
          취소
        </button>
        <button type="submit" className="btn apply" onClick={handleSubmit}>
          {isEdit ? "수정하기" : "작성하기"}
        </button>
      </div>

      {showOrderModal && (
        <OrderSelectModal
          onClose={() => setShowOrderModal(false)}
          onSelect={({ orderUid: uid, items }) => {
            setOrderUid(uid);
            setOrderItems(Array.isArray(items) ? items : []);
            setProductId(null);
            setShowOrderModal(false);
          }}
        />
      )}
    </div>
  );
}
