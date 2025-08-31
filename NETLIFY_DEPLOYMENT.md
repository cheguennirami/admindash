# Deploying to Netlify with JSONBin Backend

This guide will help you deploy the Shein TO YOU Dashboard to Netlify using JSONBin.io as the backend.

## Prerequisites

1. A Netlify account (sign up at [netlify.com](https://netlify.com) if you don't have one)
2. A JSONBin.io account (sign up at [jsonbin.io](https://jsonbin.io) if you don't have one)

## Step 1: Set up JSONBin

1. Log in to your JSONBin.io account (or create one at [jsonbin.io](https://jsonbin.io))
2. Go to your account settings to get your API Key (you'll need this later)
3. Create a new bin by clicking "Create Bin"
4. Make sure to select "Private Bin" for security
5. Paste the following JSON structure:

```json
{
  "users": [
    {
      "_id": "admin-001",
      "full_name": "Super Administrator",
      "email": "admin@sheintoyou.com",
      "password": "admin123",
      "role": "super_admin",
      "isActive": true,
      "avatar": "",
      "phone": "",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    },
    {
      "_id": "marketing-001",
      "full_name": "Marketing Manager",
      "email": "marketing@sheintoyou.com",
      "password": "marketing123",
      "role": "marketing",
      "isActive": true,
      "avatar": "",
      "phone": "",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    },
    {
      "_id": "logistics-001",
      "full_name": "Logistics Coordinator",
      "email": "logistics@sheintoyou.com",
      "password": "logistics123",
      "role": "logistics",
      "isActive": true,
      "avatar": "",
      "phone": "",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    },
    {
      "_id": "treasurer-001",
      "full_name": "Financial Manager",
      "email": "treasurer@sheintoyou.com",
      "password": "treasurer123",
      "role": "treasurer",
      "isActive": true,
      "avatar": "",
      "phone": "",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  ],
  "clients": [
    {
      "_id": "client-001",
      "fullName": "Test Client 1",
      "phoneNumber": "+216 12 345 678",
      "address": "Tunis, Tunisia",
      "buyingPrice": 50,
      "sellingPrice": 100,
      "cart": "Test Product",
      "advancePaid": false,
      "remainingPaid": false,
      "status": "in_progress",
      "confirmation": "pending",
      "orderId": "ORD-001",
      "advanceAmount": 30,
      "remainingAmount": 70,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    },
    {
      "_id": "client-002",
      "fullName": "Sarah Johnson",
      "phoneNumber": "+216 98 765 432",
      "address": "Sousse, Tunisia",
      "buyingPrice": 75,
      "sellingPrice": 150,
      "cart": "Summer Dress Collection",
      "advancePaid": true,
      "remainingPaid": false,
      "status": "bought",
      "confirmation": "confirmed",
      "orderId": "ORD-002",
      "advanceAmount": 50,
      "remainingAmount": 100,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    },
    {
      "_id": "client-003",
      "fullName": "Mohammed Ali",
      "phoneNumber": "+216 55 123 456",
      "address": "Sfax, Tunisia",
      "buyingPrice": 120,
      "sellingPrice": 220,
      "cart": "Winter Collection",
      "advancePaid": true,
      "remainingPaid": true,
      "status": "delivered_to_client",
      "confirmation": "confirmed",
      "orderId": "ORD-003",
      "advanceAmount": 100,
      "remainingAmount": 120,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  ],
  "payments": [
    {
      "_id": "payment-001",
      "clientId": "client-002",
      "amount": 50,
      "type": "advance",
      "method": "cash",
      "notes": "Advance payment for summer dress collection",
      "createdAt": "2023-01-01T00:00:00.000Z"
    },
    {
      "_id": "payment-002",
      "clientId": "client-003",
      "amount": 100,
      "type": "advance",
      "method": "bank_transfer",
      "notes": "Advance payment for winter collection",
      "createdAt": "2023-01-01T00:00:00.000Z"
    },
    {
      "_id": "payment-003",
      "clientId": "client-003",
      "amount": 120,
      "type": "remaining",
      "method": "cash",
      "notes": "Final payment upon delivery",
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
  ],
  "settings": {
    "initialized": true,
    "version": "3.0.0"
  }
}
```

6. Click "Create" to save the bin
7. Note down the Bin ID from the URL (it will look like `https://jsonbin.io/app/bins/YOUR_BIN_ID_HERE`)
8. Make sure you have both your API Key and Bin ID saved for the next steps

## Step 2: Update Environment Variables

1. Open the `.env` file in your project
2. Update the following variables with your JSONBin credentials:
   ```
   REACT_APP_JSONBIN_API_KEY=your_api_key_here
   REACT_APP_JSONBIN_BIN_ID=your_bin_id_here
   ```

## Step 3: Deploy to Netlify

### Option 1: Deploy via Netlify UI

1. Build your project locally:
   ```
   npm run build
   ```

2. Drag and drop the `build` folder to Netlify's upload area at [app.netlify.com/drop](https://app.netlify.com/drop)

3. Once deployed, go to "Site settings" > "Build & deploy" > "Environment variables"

4. Add the following environment variables:
   - `REACT_APP_JSONBIN_API_KEY`: Your JSONBin API key
   - `REACT_APP_JSONBIN_BIN_ID`: Your JSONBin bin ID

### Option 2: Deploy via Git

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)

2. Log in to Netlify and click "New site from Git"

3. Select your Git provider and repository

4. Configure the build settings:
   - Build command: `npm run build`
   - Publish directory: `build`

5. Click "Show advanced" and add the environment variables:
   - `REACT_APP_JSONBIN_API_KEY`: Your JSONBin API key
   - `REACT_APP_JSONBIN_BIN_ID`: Your JSONBin bin ID

6. Click "Deploy site"

## Step 4: Test Your Deployment

1. Once deployed, Netlify will provide you with a URL (e.g., `https://your-site-name.netlify.app`)

2. Visit the URL and test the login functionality with the following credentials:
   - Admin: admin@sheintoyou.com / admin123
   - Marketing: marketing@sheintoyou.com / marketing123
   - Logistics: logistics@sheintoyou.com / logistics123
   - Treasurer: treasurer@sheintoyou.com / treasurer123

## Troubleshooting

If you encounter any issues:

1. Check the browser console for errors
2. Verify your environment variables are set correctly in Netlify
3. Make sure your JSONBin bin is accessible and has the correct structure
4. Check that your JSONBin API key has the necessary permissions

### Common Issues and Solutions

#### "Failed to connect to JSONBin" error
- Double-check your API key and bin ID
- Make sure your bin is set to "Private" and not "Public"
- Try creating a new bin and updating the bin ID

#### "Authentication failed" error
- Ensure the JSON structure in your bin includes the user accounts
- Check that the email and password match the ones in the bin
- Try refreshing the page and logging in again

#### Data not saving to JSONBin
- Check your browser console for any API errors
- Verify that your API key has write permissions
- Make sure your internet connection is stable

## Important Notes

- This setup uses JSONBin.io as a simple backend database
- All data is stored in a single JSON bin
- The application will work even without JSONBin configured (it will fall back to localStorage)
- For production use with real customer data, consider implementing proper authentication and data validation
- JSONBin has rate limits on their free tier, so for high-traffic applications, consider upgrading to a paid plan