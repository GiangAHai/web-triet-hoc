\# PROJECT RULES: Web Triết Học AI



\## 1. Tech Stack

\- Frontend: HTML5, CSS3, Vanilla JavaScript (ES6 Modules). KHÔNG dùng framework như React, Vue hay Tailwind.

\- Backend/Database: Firebase Authentication, Cloud Firestore (Modular SDK v10+ qua CDN).

\- AI Integration: Coze Web SDK.

\- Hosting: GitHub Pages.



\## 2. File Structure \& Pathing

\- Luôn sử dụng đường dẫn tương đối (ví dụ: `./css/style.css`, `./js/auth.js`) cho mọi assets, script để tránh lỗi 404 khi deploy lên GitHub Pages.

\- Chia nhỏ logic JavaScript theo chức năng (auth.js, db.js, coze.js) thay vì viết gộp vào một file khổng lồ.



\## 3. Execution Constraints

\- Đọc kỹ mã nguồn hiện tại trước khi đề xuất thay đổi.

\- Khi được yêu cầu cập nhật code, phải trả về toàn bộ tệp hoặc khối code hoàn chỉnh. Tuyệt đối KHÔNG viết tắt kiểu `// ... existing code ...` làm hỏng logic cũ.

\- Bắt lỗi (try/catch) đầy đủ và in log rõ ràng (console.error) khi tương tác với Firebase hoặc Coze SDK.

