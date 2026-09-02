# ShopSphere

ShopSphere is a modern multi-vendor e-commerce marketplace built with the MERN stack. It brings together customers, sellers, delivery partners, and administrators in a unified commerce platform for browsing products, managing orders, tracking deliveries, and monitoring store operations.

## Overview

This project is designed as a complete capstone-style marketplace with role-based access, REST APIs, MongoDB data models, secure authentication, and a responsive React front end. Sellers can manage inventory and orders, customers can browse stores and place orders, delivery partners can update shipment progress, and admins can oversee listings, users, and platform activity.

## Key Features

- Role-based authentication for customers, sellers, delivery partners, and admins
- Seller storefront management with product and inventory workflows
- Multi-store browsing and product discovery for customers
- Cart and order flow with delivery address management
- Delivery tracking and earnings oversight for logistics partners
- Admin moderation and operational dashboard access
- Image upload support with local and Cloudinary-ready configuration
- REST API structure with MongoDB + Express backend

## Tech Stack

### Frontend

- React 19
- Vite
- React Router
- Tailwind CSS

### Backend

- Node.js
- Express.js
- MongoDB + Mongoose
- JWT authentication
- bcryptjs
- Multer for file uploads
- Cloudinary-ready image storage support

## Roles

### Customer
- Browse stores and products
- Add items to cart
- Place and track orders
- Save delivery addresses
- Review purchase history

### Seller
- Manage store profile
- Add, edit, and delete products
- Handle inventory and pricing
- View orders and dispatch to delivery partners

### Delivery Partner
- Access assigned deliveries
- Update shipment status
- View earnings and task progress

### Admin
- Monitor platform activity
- Manage users, stores, and orders
- Moderate operational data and reports

## Project Structure

```text
shopez/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── uploads/
│   ├── utils/
│   ├── REST_API_TESTING/
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── styles/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── README.md
└── LICENSE
```

## Getting Started

### Prerequisites

Make sure you have the following installed:

- Node.js 18+
- npm
- MongoDB running locally or MongoDB Atlas access

### 1. Clone the Repository

```bash
git clone https://github.com/NSriNihal/ShopSphere.git
cd ShopSphere
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Configure the Backend Environment

Create a `.env` file in the `backend` folder:

```env
PORT=5000
DB_URL=mongodb://127.0.0.1:27017/ShopSphere
SECRETKEY=your_jwt_secret_key
NODE_ENV=development

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=shopsphere
```

### 4. Run the Backend

```bash
npm run dev
```

The API server will run at:

```text
http://localhost:5000
```

### 5. Install Frontend Dependencies

Open a new terminal and run:

```bash
cd frontend
npm install
```

### 6. Configure the Frontend Environment

Create a `.env` file in the `frontend` folder:

```env
VITE_API_URL=http://localhost:5000
```

### 7. Run the Frontend

```bash
npm run dev
```

The storefront runs on the Vite dev server, usually at:

```text
http://localhost:5173
```

## Demo Workflow

1. Sign up as a user, seller, or delivery partner.
2. Create or manage seller products and inventory.
3. Browse stores and place orders as a customer.
4. Track order progress and delivery updates.
5. Use the admin dashboard to manage platform operations.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Project Highlights

- Modern multi-vendor marketplace experience
- Role-aware shopping, selling, and delivery flows
- Modular React and Express architecture
- Ready for extension with AI-powered search and recommendations

## Contributing

Contributions are welcome. You can fork the repository, create a feature branch, and submit a pull request with your improvements.

## Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a new feature branch.
3. Make your changes.
4. Run linting and verify the app locally.
5. Commit your changes.
6. Open a pull request.

## License

This project is licensed under the ISC License.

## Author

Built with care for local commerce, sellers, customers, and delivery partners.
