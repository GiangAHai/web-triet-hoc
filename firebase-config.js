/**
 * ============================================================================
 * HỆ THỐNG E-LEARNING TRIẾT HỌC MÁC - LÊNIN
 * File: firebase-config.js
 * Nhiệm vụ: Cấu hình và khởi tạo kết nối Firebase (Authentication & Firestore)
 *           Sử dụng Firebase Modular SDK v10 qua CDN dành cho Web tĩnh (HTML/JS).
 * ============================================================================
 */

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

/**
 * 1. ĐỐI TƯỢNG CẤU HÌNH FIREBASE (ĐỂ TRỐNG CHO BẠN TỰ ĐIỀN)
 * Hướng dẫn: Vào Firebase Console -> Project Settings -> General -> Your apps
 * Copy các thông số trong firebaseConfig của bạn và dán vào các chuỗi bên dưới.
 */
export const firebaseConfig = {
  apiKey: "AIzaSyA-IhadWZAhTPmivheeKErl2Uq6eKJP6hE",             // Điền apiKey của bạn (VD: "AIzaSyD...")
  authDomain: "luu-diem-triet-hoc.firebaseapp.com",         // Điền authDomain (VD: "triet-hoc-elearning.firebaseapp.com")
  projectId: "luu-diem-triet-hoc",          // Điền projectId (VD: "triet-hoc-elearning")
  storageBucket: "luu-diem-triet-hoc.firebasestorage.app",      // Điền storageBucket (VD: "triet-hoc-elearning.appspot.com")
  messagingSenderId: "208824884586",  // Điền messagingSenderId (VD: "123456789012")
  appId: "1:208824884586:web:1421168c90bafb57dcd913"               // Điền appId (VD: "1:123456789012:web:abcdef123456")
};

/**
 * 2. Hàm kiểm tra xem bộ cấu hình Firebase đã được điền đầy đủ chưa
 * @returns {boolean} true nếu đã điền apiKey và projectId hợp lệ
 */
export function isFirebaseConfigReady() {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey.trim() !== "" &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId.trim() !== ""
  );
}

/**
 * 3. Hàm khởi tạo các dịch vụ cốt lõi của Firebase (App, Auth, Firestore, GoogleProvider)
 * @returns {{ app: Object|null, auth: Object|null, db: Object|null, googleProvider: Object|null, isConfigured: boolean }}
 */
export function initFirebaseCore() {
  if (!isFirebaseConfigReady()) {
    console.warn(
      "[Firebase Config] Bạn chưa điền thông số vào firebase-config.js. " +
      "Hệ thống sẽ tạm thời chạy ở chế độ mô phỏng cục bộ (Demo State) để bạn kiểm thử giao diện."
    );
    return {
      app: null,
      auth: null,
      db: null,
      googleProvider: null,
      isConfigured: false
    };
  }

  // Khởi tạo Firebase App (đảm bảo không khởi tạo trùng lặp nhiều lần)
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

  // Khởi tạo Firebase Authentication & Cấu hình Google Pop-up Provider
  const auth = getAuth(app);
  const googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({
    prompt: "select_account" // Luôn cho phép sinh viên chọn tài khoản Google khi đăng nhập
  });

  // Khởi tạo Cloud Firestore Database
  const db = getFirestore(app);

  return {
    app: app,
    auth: auth,
    db: db,
    googleProvider: googleProvider,
    isConfigured: true
  };
}
