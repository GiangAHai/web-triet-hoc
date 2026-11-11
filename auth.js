/**
 * ============================================================================
 * HỆ THỐNG E-LEARNING TRIẾT HỌC MÁC - LÊNIN
 * File: auth.js
 * Nhiệm vụ:
 *   1. Xử lý Đăng nhập bằng Google Pop-up & Đăng xuất (Firebase Auth).
 *   2. Lưu điểm bài trắc nghiệm lên Firestore theo cấu trúc:
 *      users/{uid}/progress/{chapter_id}
 *   3. Đọc dữ liệu tiến độ từ Firestore về và hiển thị lên màn hình
 *      "Hành trình tự học".
 * ============================================================================
 */

import {
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

import { initFirebaseCore } from "./firebase-config.js";

// Khởi tạo kết nối từ firebase-config.js
const firebaseServices = initFirebaseCore();

// Danh mục chuẩn 3 Chương của môn Triết học Mác - Lênin để đối chiếu trên "Hành trình tự học"
export const CURRICULUM_CHAPTERS = [
  {
    chapterId: "chuong_1",
    chapterNumber: "Chương 01",
    title: "Triết học và vai trò của triết học trong đời sống xã hội",
    targetQuestions: 10
  },
  {
    chapterId: "chuong_2",
    chapterNumber: "Chương 02",
    title: "Chủ nghĩa duy vật biện chứng",
    targetQuestions: 2
  },
  {
    chapterId: "chuong_3",
    chapterNumber: "Chương 03",
    title: "Chủ nghĩa duy vật lịch sử",
    targetQuestions: 10
  }
];

// Biến lưu thông tin sinh viên đang đăng nhập trong phiên hiện tại
let currentAuthenticatedUser = null;

/**
 * ============================================================================
 * PHẦN 1: ĐĂNG NHẬP BẰNG GOOGLE POP-UP & QUẢN LÝ PHIÊN ĐĂNG NHẬP
 * ============================================================================
 */

/**
 * Hàm Đăng nhập bằng Google Pop-up (Firebase Authentication)
 * @returns {Promise<Object|null>} Thông tin người dùng (uid, displayName, email, photoURL)
 */
export async function loginWithGooglePopup() {
  if (!firebaseServices.isConfigured || !firebaseServices.auth) {
    renderAuthStatusBanner(
      "Vui lòng điền thông số vào file firebase-config.js để kích hoạt Google Pop-up thực tế.",
      "warning"
    );
    return null;
  }

  try {
    const result = await signInWithPopup(firebaseServices.auth, firebaseServices.googleProvider);
    const user = result.user;

    // Lưu / cập nhật hồ sơ định danh cơ bản tại document gốc: users/{uid}
    const userProfileRef = doc(firebaseServices.db, "users", user.uid);
    await setDoc(
      userProfileRef,
      {
        uid: user.uid,
        displayName: user.displayName || "Sinh viên",
        email: user.email || "",
        photoURL: user.photoURL || "",
        lastLoginAt: serverTimestamp()
      },
      { merge: true }
    );

    renderAuthStatusBanner("Đăng nhập thành công! Xin chào " + (user.displayName || user.email), "success");
    return user;
  } catch (error) {
    console.error("[Auth Error] Lỗi khi đăng nhập Google Pop-up:", error);
    renderAuthStatusBanner("Đăng nhập không thành công: " + error.message, "error");
    return null;
  }
}

/**
 * Hàm Đăng xuất tài khoản sinh viên
 */
export async function logoutStudent() {
  if (!firebaseServices.isConfigured || !firebaseServices.auth) return;

  try {
    await signOut(firebaseServices.auth);
    currentAuthenticatedUser = null;
    renderAuthStatusBanner("Đã đăng xuất tài khoản sinh viên.", "info");
  } catch (error) {
    console.error("[Auth Error] Lỗi khi đăng xuất:", error);
  }
}

/**
 * Hàm lắng nghe sự thay đổi trạng thái đăng nhập (Tự động chạy khi mở trang hoặc F5)
 * @param {Function} onUserChangedCallback - Hàm callback nhận đối tượng user (hoặc null)
 */
export function initAuthStateObserver(onUserChangedCallback) {
  if (!firebaseServices.isConfigured || !firebaseServices.auth) {
    updateAuthHeaderUI(null);
    if (typeof onUserChangedCallback === "function") {
      onUserChangedCallback(null);
    }
    return;
  }

  onAuthStateChanged(firebaseServices.auth, async function(user) {
    currentAuthenticatedUser = user || null;
    updateAuthHeaderUI(currentAuthenticatedUser);

    if (currentAuthenticatedUser) {
      // Ngay khi xác nhận sinh viên đã đăng nhập, tự động lấy tiến độ từ Firestore về hiển thị
      const progressMap = await fetchStudentProgress(currentAuthenticatedUser.uid);
      renderLearningJourneyUI(progressMap, currentAuthenticatedUser);
    } else {
      renderLearningJourneyUI({}, null);
    }

    if (typeof onUserChangedCallback === "function") {
      onUserChangedCallback(currentAuthenticatedUser);
    }
  });
}

/**
 * ============================================================================
 * PHẦN 2: LƯU TIẾN ĐỘ LÀM BÀI TRẮC NGHIỆM LÊN FIRESTORE
 * Cấu trúc Document yêu cầu: users/{uid}/progress/{chapter_id}
 * ============================================================================
 */

/**
 * Hàm lưu điểm số sau khi sinh viên hoàn thành bài trắc nghiệm ở quiz.html
 * @param {string} uid - Mã định danh người dùng Firebase Auth (user.uid)
 * @param {string} chapterId - Mã chương học (VD: "chuong_1", "chuong_2", "chuong_3")
 * @param {Object} quizResult - Kết quả làm bài: { correctCount, totalQuestions, chapterTitle }
 * @returns {Promise<Object|null>} Dữ liệu tiến độ vừa được lưu lên Firestore
 */
export async function saveQuizProgressToFirestore(uid, chapterId, quizResult) {
  if (!uid || !chapterId) {
    renderAuthStatusBanner("Bạn cần đăng nhập Google trước khi lưu điểm lên hệ thống!", "warning");
    return null;
  }

  if (!firebaseServices.isConfigured || !firebaseServices.db) {
    renderAuthStatusBanner("Chưa cấu hình firebase-config.js để ghi dữ liệu lên Firestore.", "warning");
    return null;
  }

  try {
    const correctCount = Number(quizResult.correctCount) || 0;
    const totalQuestions = Number(quizResult.totalQuestions) || 1;
    // Quy đổi ra thang điểm 10 (làm tròn 1 chữ số thập phân) và tỷ lệ phần trăm
    const scoreOutOf10 = Math.round((correctCount / totalQuestions) * 100) / 10;
    const accuracyPercent = Math.round((correctCount / totalQuestions) * 100);

    // Tham chiếu chính xác tới Document: users/{uid}/progress/{chapter_id}
    const progressDocRef = doc(firebaseServices.db, "users", uid, "progress", chapterId);

    // Đọc dữ liệu cũ (nếu có) để giữ lại điểm kỷ lục cao nhất (highestScore) và cộng dồn số lần làm (attempts)
    const existingSnap = await getDoc(progressDocRef);
    let previousHighest = scoreOutOf10;
    let previousAttempts = 0;

    if (existingSnap.exists()) {
      const oldData = existingSnap.data();
      previousHighest = Math.max(Number(oldData.highestScore) || 0, scoreOutOf10);
      previousAttempts = Number(oldData.attempts) || 0;
    }

    const payloadToSave = {
      uid: uid,
      chapterId: chapterId,
      chapterTitle: quizResult.chapterTitle || chapterId,
      lastScore: scoreOutOf10,
      highestScore: previousHighest,
      correctCount: correctCount,
      totalQuestions: totalQuestions,
      accuracyPercent: accuracyPercent,
      attempts: previousAttempts + 1,
      isPassed: accuracyPercent >= 50,
      updatedAt: serverTimestamp(),
      updatedAtClientISO: new Date().toISOString()
    };

    // Ghi dữ liệu vào users/{uid}/progress/{chapter_id} với cờ merge: true
    await setDoc(progressDocRef, payloadToSave, { merge: true });

    renderAuthStatusBanner(
      "Đã lưu điểm " + scoreOutOf10 + "/10 vào Firestore (users/" + uid.slice(0, 6) + ".../progress/" + chapterId + ")!",
      "success"
    );

    // Sau khi lưu xong, tải lại dữ liệu tiến độ mới nhất để cập nhật màn hình "Hành trình tự học"
    const updatedProgressMap = await fetchStudentProgress(uid);
    renderLearningJourneyUI(updatedProgressMap, currentAuthenticatedUser);

    return payloadToSave;
  } catch (error) {
    console.error("[Firestore Write Error] Lỗi khi lưu tiến độ:", error);
    renderAuthStatusBanner("Lỗi khi lưu điểm lên Firestore: " + error.message, "error");
    return null;
  }
}

/**
 * ============================================================================
 * PHẦN 3: LẤY TIẾN ĐỘ TỪ FIRESTORE & HIỂN THỊ "HÀNH TRÌNH TỰ HỌC"
 * Đọc toàn bộ Subcollection: users/{uid}/progress
 * ============================================================================
 */

/**
 * Hàm lấy toàn bộ tiến độ học tập của sinh viên từ nhánh users/{uid}/progress
 * @param {string} uid - Mã định danh người dùng Firebase Auth
 * @returns {Promise<Object>} Bản đồ tiến độ theo từng chương: { [chapter_id]: progressData }
 */
export async function fetchStudentProgress(uid) {
  if (!uid || !firebaseServices.isConfigured || !firebaseServices.db) {
    return {};
  }

  try {
    // Tham chiếu tới Subcollection: users/{uid}/progress
    const progressCollectionRef = collection(firebaseServices.db, "users", uid, "progress");
    const querySnapshot = await getDocs(progressCollectionRef);

    const progressMap = {};
    querySnapshot.forEach(function(docSnap) {
      progressMap[docSnap.id] = docSnap.data();
    });

    return progressMap;
  } catch (error) {
    console.error("[Firestore Read Error] Lỗi khi tải tiến độ tự học:", error);
    return {};
  }
}

/**
 * Hàm kết xuất (Render) dữ liệu điểm số lên màn hình "Hành trình tự học"
 * @param {Object} progressMap - Dữ liệu đọc về từ users/{uid}/progress/{chapter_id}
 * @param {Object|null} user - Thông tin tài khoản sinh viên hiện tại
 */
export function renderLearningJourneyUI(progressMap, user) {
  const journeyGridEl = document.getElementById("learning-journey-cards-grid");
  const summaryScoreEl = document.getElementById("journey-overall-gpa");
  const summaryCompletedEl = document.getElementById("journey-completed-chapters");
  const summaryAttemptsEl = document.getElementById("journey-total-attempts");
  const firestorePathBadgeEl = document.getElementById("journey-firestore-path");

  if (firestorePathBadgeEl) {
    firestorePathBadgeEl.textContent = user
      ? "users/" + user.uid + "/progress/{chapter_id}"
      : "users/{uid}/progress/{chapter_id} (Chưa đăng nhập)";
  }

  let totalScoreSum = 0;
  let chaptersWithScoreCount = 0;
  let completedChaptersCount = 0;
  let totalAttemptsCount = 0;

  const cardsHtml = CURRICULUM_CHAPTERS.map(function(chap) {
    const record = progressMap && progressMap[chap.chapterId] ? progressMap[chap.chapterId] : null;

    if (record) {
      const bestScore = Number(record.highestScore ?? record.lastScore ?? 0);
      const lastScore = Number(record.lastScore ?? 0);
      const attempts = Number(record.attempts ?? 1);
      const accuracy = Number(record.accuracyPercent ?? 0);

      totalScoreSum += bestScore;
      chaptersWithScoreCount += 1;
      totalAttemptsCount += attempts;
      if (record.isPassed || accuracy >= 50) {
        completedChaptersCount += 1;
      }

      return (
        '<article class="journey-chapter-card is-completed">' +
          '<div class="journey-card-top">' +
            '<span class="academic-badge">' + chap.chapterNumber + ' • ID: ' + chap.chapterId + '</span>' +
            '<span class="journey-status-tag status-done">Đã lưu trên Firestore</span>' +
          '</div>' +
          '<h3 class="journey-chapter-title">' + chap.title + '</h3>' +
          '<div class="journey-metrics-row">' +
            '<div class="journey-metric-item">' +
              '<span class="metric-label">Điểm cao nhất</span>' +
              '<strong class="metric-val highlight-score">' + bestScore.toFixed(1) + ' / 10</strong>' +
            '</div>' +
            '<div class="journey-metric-item">' +
              '<span class="metric-label">Lần làm gần nhất</span>' +
              '<strong class="metric-val">' + lastScore.toFixed(1) + ' / 10 (' + record.correctCount + '/' + record.totalQuestions + ' câu)</strong>' +
            '</div>' +
            '<div class="journey-metric-item">' +
              '<span class="metric-label">Số lượt luyện tập</span>' +
              '<strong class="metric-val">' + attempts + ' lần</strong>' +
            '</div>' +
          '</div>' +
          '<div class="progress-track" style="margin-top: 0.75rem; background: #E2E8F0;">' +
            '<div class="progress-fill" style="width: ' + Math.min(100, accuracy) + '%;"></div>' +
          '</div>' +
          '<div class="journey-doc-path">Document: <code>users/' + (user ? user.uid : "{uid}") + '/progress/' + chap.chapterId + '</code></div>' +
        '</article>'
      );
    }

    return (
      '<article class="journey-chapter-card">' +
        '<div class="journey-card-top">' +
          '<span class="academic-badge">' + chap.chapterNumber + ' • ID: ' + chap.chapterId + '</span>' +
          '<span class="journey-status-tag">Chưa có điểm</span>' +
        '</div>' +
        '<h3 class="journey-chapter-title">' + chap.title + '</h3>' +
        '<p class="journey-empty-desc">Hoàn thành bài trắc nghiệm của chương này và ấn "Lưu điểm lên Firestore" để ghi nhận tiến độ.</p>' +
        '<div class="journey-doc-path">Document: <code>users/' + (user ? user.uid : "{uid}") + '/progress/' + chap.chapterId + '</code></div>' +
      '</article>'
    );
  }).join("");

  if (journeyGridEl) {
    journeyGridEl.innerHTML = cardsHtml;
  }

  const avgGpa = chaptersWithScoreCount > 0 ? (totalScoreSum / chaptersWithScoreCount).toFixed(1) : "0.0";
  if (summaryScoreEl) summaryScoreEl.textContent = avgGpa + " / 10";
  if (summaryCompletedEl) summaryCompletedEl.textContent = completedChaptersCount + " / " + CURRICULUM_CHAPTERS.length + " chương";
  if (summaryAttemptsEl) summaryAttemptsEl.textContent = totalAttemptsCount + " lượt làm bài";
}

/**
 * ============================================================================
 * PHẦN 4: CÁC HÀM CẬP NHẬT GIAO DIỆN XÁC THỰC (HEADER & THÔNG BÁO)
 * ============================================================================
 */

function updateAuthHeaderUI(user) {
  const loginBtn = document.getElementById("google-login-btn");
  const logoutBtn = document.getElementById("google-logout-btn");
  const userChip = document.getElementById("authenticated-user-chip");
  const userNameEl = document.getElementById("authenticated-user-name");

  if (user) {
    if (loginBtn) loginBtn.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "inline-flex";
    if (userChip) userChip.style.display = "inline-flex";
    if (userNameEl) userNameEl.textContent = user.displayName || user.email || "Sinh viên";
  } else {
    if (loginBtn) loginBtn.style.display = "inline-flex";
    if (logoutBtn) logoutBtn.style.display = "none";
    if (userChip) userChip.style.display = "none";
  }
}

function renderAuthStatusBanner(message, type) {
  const bannerEl = document.getElementById("firebase-toast-banner");
  if (!bannerEl) return;
  bannerEl.textContent = message;
  bannerEl.className = "firebase-toast-banner is-shown toast-" + (type || "info");
}

export function getCurrentUser() {
  return currentAuthenticatedUser;
}
