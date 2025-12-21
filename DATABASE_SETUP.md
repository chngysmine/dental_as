# Hướng dẫn cấu hình Database cho DentWise

## ⚠️ VẤN ĐỀ HIỆN TẠI

File `.env.local` của bạn có:
```
DATABASE_URL=your-neon-database-connection-string-here
```

Đây là **placeholder**, cần thay bằng connection string thực tế.

## 🚀 CÁCH KHẮC PHỤC

### Option 1: Sử dụng Neon (Khuyến nghị - Free tier)

1. **Đăng ký Neon:**
   - Truy cập: https://neon.tech
   - Đăng ký tài khoản miễn phí

2. **Tạo Database:**
   - Click "Create Project"
   - Chọn region gần bạn nhất
   - Đặt tên project (ví dụ: `dental-as`)
   - Click "Create Project"

3. **Lấy Connection String:**
   - Sau khi tạo project, Neon sẽ hiển thị connection string
   - Hoặc vào **Dashboard → Project → Connection Details**
   - Copy connection string (có dạng):
     ```
     postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
     ```

4. **Cập nhật `.env.local`:**
   - Mở file `.env.local`
   - Thay dòng:
     ```
     DATABASE_URL=your-neon-database-connection-string-here
     ```
   - Bằng connection string thực tế:
     ```
     DATABASE_URL="postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require"
     ```
   - **Lưu ý:** Đặt trong dấu ngoặc kép `"..."`

5. **Chạy Prisma Migrations:**
   ```bash
   # Generate Prisma Client
   npx prisma generate

   # Run migrations to create tables
   npx prisma migrate dev --name init
   ```

6. **Khởi động lại server:**
   ```bash
   npm run dev
   ```

### Option 2: Sử dụng Supabase (Free tier)

1. **Đăng ký Supabase:**
   - Truy cập: https://supabase.com
   - Đăng ký tài khoản miễn phí

2. **Tạo Project:**
   - Click "New Project"
   - Đặt tên và password cho database
   - Chọn region
   - Click "Create new project"

3. **Lấy Connection String:**
   - Vào **Settings → Database**
   - Scroll xuống phần "Connection string"
   - Chọn tab "URI"
   - Copy connection string
   - Format: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

4. **Cập nhật `.env.local`:**
   ```
   DATABASE_URL="postgresql://postgres:your_password@db.xxxxx.supabase.co:5432/postgres"
   ```

### Option 3: PostgreSQL Local

1. **Cài đặt PostgreSQL:**
   - Windows: Download từ https://www.postgresql.org/download/windows/
   - Mac: `brew install postgresql`
   - Linux: `sudo apt-get install postgresql`

2. **Tạo Database:**
   ```sql
   CREATE DATABASE dental_as;
   ```

3. **Cập nhật `.env.local`:**
   ```
   DATABASE_URL="postgresql://postgres:your_password@localhost:5432/dental_as"
   ```

## ✅ KIỂM TRA

Sau khi cập nhật `DATABASE_URL`:

1. **Test connection:**
   ```bash
   npx prisma db pull
   ```

2. **Nếu thành công, chạy migrations:**
   ```bash
   npx prisma migrate dev --name init
   ```

3. **Khởi động lại dev server:**
   ```bash
   npm run dev
   ```

4. **Kiểm tra console:**
   - Không còn lỗi `DATABASE_URL`
   - Prisma kết nối thành công

## 🔍 TROUBLESHOOTING

### Lỗi: "the URL must start with the protocol `postgresql://`"

**Nguyên nhân:** Connection string không đúng format

**Giải pháp:**
- Đảm bảo connection string bắt đầu với `postgresql://` hoặc `postgres://`
- Đặt trong dấu ngoặc kép: `DATABASE_URL="postgresql://..."`
- Không có khoảng trắng thừa

### Lỗi: "password authentication failed"

**Nguyên nhân:** Password sai

**Giải pháp:**
- Kiểm tra lại password trong connection string
- Với Neon/Supabase: Đảm bảo đã copy đúng password từ dashboard

### Lỗi: "connection refused"

**Nguyên nhân:** Database server không chạy hoặc host/port sai

**Giải pháp:**
- Kiểm tra database server đang chạy (nếu dùng local)
- Kiểm tra host và port trong connection string
- Kiểm tra firewall/network settings

## 📝 VÍ DỤ CONNECTION STRING ĐÚNG

```bash
# Neon
DATABASE_URL="postgresql://user:pass@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Supabase
DATABASE_URL="postgresql://postgres:yourpassword@db.abcdefghijklmnop.supabase.co:5432/postgres"

# Local PostgreSQL
DATABASE_URL="postgresql://postgres:mypassword@localhost:5432/dental_as"
```

## 🚨 LƯU Ý QUAN TRỌNG

- **KHÔNG commit** file `.env.local` vào Git
- **KHÔNG chia sẻ** connection string công khai
- **Đổi password** mặc định sau khi setup
- **Backup database** trước khi deploy production

