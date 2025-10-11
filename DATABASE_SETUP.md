# Database Setup - NeonDB PostgreSQL

## 🎯 Database URL
```
postgresql://neondb_owner:npg_pyfjGkKWz26X@ep-round-unit-af2adeyg.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require
```

## ✅ Optimizations Applied

### 1. Connection Pool Optimization
- **Max Connections**: 20 (handles high concurrent requests)
- **Min Connections**: 2 (maintains ready connections)
- **Idle Timeout**: 30 seconds (frees unused connections)
- **Connection Timeout**: 10 seconds (prevents hanging requests)
- **Auto Exit on Idle**: Enabled (optimizes resource usage)

### 2. Database Indexes
Added performance indexes on frequently queried columns:
- `customers`: campaign_id, username, referral_code
- `transactions`: customer_id, campaign_id, created_at
- `customer_coupons`: customer_id, shop_profile_id
- `shared_coupons`: share_token
- `campaigns`: store_id

### 3. Error Handling
- Pool error logging for debugging
- Graceful connection failure handling
- SSL connection with proper configuration

## 📊 Database Schema

### Tables Created:
1. **stores** - Store information
2. **shop_profiles** - Shop profile details
3. **campaigns** - Reward campaigns
4. **customers** - Customer data
5. **customer_coupons** - Customer coupon management
6. **shared_coupons** - Shared coupon tracking
7. **transactions** - Transaction records

## 🚀 Performance Features

### Fast Query Performance
- Optimized indexes on foreign keys
- Index on frequently searched fields (username, referral codes)
- Timestamp indexes for time-based queries

### Smooth User Experience
- Connection pooling prevents lag
- Pre-warmed connections (min: 2)
- Fast timeout handling (10s max)
- Auto-cleanup of idle connections

### Scalability
- Supports up to 20 concurrent connections
- Efficient resource management
- SSL-secured connections

## 🔧 Environment Variables
All database credentials are automatically set:
- `DATABASE_URL`: Full connection string
- `PGHOST`: Database host
- `PGPORT`: Database port
- `PGUSER`: Database user
- `PGPASSWORD`: Database password
- `PGDATABASE`: Database name

## 📝 Usage
The database is fully configured and ready to use. All tables, indexes, and optimizations are in place for smooth, lag-free performance.

### Sample Login Credentials (from seed data):
- **Customer**: username=sarah, password=password123
- **Shop Owner**: username=coffeehaven, password=password123
