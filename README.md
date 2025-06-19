# Halu FE (Next.js Frontend) Setup Guide

This guide explains how to set up and run the Next.js frontend for the Halu project.

---

## 1. Prerequisites

- **Node.js** (v16+ recommended)
- **npm** or **yarn**
- The backend API running (see backend README for setup)

---

## 2. Clone the Repository

```sh
git clone <your-frontend-repo-url>
cd <your-frontend-folder>
```

---

## 3. Install Dependencies

```sh
npm install
# or
yarn install
```

---

## 4. Configure Environment Variables

Create a `.env.local` file in the root directory if you want to override API URLs or other settings.

Example:

```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

> By default, the frontend expects the backend to run on `http://localhost:8080`.

---

## 5. Run the Development Server

```sh
npm run dev
# or
yarn dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

---

## 6. Build for Production

```sh
npm run build
npm start
# or
yarn build
yarn start
```

---

## 7. Project Structure

- `src/components/` — React components (Navbar, HomeBuyer, HomeSeller, Cart, etc.)
- `src/app/` — Next.js app directory (pages, routing, etc.)
- `public/` — Static files (e.g. images, favicon)
- `README.md` — This file

---

## 8. Features

- **Role-based Home:** Buyer and Seller dashboards
- **Product Management:** Create, edit, delete, and view products
- **Cart:** Add to cart, view cart, clear cart, checkout (UI only)
- **Sorting:** 3-mode sort (default, most expensive, cheapest)
- **Aesthetic UI:** Modern, responsive, and consistent design

---

## 9. Notes

- Make sure the backend is running and accessible at the API URL.
- If you change the backend URL, update `NEXT_PUBLIC_API_URL` in `.env.local` and in your fetch requests if not using the env variable.
- For image uploads, ensure your backend and any third-party services (e.g. Cloudinary) are configured.

---

## 10. Useful Commands

- **Start dev server:**  
  `npm run dev`
- **Build for production:**  
  `npm run build`
- **Start production server:**  
  `npm start`
- **Lint:**  
  `npm run lint`

---

## 11. Troubleshooting

- **API errors:** Make sure the backend is running and CORS is configured.
- **Image upload issues:** Check your Cloudinary or image upload configuration.
- **Port conflicts:** Change the port in `package.json` or use `-p` flag.

---

## 12. Further Reading

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

---
