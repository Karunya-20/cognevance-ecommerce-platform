# Full-Scale E-commerce Platform (Internship Demo)

## Features
- JWT authentication, bcrypt password hashes, customer/admin roles.
- Product listing and admin create/update/soft-delete APIs.
- React catalog and client-side cart.
- Order creation and current-user order API.
- Stripe Checkout session integration scaffold using test credentials.
- Image upload endpoint with file type/size restrictions; local disk storage in this demo.
- Admin analytics endpoint for active products, order counts, status breakdown, and revenue.

## Setup
Backend: copy `.env.example` to `.env`; configure MongoDB URI, strong JWT secret, and Stripe test secret; `npm install`; `npm run dev` (port 5002).
Frontend: copy `.env.example` to `.env`; `npm install`; `npm run dev` (Vite normally uses port 5175 if earlier projects occupy 5173/5174).

## First-run steps
1. Register a user.
2. To test admin features, manually change that user's `role` to `admin` in the MongoDB `shopusers` collection, then log out and log in again so the new JWT contains the role.
3. Add products in the Admin panel.
4. Add products to cart and place an order.
5. Configure a Stripe test secret before checkout; the frontend will show a setup message otherwise.

## Important production work
- Configure and test Stripe webhooks to verify payments and update order status.
- Use Cloudinary/S3 rather than local upload storage for a deployed multi-instance app.
- Add inventory reservation/decrement transactions, stronger validation, request rate limits, audit logs, and automated tests.
- Add deployment URLs only after verifying the deployments.

## Deployment
- Frontend: TODO
- Backend: TODO
- MongoDB: configure Atlas or another hosted MongoDB provider.

## Screenshots
Capture genuine screenshots: product listing, cart, account, admin product creation, analytics, and test checkout.
