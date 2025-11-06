import { createContext, useContext, useState, useEffect } from "react";
import { http } from "../lib/http";

const ReviewContext = createContext();

export function ReviewProvider({ children }) {
  const [writableReviews, setWritableReviews] = useState([]);
  const [writtenReviews, setWrittenReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const fetchAll = async () => {
    try {
      setLoading(true);
      console.log("📦 후기 목록 불러오기 (JWT 인증)");

      const [writableRes, writtenRes] = await Promise.allSettled([
        http.get(`/api/reviews/available`),
        http.get(`/api/reviews/me`),
      ]);

      setWritableReviews(
        writableRes.status === "fulfilled" && Array.isArray(writableRes.value?.data)
          ? writableRes.value.data
          : []
      );

      setWrittenReviews(
        writtenRes.status === "fulfilled" && Array.isArray(writtenRes.value?.data)
          ? writtenRes.value.data
          : []
      );
    } catch (err) {
      console.error("❌ 후기 목록 불러오기 실패:", err);
      setWritableReviews([]);
      setWrittenReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    const handler = () => fetchAll();
    window.addEventListener("reviewUpdate", handler);
    return () => window.removeEventListener("reviewUpdate", handler);
  }, []);

  const removeWritable = (productId) =>
    setWritableReviews((prev) => prev.filter((r) => r.productId !== productId));

  const addWritten = (review) => {
    if (!review) return;
    setWrittenReviews((prev) => {
      const exists = prev.some((r) => (r.id || r.rid) === (review.id || review.rid));
      return exists ? prev : [review, ...prev];
    });
  };

  return (
    <ReviewContext.Provider
      value={{
        writableReviews,
        writtenReviews,
        removeWritable,
        addWritten,
        loading,
      }}
    >
      {children}
    </ReviewContext.Provider>
  );
}

export const useReview = () => useContext(ReviewContext);
