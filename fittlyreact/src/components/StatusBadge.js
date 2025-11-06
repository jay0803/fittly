import React from "react";

export default function StatusBadge({ status }) {
  const MAP = {
    PAID:       { label: '결제완료', className: 'badge-paid' },
    PREPARING:  { label: '배송준비중', className: 'badge-preparing' },
    SHIPPING:   { label: '배송중', className: 'badge-shipping' },
    DELIVERED:  { label: '배송완료', className: 'badge-delivered' },
    CANCELED:   { label: '취소', className: 'badge-canceled' },
    REFUNDED:   { label: '환불', className: 'badge-refunded' },
  };
  const s = MAP[status] || { label: status, className: 'badge-default' };
  return <span className={`badge ${s.className}`}>{s.label}</span>;
}
