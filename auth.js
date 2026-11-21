/**
 * ============================================================================
 * HỆ THỐNG E-LEARNING TRIẾT HỌC MÁC - LÊNIN (PHI1001)
 * File: auth.js (ES Module)
 * Nhiệm vụ:
 *   1. Xử lý Đăng nhập thủ công bằng Google Pop-up & Đăng xuất về index.html.
 *      (KHÔNG tự động chuyển hướng khi mở index.html).
 *   2. Auth Guard cho dashboard.html: Kiểm tra onAuthStateChanged(auth, ...),
 *      chuyển hướng về index.html nếu chưa đăng nhập.
 *   3. Đọc/ghi tiến độ học tập, điểm trắc nghiệm/tự luận và chuyên đề đã hoàn
 *      thành trên Cloud Firestore theo user.uid:
 *      - users/{user.uid}
 *      - users/{user.uid}/progress/{chapter_id}
 *   4. Hiển thị thông báo trạng thái thân thiện (#firebase-toast-banner).
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

import { auth, db, googleProvider } from "./firebase-config.js";

/**
 * Danh mục 3 chương chuẩn của học phần Triết học Mác - Lênin (PHI1001)
 */
export const CURRICULUM_CHAPTERS = [
  {
    chapterId: "chuong_1",
    chapterNumber: "Chương 01",
    title: "Triết học và vai trò của triết học trong đời sống xã hội",
    targetQuestions: 14
  },
  {
    chapterId: "chuong_2",
    chapterNumber: "Chương 02",
    title: "Chủ nghĩa duy vật biện chứng",
    targetQuestions: 14
  },
  {
    chapterId: "chuong_3",
    chapterNumber: "Chương 03",
    title: "Chủ nghĩa duy vật lịch sử",
    targetQuestions: 14
  }
];

let currentAuthenticatedUser = null;
let friendlyBannerTimeoutId = null;

/**
 * Hiển thị thanh thông báo trạng thái thân thiện (#firebase-toast-banner)
 * @param {string} message - Nội dung thông báo
 * @param {"info"|"success"|"warning"} [type="info"] - Kiểu hiển thị
 * @param {number} [durationMs=5000] - Thời gian tự ẩn (ms), truyền 0 để giữ nguyên
 */
export function showFriendlyBanner(message, type = "info", durationMs = 5000) {
  if (typeof document === "undefined") return;
  const bannerEl = document.getElementById("firebase-toast-banner");
  if (!bannerEl) return;

  const allowedTypes = ["info", "success", "warning"];
  const safeType = allowedTypes.includes(type) ? type : "info";

  bannerEl.textContent = String(message || "");
  bannerEl.className = "firebase-toast-banner is-shown toast-" + safeType;

  if (friendlyBannerTimeoutId !== null) {
    clearTimeout(friendlyBannerTimeoutId);
    friendlyBannerTimeoutId = null;
  }

  if (typeof durationMs === "number" && durationMs > 0) {
    friendlyBannerTimeoutId = setTimeout(function () {
      bannerEl.classList.remove("is-shown");
      friendlyBannerTimeoutId = null;
    }, durationMs);
  }
}

/**
 * Bí danh tương thích ngược cho các thành phần gọi renderAuthStatusBanner
 */
export function renderAuthStatusBanner(message, type = "info", durationMs = 5000) {
  showFriendlyBanner(message, type, durationMs);
}

/**
 * Đồng bộ hồ sơ người dùng Google thật vào users/{user.uid}
 * @param {Object} user - Firebase User object
 */
async function syncUserProfileToFirestore(user) {
  if (!db || !user || !user.uid) return;
  try {
    const userProfileRef = doc(db, "users", user.uid);
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
  } catch (err) {
    console.warn("[Auth] Không thể cập nhật hồ sơ người dùng trên Firestore:", err);
  }
}

/**
 * 1. Đăng nhập thủ công bằng Google Pop-up
 *    - Luôn bật hộp thoại chọn tài khoản Google (prompt: "select_account").
 *    - Không tự động chuyển hướng khi mở index.html; chỉ thực thi khi người dùng bấm nút đăng nhập.
 * @returns {Promise<Object|null>} Firebase User nếu thành công, hoặc null nếu thất bại/hủy
 */
export async function loginWithGooglePopup() {
  if (!auth || !googleProvider) {
    showFriendlyBanner(
      "Hệ thống Firebase chưa sẵn sàng. Vui lòng kiểm tra cấu hình trong firebase-config.js.",
      "warning"
    );
    return null;
  }

  try {
    if (typeof googleProvider.setCustomParameters === "function") {
      googleProvider.setCustomParameters({ prompt: "select_account" });
    }

    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    currentAuthenticatedUser = user;

    await syncUserProfileToFirestore(user);

    showFriendlyBanner(
      "Đăng nhập thành công! Xin chào " + (user.displayName || user.email || "Sinh viên") + ".",
      "success"
    );
    return user;
  } catch (error) {
    console.error("[Auth Error] Lỗi khi đăng nhập Google Pop-up:", error);
    const errorMessage = error && error.message ? error.message : "Không thể xác thực tài khoản Google.";
    showFriendlyBanner("Đăng nhập không thành công: " + errorMessage, "warning");
    return null;
  }
}

/**
 * 2. Đăng xuất tài khoản Google và chuyển hướng thẳng về trang index.html
 */
export async function logoutStudent() {
  try {
    if (auth) {
      await signOut(auth);
    }
    currentAuthenticatedUser = null;
  } catch (error) {
    console.error("[Auth Error] Lỗi khi đăng xuất:", error);
  } finally {
    window.location.href = "index.html";
  }
}

/**
 * 3. Auth Guard dành riêng cho dashboard.html:
 *    - Nếu chưa đăng nhập (!user) -> tự động chuyển hướng về index.html.
 *    - Nếu đã đăng nhập -> đồng bộ hồ sơ thật và tải dữ liệu tiến độ từ Firestore.
 *    (Lưu ý: KHÔNG gọi hàm này trên index.html để giữ luồng đăng nhập thủ công).
 * @param {Function} onUserChangedCallback - Hàm callback nhận (user, progressMap)
 * @returns {Function|null} Hàm unsubscribe của onAuthStateChanged
 */
export function initAuthStateObserver(onUserChangedCallback) {
  if (!auth) {
    window.location.href = "index.html";
    return null;
  }

  return onAuthStateChanged(auth, async function (user) {
    if (!user) {
      currentAuthenticatedUser = null;
      window.location.href = "index.html";
      return;
    }

    currentAuthenticatedUser = user;
    await syncUserProfileToFirestore(user);

    const progressMap = await fetchStudentProgress(user.uid);
    if (typeof onUserChangedCallback === "function") {
      onUserChangedCallback(user, progressMap);
    }
  });
}

/**
 * 4. Tải toàn bộ tiến độ học tập của sinh viên từ Cloud Firestore:
 *    Collection: users/{uid}/progress
 * @param {string} uid - Firebase user.uid
 * @returns {Promise<Object>} Map dạng { [chapterId]: progressDocData }
 */
export async function fetchStudentProgress(uid) {
  if (!uid || !db) {
    return {};
  }

  try {
    const progressCollectionRef = collection(db, "users", uid, "progress");
    const querySnapshot = await getDocs(progressCollectionRef);

    const progressMap = {};
    querySnapshot.forEach(function (docSnap) {
      progressMap[docSnap.id] = docSnap.data();
    });

    return progressMap;
  } catch (error) {
    console.error("[Firestore Read Error] Lỗi khi tải tiến độ tự học:", error);
    return {};
  }
}

/**
 * 5. Lưu điểm trắc nghiệm / tự luận theo chương lên Cloud Firestore:
 *    Document: users/{uid}/progress/{chapterId}
 * @param {string} uid - Firebase user.uid
 * @param {string} chapterId - Mã chương (ví dụ: "chuong_1", "chuong_2", "chuong_3")
 * @param {Object} quizResult - { correctCount, totalQuestions, chapterTitle }
 * @returns {Promise<Object|null>} Dữ liệu đã lưu hoặc null nếu lỗi
 */
export async function saveQuizProgressToFirestore(uid, chapterId, quizResult) {
  if (!uid || !chapterId || !db) {
    return null;
  }

  try {
    const safeResult = quizResult || {};
    const correctCount = Math.max(0, Number(safeResult.correctCount) || 0);
    const totalQuestions = Math.max(1, Number(safeResult.totalQuestions) || 1);
    const scoreOutOf10 = Math.round((correctCount / totalQuestions) * 100) / 10;
    const accuracyPercent = Math.min(100, Math.round((correctCount / totalQuestions) * 100));

    const progressDocRef = doc(db, "users", uid, "progress", chapterId);
    const existingSnap = await getDoc(progressDocRef);

    let previousHighest = scoreOutOf10;
    let previousAttempts = 0;
    let existingCompletedLessons = [];

    if (existingSnap.exists()) {
      const oldData = existingSnap.data() || {};
      previousHighest = Math.max(Number(oldData.highestScore) || 0, scoreOutOf10);
      previousAttempts = Number(oldData.attempts) || 0;
      if (Array.isArray(oldData.completedLessons)) {
        existingCompletedLessons = oldData.completedLessons;
      }
    }

    const payloadToSave = {
      uid: uid,
      chapterId: chapterId,
      chapterTitle: safeResult.chapterTitle || chapterId,
      lastScore: scoreOutOf10,
      highestScore: previousHighest,
      correctCount: correctCount,
      totalQuestions: totalQuestions,
      accuracyPercent: accuracyPercent,
      attempts: previousAttempts + 1,
      completedLessons: existingCompletedLessons,
      isPassed: accuracyPercent >= 50,
      updatedAt: serverTimestamp(),
      updatedAtClientISO: new Date().toISOString()
    };

    await setDoc(progressDocRef, payloadToSave, { merge: true });
    showFriendlyBanner(
      "✓ Đã đồng bộ điểm " + scoreOutOf10.toFixed(1) + "/10 lên đám mây thành công!",
      "success"
    );

    return payloadToSave;
  } catch (error) {
    console.error("[Firestore Write Error] Lỗi khi lưu điểm lên Firestore:", error);
    showFriendlyBanner(
      "Không thể đồng bộ điểm lên Firestore: " + (error && error.message ? error.message : "Lỗi kết nối."),
      "warning"
    );
    return null;
  }
}

/**
 * 6. Lưu danh sách các chuyên đề đã hoàn thành của một chương lên Cloud Firestore:
 *    Document: users/{uid}/progress/{chapterId}
 * @param {string} uid - Firebase user.uid
 * @param {string} chapterId - Mã chương ("chuong_1", "chuong_2", "chuong_3")
 * @param {string} chapterTitle - Tên hiển thị của chương
 * @param {string[]} completedLessonIds - Mảng ID các chuyên đề đã hoàn thành trong chương
 * @returns {Promise<boolean>} true nếu lưu thành công, false nếu có lỗi
 */
export async function saveCompletedLessonsToFirestore(uid, chapterId, chapterTitle, completedLessonIds) {
  if (!uid || !chapterId || !db) {
    return false;
  }

  try {
    const cleanIds = Array.isArray(completedLessonIds)
      ? Array.from(new Set(completedLessonIds.filter(Boolean)))
      : [];

    const progressDocRef = doc(db, "users", uid, "progress", chapterId);
    await setDoc(
      progressDocRef,
      {
        uid: uid,
        chapterId: chapterId,
        chapterTitle: chapterTitle || chapterId,
        completedLessons: cleanIds,
        updatedAt: serverTimestamp(),
        updatedAtClientISO: new Date().toISOString()
      },
      { merge: true }
    );

    return true;
  } catch (error) {
    console.error("[Firestore Write Error] Lỗi khi lưu trạng thái chuyên đề:", error);
    showFriendlyBanner(
      "Không thể lưu trạng thái hoàn thành lên Firestore: " + (error && error.message ? error.message : "Lỗi kết nối."),
      "warning"
    );
    return false;
  }
}

/**
 * 7. Trả về đối tượng người dùng Google hiện đang đăng nhập
 * @returns {Object|null}
 */
export function getCurrentUser() {
  return currentAuthenticatedUser || (auth ? auth.currentUser : null);
}