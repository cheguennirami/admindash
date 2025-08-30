# Shein TO YOU - Business Management Dashboard

A comprehensive web application for managing a Shein reselling business with role-based access control, client management, order tracking, and financial management.

## 🚀 Features

### 🔐 Authentication & Authorization
- JWT-based secure authentication
- Role-based access control (Super Admin, Marketing, Logistics, Treasurer)
- Protected routes and API endpoints

### 👥 User Management (Super Admin)
- Create and manage user accounts
- Assign roles and permissions
- Monitor user activity
- Activate/deactivate accounts

### 🛍️ Client Management (Marketing)
- Add new clients with detailed information
- Upload and manage screenshots
- Track client orders and confirmations
- Comprehensive client database

### 📦 Order Tracking (Logistics)
- Track order status throughout delivery process
- Update order status: In Progress → Bought → Delivered to France → Delivered to Tunisia → Delivered to Client
- Read-only access to client information
- Order statistics and metrics

### 💰 Financial Management (Treasurer)
- Record income and expenses
- Categorize transactions
- Generate financial reports
- Track profits and margins
- Payment method tracking

### 📊 Dashboard Analytics
- Role-specific dashboards
- Real-time statistics
- Revenue and profit tracking
- Order status overview
- Recent activity monitoring

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Multer** for file uploads
- **Bcrypt** for password hashing
- **Helmet** for security
- **CORS** for cross-origin requests

### Frontend
- **React 18** with functional components
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Axios** for API calls
- **React Hook Form** for form handling
- **React Hot Toast** for notifications
- **Lucide React** for icons
- **Recharts** for data visualization

## 📁 Project Structure

```
shein-to-you-dashboard/
├── server/                 # Backend API
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── middleware/        # Authentication & authorization
│   ├── utils/             # Utility functions
│   └── index.js           # Server entry point
├── client/                # Frontend React app
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   └── App.js         # Main app component
│   └── public/            # Static assets
└── package.json           # Root package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd shein-to-you-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm run install-deps
   ```

3. **Environment Setup**
   
   Create `.env` file in the `server` directory:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/shein-to-you
   JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
   JWT_EXPIRE=7d
   
   # Admin credentials (for initial setup)
   ADMIN_EMAIL=admin@sheintoyou.com
   ADMIN_PASSWORD=AdminPassword123!
   ```

4. **Start the application**
   ```bash
   npm run dev
   ```

   This will start both the backend server (port 5000) and frontend development server (port 3000).

### Default Admin Account
- **Email:** admin@sheintoyou.com
- **Password:** AdminPassword123!

## 👥 User Roles & Permissions

### Super Admin
- Full system access
- User management
- All dashboard features
- System configuration

### Marketing Manager
- Client management (CRUD)
- Order creation and editing
- Revenue tracking
- Client statistics

### Logistics Coordinator
- Order status tracking
- Read-only client access
- Delivery management
- Order statistics

### Financial Manager (Treasurer)
- Payment recording
- Financial reports
- Expense tracking
- Profit analysis

## 🎨 Design Features

### Brand Colors
- **Primary Pink:** #ec4899
- **Primary Teal:** #14b8a6
- **Primary Navy:** #1e293b

### UI/UX Features
- Responsive design (mobile-first)
- Professional sidebar navigation
- Role-based menu items
- Interactive dashboards
- Real-time notifications
- Modern card-based layout

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation
- Role-based access control

## 📱 Mobile Compatibility

The application is fully responsive and works seamlessly on:
- Desktop computers
- Tablets
- Mobile phones
- All modern browsers

## 🚀 Deployment

### Frontend (Netlify)
1. Build the React app:
   ```bash
   cd client && npm run build
   ```

2. Deploy the `build` folder to Netlify

3. Configure environment variables in Netlify:
   - `REACT_APP_API_URL`: Your backend API URL

### Backend (Heroku/Railway/DigitalOcean)
1. Set up environment variables
2. Configure MongoDB connection
3. Deploy the `server` directory

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions, please contact the development team.

---

**Shein TO YOU** - Professional Business Management Made Simple 🛍️✨
