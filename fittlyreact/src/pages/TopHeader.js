import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../css/TopHeader.css";
import { clearAuth, getAuth } from "../lib/jwt";

export default function TopHeader({ forceVariant }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState("guest");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const searchWrapRef = useRef(null);
  const inputRef = useRef(null);

  const readRole = useCallback(() => {
    const { role } = getAuth();
    if (role === "ROLE_USER" || role === "USER") setRole("member");
    else if (role === "ROLE_ADMIN" || role === "ADMIN") setRole("admin");
    else setRole("guest");
  }, []);

  useEffect(() => {
    readRole();
    const onAuthChanged = () => readRole();
    window.addEventListener("authChange", onAuthChanged);
    return () => window.removeEventListener("authChange", onAuthChanged);
  }, [readRole]);

  useEffect(() => {
    readRole();
    setSearchOpen(false);
    setDrawerOpen(false);
  }, [location.pathname, readRole]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!searchOpen) return;
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [searchOpen]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = drawerOpen ? "hidden" : prev || "";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [drawerOpen]);

  const variant = forceVariant || role;
  const menusByVariant = {
    guest: [
      { type: "link", label: "로그인", to: "/login/user" },
      { type: "link", label: "회원가입", to: "/signup" },
      {
        type: "link",
        label: "고객센터",
        to: "/notice",
        children: [
          { label: "공지사항", to: "/notice" },
          { label: "FAQ", to: "/faq" },
        ],
      },
      { type: "search" },
    ],
    member: [
      { type: "link", label: "내 정보", to: "/my" },
      { type: "link", label: "찜 목록", to: "/wishlist" },
      { type: "link", label: "장바구니", to: "/cart" },
      {
        type: "link",
        label: "고객센터",
        to: "/notice",
        children: [
          { label: "공지사항", to: "/notice" },
          { label: "FAQ", to: "/faq" },
        ],
      },
      { type: "logout", label: "로그아웃" },
      { type: "search" },
    ],
    admin: [
      {
        type: "link",
        label: "고객센터",
        to: "/notice",
        children: [
          { label: "공지사항", to: "/notice" },
          { label: "FAQ", to: "/faq" },
          { label: "문의관리", to: "/admin/qna" },
        ],
      },
      { type: "link", label: "회원목록", to: "/admin/users" },
      { type: "link", label: "상품관리", to: "/admin/products/hub" },
      { type: "link", label: "리뷰관리", to: "/admin/reviews" },
      { type: "logout", label: "로그아웃" },
    ],
  };
  const menus = menusByVariant[variant] ?? menusByVariant.guest;
  const isActive = (to) => {
    if (!to) return false;
    if (to === "/") return location.pathname === "/";
    return location.pathname.startsWith(to);
  };

  const submitSearch = () => {
    const q = (searchQuery || "").trim();
    if (!q) {
      setSearchOpen(false);
      return;
    }
    navigate(`/search?q=${encodeURIComponent(q)}`);
    setSearchOpen(false);
  };

  const handleToggleSearch = () => {
    setSearchOpen((prev) => {
      const next = !prev;
      if (next) setTimeout(() => inputRef.current?.focus(), 0);
      return next;
    });
  };

  const handleLogout = () => {
    clearAuth();
    window.dispatchEvent(new Event("authChange"));
    alert("로그아웃 되었습니다.");
    navigate("/");
  };

  return (
    <>
      <header className="topheader">
        <div className="topheader-inner">
          <h1 className="logo">
            <Link to="/" className="logo-link">
              FITTLY
            </Link>
          </h1>

          <nav
            ref={searchWrapRef}
            className={`util ${searchOpen ? "search-open" : ""}`}
            aria-label="상단 메뉴"
          >
            {menus.map((item, idx) =>
              item.type === "link" ? (
                <div key={idx} className="menu-with-children">
                  <Link
                    to={item.to}
                    className={`util-item link${isActive(item.to) ? " active" : ""}`}
                  >
                    {item.label}
                  </Link>
                  {item.children && (
                    <div className="submenu">
                      {item.children.map((child, cidx) => (
                        <Link
                          key={cidx}
                          to={child.to}
                          className={`submenu-item${
                            isActive(child.to) ? " active" : ""
                          }`}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : item.type === "logout" ? (
                <button
                  key={idx}
                  type="button"
                  className="util-item logout-btn"
                  onClick={handleLogout}
                >
                  {item.label}
                </button>
              ) : null
            )}

            {menus.some((m) => m.type === "search") && (
              <button
                type="button"
                className={`util-item search-btn ${searchOpen ? "active" : ""}`}
                aria-expanded={searchOpen}
                aria-label={searchOpen ? "검색 닫기" : "검색 열기"}
                onClick={() => {
                  if (searchOpen && (searchQuery || "").trim()) submitSearch();
                  else handleToggleSearch();
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                  <line
                    x1="16.65"
                    y1="16.65"
                    x2="21"
                    y2="21"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}

            <div className={`searchbar ${searchOpen ? "open" : ""}`}>
              <input
                ref={inputRef}
                className="search-input"
                type="text"
                placeholder="검색어를 입력하세요"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitSearch();
                }}
              />
            </div>
          </nav>

          <button
            className="hamburger"
            aria-label="메뉴 열기"
            aria-expanded={drawerOpen}
            aria-controls="mobile-drawer"
            onClick={() => setDrawerOpen(true)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </header>

      <div className="topheader-spacer" aria-hidden="true" />

      {drawerOpen && (
        <div className="overlay" onClick={() => setDrawerOpen(false)}>
          <aside
            id="mobile-drawer"
            className="drawer"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawer-head">
              <div className="drawer-logo">FITTLY</div>
              <button
                className="close-btn"
                onClick={() => setDrawerOpen(false)}
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            <nav className="drawer-nav" aria-label="모바일 메뉴">
              {menus.map((item, idx) => {
                if (item.type === "link") {
                  return (
                    <div key={idx} className="drawer-group">
                      <Link
                        to={item.to}
                        className={`drawer-link${isActive(item.to) ? " active" : ""}`}
                        onClick={() => setDrawerOpen(false)}
                      >
                        {item.label}
                      </Link>
                      {item.children && (
                        <div className="drawer-children">
                          {item.children.map((c, cidx) => (
                            <Link
                              key={cidx}
                              to={c.to}
                              className={`drawer-link child${
                                isActive(c.to) ? " active" : ""
                              }`}
                              onClick={() => setDrawerOpen(false)}
                            >
                              {c.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                } else if (item.type === "logout") {
                  return (
                    <button
                      key={idx}
                      type="button"
                      className="drawer-link"
                      onClick={() => {
                        handleLogout();
                        setDrawerOpen(false);
                      }}
                    >
                      {item.label}
                    </button>
                  );
                } else {
                  return null;
                }
              })}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
