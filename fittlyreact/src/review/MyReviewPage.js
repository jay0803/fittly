import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import ReviewWriteableList from "./ReviewWriteableList";
import ReviewWrittenList from "./ReviewWrittenList";
import ReviewForm from "./ReviewForm";
import "../css/MyReviewPage.css";

export default function MyReviewPage() {
  const [activeTab, setActiveTab] = useState("writeable");
  const location = useLocation();
  const product = location.state?.product;
  const [formProduct, setFormProduct] = useState(product || null);
  const handleSubmitSuccess = () => {
    setFormProduct(null);
    setActiveTab("written");
  };

  return (
    <section className="my-review-page">
      <div className="myreview-tabs">
        <button
          className={`myreview-tab ${activeTab === "writeable" ? "active" : ""}`}
          onClick={() => {
            setFormProduct(null);
            setActiveTab("writeable");
          }}
        >
          작성 가능한 리뷰
        </button>
        <button
          className={`myreview-tab ${activeTab === "written" ? "active" : ""}`}
          onClick={() => {
            setFormProduct(null);
            setActiveTab("written");
          }}
        >
          작성한 리뷰
        </button>
      </div>

      <div className="myreview-content">
        {formProduct ? (
          <ReviewForm
            product={formProduct}
            onSubmit={handleSubmitSuccess}
          />
        ) : activeTab === "writeable" ? (
          <ReviewWriteableList onWriteReview={setFormProduct} />
        ) : (
          <ReviewWrittenList />
        )}
      </div>
    </section>
  );
}
