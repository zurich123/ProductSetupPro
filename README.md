# Colibri Core - Product Management System

A comprehensive full-stack product management application built for healthcare and wellness organizations to manage their product catalog, pricing, and ecosystem relationships.

## Overview

This application provides a complete solution for product managers to create, edit, and manage products across different ecosystems, brands, and fulfillment platforms. Built with a modern tech stack and designed for scalability and ease of use.

## Features

### Core Functionality
- **Product Management**: Create, edit, delete, and clone products
- **Advanced Search & Filtering**: Search by name, SKU, ecosystem, brand, and status
- **Multi-Brand Support**: Manage products across different brands and ecosystems
- **Pricing Management**: Handle base pricing, MSRP, cost of goods, and promotional pricing
- **SKU Versioning**: Support for multiple SKU versions with independent pricing
- **Status Management**: Track product status (Active, Inactive, Draft)

### User Interface
- **Modern Design**: Clean, professional interface with shadcn/ui components
- **Responsive Layout**: Works seamlessly on desktop and mobile devices
- **Real-time Updates**: Instant feedback and live data updates
- **Modal Forms**: Intuitive product creation and editing experience
- **Data Tables**: Advanced product listing with sorting and pagination

## Tech Stack

### Frontend
- **React 18** - Modern UI library with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality component library
- **TanStack Query** - Powerful data fetching and caching
- **React Hook Form** - Performant form management
- **Wouter** - Minimalist routing solution

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **TypeScript** - Type-safe server development
- **Drizzle ORM** - Type-safe database operations
- **PostgreSQL** - Robust relational database
- **Zod** - Schema validation library

### Database Schema
Complex relational database supporting:
- **Products (Offerings)**: Core product information
- **SKU Versions**: Multiple versions per product
- **Pricing Tiers**: Flexible pricing structures
- **Brand Management**: Multi-brand product organization
- **Ecosystem Support**: Healthcare, Dental, Veterinary, Mental Health
- **Fulfillment Integration**: Multiple platform support

## Getting Started

### Prerequisites
- Node.js 20+ 
- PostgreSQL database
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd colibri-core
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Database configuration (automatically provided in Replit)
   DATABASE_URL=your_postgresql_connection_string
   PGHOST=your_host
   PGPORT=your_port
   PGUSER=your_username
   PGPASSWORD=your_password
   PGDATABASE=your_database
   ```

4. **Initialize the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   Open your browser to `http://localhost:5000`

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   ├── ui/       # shadcn/ui components
│   │   │   ├── layout/   # Layout components
│   │   │   └── ...       # Feature components
│   │   ├── pages/        # Application pages
│   │   ├── hooks/        # Custom React hooks
│   │   └── lib/          # Utility functions
├── server/                # Backend Express application
│   ├── db.ts             # Database connection
│   ├── storage.ts        # Data access layer
│   ├── routes.ts         # API routes
│   └── index.ts          # Server entry point
├── shared/               # Shared types and schemas
│   └── schema.ts         # Database schema and types
└── README.md            # This file
```

## API Endpoints

### Products
- `GET /api/products` - List all products with optional filtering
- `GET /api/products/:id` - Get specific product details
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update existing product
- `DELETE /api/products/:id` - Delete product
- `POST /api/products/:id/clone` - Clone existing product

### Lookup Data
- `GET /api/brands` - Get all available brands
- `GET /api/ecosystems` - Get all ecosystems
- `GET /api/fulfillment-platforms` - Get fulfillment platforms

## Database Schema

The application uses a sophisticated database schema designed for enterprise product management:

### Core Tables
- **offering**: Main product information
- **sku_version**: Product variants and versions
- **sku_version_pricing**: Pricing information per SKU
- **offering_brand**: Product-brand relationships
- **offering_product**: Product-SKU relationships

### Lookup Tables
- **brand_lookup**: Available brands
- **ecosystem**: Business ecosystems (Healthcare, Dental, etc.)
- **fulfillment_platform**: Fulfillment and distribution channels
- **profession_lookup**: Professional categories
- **state_lookup**: Geographic state information

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:push` - Push schema changes to database
- `npm run type-check` - Run TypeScript type checking

### Code Quality
- **TypeScript**: Full type safety across frontend and backend
- **Zod Validation**: Runtime schema validation
- **ESLint**: Code linting and formatting
- **Type-safe API**: Shared types between client and server

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Deployment

The application is configured for deployment on Replit with automatic:
- Database provisioning
- Environment variable management
- SSL/TLS handling
- Domain management

For other platforms, ensure:
- PostgreSQL database is available
- Environment variables are configured
- Build process is run (`npm run build`)

## License

This project is proprietary software developed for Colibri Core.

## Support

For technical support or feature requests, please contact the development team or create an issue in the repository.

---

**Built with ❤️ for modern product management**