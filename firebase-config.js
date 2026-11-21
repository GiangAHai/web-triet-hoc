/**
 * ============================================================================
 * HỆ THỐNG E-LEARNING TRIẾT HỌC MÁC - LÊNIN (PHI1001)
 * File: firebase-config.js
 * Nhiệm vụ: Cấu hình và khởi tạo kết nối Firebase (Authentication & Firestore)
 *           Sử dụng Firebase Modular SDK v10.14.1 qua CDN (gstatic.com)
 *           Tương thích 100% trên GitHub Pages & Web tĩnh (không dùng npm).
 * ============================================================================
 */

import {
  initializeApp,
  getApps,
  getApp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

/**
 * 1. ĐỐI TƯỢNG CẤU HÌNH FIREBASE CHÍNH THỨC CỦA DỰ ÁN
 */
export const firebaseConfig = {
  apiKey: "AIzaSyBa8Oxs1tyBHTNzx81rgpF9aZa04bnJ0Es",
  authDomain: "luu-diem-triet-hoc.firebaseapp.com",
  projectId: "luu-diem-triet-hoc",
  storageBucket: "luu-diem-triet-hoc.firebasestorage.app",
  messagingSenderId: "208824884586",
  appId: "1:208824884586:web:1421168c90bafb57dcd913"
};

/**
 * 2. Hàm kiểm tra bộ cấu hình Firebase đã đầy đủ hay chưa
 * @returns {boolean} true nếu đã có apiKey và projectId hợp lệ
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
 * Tương thích với auth.js, app.js và quiz.js khi gọi initFirebaseCore()
 * @returns {{ app: Object|null, auth: Object|null, db: Object|null, googleProvider: Object|null, isConfigured: boolean }}
 */
export function initFirebaseCore() {
  if (!isFirebaseConfigReady()) {
    console.warn(
      "[Firebase Config] Chưa phát hiện thông số hợp lệ trong firebase-config.js."
    );
    return {
      app: null,
      auth: null,
      db: null,
      googleProvider: null,
      isConfigured: false
    };
  }

  // Khởi tạo Firebase App (tránh khởi tạo trùng lặp nhiều lần)
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

  // Khởi tạo Firebase Authentication & Google Pop-up Provider
  const auth = getAuth(app);
  const googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({
    prompt: "select_account"
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

/**
 * 4. Khởi tạo sẵn các instance để hỗ trợ import trực tiếp { app, auth, db, googleProvider }
 */
const defaultServices = initFirebaseCore();

export const app = defaultServices.app;
export const auth = defaultServices.auth;
export const db = defaultServices.db;
export const googleProvider = defaultServices.googleProvider;
export const isConfigured = defaultServices.isConfigured;

export default defaultServices;