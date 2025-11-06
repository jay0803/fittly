import React from 'react';

export default function ShippingInfoForm({ shippingInfo, onChange, onSearchAddress }) {
  return (
    <div className="payment-section">
      <h3>배송지 정보</h3>
      <div className="form-group">
        <label>받는 사람</label>
        <input name="receiverName" value={shippingInfo.receiverName} onChange={onChange} placeholder="이름" />
      </div>
      <div className="form-group">
        <label>연락처</label>
        <input name="phone" value={shippingInfo.phone} onChange={onChange} placeholder="'-' 없이 숫자만 입력" />
      </div>
      <div className="form-group address-group">
        <label>주소</label>
        <div className="zip-row">
          <input name="zipcode" value={shippingInfo.zipcode} placeholder="우편번호" readOnly />
          <button type="button" onClick={onSearchAddress} className="address-search-btn">주소 검색</button>
        </div>
        <input name="address1" value={shippingInfo.address1} placeholder="기본 주소" readOnly />
        <input name="address2" value={shippingInfo.address2} onChange={onChange} placeholder="상세 주소" />
      </div>
    </div>
  );
}