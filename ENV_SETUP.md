# Hướng dẫn cấu hình Environment Variables

## ⚠️ LỖI HIỆN TẠI

Bạn đang gặp lỗi: **`DATABASE_URL` is missing or invalid**

## 🔧 CÁCH KHẮC PHỤC

### Bước 1: Tạo file `.env.local`

Tạo file `.env.local` trong thư mục gốc của project (cùng cấp với `package.json`)

### Bước 2: Thêm các biến môi trường bắt buộc

Copy nội dung sau vào file `.env.local`:

```bash
# ============================================
# REQUIRED - Database Configuration
# ============================================
# PostgreSQL connection string
# Format: postgresql://username:password@host:port/database
DATABASE_URL="postgresql://postgres:password@localhost:5432/dental_as"

# ============================================
# REQUIRED - Clerk Authentication
# ============================================
# Get these from: https://dashboard.clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here
```

### Bước 3: Cấu hình Database

Bạn có 3 lựa chọn:

#### Option 1: PostgreSQL Local (Khuyến nghị cho development)

1. Cài đặt PostgreSQL trên máy:
   - Windows: Download từ https://www.postgresql.org/download/windows/
   - Mac: `brew install postgresql`
   - Linux: `sudo apt-get install postgresql`

2. Tạo database:
   ```sql
   CREATE DATABASE dental_as;
   ```

3. Cập nhật `DATABASE_URL` trong `.env.local`:
   ```bash
   DATABASE_URL="postgresql://postgres:your_password@localhost:5432/dental_as"
   ```

#### Option 2: Supabase (Free tier - Khuyến nghị)

1. Đăng ký tại: https://supabase.com
2. Tạo project mới
3. Vào Settings → Database
4. Copy connection string (URI)
5. Paste vào `.env.local`:
   ```bash
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
   ```

#### Option 3: Neon (Free tier)

1. Đăng ký tại: https://neon.tech
2. Tạo project mới
3. Copy connection string
4. Paste vào `.env.local`

### Bước 4: Chạy Prisma Migrations

Sau khi cấu hình database, chạy:

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations to create tables
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

### Bước 5: Cấu hình Clerk (Authentication)

1. Đăng ký tại: https://clerk.com
2. Tạo application mới
3. Vào API Keys
4. Copy `Publishable Key` và `Secret Key`
5. Paste vào `.env.local`:
   ```bash
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```

## 📋 CÁC BIẾN MÔI TRƯỜNG KHÁC (Tùy chọn)

### Email Configuration (Resend)

```bash
# Get API key from: https://resend.com/api-keys
RESEND_API_KEY=re_your_api_key_here

# Optional: Custom email addresses (after verifying domain)
RESEND_FROM_EMAIL="DentWise <noreply@yourdomain.com>"
RESEND_REPLY_TO_EMAIL="support@yourdomain.com"
```

Xem thêm: `RESEND_SETUP.md`

### Voice AI (VAPI)

```bash
# Get from: https://dashboard.vapi.ai
NEXT_PUBLIC_VAPI_API_KEY=your_vapi_api_key_here
NEXT_PUBLIC_VAPI_ASSISTANT_ID=your_assistant_id_here
```

### Admin Configuration

```bash
# Email address that will have admin access
ADMIN_EMAIL=admin@example.com
```

### App URL

```bash
# For development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# For production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## ✅ KIỂM TRA

Sau khi cấu hình xong:

1. **Khởi động lại dev server:**
   ```bash
   npm run dev
   ```

2. **Kiểm tra console:**
   - Không còn lỗi `DATABASE_URL`
   - Prisma kết nối thành công
   - Clerk authentication hoạt động

3. **Test database connection:**
   ```bash
   npx prisma db pull
   ```

## 🚨 LƯU Ý

- **KHÔNG commit file `.env.local`** vào Git (đã có trong `.gitignore`)
- **KHÔNG chia sẻ** các API keys và secrets
- **Đổi password** mặc định của PostgreSQL
- **Backup database** trước khi deploy production

## 📚 TÀI LIỆU THAM KHẢO

- Prisma: https://www.prisma.io/docs
- Clerk: https://clerk.com/docs
- Supabase: https://supabase.com/docs
- Neon: https://neon.tech/docs

