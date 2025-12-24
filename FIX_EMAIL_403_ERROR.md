# 🔧 Khắc phục Lỗi 403 Validation Error - Email Chỉ Gửi Được Đến Email Của Bạn

## ❌ Lỗi hiện tại

Bạn đang gặp lỗi:
```
validation_error: You can only send testing emails to your own email address (qimin020104@gmail.com). 
To send emails to other recipients, please verify a domain at resend.com/domains, and change the `from`
```

## 🔍 Nguyên nhân

Resend API key của bạn đang ở **chế độ test** (test mode). Trong chế độ này:
- ✅ Chỉ có thể gửi email đến email đã verify: **qimin020104@gmail.com**
- ❌ Không thể gửi đến email khác
- ❌ Phải dùng domain test: `onboarding@resend.dev`

## ✅ Giải pháp

Bạn có **2 lựa chọn**:

### Giải pháp 1: Chỉ gửi email đến email của bạn (Cho Development/Testing)

Nếu bạn chỉ cần test tính năng email, có thể tạm thời chỉ gửi đến email của bạn:

**Cách làm:**
1. Trong code, khi book appointment, nếu email khác email của bạn, có thể skip hoặc gửi đến email của bạn
2. Hoặc chỉ test với email: `qimin020104@gmail.com`

**Ưu điểm:**
- ✅ Không cần verify domain
- ✅ Nhanh chóng để test
- ✅ Miễn phí

**Nhược điểm:**
- ❌ Chỉ gửi được đến 1 email
- ❌ Không thể test với email thật của user

### Giải pháp 2: Verify Domain (Cho Production - KHUYẾN NGHỊ)

Để gửi email đến bất kỳ email nào, bạn cần verify domain trong Resend.

#### Bước 1: Verify Domain trong Resend

1. **Đăng nhập Resend Dashboard:**
   - Truy cập: https://resend.com/domains
   - Đăng nhập vào tài khoản

2. **Add Domain:**
   - Click "Add Domain"
   - Nhập domain của bạn (ví dụ: `yourdomain.com`)
   - Resend sẽ cung cấp các DNS records cần thêm

3. **Thêm DNS Records:**
   - Đăng nhập vào domain provider (GoDaddy, Namecheap, Cloudflare, etc.)
   - Thêm các records mà Resend yêu cầu:
     - **SPF record** (TXT)
     - **DKIM record** (TXT)
     - **DMARC record** (TXT) - Optional nhưng khuyến nghị
   - Đợi DNS propagate (5-30 phút)

4. **Verify Domain:**
   - Quay lại Resend dashboard
   - Click "Verify"
   - Khi status chuyển sang "Verified" (màu xanh) là thành công

#### Bước 2: Cập nhật .env.local

Sau khi verify domain, cập nhật file `.env.local`:

```bash
# API key (giữ nguyên)
RESEND_API_KEY=re_your_api_key_here

# Cập nhật from email với domain đã verify
RESEND_FROM_EMAIL="DentWise <noreply@yourdomain.com>"
RESEND_REPLY_TO_EMAIL="support@yourdomain.com"

# App URL
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

**Lưu ý:** Thay `yourdomain.com` bằng domain thật của bạn.

#### Bước 3: Restart Server

```bash
# Dừng server (Ctrl+C)
npm run dev
```

#### Bước 4: Test lại

1. Book một appointment với email bất kỳ
2. Kiểm tra email có được gửi không
3. Kiểm tra Resend dashboard để xem logs

## 🚀 Quick Fix (Tạm thời cho Development)

Nếu bạn chỉ cần test nhanh và không muốn verify domain ngay, có thể:

1. **Test với email của bạn:**
   - Khi book appointment, dùng email: `qimin020104@gmail.com`
   - Email sẽ được gửi thành công

2. **Hoặc skip email trong development:**
   - Có thể tạm thời comment phần gửi email
   - Hoặc chỉ log ra console thay vì gửi email thật

## 📋 Checklist

### Nếu chọn Giải pháp 1 (Test mode):
- [ ] Chỉ test với email: `qimin020104@gmail.com`
- [ ] Hiểu rằng chỉ gửi được đến 1 email

### Nếu chọn Giải pháp 2 (Verify domain):
- [ ] Đã add domain trong Resend dashboard
- [ ] Đã thêm DNS records (SPF, DKIM, DMARC)
- [ ] Domain đã được verify (status: Verified)
- [ ] Đã cập nhật `RESEND_FROM_EMAIL` trong `.env.local`
- [ ] Đã restart server
- [ ] Đã test gửi email đến email khác

## 💡 Lưu ý

### Về Domain Verification:

1. **Cần có domain:**
   - Bạn cần có domain riêng (ví dụ: `yourdomain.com`)
   - Có thể mua domain từ: GoDaddy, Namecheap, Cloudflare, etc.

2. **DNS Records:**
   - SPF: Xác thực server được phép gửi email
   - DKIM: Ký email để chống spam
   - DMARC: Policy để xử lý email không pass authentication

3. **Thời gian:**
   - DNS propagate: 5-30 phút (có thể lâu hơn)
   - Verification: Ngay sau khi DNS records được thêm

### Về Test Mode:

- Test mode là tính năng của Resend để bảo vệ người dùng
- Tránh gửi spam email khi chưa verify domain
- Miễn phí nhưng có giới hạn

## 🎯 Khuyến nghị

- **Development/Testing:** Dùng test mode, chỉ gửi đến email của bạn
- **Production:** **PHẢI** verify domain để gửi email đến bất kỳ ai

## 📞 Cần hỗ trợ thêm?

1. **Xem hướng dẫn chi tiết:** `RESEND_SETUP.md`
2. **Resend Documentation:** https://resend.com/docs
3. **Resend Domains:** https://resend.com/domains

