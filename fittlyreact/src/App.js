import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import "./css/auth.css";
import { AuthProvider } from "./contexts/AuthContext";
import { WishlistProvider } from "./wishlist/WishlistContext";
import { CartProvider } from "./cart/CartContext";
import TopHeader from "./pages/TopHeader";
import Footer from "./pages/Footer";
import PublicOnlyRoute from "./guards/PublicOnlyRoute";
import RequireAuth from "./guards/RequireAuth";
import MainPage from "./pages/MainPage";
import MyPage from "./pages/MyPage";
import Signup from "./pages/auth/signup";
import VerifyEmail from "./pages/auth/verifyEmail";
import LoginUser from "./pages/auth/loginUser";
import LoginAdmin from "./pages/auth/loginAdmin";
import FindId from "./pages/auth/findId";
import FindPw from "./pages/auth/findPw";
import ResetPassword from "./pages/auth/resetPassword";
import SignComplete from "./pages/auth/signupComplete";
import AdminUserList from "./pages/admin/AdminUserList";
import AdminQnaList from "./qna/admin/AdminQnaList";
import AdminQnaDetail from "./qna/admin/AdminQnaDetail";
import QnA from "./qna/Qna";
import QnaWrite from "./qna/QnaWrite";
import QnaDetail from "./qna/QnaDetail";
import NoticeList from "./notice/NoticeList";
import NoticeDetail from "./notice/NoticeDetail";
import NoticeWrite from "./notice/NoticeWrite";
import NoticeEdit from "./notice/NoticeEdit";
import FaqList from "./faq/FaqList";
import FaqDetail from "./faq/FaqDetail";
import FaqWrite from "./faq/FaqWrite";
import FaqEdit from "./faq/FaqEdit";
import AdminProductHub from "./product/AdminProductHub";
import ManageProductsPage from "./product/ManageProductsPage";
import AdminProductEditPage from "./product/AdminProductEditPage";
import AdminProductPage from "./product/AdminProductPage";
import ProductDetailPage from "./product/ProductDetailPage";
import OrderHistoryPage from "./order/OrderHistoryPage";
import OrderDetailPage from "./order/OrderDetailPage";
import PaymentPage from "./pay/PaymentPage";
import PaymentSuccessPage from "./pay/PaymentSuccessPage";
import WishlistPage from "./wishlist/WishlistPage";
import CartPage from "./cart/CartPage";
import CategoryPage from "./pages/CategoryPage";
import SearchResultsPage from "./product/SearchResultsPage";
import AdminReviewList from "./review/admin/AdminReviewList";
import AiVisionPage from "./pages/ai/AiVisionPage";

export const __APP_FILE__ = true;

const Aicommend = lazy(() => import("./pages/ai/Aicommend"));

function LegacyOrderRedirect() {
  const { orderId } = useParams();
  return <Navigate to={`/orders/${orderId}`} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <WishlistProvider>
        <CartProvider>
          <BrowserRouter>
            <TopHeader />
            <main style={{ minHeight: "80vh" }}>
              <Suspense fallback={<div style={{ padding: 24 }}>불러오는 중…</div>}>
                <Routes>
                  <Route path="/" element={<MainPage />} />
                  <Route path="/ai/commend" element={<Aicommend />} />
                  <Route path="/ai/vision" element={<RequireAuth><AiVisionPage /></RequireAuth>} />
                  <Route path="/ai" element={<Navigate to="/ai/vision" replace />} />
                  <Route
                    path="/my"
                    element={
                      <RequireAuth>
                        <MyPage />
                      </RequireAuth>
                    }
                  />

                  <Route path="/signup" element={<Signup />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/auth/find-id" element={<FindId />} />
                  <Route path="/auth/find-pw" element={<FindPw />} />
                  <Route path="/auth/reset-password" element={<ResetPassword />} />
                  <Route path="/auth/sign-complete" element={<SignComplete />} />
                  <Route path="/auth/signup-complete" element={<SignComplete />} />
                  <Route
                    path="/login/user"
                    element={
                      <PublicOnlyRoute>
                        <LoginUser />
                      </PublicOnlyRoute>
                    }
                  />
                  <Route
                    path="/login/admin"
                    element={
                      <PublicOnlyRoute>
                        <LoginAdmin />
                      </PublicOnlyRoute>
                    }
                  />

                  <Route path="/auth" element={<Navigate to="/login/user" replace />} />
                  <Route path="/auth/signup" element={<Navigate to="/signup" replace />} />
                  <Route path="/findid" element={<Navigate to="/auth/find-id" replace />} />
                  <Route path="/findpw" element={<Navigate to="/auth/find-pw" replace />} />
                  <Route path="/notice" element={<NoticeList />} />
                  <Route path="/notice/:id" element={<NoticeDetail />} />
                  <Route
                    path="/notice/write"
                    element={
                      <RequireAuth role="ROLE_ADMIN">
                        <NoticeWrite />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/notice/edit/:id"
                    element={
                      <RequireAuth role="ROLE_ADMIN">
                        <NoticeEdit />
                      </RequireAuth>
                    }
                  />

                <Route
                    path="/admin/reviews"
                    element={
                      <RequireAuth role="ROLE_ADMIN">
                        <AdminReviewList />
                      </RequireAuth>
                    }
                  />

                  <Route path="/faq" element={<FaqList />} />
                  <Route path="/faq/:id" element={<FaqDetail />} />
                  <Route
                    path="/faq/write"
                    element={
                      <RequireAuth role="ROLE_ADMIN">
                        <FaqWrite />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/faq/:id/edit"
                    element={
                      <RequireAuth role="ROLE_ADMIN">
                        <FaqEdit />
                      </RequireAuth>
                    }
                  />

                  <Route
                    path="/qna"
                    element={
                      <RequireAuth>
                        <QnA />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/qna/write"
                    element={
                      <RequireAuth>
                        <QnaWrite />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/qna/write/:id"
                    element={
                      <RequireAuth>
                        <QnaWrite />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/qna/:id"
                    element={
                      <RequireAuth>
                        <QnaDetail />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/admin/qna"
                    element={
                      <RequireAuth role="ROLE_ADMIN">
                        <AdminQnaList />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/admin/qna/:id"
                    element={
                      <RequireAuth role="ROLE_ADMIN">
                        <AdminQnaDetail />
                      </RequireAuth>
                    }
                  />

                  {/* 관리자 */}
                  <Route
                    path="/admin"
                    element={
                      <RequireAuth role="ROLE_ADMIN">
                        <Navigate to="/admin/products/hub" replace />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/admin/products/hub"
                    element={
                      <RequireAuth role="ROLE_ADMIN">
                        <AdminProductHub />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/admin/products/manage"
                    element={
                      <RequireAuth role="ROLE_ADMIN">
                        <ManageProductsPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/admin/products/:id/edit"
                    element={
                      <RequireAuth role="ROLE_ADMIN">
                        <AdminProductEditPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/admin/products"
                    element={
                      <RequireAuth role="ROLE_ADMIN">
                        <AdminProductPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/admin/users"
                    element={
                      <RequireAuth role="ROLE_ADMIN">
                        <AdminUserList />
                      </RequireAuth>
                    }
                  />

                  <Route path="/products/:id" element={<ProductDetailPage />} />
                  <Route path="/category/:cat" element={<CategoryPage />} />
                  <Route
                    path="/wishlist"
                    element={
                      <RequireAuth>
                        <WishlistPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/cart"
                    element={
                      <RequireAuth>
                        <CartPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/payment"
                    element={
                      <RequireAuth>
                        <PaymentPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/payment/success"
                    element={
                      <RequireAuth>
                        <PaymentSuccessPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/orders"
                    element={
                      <RequireAuth>
                        <OrderHistoryPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/orders/:orderId"
                    element={
                      <RequireAuth>
                        <OrderDetailPage />
                      </RequireAuth>
                    }
                  />
                  <Route path="/mypage/orders/:orderId" element={<LegacyOrderRedirect />} />
                  <Route path="/search" element={<SearchResultsPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </main>
            <Footer />
          </BrowserRouter>
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  );
}
