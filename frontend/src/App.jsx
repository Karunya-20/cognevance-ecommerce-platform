
import { useEffect, useMemo, useState } from "react";
import "./style.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001";

const initialProducts = [
  { id: 1, name: "Studio Wireless Headphones", category: "Electronics", price: 2499, oldPrice: 3299, rating: 4.8, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85", tag: "BESTSELLER" },
  { id: 2, name: "Everyday Minimal Watch", category: "Accessories", price: 1899, oldPrice: 2499, rating: 4.7, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85", tag: "POPULAR" },
  { id: 3, name: "Urban Classic Sneakers", category: "Fashion", price: 2999, oldPrice: 3799, rating: 4.9, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85", tag: "TRENDING" },
  { id: 4, name: "Modern Everyday Backpack", category: "Accessories", price: 1599, oldPrice: 1999, rating: 4.6, image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85", tag: "NEW" },
  { id: 5, name: "Premium Smart Speaker", category: "Electronics", price: 2199, oldPrice: 2799, rating: 4.7, image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=900&q=85", tag: "POPULAR" },
  { id: 6, name: "Essential Ceramic Mug Set", category: "Home", price: 799, oldPrice: 999, rating: 4.5, image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=85", tag: "VALUE PICK" },
  { id: 7, name: "Classic Everyday Sunglasses", category: "Fashion", price: 999, oldPrice: 1399, rating: 4.6, image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=900&q=85", tag: "NEW" },
  { id: 8, name: "Soft Ambient Table Lamp", category: "Home", price: 1299, oldPrice: 1699, rating: 4.8, image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85", tag: "DESIGN PICK" },
];

const money = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

function productId(p) {
  return p._id || p.id || p.productId;
}

function App() {
  const [products, setProducts] = useState(initialProducts);
  const [cart, setCart] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("featured");
  const [activePage, setActivePage] = useState("shop");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [notice, setNotice] = useState("");
  const [apiStatus, setApiStatus] = useState("checking");
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;

    async function loadProducts() {
      try {
        const response = await fetch(`${API}/api/products`);
        if (!response.ok) throw new Error("Product API unavailable");

        const data = await response.json();
        const list = Array.isArray(data)
          ? data
          : data.products || data.items || [];

        if (alive && list.length) {
          setProducts(list.map((p) => ({
            ...p,
            id: productId(p),
            price: Number(p.price || p.salePrice || 0),
            category: p.category || "General",
            image: p.image || p.imageUrl || p.images?.[0] || initialProducts[0].image,
            rating: Number(p.rating || 4.5),
          })));
        }

        if (alive) setApiStatus("connected");
      } catch {
        if (alive) setApiStatus("offline");
      }
    }

    loadProducts();
    return () => { alive = false; };
  }, []);

  const categories = useMemo(
    () => ["All", ...new Set(products.map((p) => p.category || "General"))],
    [products]
  );

  const visibleProducts = useMemo(() => {
    let list = products.filter((p) => {
      const matchesCategory = category === "All" || p.category === category;
      const matchesQuery = `${p.name} ${p.category} ${p.description || ""}`
        .toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });

    if (sort === "low") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "high") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));

    return list;
  }, [products, category, query, sort]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal === 0 || subtotal >= 1999 ? 0 : 99;
  const total = subtotal + shipping;

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  }

  function addToCart(product) {
    const id = productId(product);
    setCart((old) => {
      const found = old.find((item) => productId(item) === id);
      return found
        ? old.map((item) =>
            productId(item) === id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        : [...old, { ...product, id, quantity: 1 }];
    });
    showNotice("Added to your bag");
  }

  function changeQuantity(id, amount) {
    setCart((old) =>
      old
        .map((item) =>
          productId(item) === id
            ? { ...item, quantity: item.quantity + amount }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  async function submitAuth(event) {
    event.preventDefault();
    setBusy(true);

    try {
      const response = await fetch(
        `${API}/api/auth/${authMode === "login" ? "login" : "register"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            authMode === "login"
              ? { email, password }
              : { name: fullName, fullName, email, password }
          ),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || "Authentication failed");

      const token = data.token || data.accessToken;
      const account = data.user || data.customer || { name: fullName, email };

      if (token) localStorage.setItem("northstar_token", token);
      setUser(account);
      showNotice("Welcome to Northstar");
      setActivePage("shop");
    } catch (error) {
      showNotice(error.message || "Could not connect to the account service");
    } finally {
      setBusy(false);
    }
  }

  async function placeOrder() {
    if (!cart.length) {
      showNotice("Your shopping bag is empty");
      return;
    }

    if (!user) {
      setActivePage("account");
      showNotice("Please log in before checkout");
      return;
    }

    setBusy(true);
    try {
      const token = localStorage.getItem("northstar_token");
      const response = await fetch(`${API}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          items: cart.map((item) => ({
            product: productId(item),
            productId: productId(item),
            quantity: item.quantity,
          })),
          totalAmount: total,
          shippingAddress: {},
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || "Order could not be placed");

      setCart([]);
      showNotice("Order placed successfully");
      setActivePage("orders");
    } catch (error) {
      showNotice(error.message || "Checkout service is unavailable");
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    localStorage.removeItem("northstar_token");
    setUser(null);
    showNotice("You have been logged out");
  }

  return (
    <div className="store">
      <div className="announcement">
        <span>Complimentary shipping on orders over ₹1,999</span>
        <span className="announcement-right">Thoughtfully selected. Made for everyday.</span>
      </div>

      <header className="navbar">
        <button className="brand" onClick={() => setActivePage("shop")} aria-label="Northstar home">
          <span className="brand-symbol">N</span>
          <span>NORTHSTAR<span className="brand-sub">STORE</span></span>
        </button>

        <nav className="nav-links">
          <button className={activePage === "shop" ? "nav-active" : ""} onClick={() => setActivePage("shop")}>Shop</button>
          <button onClick={() => { setCategory("All"); setActivePage("shop"); document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" }); }}>Collections</button>
          <button onClick={() => setActivePage("orders")}>Orders</button>
        </nav>

        <div className="nav-actions">
          <button className="icon-button search-toggle" onClick={() => document.getElementById("search-box")?.focus()} aria-label="Search">⌕</button>
          <button className="icon-button" onClick={() => setActivePage("cart")} aria-label="Shopping bag">
            ♧ <span className="cart-count">{cartCount}</span>
          </button>
          <button className="account-button" onClick={() => setActivePage("account")}>
            {user ? "My account" : "Sign in"} <span>↗</span>
          </button>
        </div>
      </header>

      {notice && <div className="toast" role="status">{notice}</div>}

      {activePage === "shop" && (
        <main>
          <section className="hero">
            <div className="hero-image" />
            <div className="hero-content">
              <span className="eyebrow"><span className="eyebrow-dot" /> THE NORTHSTAR EDIT</span>
              <h1>Everyday essentials.<br /><em>Extraordinary</em> living.</h1>
              <p>Discover considered design, useful details, and timeless pieces that make every day feel a little better.</p>
              <button className="primary-button" onClick={() => document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" })}>
                Explore the collection <span>↗</span>
              </button>
              <div className="hero-note"><span>✳</span> Curated for your everyday</div>
            </div>
            <div className="hero-index"><span>01</span> / THE NEW COLLECTION</div>
          </section>

          <section className="benefits">
            <div><span className="benefit-icon">✦</span><span><b>Thoughtful quality</b><small>Selected with care</small></span></div>
            <div><span className="benefit-icon">↗</span><span><b>Easy, secure shopping</b><small>A simple checkout experience</small></span></div>
            <div><span className="benefit-icon">◇</span><span><b>Everyday value</b><small>More to love, every day</small></span></div>
            <div><span className="benefit-icon">♡</span><span><b>Here to help</b><small>Support when you need it</small></span></div>
          </section>

          <section className="catalog section-wrap" id="catalog">
            <div className="section-heading">
              <div>
                <span className="eyebrow muted-eyebrow">THE COLLECTION</span>
                <h2>Find your next favourite.</h2>
                <p>Good design. Useful things. A little something for you.</p>
              </div>
              <span className="product-count">{visibleProducts.length} PRODUCTS</span>
            </div>

            <div className="catalog-controls">
              <div className="category-list">
                {categories.map((c) => (
                  <button key={c} onClick={() => setCategory(c)} className={category === c ? "category-active" : ""}>{c}</button>
                ))}
              </div>
              <div className="catalog-tools">
                <label className="search-box">
                  <span>⌕</span>
                  <input id="search-box" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products..." />
                </label>
                <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort products">
                  <option value="featured">Featured</option>
                  <option value="low">Price: low to high</option>
                  <option value="high">Price: high to low</option>
                  <option value="name">Name A–Z</option>
                </select>
              </div>
            </div>

            <div className="product-grid">
              {visibleProducts.map((product, index) => (
                <article className="product-card" key={productId(product) || index}>
                  <button className="product-image" onClick={() => setSelectedProduct(product)} aria-label={`View ${product.name}`}>
                    <img src={product.image || initialProducts[index % initialProducts.length].image} alt={product.name} loading="lazy" />
                    <span className="product-tag">{product.tag || (index % 2 === 0 ? "THE EDIT" : "EVERYDAY PICK")}</span>
                    <span className="quick-view">Quick view ↗</span>
                  </button>
                  <div className="product-details">
                    <div className="product-meta"><span>{product.category}</span><span className="rating">★ {product.rating || "4.7"}</span></div>
                    <button className="product-name" onClick={() => setSelectedProduct(product)}>{product.name}</button>
                    <div className="product-bottom">
                      <div className="price-line"><b>{money(product.price)}</b>{product.oldPrice > product.price && <del>{money(product.oldPrice)}</del>}</div>
                      <button className="add-button" onClick={() => addToCart(product)} aria-label={`Add ${product.name} to cart`}>+</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {!visibleProducts.length && <div className="empty-state"><h3>No products found</h3><p>Try a different search or category.</p><button className="secondary-button" onClick={() => { setQuery(""); setCategory("All"); }}>Clear filters</button></div>}
            {apiStatus === "offline" && <p className="api-note">Showing sample products because the product API is not reachable. Connect the backend to load database products.</p>}
          </section>

          <section className="editorial">
            <div className="editorial-image" />
            <div className="editorial-copy">
              <span className="eyebrow">A BETTER KIND OF EVERYDAY</span>
              <h2>Less noise.<br /><em>More meaning.</em></h2>
              <p>We believe the best things are the ones you reach for again and again. Explore useful, considered pieces designed to fit naturally into your life.</p>
              <button className="text-link" onClick={() => { setCategory("All"); document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" }); }}>Shop the collection <span>↗</span></button>
            </div>
          </section>
        </main>
      )}

      {activePage === "cart" && (
        <main className="page-shell">
          <span className="eyebrow muted-eyebrow">YOUR SELECTION</span>
          <h1 className="page-title">Your shopping bag</h1>
          {cart.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">♧</div><h2>Your bag is taking a break.</h2><p>Find something you'll love and it will show up here.</p><button className="primary-button" onClick={() => setActivePage("shop")}>Continue shopping ↗</button></div>
          ) : (
            <div className="cart-layout">
              <div className="cart-items">
                {cart.map((item) => (
                  <div className="cart-item" key={productId(item)}>
                    <img src={item.image} alt={item.name} />
                    <div className="cart-item-info"><span>{item.category}</span><h3>{item.name}</h3><b>{money(item.price)}</b><button className="remove-button" onClick={() => changeQuantity(productId(item), -item.quantity)}>Remove</button></div>
                    <div className="quantity-control"><button onClick={() => changeQuantity(productId(item), -1)}>-</button><span>{item.quantity}</span><button onClick={() => changeQuantity(productId(item), 1)}>+</button></div>
                    <strong>{money(item.price * item.quantity)}</strong>
                  </div>
                ))}
              </div>
              <aside className="summary-card"><h2>Order summary</h2><div><span>Subtotal</span><b>{money(subtotal)}</b></div><div><span>Shipping</span><b>{shipping ? money(shipping) : "FREE"}</b></div><div className="summary-total"><span>Total</span><strong>{money(total)}</strong></div><p>{subtotal >= 1999 ? "You've unlocked free shipping." : `Add ${money(1999 - subtotal)} more for free shipping.`}</p><button className="primary-button full-button" onClick={placeOrder} disabled={busy}>{busy ? "Processing..." : "Place order ↗"}</button><button className="text-link" onClick={() => setActivePage("shop")}>Continue shopping</button></aside>
            </div>
          )}
        </main>
      )}

      {activePage === "account" && (
        <main className="page-shell account-page">
          <div className="auth-art"><span className="eyebrow">WELCOME TO NORTHSTAR</span><h1>Good things<br />start <em>here.</em></h1><p>Create an account to enjoy a more personal shopping experience.</p></div>
          <form className="auth-card" onSubmit={submitAuth}>
            <span className="eyebrow muted-eyebrow">YOUR ACCOUNT</span>
            <h2>{authMode === "login" ? "Welcome back." : "Join Northstar."}</h2>
            <p>{authMode === "login" ? "Sign in to continue shopping." : "Create an account to get started."}</p>
            <div className="auth-switch"><button type="button" className={authMode === "login" ? "selected" : ""} onClick={() => setAuthMode("login")}>Sign in</button><button type="button" className={authMode === "register" ? "selected" : ""} onClick={() => setAuthMode("register")}>Create account</button></div>
            {authMode === "register" && <label>Full name<input value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Your name" /></label>}
            <label>Email address<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" /></label>
            <label>Password<input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="At least 8 characters" /></label>
            <button className="primary-button full-button" disabled={busy}>{busy ? "Please wait..." : authMode === "login" ? "Sign in ↗" : "Create account ↗"}</button>
            <small className="form-footnote">Your account request is sent to the backend API.</small>
          </form>
        </main>
      )}

      {activePage === "orders" && (
        <main className="page-shell">
          <span className="eyebrow muted-eyebrow">YOUR NORTHSTAR</span>
          <h1 className="page-title">Your orders</h1>
          <div className="empty-state"><div className="empty-icon">↗</div><h2>Keep your favourites close.</h2><p>Sign in and complete a purchase to view your order history.</p><button className="primary-button" onClick={() => setActivePage(user ? "shop" : "account")}>{user ? "Continue shopping" : "Sign in to continue"} ↗</button></div>
          {user && <button className="secondary-button logout-button" onClick={logout}>Sign out</button>}
        </main>
      )}

      <footer className="footer">
        <div className="footer-main">
          <div className="footer-brand"><div className="brand"><span className="brand-symbol">N</span><span>NORTHSTAR<span className="brand-sub">STORE</span></span></div><p>Thoughtful goods for the way<br />you live every day.</p></div>
          <div><b>Explore</b><button onClick={() => setActivePage("shop")}>Shop all</button><button onClick={() => { setCategory("Fashion"); setActivePage("shop"); }}>Fashion</button><button onClick={() => { setCategory("Home"); setActivePage("shop"); }}>Home & living</button></div>
          <div><b>Your account</b><button onClick={() => setActivePage("account")}>Sign in / Register</button><button onClick={() => setActivePage("cart")}>Shopping bag ({cartCount})</button><button onClick={() => setActivePage("orders")}>Orders</button></div>
          <div><b>Our promise</b><p>Useful design. Thoughtful choices.<br />A little more joy in everyday life.</p><span className="footer-status">● {apiStatus === "connected" ? "Store API connected" : apiStatus === "offline" ? "Demo catalogue active" : "Connecting to store"}</span></div>
        </div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} Northstar Store</span><span>Designed for everyday living.</span><button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Back to top ↑</button></div>
      </footer>

      {selectedProduct && (
        <div className="modal-backdrop" onClick={() => setSelectedProduct(null)}>
          <div className="product-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedProduct(null)} aria-label="Close">×</button>
            <img src={selectedProduct.image} alt={selectedProduct.name} />
            <div className="modal-copy"><span className="eyebrow muted-eyebrow">{selectedProduct.category}</span><h2>{selectedProduct.name}</h2><div className="modal-price">{money(selectedProduct.price)}</div><p>{selectedProduct.description || "A thoughtfully selected everyday essential, chosen for its balance of style, usefulness, and lasting appeal."}</p><div className="modal-rating">★ {selectedProduct.rating || "4.7"} <span>Customer favourite</span></div><button className="primary-button full-button" onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}>Add to bag ↗</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
