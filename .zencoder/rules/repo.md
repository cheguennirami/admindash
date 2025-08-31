---
description: Repository Information Overview
alwaysApply: true
---

# Shein TO YOU Dashboard Information

## Summary
A comprehensive React-based web application for managing a Shein reselling business with role-based access control, client management, order tracking, and financial management. The application uses JSONBin.io as a backend storage solution.

## Structure
- **public/**: Contains static assets and HTML entry point
- **src/**: Main source code directory
  - **components/**: React components organized by feature
  - **contexts/**: React context providers for state management
  - **services/**: API and data management services
  - **assets/**: Static assets like images
- **build/**: Production build output directory

## Language & Runtime
**Language**: JavaScript (React)
**Version**: React 18.2.0
**Build System**: Create React App (react-scripts 5.0.1)
**Package Manager**: npm
**Node Version**: 14 or higher

## Dependencies
**Main Dependencies**:
- react: ^18.2.0
- react-dom: ^18.2.0
- react-router-dom: ^6.20.1
- react-hook-form: ^7.48.2
- react-hot-toast: ^2.4.1
- lucide-react: ^0.294.0
- recharts: ^2.8.0
- date-fns: ^2.30.0
- react-dropzone: ^14.2.3
- framer-motion: ^10.16.16

## Build & Installation
```bash
npm install
npm start  # Development server
npm run build  # Production build
```

## Deployment
**Platform**: Netlify
**Build Command**: npm run build
**Publish Directory**: build
**Environment Variables**:
- REACT_APP_JSONBIN_API_KEY
- REACT_APP_JSONBIN_BIN_ID

## Data Storage
**Backend**: JSONBin.io
**Storage Method**: Remote JSON storage with local fallback
**Data Structure**:
- Users (authentication and role management)
- Clients (customer information and order status)
- Payments (financial transactions)
- Settings (application configuration)
**Connection**: Automatic connection with status indicator

## Authentication
**Method**: Simple email/password authentication
**Storage**: LocalStorage for user data
**Roles**: Super Admin, Marketing, Logistics, Treasurer
**Demo Accounts**:
- Admin: admin@sheintoyou.com / admin123
- Marketing: marketing@sheintoyou.com / marketing123
- Logistics: logistics@sheintoyou.com / logistics123
- Treasurer: treasurer@sheintoyou.com / treasurer123

## UI Framework
**Styling**: Tailwind CSS
**Theme Colors**:
- Primary Pink: #ec4899
- Primary Teal: #14b8a6
- Primary Navy: #1e293b
**Components**: Custom React components organized by feature
**Notifications**: react-hot-toast for toast notifications

## Application Features
**User Management**: Create and manage user accounts with different roles
**Client Management**: Track client information and order status
**Order Tracking**: Monitor order status through delivery process
**Financial Management**: Record income, expenses, and track profits
**Dashboard Analytics**: Role-specific dashboards with statistics