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
- **JSONBin.io** for data storage
- Simple API calls to JSONBin.io
- Local storage fallback for offline functionality

### Frontend
- **React 18** with functional components
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Fetch API** for JSONBin calls
- **React Hook Form** for form handling
- **React Hot Toast** for notifications
- **Lucide React** for icons
- **Recharts** for data visualization

## 📁 Project Structure

```
shein-to-you-dashboard/
├── public/                # Static assets and HTML entry point
├── src/                   # Main source code directory
│   ├── assets/            # Images and static assets
│   ├── components/        # React components organized by feature
│   │   ├── auth/          # Authentication components
│   │   ├── common/        # Shared UI components
│   │   ├── dashboard/     # Dashboard components
│   │   └── layout/        # Layout components
│   ├── contexts/          # React context providers
│   │   └── SimpleAuthContext.js  # Authentication context
│   ├── services/          # API and data services
│   │   └── jsonbin-simple.js     # JSONBin service
│   ├── App.js             # Main application component
│   └── index.js           # Entry point
└── package.json           # Project dependencies and scripts
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- JSONBin.io account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd shein-to-you-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   Create `.env` file in the root directory:
   ```env
   REACT_APP_JSONBIN_API_KEY=your_jsonbin_api_key
   REACT_APP_JSONBIN_BIN_ID=your_jsonbin_bin_id
   ```

4. **Start the application**
   ```bash
   npm start
   ```

   This will start the development server on port 3000.

### Demo Accounts
- **Admin:** admin@sheintoyou.com / admin123
- **Marketing:** marketing@sheintoyou.com / marketing123
- **Logistics:** logistics@sheintoyou.com / logistics123
- **Treasurer:** treasurer@sheintoyou.com / treasurer123

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

- Simple authentication with email/password
- Local storage for user session
- Input validation with React Hook Form
- Role-based access control
- JSONBin.io API key protection

## 📱 Mobile Compatibility

The application is fully responsive and works seamlessly on:
- Desktop computers
- Tablets
- Mobile phones
- All modern browsers

## 🚀 Deployment

### Netlify Deployment
1. Build the React app:
   ```bash
   npm run build
   ```

2. Deploy the `build` folder to Netlify

3. Configure environment variables in Netlify:
   - `REACT_APP_JSONBIN_API_KEY`: Your JSONBin API key
   - `REACT_APP_JSONBIN_BIN_ID`: Your JSONBin bin ID

For detailed deployment instructions, see [NETLIFY_DEPLOYMENT.md](./NETLIFY_DEPLOYMENT.md)

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
