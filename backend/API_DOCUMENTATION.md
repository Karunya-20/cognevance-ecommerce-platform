# E-commerce API Documentation

Base URL: `http://localhost:5002`; protected routes require `Authorization: Bearer <JWT>`.

- `GET /api/health` — health check.
- `POST /api/auth/register` — register customer.
- `POST /api/auth/login` — login and receive JWT with role.
- `GET /api/products` — active catalog.
- `POST /api/products` — admin only; create product JSON `{ "name":"Notebook", "description":"...", "price":250, "category":"Stationery", "stock":10 }`.
- `PATCH /api/products/:id` — admin only; update product.
- `DELETE /api/products/:id` — admin only; soft-delete product.
- `POST /api/products/:id/image` — admin only, multipart form field `image`; accepts JPEG/PNG/WebP/GIF up to 3MB. Current demo stores files locally in `backend/uploads`; use Cloudinary/S3 for production.
- `POST /api/orders` — authenticated user, body `{ "items":[{"productId":"PRODUCT_ID","quantity":1}] }`.
- `GET /api/orders/mine` — current user's orders.
- `POST /api/payments/checkout/:orderId` — creates Stripe Checkout session when a Stripe test secret is configured.
- `GET /api/admin/analytics` — admin-only product/order/revenue summary.

## MongoDB models
User: `name`, `email`, `passwordHash`, `role` (`customer` or `admin`).
Product: `name`, `description`, `price`, `imageUrl`, `category`, `stock`, `active`.
Order: `user`, item snapshots (`product`, `name`, `price`, `quantity`), `total`, `status`, `paymentSessionId`.

## Payment caveat
This demo creates a Stripe Checkout session, but a production payment flow must verify Stripe webhook signatures before marking orders paid. Do not trust a frontend redirect as payment proof.
