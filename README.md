# Plastic Production & Cost Intelligence System

A comprehensive web application for plastic manufacturing companies to calculate production costs, generate quotations, and manage client relationships.

## Features

### 🔧 Production Calculator
- **Mode A (Component-Based)**: Calculate costs when you know the part weight
- **Mode B (Shot-Based)**: Calculate costs when you know the total shot weight
- Real-time calculations with live results
- Material efficiency analysis
- Profitability calculations
- What-if scenarios and material comparisons

### 📄 Quotation Management
- Professional quotation generation matching your company format
- Multi-line item support with automatic calculations
- GST handling (CGST/SGST for same state, IGST for inter-state)
- PDF export with QR codes for public viewing
- Status tracking (Draft, Sent, Approved, Rejected, Revised)

### 👥 Client Management
- Complete client database with contact information
- GSTIN and PAN tracking
- Client-specific quotation history
- Search and filter capabilities

### 🧪 Material Price Library
- Comprehensive material database (PP, HDPE, LDPE, ABS, Nylon, etc.)
- Price history tracking with alerts for outdated prices
- Supplier information management
- Density data for volume calculations

### 📊 Dashboard & Analytics
- Production metrics and trends
- Cost analysis charts
- Material usage statistics
- Quotation status distribution

### 👤 User Management
- Role-based access control (Admin, Manager, Operator)
- Secure authentication with JWT tokens
- User activity tracking
- Profile management

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **React Hook Form** + **Zod** for form validation
- **React Router v6** for navigation
- **Recharts** for data visualization
- **@react-pdf/renderer** for PDF generation
- **Axios** for API calls
- **React Hot Toast** for notifications

### Backend
- **Node.js** + **Express**
- **MongoDB** with **Mongoose**
- **JWT** authentication
- **bcryptjs** for password hashing
- **express-validator** for input validation
- **multer** for file uploads
- **puppeteer** for PDF generation
- **helmet**, **cors**, **compression** for security and performance

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Git

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd plastic-production-system
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Environment Configuration**
   
   **Server (.env)**:
   ```bash
   cd server
   cp .env.example .env
   ```
   
   Edit `server/.env`:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/plastic-production
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
   CLIENT_URL=http://localhost:3000
   NODE_ENV=development
   ```

   **Client (.env)**:
   ```bash
   cd client
   cp .env.example .env
   ```
   
   Edit `client/.env`:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Database Setup**
   ```bash
   # Make sure MongoDB is running, then seed the database
   npm run seed
   ```

5. **Start Development Servers**
   ```bash
   # Start both client and server concurrently
   npm run dev
   ```

   Or start them separately:
   ```bash
   # Terminal 1 - Server
   cd server && npm run dev
   
   # Terminal 2 - Client
   cd client && npm run dev
   ```

6. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Default Login Credentials

After running the seed script, use these credentials:

- **Admin**: admin@company.com / Admin@123
- **Manager**: manager@company.com / Manager@123
- **Operator**: operator@company.com / Operator@123

## Project Structure

```
plastic-production-system/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   ├── utils/          # Utility functions
│   │   └── App.tsx         # Main app component
│   ├── public/             # Static assets
│   └── package.json
├── server/                 # Express backend
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── seed.js             # Database seeding
│   └── server.js           # Main server file
├── package.json            # Root package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Calculations
- `GET /api/calculations` - List calculations
- `POST /api/calculations` - Create calculation
- `GET /api/calculations/:id` - Get calculation
- `PUT /api/calculations/:id` - Update calculation
- `DELETE /api/calculations/:id` - Delete calculation
- `GET /api/calculations/:id/pdf` - Export as PDF

### Quotations
- `GET /api/quotations` - List quotations
- `POST /api/quotations` - Create quotation
- `GET /api/quotations/:id` - Get quotation
- `PUT /api/quotations/:id` - Update quotation
- `DELETE /api/quotations/:id` - Delete quotation
- `GET /api/quotations/:id/pdf` - Export as PDF
- `GET /api/quotations/public/:quoteNumber` - Public view

### Materials
- `GET /api/materials` - List materials
- `POST /api/materials` - Create material
- `PUT /api/materials/:id` - Update material
- `DELETE /api/materials/:id` - Delete material
- `GET /api/materials/:id/history` - Price history

### Clients
- `GET /api/clients` - List clients
- `POST /api/clients` - Create client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client
- `GET /api/clients/:id/quotations` - Client quotations

### Dashboard
- `GET /api/dashboard/summary` - Summary statistics
- `GET /api/dashboard/charts` - Chart data

### Settings
- `GET /api/settings` - Get settings
- `PUT /api/settings` - Update settings
- `POST /api/settings/logo` - Upload logo

### Users (Admin only)
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Features in Detail

### Calculation Modes

**Mode A (Component-Based)**:
- Input: Component weight, cavities, short weight, scrap/runner weight
- Calculates: Material utilization, efficiency, cost breakdown
- Use case: When you know the exact part weight

**Mode B (Shot-Based)**:
- Input: Total shot weight, cavities
- Calculates: Component weight automatically
- Use case: When you know the total material per cycle

### Quotation System

The quotation system replicates your exact company format:
- Header with company logo and details
- Client information block
- Line items table with HSN codes
- GST calculations (CGST/SGST or IGST)
- Terms and conditions
- Authorized signatory section

### Material Efficiency Analysis

- **Net Part Material**: Material actually in finished parts
- **Short Weight Loss**: Material lost due to short shots
- **Scrap/Runner Loss**: Material in runners and scrap
- **Leftover Material**: Unused material from incomplete cycles
- **Overall Efficiency**: Percentage of material in finished parts

### Cost Breakdown

- **Material Cost**: Based on component weight and material price
- **Job Work Cost**: Processing cost per piece
- **Overhead Cost**: Additional overhead per piece
- **Packing Cost**: Packaging cost per piece
- **Total Cost**: Sum of all costs

## Production Deployment

### Build for Production

```bash
# Build the client
cd client
npm run build

# The built files will be in client/dist/
```

### Environment Variables for Production

Update your production environment variables:

**Server**:
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/plastic-production
JWT_SECRET=your-production-jwt-secret
JWT_REFRESH_SECRET=your-production-refresh-secret
CLIENT_URL=https://yourdomain.com
```

**Client**:
```
VITE_API_URL=https://api.yourdomain.com/api
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@yourdomain.com or create an issue in the repository.