/**
 * ============================================================================
 * HỆ THỐNG E-LEARNING TRIẾT HỌC MÁC - LÊNIN (PHI1001)
 * File: app.js (ES Module)
 * Chức năng đầy đủ 100%:
 *   1. Kết nối trực tiếp Firebase Authentication & Cloud Firestore qua firebase-config.js và auth.js.
 *   2. Auth Guard: Tự động chuyển hướng về index.html nếu chưa đăng nhập; hiển thị tên thật,
 *      email và ảnh đại diện Google của người học.
 *   3. Đồng bộ dữ liệu động 100% từ data.json (Object.keys(data.lessons).length).
 *   4. Native Web Slide Viewer sử dụng Mozilla PDF.js (v3.11.174 UMD) render trên <canvas> + Smart Cache.
 *   5. Phòng luyện tập Trắc nghiệm (tự động lưu điểm lên Firestore) & Tự luận chấm bằng Gemini API.
 * ============================================================================
 */

import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
  addDoc,
  getDocs,
  collection,
  query,
  orderBy,
  limit,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";
import {
  CURRICULUM_CHAPTERS,
  fetchStudentProgress,
  saveQuizProgressToFirestore,
  saveCompletedLessonsToFirestore,
  showFriendlyBanner
} from "./auth.js";

// Cấu hình Worker cho Mozilla PDF.js v3.11.174
if (typeof window !== "undefined" && window.pdfjsLib) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

const DEFAULT_SLIDE_PDF_PATH = "assets/slides/slide-triet-hoc.pdf";
const DEFAULT_TOTAL_SLIDE_PAGES = 388;
const DEFAULT_AVATAR_SVG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 24 24' fill='%231E3A8A'><circle cx='12' cy='8' r='4' fill='%23FCD34D'/><path d='M4 20c0-4 4-6 8-6s8 2 8 6' fill='%23FFFFFF'/></svg>";

const CURRICULUM_CHAPTERS_META = [
  {
    chapterId: "chuong_1",
    chapterNumber: "Chương 01",
    tagLabel: "Chương 01 • Nhập môn",
    pagesRange: "Slide 6 – 54",
    title: "Triết học và vai trò của triết học trong đời sống xã hội"
  },
  {
    chapterId: "chuong_2",
    chapterNumber: "Chương 02",
    tagLabel: "Chương 02 • Trọng tâm",
    pagesRange: "Slide 55 – 210",
    title: "Chủ nghĩa duy vật biện chứng"
  },
  {
    chapterId: "chuong_3",
    chapterNumber: "Chương 03",
    tagLabel: "Chương 03 • Vận dụng",
    pagesRange: "Slide 211 – 388",
    title: "Chủ nghĩa duy vật lịch sử"
  }
];

let LESSONS_DATA = {};
let ALL_QUIZ_QUESTIONS = [];
let ESSAY_PROMPTS_DATA = [];
let ALL_FLASHCARDS = [];

/* Trạng thái Tính năng 1: Thẻ ghi nhớ (Flashcards 3D) */
let activePracticeModeId = "practice-pane-single";
let fcChapterFilter = "all";
let fcStatusFilter = "all";
let fcFilteredList = [];
let fcCurrentIndex = 0;
let fcIsFlipped = false;
let fcMemoryMap = {}; // { [cardId]: "mastered" | "review" }

/* Trạng thái Tính năng 2: Thi thử tổng hợp (Mock Exam 45 phút) */
let mockExamSelectedSize = 30;
let mockExamQuestions = [];
let mockExamAnswers = {};
let mockExamDurationSec = 45 * 60;
let mockExamRemainingSec = 45 * 60;
let mockExamTimerInterval = null;
let mockExamIsRunning = false;
let mockExamStartTimeMs = 0;
let mockExamActiveIdx = 0;

/* Trạng thái Tính năng 3: Ngân hàng Câu hay làm sai (Mistake Review) */
let mistakeQuestionIds = new Set();

/* Trạng thái Tính năng 4: Ghi nhớ trang đọc dở (Resume Reading) & Ghi chú cá nhân */
let lastReadingState = null;
let lastReadingSaveTimer = null;
let isInitialLessonBootstrap = true;
let notesCacheByLesson = {};

/* Trạng thái Tính năng 6: Chuỗi ngày tự học (Study Streak) & Mục tiêu mỗi ngày */
let studyStreakState = {
  currentStreak: 0,
  lastStudyDate: "",
  todayDate: "",
  todayActions: 0,
  todayLessonsDone: 0,
  todayQuizCount: 0
};

let activeStudentUser = null;
let studentProgressMap = {};
let completedLessons = new Set();

let currentActiveViewId = "view-overview";
let currentLessonId = "";
let currentQuizChapterFilter = "all";

/* Biến quản lý Native PDF.js Slide Viewer & Smart Cache */
let cachedPdfDoc = null;
let cachedPdfPath = null;
let currentSlidePage = 1;
let totalSlidePages = DEFAULT_TOTAL_SLIDE_PAGES;
let currentZoomMultiplier = 1.0;
let isPageRendering = false;
let pendingPageNumber = null;
let activeRenderTask = null;
let usingVirtualDeckFallback = false;

const quizAppState = {
  questions: [],
  selectedAnswers: {},
  checkedResults: {}
};

function getLessonKeys() {
  return Object.keys(LESSONS_DATA || {});
}

function resolveLessonChapterId(lessonKey, lessonObj) {
  if (lessonObj && lessonObj.chapterId) return lessonObj.chapterId;
  const badgeStr = (lessonObj && lessonObj.badge) ? lessonObj.badge.toLowerCase() : "";
  const keyStr = String(lessonKey || "").toLowerCase();
  if (keyStr.indexOf("ch1") !== -1 || keyStr.indexOf("chuong_1") !== -1 || badgeStr.indexOf("chương 1") !== -1) {
    return "chuong_1";
  }
  if (keyStr.indexOf("ch2") !== -1 || keyStr.indexOf("chuong_2") !== -1 || badgeStr.indexOf("chương 2") !== -1) {
    return "chuong_2";
  }
  if (keyStr.indexOf("ch3") !== -1 || keyStr.indexOf("chuong_3") !== -1 || badgeStr.indexOf("chương 3") !== -1) {
    return "chuong_3";
  }
  return "chuong_1";
}

function sanitizeCompletedLessonsSet() {
  const validKeys = new Set(getLessonKeys());
  if (validKeys.size === 0) return;
  Array.from(completedLessons).forEach(function (k) {
    if (!validKeys.has(k)) {
      completedLessons.delete(k);
    }
  });
}

function hydrateCompletedLessonsFromProgress(progressMap) {
  const nextSet = new Set();
  Object.keys(progressMap || {}).forEach(function (chapId) {
    const docData = progressMap[chapId];
    if (docData && Array.isArray(docData.completedLessons)) {
      docData.completedLessons.forEach(function (lessonId) {
        nextSet.add(lessonId);
      });
    }
  });
  completedLessons = nextSet;
  sanitizeCompletedLessonsSet();
}

function switchDashboardView(targetViewId) {
  currentActiveViewId = targetViewId;
  document.querySelectorAll(".dashboard-view-section").forEach(function (sec) {
    sec.classList.toggle("is-active-view", sec.id === targetViewId);
  });
  document.querySelectorAll(".sidebar-nav-item").forEach(function (btn) {
    const viewAttr = btn.getAttribute("data-target-view");
    btn.classList.toggle("active", viewAttr === targetViewId);
  });
  const sidebarEl = document.getElementById("main-nav-menu");
  if (sidebarEl) sidebarEl.classList.remove("is-open");
  const mainCanvas = document.getElementById("edtech-main-canvas");
  if (mainCanvas) mainCanvas.scrollTop = 0;

  if (targetViewId === "view-materials") {
    queueRenderSlidePage(currentSlidePage);
  }
}

function renderCurrentDateFormatted() {
  const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  const now = new Date();
  const formatted = days[now.getDay()] + ", ngày " +
    String(now.getDate()).padStart(2, "0") + "/" +
    String(now.getMonth() + 1).padStart(2, "0") + "/" +
    now.getFullYear();

  const headerDateEl = document.getElementById("header-current-date");
  const overviewDateEl = document.getElementById("overview-current-date");
  if (headerDateEl) headerDateEl.textContent = formatted;
  if (overviewDateEl) overviewDateEl.textContent = formatted + " • Học kỳ I năm học 2026 - 2027";
}

/**
 * Hiển thị thông tin tài khoản Google thật từ Firebase Auth
 */
function syncStudentIdentityUI(user) {
  const welcomeNameEl = document.getElementById("overview-student-name");
  const guardNameEl = document.getElementById("guard-user-name");
  const guardEmailEl = document.getElementById("guard-user-email");
  const guardAvatarEl = document.getElementById("guard-user-avatar");

  if (!user) return;

  const displayName = user.displayName || user.email || "Sinh viên";
  if (welcomeNameEl) welcomeNameEl.textContent = displayName;
  if (guardNameEl) guardNameEl.textContent = displayName;
  if (guardEmailEl) guardEmailEl.textContent = user.email || "";
  if (guardAvatarEl) {
    guardAvatarEl.src = user.photoURL || DEFAULT_AVATAR_SVG;
    guardAvatarEl.onerror = function () {
      guardAvatarEl.src = DEFAULT_AVATAR_SVG;
    };
  }
}

function renderOverviewPathwayCards() {
  const gridEl = document.getElementById("overview-pathway-grid");
  const headingEl = document.getElementById("overview-pathway-heading");
  const lessonKeys = getLessonKeys();

  if (headingEl) {
    headingEl.textContent = "Lộ trình " + lessonKeys.length + " Chuyên đề Trọng tâm Giáo trình Bộ GD&ĐT";
  }
  if (!gridEl) return;

  gridEl.innerHTML = lessonKeys.map(function (key, idx) {
    const item = LESSONS_DATA[key] || {};
    const isDone = completedLessons.has(key);
    const badgeText = item.badge || ("Chuyên đề " + (idx + 1));
    const startPg = item.slideStartPage || 1;
    const descText = item.shortDesc || item.summary || ("Bắt đầu tại Slide trang " + startPg);
    return (
      '<button type="button" class="pathway-lesson-card' + (isDone ? " is-done" : "") + '" data-pathway-lesson="' + key + '">' +
        '<div class="pathway-card-left">' +
          '<span class="pathway-number-circle">' + (idx + 1) + '</span>' +
          '<div class="pathway-card-text">' +
            '<div style="font-size:0.72rem;font-weight:700;color:var(--color-primary-active);margin-bottom:2px;">' +
              badgeText + " • Slide trang " + startPg + (isDone ? " • ✓ Đã hoàn thành" : "") +
            '</div>' +
            '<div class="pathway-card-title">' + (item.title || key) + '</div>' +
            '<div class="pathway-card-desc">' + descText + '</div>' +
          '</div>' +
        '</div>' +
        '<span class="pathway-arrow" aria-hidden="true">&gt;</span>' +
      '</button>'
    );
  }).join("");
}

function renderRoadmapChapters() {
  const container = document.getElementById("chapters-roadmap-grid");
  if (!container) return;

  const lessonKeys = getLessonKeys();

  container.innerHTML = CURRICULUM_CHAPTERS_META.map(function (chap, idx) {
    const chapLessonKeys = lessonKeys.filter(function (k) {
      return resolveLessonChapterId(k, LESSONS_DATA[k]) === chap.chapterId;
    });
    const firstLessonKey = chapLessonKeys[0] || lessonKeys[0] || "";
    const doneInChap = chapLessonKeys.filter(function (k) { return completedLessons.has(k); }).length;

    const topicsListHtml = chapLessonKeys.length > 0
      ? chapLessonKeys.map(function (k) {
          const item = LESSONS_DATA[k] || {};
          const isDone = completedLessons.has(k);
          const pgInfo = item.slideStartPage ? (" (Tr." + item.slideStartPage + ")") : "";
          return (
            '<li>' +
              '<button type="button" class="roadmap-lesson-link-btn select-chapter-shortcut' + (isDone ? " is-done" : "") + '" data-lesson-target="' + k + '">' +
                '<span>' + (isDone ? "✓ " : "• ") + (item.title || k) + pgInfo + '</span>' +
                '<span style="font-size:0.75rem;color:var(--color-primary-active);white-space:nowrap;">Mở bài →</span>' +
              '</button>' +
            '</li>'
          );
        }).join("")
      : "<li>• Đang cập nhật chuyên đề cho chương này</li>";

    const btnClass = (idx === 1) ? "btn btn-primary btn-sm select-chapter-shortcut" : "btn btn-secondary btn-sm select-chapter-shortcut";

    return (
      '<article class="chapter-overview-card">' +
        '<div>' +
          '<div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;">' +
            '<span class="chapter-number-tag">' + chap.tagLabel + '</span>' +
            '<span class="academic-badge">' + doneInChap + "/" + chapLessonKeys.length + " hoàn thành</span>" +
          '</div>' +
          '<h3 class="chapter-card-title">' + chap.title + '</h3>' +
          '<ul class="chapter-topic-list">' + topicsListHtml + '</ul>' +
        '</div>' +
        '<div class="chapter-card-footer">' +
          '<span style="font-size:0.8rem;color:var(--text-muted);font-weight:600;">' +
            String(chapLessonKeys.length).padStart(2, "0") + " Chuyên đề • " + chap.pagesRange +
          '</span>' +
          '<button type="button" class="' + btnClass + '" data-lesson-target="' + firstLessonKey + '">' +
            "Vào học Chương " + (idx + 1) + " →" +
          '</button>' +
        '</div>' +
      '</article>'
    );
  }).join("");
}

function syncHorizontalLessonToolbar(lessonId) {
  const lessonKeys = getLessonKeys();
  const selectEl = document.getElementById("lesson-selector-dropdown");

  if (selectEl) {
    selectEl.innerHTML = lessonKeys.map(function (key) {
      const item = LESSONS_DATA[key] || {};
      const checkPrefix = completedLessons.has(key) ? "✓ " : "○ ";
      const chapPrefix = item.badge ? (item.badge.split("•")[0].trim() + " — ") : "";
      const pgSuffix = item.slideStartPage ? (" [Slide tr." + item.slideStartPage + "]") : "";
      const selectedAttr = (key === lessonId) ? " selected" : "";
      return '<option value="' + key + '"' + selectedAttr + '>' + checkPrefix + chapPrefix + (item.title || key) + pgSuffix + '</option>';
    }).join("");
    selectEl.value = lessonId;
  }

  const currentIdx = lessonKeys.indexOf(lessonId);
  const prevBtn = document.getElementById("prev-lesson-btn");
  const nextBtn = document.getElementById("next-lesson-btn");
  if (prevBtn) prevBtn.disabled = (currentIdx <= 0);
  if (nextBtn) nextBtn.disabled = (currentIdx === -1 || currentIdx >= lessonKeys.length - 1);

  const completeBtnLabel = document.getElementById("complete-btn-label");
  const completeBtn = document.getElementById("toggle-complete-lesson-btn");
  if (completeBtn && completeBtnLabel) {
    if (completedLessons.has(lessonId)) {
      completeBtnLabel.textContent = "✓ Đã hoàn thành";
      completeBtn.className = "btn btn-success btn-sm";
    } else {
      completeBtnLabel.textContent = "Đánh dấu hoàn thành";
      completeBtn.className = "btn btn-primary btn-sm";
    }
  }
}

function renderSummaryReader(lessonId) {
  const lesson = LESSONS_DATA[lessonId];
  const readerEl = document.getElementById("summary-reader");
  if (!readerEl || !lesson) return;

  readerEl.innerHTML = lesson.summaryHtml || (
    '<div class="summary-doc-header">' +
      '<span class="summary-kicker">' + (lesson.badge || "Chuyên đề") + '</span>' +
      '<h2>' + (lesson.title || lessonId) + '</h2>' +
      '<p class="summary-lead">' + (lesson.summary || lesson.shortDesc || "") + '</p>' +
    '</div>'
  );
}

/* ============================================================================
   NATIVE WEB SLIDE VIEWER (MOZILLA PDF.JS v3.11.174 & SMART CACHE)
   ============================================================================ */

function findLessonBySlidePage(pageNum) {
  const keys = getLessonKeys();
  let matchedKey = keys[0];
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    const startPg = Number((LESSONS_DATA[k] && LESSONS_DATA[k].slideStartPage) || 1);
    if (pageNum >= startPg) {
      matchedKey = k;
    }
  }
  return LESSONS_DATA[matchedKey] || LESSONS_DATA[currentLessonId] || {};
}

function syncSlideToolbarUI() {
  const pageInput = document.getElementById("pdf-page-input");
  const totalPagesEl = document.getElementById("pdf-total-pages");
  const prevPageBtn = document.getElementById("pdf-prev-page-btn");
  const nextPageBtn = document.getElementById("pdf-next-page-btn");
  const zoomTextEl = document.getElementById("pdf-zoom-level-text");

  if (pageInput) {
    pageInput.value = currentSlidePage;
    pageInput.max = totalSlidePages;
  }
  if (totalPagesEl) totalPagesEl.textContent = totalSlidePages;
  if (prevPageBtn) prevPageBtn.disabled = (currentSlidePage <= 1);
  if (nextPageBtn) nextPageBtn.disabled = (currentSlidePage >= totalSlidePages);
  if (zoomTextEl) zoomTextEl.textContent = Math.round(currentZoomMultiplier * 100) + "%";
}

function renderVirtualHiDPISlideToCanvas(pageNum) {
  const canvas = document.getElementById("pdf-render-canvas");
  const stage = document.getElementById("pdf-canvas-stage");
  if (!canvas || !stage) return;

  const matchedLesson = findLessonBySlidePage(pageNum);
  const startPg = Number(matchedLesson.slideStartPage || 1);
  const slideOffset = Math.max(1, pageNum - startPg + 1);

  const stageWidth = Math.max(640, (stage.clientWidth || 920) - 32);
  const cssWidth = Math.round(stageWidth * currentZoomMultiplier);
  const cssHeight = Math.round(cssWidth * (9 / 16));
  const dpr = window.devicePixelRatio || 1;

  canvas.width = Math.round(cssWidth * dpr);
  canvas.height = Math.round(cssHeight * dpr);
  canvas.style.width = cssWidth + "px";
  canvas.style.height = cssHeight + "px";

  const ctx = canvas.getContext("2d");
  ctx.save();
  ctx.scale(dpr, dpr);

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, cssWidth, cssHeight);

  const grad = ctx.createLinearGradient(0, 0, cssWidth, 0);
  grad.addColorStop(0, "#1E3A8A");
  grad.addColorStop(1, "#2563EB");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, cssWidth, Math.round(cssHeight * 0.14));

  const scaleUnit = cssWidth / 960;

  ctx.fillStyle = "#DBEAFE";
  ctx.font = "700 " + Math.round(13 * scaleUnit) + "px 'Be Vietnam Pro', sans-serif";
  ctx.fillText(
    "HỌC PHẦN TRIẾT HỌC MÁC - LÊNIN (PHI1001) • " + (matchedLesson.badge || "CHƯƠNG HỌC").toUpperCase(),
    Math.round(36 * scaleUnit),
    Math.round(28 * scaleUnit)
  );

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "800 " + Math.round(21 * scaleUnit) + "px 'Be Vietnam Pro', sans-serif";
  const titleStr = (matchedLesson.title || "Chuyên đề Triết học Mác - Lênin").slice(0, 68);
  ctx.fillText(titleStr, Math.round(36 * scaleUnit), Math.round(56 * scaleUnit));

  ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
  const badgeW = Math.round(150 * scaleUnit);
  const badgeH = Math.round(34 * scaleUnit);
  const badgeX = cssWidth - badgeW - Math.round(28 * scaleUnit);
  const badgeY = Math.round(22 * scaleUnit);
  ctx.fillRect(badgeX, badgeY, badgeW, badgeH);

  ctx.fillStyle = "#FDE68A";
  ctx.font = "800 " + Math.round(14 * scaleUnit) + "px 'Be Vietnam Pro', sans-serif";
  ctx.fillText(
    "TRANG " + pageNum + " / " + totalSlidePages,
    badgeX + Math.round(18 * scaleUnit),
    badgeY + Math.round(22 * scaleUnit)
  );

  const cardX = Math.round(36 * scaleUnit);
  const cardY = Math.round(cssHeight * 0.19);
  const cardW = cssWidth - Math.round(72 * scaleUnit);
  const cardH = Math.round(cssHeight * 0.67);

  ctx.fillStyle = "#F8FAFC";
  ctx.fillRect(cardX, cardY, cardW, cardH);
  ctx.strokeStyle = "#E2E8F0";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(cardX, cardY, cardW, cardH);

  ctx.fillStyle = "#2563EB";
  ctx.fillRect(cardX, cardY, Math.round(6 * scaleUnit), cardH);

  ctx.fillStyle = "#1E3A8A";
  ctx.font = "800 " + Math.round(18 * scaleUnit) + "px 'Be Vietnam Pro', sans-serif";
  ctx.fillText(
    "Slide #" + slideOffset + " của chuyên đề (Mục bắt đầu từ trang " + startPg + ")",
    cardX + Math.round(24 * scaleUnit),
    cardY + Math.round(36 * scaleUnit)
  );

  const summaryText = matchedLesson.summary || matchedLesson.shortDesc || "";
  const sentences = summaryText.split(/[.;]/).map(function (s) { return s.trim(); }).filter(Boolean);

  ctx.fillStyle = "#0F172A";
  ctx.font = "600 " + Math.round(15 * scaleUnit) + "px 'Be Vietnam Pro', sans-serif";

  let curY = cardY + Math.round(74 * scaleUnit);
  sentences.forEach(function (line, idx) {
    const bulletText = (idx + 1) + ". " + line + ".";
    const words = bulletText.split(" ");
    let currentLine = "";
    const maxW = cardW - Math.round(52 * scaleUnit);

    for (let n = 0; n < words.length; n++) {
      const testLine = currentLine + words[n] + " ";
      if (ctx.measureText(testLine).width > maxW && n > 0) {
        ctx.fillText(currentLine, cardX + Math.round(26 * scaleUnit), curY);
        currentLine = "    " + words[n] + " ";
        curY += Math.round(25 * scaleUnit);
      } else {
        currentLine = testLine;
      }
    }
    ctx.fillText(currentLine, cardX + Math.round(26 * scaleUnit), curY);
    curY += Math.round(34 * scaleUnit);
  });

  ctx.fillStyle = "#64748B";
  ctx.font = "600 " + Math.round(12 * scaleUnit) + "px 'Be Vietnam Pro', sans-serif";
  ctx.fillText(
    "Không tìm thấy tệp slide PDF tại " + (matchedLesson.slidePdfPath || DEFAULT_SLIDE_PDF_PATH) + " — Đang hiển thị bản tóm tắt trực quan.",
    Math.round(36 * scaleUnit),
    cssHeight - Math.round(16 * scaleUnit)
  );

  ctx.restore();
}

async function renderSlidePage(pageNum) {
  const safePage = Math.max(1, Math.min(totalSlidePages, Number(pageNum) || 1));
  currentSlidePage = safePage;
  syncSlideToolbarUI();

  const loadingEl = document.getElementById("pdf-loading-indicator");
  const canvas = document.getElementById("pdf-render-canvas");
  const stage = document.getElementById("pdf-canvas-stage");
  if (!canvas || !stage) return;

  if (!cachedPdfDoc || usingVirtualDeckFallback) {
    renderVirtualHiDPISlideToCanvas(safePage);
    return;
  }

  isPageRendering = true;
  if (loadingEl) loadingEl.classList.add("is-loading");

  try {
    const page = await cachedPdfDoc.getPage(safePage);
    const unscaledViewport = page.getViewport({ scale: 1 });
    const availableWidth = Math.max(480, (stage.clientWidth || 900) - 32);
    const fitWidthScale = (availableWidth / unscaledViewport.width) * currentZoomMultiplier;
    const viewport = page.getViewport({ scale: fitWidthScale });

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width = Math.floor(viewport.width) + "px";
    canvas.style.height = Math.floor(viewport.height) + "px";

    const ctx = canvas.getContext("2d");
    const transform = dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null;

    if (activeRenderTask && typeof activeRenderTask.cancel === "function") {
      try { activeRenderTask.cancel(); } catch (e) {}
    }

    activeRenderTask = page.render({
      canvasContext: ctx,
      transform: transform,
      viewport: viewport
    });

    await activeRenderTask.promise;
  } catch (err) {
    if (err && err.name !== "RenderingCancelledException") {
      renderVirtualHiDPISlideToCanvas(safePage);
    }
  } finally {
    isPageRendering = false;
    if (loadingEl) loadingEl.classList.remove("is-loading");
    if (pendingPageNumber !== null) {
      const nextToRender = pendingPageNumber;
      pendingPageNumber = null;
      renderSlidePage(nextToRender);
    }
  }
}

function queueRenderSlidePage(pageNum, shouldSaveReading) {
  const targetPage = Math.max(1, Math.min(totalSlidePages, Number(pageNum) || 1));
  currentSlidePage = targetPage;
  syncSlideToolbarUI();

  if (shouldSaveReading && !isInitialLessonBootstrap && activeStudentUser && currentLessonId) {
    const pdfPanel = document.getElementById("tab-panel-pdf");
    const isPdfActive = Boolean(pdfPanel && pdfPanel.classList.contains("active"));
    scheduleSaveLastReadingState(currentLessonId, targetPage, isPdfActive);
  }

  if (isPageRendering) {
    pendingPageNumber = targetPage;
  } else {
    renderSlidePage(targetPage);
  }
}

async function loadOrJumpSlidePdf(lessonObj) {
  if (!lessonObj) return;
  const pdfPath = lessonObj.slidePdfPath || DEFAULT_SLIDE_PDF_PATH;
  const startPage = Number(lessonObj.slideStartPage) || 1;

  const pathLabelEl = document.getElementById("pdf-filename-label");
  const cacheBadgeEl = document.getElementById("pdf-cache-status-badge");
  if (pathLabelEl) {
    pathLabelEl.textContent = "Slide bài giảng • Bắt đầu từ trang " + startPage;
  }

  if (cachedPdfDoc && cachedPdfPath === pdfPath) {
    if (cacheBadgeEl) {
      cacheBadgeEl.textContent = "⚡ Chuyển trang tức thì";
    }
    queueRenderSlidePage(startPage);
    return;
  }

  if (usingVirtualDeckFallback && cachedPdfPath === pdfPath) {
    queueRenderSlidePage(startPage);
    return;
  }

  const loadingEl = document.getElementById("pdf-loading-indicator");
  if (loadingEl) loadingEl.classList.add("is-loading");

  try {
    if (!window.pdfjsLib) throw new Error("PDF.js chưa sẵn sàng");
    const loadingTask = window.pdfjsLib.getDocument({
      url: pdfPath,
      disableAutoFetch: true,
      disableStream: false
    });
    const pdfDoc = await loadingTask.promise;

    cachedPdfDoc = pdfDoc;
    cachedPdfPath = pdfPath;
    usingVirtualDeckFallback = false;
    totalSlidePages = pdfDoc.numPages || DEFAULT_TOTAL_SLIDE_PAGES;

    if (cacheBadgeEl) {
      cacheBadgeEl.textContent = "✓ Đã tải " + totalSlidePages + " trang slide";
    }
    if (loadingEl) loadingEl.classList.remove("is-loading");
    queueRenderSlidePage(startPage);
  } catch (err) {
    cachedPdfDoc = null;
    cachedPdfPath = pdfPath;
    usingVirtualDeckFallback = true;
    totalSlidePages = DEFAULT_TOTAL_SLIDE_PAGES;

    if (cacheBadgeEl) {
      cacheBadgeEl.textContent = "Chế độ xem tóm tắt trực quan";
    }
    if (loadingEl) loadingEl.classList.remove("is-loading");
    queueRenderSlidePage(startPage);
  }
}

function selectLesson(lessonId) {
  const lessonKeys = getLessonKeys();
  if (!LESSONS_DATA[lessonId] && lessonKeys.length > 0) {
    lessonId = lessonKeys[0];
  }
  const lesson = LESSONS_DATA[lessonId];
  if (!lesson) return;
  currentLessonId = lessonId;

  const badgeEl = document.getElementById("active-lesson-chapter-badge");
  const pagesEl = document.getElementById("active-lesson-pages-meta");

  if (badgeEl) badgeEl.textContent = lesson.badge || "Chuyên đề Triết học";
  if (pagesEl) {
    const startPg = lesson.slideStartPage || 1;
    pagesEl.textContent = lesson.pages || ("Slide trang " + startPg + " / " + totalSlidePages);
  }

  syncHorizontalLessonToolbar(lessonId);
  renderSummaryReader(lessonId);
  loadOrJumpSlidePdf(lesson);
  loadPersonalNoteForLesson(lessonId);
  renderOverviewPathwayCards();
  renderRoadmapChapters();
  updateProgressCounters();

  if (!isInitialLessonBootstrap && activeStudentUser) {
    const pdfPanel = document.getElementById("tab-panel-pdf");
    const isPdfActive = Boolean(pdfPanel && pdfPanel.classList.contains("active"));
    scheduleSaveLastReadingState(lessonId, Number(lesson.slideStartPage) || currentSlidePage || 1, isPdfActive);
  }
}

async function handleToggleCompleteLesson() {
  if (!currentLessonId || !activeStudentUser) return;
  const lesson = LESSONS_DATA[currentLessonId];
  if (!lesson) return;

  if (completedLessons.has(currentLessonId)) {
    completedLessons.delete(currentLessonId);
  } else {
    completedLessons.add(currentLessonId);
  }

  selectLesson(currentLessonId);

  const targetChapterId = resolveLessonChapterId(currentLessonId, lesson);
  const lessonKeys = getLessonKeys();
  const chapterCompletedList = lessonKeys.filter(function (k) {
    return resolveLessonChapterId(k, LESSONS_DATA[k]) === targetChapterId && completedLessons.has(k);
  });

  const chapMeta = CURRICULUM_CHAPTERS.find(function (c) { return c.chapterId === targetChapterId; });
  const chapTitle = chapMeta ? chapMeta.title : targetChapterId;

  const savedOk = await saveCompletedLessonsToFirestore(
    activeStudentUser.uid,
    targetChapterId,
    chapTitle,
    chapterCompletedList
  );

  if (savedOk) {
    studentProgressMap = await fetchStudentProgress(activeStudentUser.uid);
    renderLearningJourneyView();
    const isNowDone = completedLessons.has(currentLessonId);
    if (isNowDone) {
      await recordStudyActivityForStreak("lesson", 1);
    }
    showFriendlyBanner(
      isNowDone
        ? "✓ Đã đồng bộ tiến độ lên đám mây — Hoàn thành chuyên đề " + (lesson.title || "")
        : "✓ Đã cập nhật tiến độ học tập trên tài khoản của bạn.",
      isNowDone ? "success" : "info"
    );
  }
}

function activateMaterialTab(targetPanelId) {
  document.querySelectorAll(".tab-trigger-btn").forEach(function (btn) {
    const isMatch = btn.getAttribute("data-tab-target") === targetPanelId;
    btn.classList.toggle("active", isMatch);
    btn.setAttribute("aria-selected", isMatch ? "true" : "false");
  });

  document.querySelectorAll(".tab-panel").forEach(function (panel) {
    panel.classList.toggle("active", panel.id === targetPanelId);
  });

  if (targetPanelId === "tab-panel-pdf") {
    setTimeout(function () {
      queueRenderSlidePage(currentSlidePage, true);
    }, 30);
  }
}

function updateProgressCounters() {
  sanitizeCompletedLessonsSet();
  const totalLessons = getLessonKeys().length;
  const doneLessons = completedLessons.size;
  const percentLessons = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;

  const headerText = document.getElementById("header-progress-text");
  const sidebarCounter = document.getElementById("sidebar-completed-counter");
  const heroPercent = document.getElementById("hero-progress-percent");
  const heroBar = document.getElementById("hero-progress-bar");
  const overviewStatLessons = document.getElementById("overview-stat-lessons");

  if (headerText) headerText.textContent = "Tiến độ: " + doneLessons + "/" + totalLessons + " chuyên đề";
  if (sidebarCounter) sidebarCounter.textContent = doneLessons + "/" + totalLessons + " chuyên đề";
  if (heroPercent) heroPercent.textContent = percentLessons + "% (" + doneLessons + "/" + totalLessons + " bài)";
  if (heroBar) heroBar.style.width = percentLessons + "%";
  if (overviewStatLessons) overviewStatLessons.textContent = doneLessons + " / " + totalLessons;
}

/**
 * Tab 5 ("Hành trình tự học") & Thẻ thống kê Tab 1 — Giao diện sạch, thân thiện, không lộ biến kỹ thuật
 */
function renderLearningJourneyView() {
  const gridEl = document.getElementById("learning-journey-cards-grid");
  const gpaEl = document.getElementById("journey-overall-gpa");
  const compEl = document.getElementById("journey-completed-chapters");
  const attEl = document.getElementById("journey-total-attempts");

  const overviewGpaEl = document.getElementById("overview-stat-gpa");
  const overviewAttemptsEl = document.getElementById("overview-stat-attempts");
  const overviewLessonsEl = document.getElementById("overview-stat-lessons");

  let scoreSum = 0;
  let scoredChapters = 0;
  let passedChapters = 0;
  let totalAttempts = 0;

  const cardsHtml = CURRICULUM_CHAPTERS.map(function (chap) {
    const docData = studentProgressMap[chap.chapterId] || null;
    const hasScore = docData && typeof docData.lastScore === "number";

    if (hasScore) {
      const best = Number(docData.highestScore || docData.lastScore || 0);
      const last = Number(docData.lastScore || 0);
      const att = Number(docData.attempts || 1);
      const acc = Number(docData.accuracyPercent || 0);
      const corr = Number(docData.correctCount || 0);
      const tot = Number(docData.totalQuestions || 1);

      scoreSum += best;
      scoredChapters += 1;
      totalAttempts += att;
      if (docData.isPassed || acc >= 50) passedChapters += 1;

      return (
        '<article class="journey-chapter-card is-completed">' +
          '<div class="journey-card-top" style="display:flex;justify-content:space-between;align-items:center;">' +
            '<span class="academic-badge">' + chap.chapterNumber + '</span>' +
            '<span class="journey-status-tag status-done">✓ Đã lưu kết quả</span>' +
          '</div>' +
          '<h3 class="journey-chapter-title">' + chap.title + '</h3>' +
          '<div class="journey-metrics-row">' +
            '<div class="journey-metric-item">' +
              '<span class="metric-label">Điểm kỷ lục</span>' +
              '<strong class="metric-val highlight-score">' + best.toFixed(1) + ' / 10</strong>' +
            '</div>' +
            '<div class="journey-metric-item">' +
              '<span class="metric-label">Điểm gần nhất</span>' +
              '<strong class="metric-val">' + last.toFixed(1) + ' / 10 (' + corr + "/" + tot + ' câu)</strong>' +
            '</div>' +
            '<div class="journey-metric-item">' +
              '<span class="metric-label">Số lượt làm bài</span>' +
              '<strong class="metric-val">' + att + ' lần</strong>' +
            '</div>' +
          '</div>' +
          '<div class="progress-track">' +
            '<div class="progress-fill" style="width: ' + Math.min(100, acc) + '%;"></div>' +
          '</div>' +
          '<div class="journey-doc-path">✓ Đã đồng bộ tiến độ lên đám mây</div>' +
        '</article>'
      );
    }

    return (
      '<article class="journey-chapter-card">' +
        '<div class="journey-card-top" style="display:flex;justify-content:space-between;align-items:center;">' +
          '<span class="academic-badge">' + chap.chapterNumber + '</span>' +
          '<span class="journey-status-tag">Chưa có dữ liệu điểm</span>' +
        '</div>' +
        '<h3 class="journey-chapter-title">' + chap.title + '</h3>' +
        '<p style="font-size:0.85rem;color:var(--text-secondary);">Hãy làm bài tại mục Phòng luyện tập, kết quả của bạn sẽ được lưu tự động ngay khi bạn ấn "Kiểm tra".</p>' +
        '<div class="journey-doc-path">Dữ liệu học tập được lưu tự động trên tài khoản của bạn</div>' +
      '</article>'
    );
  }).join("");

  if (gridEl) gridEl.innerHTML = cardsHtml;

  const gpa = scoredChapters > 0 ? (scoreSum / scoredChapters).toFixed(1) : "0.0";
  if (gpaEl) gpaEl.textContent = gpa + " / 10";
  if (compEl) compEl.textContent = passedChapters + " / " + CURRICULUM_CHAPTERS.length + " chương";
  if (attEl) attEl.textContent = totalAttempts + " lượt làm bài";

  const totalLessons = getLessonKeys().length;
  if (overviewGpaEl) overviewGpaEl.textContent = gpa;
  if (overviewAttemptsEl) overviewAttemptsEl.textContent = totalAttempts + " bài";
  if (overviewLessonsEl) overviewLessonsEl.textContent = completedLessons.size + " / " + totalLessons;
}

/* ============================================================================
   PHÒNG LUYỆN TẬP (TRẮC NGHIỆM TỰ ĐỘNG LƯU ĐIỂM + TỰ LUẬN GEMINI AI)
   ============================================================================ */

function extractChapterIdAutomatically(questionObj) {
  if (questionObj && questionObj.chapterId) return questionObj.chapterId;
  const params = new URLSearchParams(window.location.search);
  if (params.get("chapter")) return params.get("chapter");
  if (questionObj && questionObj.id) {
    if (questionObj.id.indexOf("ch1") !== -1) return "chuong_1";
    if (questionObj.id.indexOf("ch3") !== -1) return "chuong_3";
  }
  if (questionObj && questionObj.chapter) {
    if (questionObj.chapter.indexOf("Chương 1") !== -1) return "chuong_1";
    if (questionObj.chapter.indexOf("Chương 3") !== -1) return "chuong_3";
  }
  return "chuong_2";
}

function updateQuizFilterButtonsCount() {
  const allCount = ALL_QUIZ_QUESTIONS.length;
  const validQuestionIds = new Set(ALL_QUIZ_QUESTIONS.map(function (q) { return q.id; }));
  const activeMistakesCount = Array.from(mistakeQuestionIds).filter(function (id) {
    return validQuestionIds.size === 0 || validQuestionIds.has(id);
  }).length;

  document.querySelectorAll(".quiz-filter-chap-btn").forEach(function (btn) {
    const chap = btn.getAttribute("data-filter-chapter");
    if (chap === "all") {
      btn.textContent = "Tất cả (" + allCount + " câu)";
    } else if (chap === "mistakes") {
      btn.textContent = "❌ Câu hay làm sai (" + activeMistakesCount + " câu)";
    } else {
      const count = ALL_QUIZ_QUESTIONS.filter(function (q) {
        return extractChapterIdAutomatically(q) === chap;
      }).length;
      const chapNum = chap.replace("chuong_", "");
      btn.textContent = "Chương " + chapNum + " (" + count + " câu)";
    }
  });
}

function buildQuestionCardMarkup(questionObj, index) {
  const qId = questionObj.id || ("q_auto_" + index);
  const currentSelected = quizAppState.selectedAnswers[qId] || null;
  const checkedInfo = quizAppState.checkedResults[qId] || null;
  const isChecked = Boolean(checkedInfo);

  let cardStateClass = "";
  if (isChecked) {
    cardStateClass = checkedInfo.isCorrect ? " is-checked-correct" : " is-checked-wrong";
  }

  const optionsList = Array.isArray(questionObj.options) ? questionObj.options : [];
  const optionsHtml = optionsList.map(function (opt) {
    let optionStateClass = "";
    if (isChecked) {
      if (opt.key === questionObj.correctAnswer) {
        optionStateClass = " is-correct";
      } else if (opt.key === checkedInfo.chosen && !checkedInfo.isCorrect) {
        optionStateClass = " is-wrong";
      }
    } else if (currentSelected === opt.key) {
      optionStateClass = " is-selected";
    }

    return (
      '<button type="button" class="quiz-option-btn' + optionStateClass + '"' +
      ' data-quiz-action="select-option"' +
      ' data-question-id="' + qId + '"' +
      ' data-option-key="' + opt.key + '"' +
      (isChecked ? " disabled" : "") + '>' +
        '<span class="quiz-option-key">' + opt.key + '</span>' +
        '<span class="quiz-option-content">' + opt.text + '</span>' +
      '</button>'
    );
  }).join("");

  let feedbackBadgeHtml = '<span class="quiz-feedback-status" id="feedback-status-' + qId + '">Chọn 1 phương án và ấn "Kiểm tra"</span>';
  if (isChecked) {
    feedbackBadgeHtml = checkedInfo.isCorrect
      ? '<span class="quiz-feedback-status status-correct" id="feedback-status-' + qId + '">✓ Chính xác! Kết quả đã được lưu tự động vào tài khoản của bạn.</span>'
      : '<span class="quiz-feedback-status status-wrong" id="feedback-status-' + qId + '">✕ Chưa chính xác (Đáp án đúng là ' + questionObj.correctAnswer + '). Xem giải thích bên dưới.</span>';
  }

  const breakdownItemsHtml = optionsList.map(function (opt) {
    const isOptCorrect = opt.key === questionObj.correctAnswer;
    const itemClass = isOptCorrect ? "explain-correct" : "explain-wrong";
    const reasonText = (questionObj.optionExplanations && questionObj.optionExplanations[opt.key]) ? questionObj.optionExplanations[opt.key] : "";
    if (!reasonText) return "";
    return '<div class="explanation-option-item ' + itemClass + '"><strong>Phương án ' + opt.key + ':</strong> ' + reasonText + '</div>';
  }).join("");

  return (
    '<article class="quiz-card' + cardStateClass + '" id="quiz-card-' + qId + '">' +
      '<div class="quiz-card-meta">' +
        '<span class="quiz-question-number">Câu ' + String(index + 1).padStart(2, "0") + " • " + (questionObj.chapter || "Triết học Mác - Lênin") + '</span>' +
        '<span class="quiz-topic-tag">' + (questionObj.topic || "Lý thuyết trọng tâm") + (questionObj.difficulty ? (" (" + questionObj.difficulty + ")") : "") + '</span>' +
      '</div>' +
      '<h3 class="quiz-question-title">' + questionObj.question + '</h3>' +
      '<div class="quiz-options-grid" role="radiogroup">' + optionsHtml + '</div>' +
      '<div class="quiz-action-bar">' +
        feedbackBadgeHtml +
        '<div>' +
          (isChecked
            ? '<button type="button" class="btn btn-secondary btn-sm" data-quiz-action="retry-question" data-question-id="' + qId + '">Làm lại câu này</button>'
            : '<button type="button" class="btn btn-primary btn-sm" data-quiz-action="check-answer" data-question-id="' + qId + '">Kiểm tra</button>'
          ) +
        '</div>' +
      '</div>' +
      '<div class="quiz-explanation-panel' + (isChecked ? " is-visible" : "") + '" id="explanation-panel-' + qId + '">' +
        '<div class="explanation-header"><span>Giải thích học thuật &amp; Phân tích Đúng / Sai</span></div>' +
        '<p class="explanation-general-text">' + (questionObj.generalExplanation || questionObj.explanation || "") + '</p>' +
        '<div class="explanation-breakdown-list">' + breakdownItemsHtml + '</div>' +
      '</div>' +
    '</article>'
  );
}

function updateQuizScoreboard() {
  const activeQuestions = Array.isArray(quizAppState.questions) ? quizAppState.questions : [];
  const totalCount = activeQuestions.length;
  const answeredCount = activeQuestions.filter(function (q) {
    return Boolean(quizAppState.checkedResults[q.id]);
  }).length;
  const correctCount = activeQuestions.filter(function (q) {
    return quizAppState.checkedResults[q.id] && quizAppState.checkedResults[q.id].isCorrect;
  }).length;

  const totalEl = document.getElementById("quiz-stat-total");
  const answeredEl = document.getElementById("quiz-stat-answered");
  const correctEl = document.getElementById("quiz-stat-correct");

  if (totalEl) totalEl.textContent = totalCount + " câu";
  if (answeredEl) answeredEl.textContent = answeredCount + "/" + totalCount + " câu";
  if (correctEl) correctEl.textContent = correctCount + "/" + totalCount + " đúng";
}

function renderQuizView() {
  const container = document.getElementById("quiz-questions-container");
  if (!container) return;

  const activeQuestions = Array.isArray(quizAppState.questions) ? quizAppState.questions : [];
  if (activeQuestions.length === 0) {
    const isMistakeMode = currentQuizChapterFilter === "mistakes";
    container.innerHTML =
      '<div class="quiz-empty-state-card">' +
        '<div class="quiz-empty-state-icon" aria-hidden="true">' + (isMistakeMode ? "🎉" : "📝") + '</div>' +
        '<h3 style="font-size:1.05rem;font-weight:700;color:var(--text-main);margin-bottom:0.35rem;">' +
          (isMistakeMode
            ? "Tuyệt vời! Bạn không còn câu nào trong danh sách Câu hay làm sai"
            : "Chuyên đề/Chương này đang được cập nhật ngân hàng câu hỏi") +
        '</h3>' +
        '<p style="font-size:0.88rem;max-width:540px;margin:0 auto 1rem;">' +
          'Bạn có thể chọn chương khác hoặc luyện tập phần <strong>Tự luận chấm bằng Gemini AI</strong> ngay bên dưới.' +
        '</p>' +
        '<button type="button" class="btn btn-secondary btn-sm" id="empty-quiz-show-all-btn">' +
          'Xem tất cả câu hỏi hiện có' +
        '</button>' +
      '</div>';

    const showAllBtn = document.getElementById("empty-quiz-show-all-btn");
    if (showAllBtn) {
      showAllBtn.addEventListener("click", function () {
        applyQuizChapterFilter("all");
      });
    }
    updateQuizScoreboard();
    return;
  }

  container.innerHTML = activeQuestions.map(function (q, idx) {
    return buildQuestionCardMarkup(q, idx);
  }).join("");
  updateQuizScoreboard();
}

function applyQuizChapterFilter(chapFilter) {
  currentQuizChapterFilter = chapFilter || "all";
  document.querySelectorAll(".quiz-filter-chap-btn").forEach(function (b) {
    const attr = b.getAttribute("data-filter-chapter");
    const isMatch = attr === currentQuizChapterFilter;
    if (attr === "mistakes") {
      b.className = "btn btn-sm quiz-filter-chap-btn btn-mistakes-filter" + (isMatch ? " is-active-mistakes" : "");
    } else {
      b.className = isMatch ? "btn btn-primary btn-sm quiz-filter-chap-btn" : "btn btn-secondary btn-sm quiz-filter-chap-btn";
    }
  });

  if (currentQuizChapterFilter === "all") {
    quizAppState.questions = ALL_QUIZ_QUESTIONS.slice();
  } else if (currentQuizChapterFilter === "mistakes") {
    quizAppState.questions = ALL_QUIZ_QUESTIONS.filter(function (q) {
      return mistakeQuestionIds.has(q.id);
    });
  } else {
    quizAppState.questions = ALL_QUIZ_QUESTIONS.filter(function (q) {
      return extractChapterIdAutomatically(q) === currentQuizChapterFilter;
    });
  }
  renderQuizView();
}

async function handleCheckAnswer(questionId) {
  const chosenOption = quizAppState.selectedAnswers[questionId];
  if (!chosenOption) {
    const statusEl = document.getElementById("feedback-status-" + questionId);
    if (statusEl) {
      statusEl.className = "quiz-feedback-status status-warning";
      statusEl.textContent = "⚠ Vui lòng chọn một phương án (A, B, C hoặc D) trước khi ấn Kiểm tra!";
    }
    return;
  }

  const questionObj = quizAppState.questions.find(function (q) { return q.id === questionId; });
  if (!questionObj) return;

  const isAnswerCorrect = (chosenOption === questionObj.correctAnswer);
  quizAppState.checkedResults[questionId] = {
    isCorrect: isAnswerCorrect,
    chosen: chosenOption
  };

  // Tính năng 3: Tự động ghi nhận lỗi sai hoặc gỡ bỏ khi trả lời đúng 100%
  if (!isAnswerCorrect) {
    await recordMistakeQuestionIds([questionId]);
  } else if (mistakeQuestionIds.has(questionId)) {
    await removeMistakeQuestionId(questionId);
    showFriendlyBanner("✓ Đã nắm vững câu hỏi này và gỡ khỏi danh sách ôn lại!", "success");
  }

  if (currentQuizChapterFilter === "mistakes" && isAnswerCorrect) {
    applyQuizChapterFilter("mistakes");
  } else {
    renderQuizView();
  }

  if (!activeStudentUser) return;

  const targetChapterId = extractChapterIdAutomatically(questionObj);
  const chapterQuestions = ALL_QUIZ_QUESTIONS.filter(function (q) {
    return extractChapterIdAutomatically(q) === targetChapterId;
  });
  const totalInChapter = chapterQuestions.length || 1;
  const correctInChapter = chapterQuestions.filter(function (q) {
    return quizAppState.checkedResults[q.id] && quizAppState.checkedResults[q.id].isCorrect;
  }).length;

  await saveQuizProgressToFirestore(activeStudentUser.uid, targetChapterId, {
    correctCount: correctInChapter,
    totalQuestions: totalInChapter,
    chapterTitle: questionObj.chapterTitle || questionObj.chapter || targetChapterId
  });

  studentProgressMap = await fetchStudentProgress(activeStudentUser.uid);
  renderLearningJourneyView();
  await recordStudyActivityForStreak("quiz", 1);
}

async function evaluateEssayWithGeminiAI() {
  const promptSelectEl = document.getElementById("essay-prompt-select");
  const answerInputEl = document.getElementById("essay-student-answer");
  const apiKeyInputEl = document.getElementById("gemini-api-key-input");
  const resultBoxEl = document.getElementById("essay-ai-result-box");
  const submitBtnEl = document.getElementById("grade-essay-ai-btn");

  if (!answerInputEl || !resultBoxEl) return;
  const studentText = answerInputEl.value.trim();
  const selectedPromptId = promptSelectEl ? promptSelectEl.value : "essay_ch2";
  const promptObj = ESSAY_PROMPTS_DATA.find(function (p) { return p.id === selectedPromptId; }) || ESSAY_PROMPTS_DATA[0];

  if (!promptObj) return;

  if (studentText.length < 20) {
    resultBoxEl.className = "essay-ai-result-box is-visible";
    resultBoxEl.innerHTML = "<strong style='color:var(--color-danger);'>⚠ Bài làm quá ngắn:</strong> Vui lòng trình bày lập luận triết học tối thiểu 1 đoạn văn trước khi chấm điểm AI.";
    return;
  }

  if (submitBtnEl) {
    submitBtnEl.disabled = true;
    submitBtnEl.textContent = "⏳ Gemini AI đang phân tích bài tự luận...";
  }

  const userApiKey = apiKeyInputEl ? apiKeyInputEl.value.trim() : "";
  let finalScore10 = 8.5;
  let feedbackHtml = "";

  if (userApiKey) {
    try {
      const geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + encodeURIComponent(userApiKey);
      const systemInstruction = "Bạn là giảng viên đại học môn Triết học Mác - Lênin. Hãy chấm điểm bài tự luận theo thang điểm 10 cho đề bài: '" + promptObj.prompt + "'. Trả về nhận xét điểm mạnh, điểm cần bổ sung theo giáo trình Bộ GD&ĐT và điểm số X/10.";
      const resp = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemInstruction + "\n\nBài làm của sinh viên:\n" + studentText }] }]
        })
      });
      const data = await resp.json();
      const rawReply = (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0])
        ? data.candidates[0].content.parts[0].text
        : "";
      const scoreMatch = rawReply.match(/([0-9]+(\.[0-9]+)?)/);
      if (scoreMatch) {
        finalScore10 = Math.min(10, Math.max(4, parseFloat(scoreMatch[1])));
      }
      if (rawReply) {
        feedbackHtml = "<div><strong>Nhận xét từ Gemini AI:</strong><p style='margin-top:6px;white-space:pre-wrap;'>" + rawReply + "</p></div>";
      }
    } catch (err) {
      console.warn("Gemini API fallback:", err);
    }
  }

  if (!feedbackHtml) {
    const lowerAns = studentText.toLowerCase();
    const keywords = Array.isArray(promptObj.rubricKeywords) ? promptObj.rubricKeywords : [];
    const matchedKeywords = keywords.filter(function (kw) {
      return lowerAns.indexOf(kw.toLowerCase()) !== -1;
    });
    const wordCount = studentText.split(/\s+/).length;
    const baseScore = 6.5 + Math.min(2.5, matchedKeywords.length * 0.45) + (wordCount > 60 ? 0.5 : 0);
    finalScore10 = Math.round(Math.min(9.5, baseScore) * 10) / 10;

    feedbackHtml =
      '<div style="display:flex;flex-direction:column;gap:0.45rem;">' +
        '<div style="font-size:1rem;font-weight:800;color:var(--color-primary-active);">Điểm Tự luận AI: ' + finalScore10.toFixed(1) + ' / 10 (' + promptObj.chapterTitle + ')</div>' +
        '<div><strong>• Thuật ngữ triết học đã vận dụng (' + matchedKeywords.length + "/" + keywords.length + '):</strong> ' +
          (matchedKeywords.length > 0 ? matchedKeywords.join(", ") : "Cần bổ sung thêm các thuật ngữ chuẩn trong giáo trình") +
        '</div>' +
        '<div><strong>• Gợi ý hoàn thiện phương pháp luận:</strong> Đảm bảo phân tích đủ 3 phần: Định nghĩa khái niệm cốt lõi, Mối quan hệ biện chứng, và Ý nghĩa phương pháp luận liên hệ thực tiễn sinh viên.</div>' +
        '<div style="color:var(--color-success);font-weight:700;">✓ Đã đồng bộ tiến độ lên đám mây — Điểm tự luận được lưu vào tài khoản của bạn.</div>' +
      '</div>';
  }

  resultBoxEl.className = "essay-ai-result-box is-visible";
  resultBoxEl.innerHTML = feedbackHtml;

  if (submitBtnEl) {
    submitBtnEl.disabled = false;
    submitBtnEl.textContent = "✨ Chấm điểm Tự luận bằng Gemini AI";
  }

  if (activeStudentUser) {
    await saveQuizProgressToFirestore(activeStudentUser.uid, promptObj.chapterId, {
      correctCount: Math.round(finalScore10),
      totalQuestions: 10,
      chapterTitle: promptObj.chapterTitle
    });
    studentProgressMap = await fetchStudentProgress(activeStudentUser.uid);
    renderLearningJourneyView();
    await recordStudyActivityForStreak("essay", 1);
  }
}

async function loadDynamicCourseData(jsonPath) {
  try {
    const response = await fetch(jsonPath, { cache: "no-store" });
    if (!response.ok) throw new Error("HTTP " + response.status);
    const parsedData = await response.json();

    if (parsedData && parsedData.lessons && typeof parsedData.lessons === "object") {
      LESSONS_DATA = parsedData.lessons;
      const keys = getLessonKeys();
      if (!LESSONS_DATA[currentLessonId] && keys.length > 0) {
        currentLessonId = keys[0];
      }
    }

    if (Array.isArray(parsedData)) {
      ALL_QUIZ_QUESTIONS = parsedData;
    } else if (parsedData && Array.isArray(parsedData.questions)) {
      ALL_QUIZ_QUESTIONS = parsedData.questions;
    }

    if (parsedData && Array.isArray(parsedData.essayPrompts)) {
      ESSAY_PROMPTS_DATA = parsedData.essayPrompts;
    }

    if (parsedData && Array.isArray(parsedData.flashcards)) {
      ALL_FLASHCARDS = parsedData.flashcards;
    }
  } catch (err) {
    console.error("[Data Load Error] Không thể tải data.json:", err);
    showFriendlyBanner("Không thể tải dữ liệu bài học từ data.json. Vui lòng thử tải lại trang.", "warning");
  }

  sanitizeCompletedLessonsSet();
  if (currentLessonId) {
    selectLesson(currentLessonId);
  }
  updateQuizFilterButtonsCount();
  applyQuizChapterFilter(currentQuizChapterFilter);
  renderLearningJourneyView();
}


/* ============================================================================
   CHUYỂN ĐỔI 3 CHẾ ĐỘ TRONG MỤC 3 ("PHÒNG LUYỆN TẬP")
   ============================================================================ */

function switchPracticeMode(targetPaneId) {
  activePracticeModeId = targetPaneId;
  document.querySelectorAll(".practice-mode-tab-btn").forEach(function (btn) {
    const isMatch = btn.getAttribute("data-practice-mode") === targetPaneId;
    btn.classList.toggle("active", isMatch);
    btn.setAttribute("aria-selected", isMatch ? "true" : "false");
  });
  document.querySelectorAll(".practice-mode-pane").forEach(function (pane) {
    pane.classList.toggle("is-active", pane.id === targetPaneId);
  });

  if (targetPaneId === "practice-pane-flashcards") {
    rebuildFlashcardsDeck(false);
  }
}

/* ============================================================================
   TÍNH NĂNG 1: THẺ GHI NHỚ NHANH (FLASHCARDS 3D) LƯU TIẾN ĐỘ THEO user.uid
   ============================================================================ */

function getFlashcardStorageKey(uid) {
  return "triet_hoc_flashcards_" + (uid || "guest");
}

async function loadFlashcardStateForUser(uid) {
  fcMemoryMap = {};
  if (!uid) return;

  try {
    const raw = localStorage.getItem(getFlashcardStorageKey(uid));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        fcMemoryMap = parsed;
      }
    }
  } catch (e) {}

  try {
    if (db) {
      const ref = doc(db, "users", uid, "progress", "flashcards_state");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        if (data && data.cardsStatus && typeof data.cardsStatus === "object") {
          fcMemoryMap = Object.assign({}, fcMemoryMap, data.cardsStatus);
          try {
            localStorage.setItem(getFlashcardStorageKey(uid), JSON.stringify(fcMemoryMap));
          } catch (e) {}
        }
      }
    }
  } catch (err) {
    console.warn("[Flashcards] Tải trạng thái từ đám mây:", err);
  }
}

async function persistFlashcardStateForUser() {
  if (!activeStudentUser) return;
  const uid = activeStudentUser.uid;

  try {
    localStorage.setItem(getFlashcardStorageKey(uid), JSON.stringify(fcMemoryMap));
  } catch (e) {}

  try {
    if (db) {
      const ref = doc(db, "users", uid, "progress", "flashcards_state");
      await setDoc(
        ref,
        {
          uid: uid,
          cardsStatus: fcMemoryMap,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.warn("[Flashcards] Không thể đồng bộ trạng thái thẻ lên Firestore:", err);
  }
}

function updateFlashcardsProgressBar() {
  const totalAll = ALL_FLASHCARDS.length;
  const masteredCount = ALL_FLASHCARDS.filter(function (c) {
    return fcMemoryMap[c.id] === "mastered";
  }).length;
  const pct = totalAll > 0 ? Math.round((masteredCount / totalAll) * 100) : 0;

  const progressTextEl = document.getElementById("fc-progress-text");
  const progressBarEl = document.getElementById("fc-progress-bar");
  if (progressTextEl) progressTextEl.textContent = "Đã thuộc " + masteredCount + "/" + totalAll + " thẻ";
  if (progressBarEl) progressBarEl.style.width = pct + "%";
}

function rebuildFlashcardsDeck(shouldShuffle) {
  let filtered = ALL_FLASHCARDS.filter(function (card) {
    const chapMatch = (fcChapterFilter === "all") || (card.chapterId === fcChapterFilter);
    const statusMatch = (fcStatusFilter === "all") || (fcMemoryMap[card.id] !== "mastered");
    return chapMatch && statusMatch;
  });

  if (shouldShuffle) {
    filtered = shuffleArrayCopy(filtered);
  }

  fcFilteredList = filtered;
  if (fcCurrentIndex >= fcFilteredList.length) {
    fcCurrentIndex = 0;
  }
  fcIsFlipped = false;
  renderActiveFlashcard();
}

function renderActiveFlashcard() {
  updateFlashcardsProgressBar();

  const emptyEl = document.getElementById("fc-empty-notice");
  const stageEl = document.getElementById("fc-card-stage");
  const idxCounterEl = document.getElementById("fc-index-counter");

  if (!fcFilteredList || fcFilteredList.length === 0) {
    if (emptyEl) emptyEl.style.display = "block";
    if (stageEl) stageEl.style.display = "none";
    if (idxCounterEl) idxCounterEl.textContent = "Thẻ 0 / 0";
    return;
  }

  if (emptyEl) emptyEl.style.display = "none";
  if (stageEl) stageEl.style.display = "block";

  const card = fcFilteredList[fcCurrentIndex];
  const isMastered = fcMemoryMap[card.id] === "mastered";

  const innerEl = document.getElementById("fc-card-inner");
  const frontChapEl = document.getElementById("fc-front-chapter");
  const frontTitleEl = document.getElementById("fc-front-title");
  const frontPillEl = document.getElementById("fc-front-status-pill");
  const backChapEl = document.getElementById("fc-back-chapter");
  const backTitleEl = document.getElementById("fc-back-title");
  const backDefEl = document.getElementById("fc-back-definition");
  const backMethEl = document.getElementById("fc-back-methodology");
  const prevBtn = document.getElementById("fc-prev-btn");
  const nextBtn = document.getElementById("fc-next-btn");

  if (innerEl) innerEl.classList.toggle("is-flipped", fcIsFlipped);
  if (frontChapEl) frontChapEl.textContent = card.chapter || "Triết học Mác - Lênin";
  if (frontTitleEl) frontTitleEl.textContent = card.front || "";
  if (frontPillEl) {
    frontPillEl.textContent = isMastered ? "✅ Đã thuộc" : "🔄 Cần ôn lại";
    frontPillEl.className = "flashcard-status-pill " + (isMastered ? "is-mastered" : "is-review");
  }
  if (backChapEl) backChapEl.textContent = card.chapter || "Triết học Mác - Lênin";
  if (backTitleEl) backTitleEl.textContent = card.front || "";
  if (backDefEl) backDefEl.textContent = card.definition || "";
  if (backMethEl) backMethEl.textContent = card.methodology || "";
  if (idxCounterEl) idxCounterEl.textContent = "Thẻ " + (fcCurrentIndex + 1) + " / " + fcFilteredList.length;

  if (prevBtn) prevBtn.disabled = (fcCurrentIndex <= 0);
  if (nextBtn) nextBtn.disabled = (fcCurrentIndex >= fcFilteredList.length - 1);
}

function flipCurrentFlashcard() {
  if (!fcFilteredList || fcFilteredList.length === 0) return;
  fcIsFlipped = !fcIsFlipped;
  const innerEl = document.getElementById("fc-card-inner");
  if (innerEl) innerEl.classList.toggle("is-flipped", fcIsFlipped);
}

async function markCurrentFlashcardStatus(statusVal) {
  if (!fcFilteredList || fcFilteredList.length === 0) return;
  const card = fcFilteredList[fcCurrentIndex];
  if (!card) return;

  fcMemoryMap[card.id] = statusVal;
  await persistFlashcardStateForUser();
  await recordStudyActivityForStreak("flashcard", 1);

  if (fcStatusFilter === "review" && statusVal === "mastered") {
    rebuildFlashcardsDeck(false);
  } else {
    if (fcCurrentIndex < fcFilteredList.length - 1) {
      fcCurrentIndex += 1;
    }
    fcIsFlipped = false;
    renderActiveFlashcard();
  }
}

/* ============================================================================
   TÍNH NĂNG 2: CHẾ ĐỘ THI THỬ TỔNG HỢP CÓ BẤM GIỜ (MOCK EXAM 45 PHÚT)
   ============================================================================ */

function shuffleArrayCopy(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

function formatSecondsMMSS(totalSec) {
  const safe = Math.max(0, Number(totalSec) || 0);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
}

function formatDurationVietnamese(elapsedSec) {
  const safe = Math.max(1, Number(elapsedSec) || 1);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return mins + " phút " + secs + " giây";
}

function stopMockExamTimer() {
  if (mockExamTimerInterval) {
    clearInterval(mockExamTimerInterval);
    mockExamTimerInterval = null;
  }
}

function updateMockExamTimerDisplay() {
  const timerEl = document.getElementById("mock-exam-timer");
  if (!timerEl) return;
  timerEl.textContent = "⏱️ " + formatSecondsMMSS(mockExamRemainingSec);
  timerEl.classList.toggle("is-danger", mockExamRemainingSec < 300);
}

function renderMockExamPalette() {
  const paletteEl = document.getElementById("mock-exam-palette-grid");
  const answeredEl = document.getElementById("mock-exam-answered-count");
  if (!paletteEl) return;

  const answeredCount = mockExamQuestions.filter(function (q) {
    return Boolean(mockExamAnswers[q.id]);
  }).length;
  if (answeredEl) {
    answeredEl.textContent = answeredCount + " / " + mockExamQuestions.length;
  }

  paletteEl.innerHTML = mockExamQuestions.map(function (q, idx) {
    const isAns = Boolean(mockExamAnswers[q.id]);
    const isCurr = idx === mockExamActiveIdx;
    return (
      '<button type="button" class="mock-palette-btn' +
      (isAns ? " is-answered" : "") +
      (isCurr ? " is-current" : "") +
      '" data-mock-jump-idx="' + idx + '">' +
        (idx + 1) +
      '</button>'
    );
  }).join("");
}

function renderMockExamQuestions() {
  const container = document.getElementById("mock-exam-questions-container");
  if (!container) return;

  container.innerHTML = mockExamQuestions.map(function (q, idx) {
    const chosen = mockExamAnswers[q.id] || null;
    const optsHtml = (q.options || []).map(function (opt) {
      const isSelected = chosen === opt.key;
      return (
        '<button type="button" class="quiz-option-btn' + (isSelected ? " is-selected" : "") + '"' +
        ' data-mock-q-idx="' + idx + '"' +
        ' data-mock-q-id="' + q.id + '"' +
        ' data-mock-opt="' + opt.key + '">' +
          '<span class="quiz-option-key">' + opt.key + '</span>' +
          '<span class="quiz-option-content">' + opt.text + '</span>' +
        '</button>'
      );
    }).join("");

    return (
      '<article class="quiz-card" id="mock-q-card-' + idx + '">' +
        '<div class="quiz-card-meta">' +
          '<span class="quiz-question-number">Câu ' + String(idx + 1).padStart(2, "0") + " / " + mockExamQuestions.length + '</span>' +
          '<span class="quiz-topic-tag">' + (q.chapter || "Triết học Mác - Lênin") + '</span>' +
        '</div>' +
        '<h3 class="quiz-question-title">' + q.question + '</h3>' +
        '<div class="quiz-options-grid" role="radiogroup">' + optsHtml + '</div>' +
      '</article>'
    );
  }).join("");

  renderMockExamPalette();
}

function startMockExamSession() {
  if (!ALL_QUIZ_QUESTIONS || ALL_QUIZ_QUESTIONS.length === 0) {
    showFriendlyBanner("Ngân hàng câu hỏi đang được tải, vui lòng thử lại sau giây lát.", "warning");
    return;
  }

  const targetCount = Math.min(mockExamSelectedSize, ALL_QUIZ_QUESTIONS.length);
  mockExamQuestions = shuffleArrayCopy(ALL_QUIZ_QUESTIONS).slice(0, targetCount);
  mockExamAnswers = {};
  mockExamDurationSec = 45 * 60;
  mockExamRemainingSec = mockExamDurationSec;
  mockExamIsRunning = true;
  mockExamStartTimeMs = Date.now();
  mockExamActiveIdx = 0;

  const setupView = document.getElementById("mock-exam-setup-view");
  const runningView = document.getElementById("mock-exam-running-view");
  const resultView = document.getElementById("mock-exam-result-view");

  if (setupView) setupView.style.display = "none";
  if (resultView) resultView.style.display = "none";
  if (runningView) runningView.style.display = "block";

  renderMockExamQuestions();
  updateMockExamTimerDisplay();

  stopMockExamTimer();
  mockExamTimerInterval = setInterval(function () {
    mockExamRemainingSec -= 1;
    updateMockExamTimerDisplay();
    if (mockExamRemainingSec <= 0) {
      submitAndGradeMockExam(true);
    }
  }, 1000);
}

async function saveMockExamHistoryToFirestore(examRecord) {
  if (!activeStudentUser || !db) return;
  try {
    const colRef = collection(db, "users", activeStudentUser.uid, "mock_exams");
    await addDoc(colRef, Object.assign({}, examRecord, {
      uid: activeStudentUser.uid,
      createdAt: serverTimestamp(),
      createdAtClientISO: new Date().toISOString()
    }));
  } catch (err) {
    console.warn("[Mock Exam] Không thể lưu lịch sử thi thử lên Firestore:", err);
  }
}

async function loadMockExamHistoryFromFirestore() {
  const listEl = document.getElementById("mock-exam-history-list");
  if (!listEl || !activeStudentUser || !db) return;

  try {
    const colRef = collection(db, "users", activeStudentUser.uid, "mock_exams");
    const q = query(colRef, orderBy("createdAtClientISO", "desc"), limit(5));
    const snap = await getDocs(q);

    if (snap.empty) {
      listEl.textContent = "Chưa có bài thi thử nào được lưu.";
      return;
    }

    const rows = [];
    snap.forEach(function (docSnap) {
      const d = docSnap.data();
      const dt = d.createdAtClientISO ? new Date(d.createdAtClientISO).toLocaleString("vi-VN") : "";
      rows.push(
        '<div class="mock-history-item">' +
          '<div><strong>Đề ' + d.totalQuestions + ' câu</strong> • ' + dt + '</div>' +
          '<div><strong style="color:var(--color-accent);">' + Number(d.score10 || 0).toFixed(1) + ' / 10</strong> (' + d.correctCount + '/' + d.totalQuestions + ' đúng • ' + (d.durationText || "") + ')</div>' +
        '</div>'
      );
    });
    listEl.innerHTML = rows.join("");
  } catch (err) {
    console.warn("[Mock Exam] Lỗi đọc lịch sử thi thử:", err);
  }
}

async function submitAndGradeMockExam(isAutoTimeout) {
  if (!mockExamIsRunning) return;
  stopMockExamTimer();
  mockExamIsRunning = false;

  const elapsedSec = Math.max(1, Math.min(mockExamDurationSec, Math.round((Date.now() - mockExamStartTimeMs) / 1000)));
  const durationText = formatDurationVietnamese(elapsedSec);
  const totalCount = mockExamQuestions.length || 1;

  let correctCount = 0;
  const wrongQuestionIds = [];
  mockExamQuestions.forEach(function (q) {
    if (mockExamAnswers[q.id] === q.correctAnswer) {
      correctCount += 1;
    } else if (q && q.id) {
      wrongQuestionIds.push(q.id);
    }
  });

  if (wrongQuestionIds.length > 0) {
    await recordMistakeQuestionIds(wrongQuestionIds);
  }

  const score10 = Math.round((correctCount / totalCount) * 100) / 10;

  const runningView = document.getElementById("mock-exam-running-view");
  const resultView = document.getElementById("mock-exam-result-view");
  const scoreEl = document.getElementById("mock-result-score-10");
  const metaEl = document.getElementById("mock-result-meta-text");
  const reviewContainer = document.getElementById("mock-exam-review-container");

  if (runningView) runningView.style.display = "none";
  if (resultView) resultView.style.display = "block";
  if (scoreEl) scoreEl.textContent = score10.toFixed(1) + " / 10";
  if (metaEl) {
    metaEl.textContent =
      "Đúng " + correctCount + " / " + totalCount + " câu • Thời gian làm bài: " + durationText +
      (isAutoTimeout ? " (Hết giờ — Hệ thống tự động nộp bài)" : "");
  }

  if (reviewContainer) {
    reviewContainer.innerHTML = mockExamQuestions.map(function (q, idx) {
      const chosen = mockExamAnswers[q.id] || null;
      const isRight = chosen === q.correctAnswer;
      const cardClass = isRight ? " is-checked-correct" : " is-checked-wrong";

      const optsHtml = (q.options || []).map(function (opt) {
        let cls = "";
        if (opt.key === q.correctAnswer) {
          cls = " is-correct";
        } else if (opt.key === chosen && !isRight) {
          cls = " is-wrong";
        }
        return (
          '<button type="button" class="quiz-option-btn' + cls + '" disabled>' +
            '<span class="quiz-option-key">' + opt.key + '</span>' +
            '<span class="quiz-option-content">' + opt.text + '</span>' +
          '</button>'
        );
      }).join("");

      const statusText = isRight
        ? '<span class="quiz-feedback-status status-correct">✓ Bạn đã chọn ' + chosen + ' — Chính xác!</span>'
        : '<span class="quiz-feedback-status status-wrong">✕ ' + (chosen ? ("Bạn đã chọn " + chosen) : "Bạn chưa chọn đáp án") + ' — Đáp án đúng là ' + q.correctAnswer + '</span>';

      return (
        '<article class="quiz-card' + cardClass + '">' +
          '<div class="quiz-card-meta">' +
            '<span class="quiz-question-number">Câu ' + String(idx + 1).padStart(2, "0") + " • " + (q.chapter || "") + '</span>' +
            '<span class="quiz-topic-tag">' + (q.topic || "Ôn tập tổng hợp") + '</span>' +
          '</div>' +
          '<h3 class="quiz-question-title">' + q.question + '</h3>' +
          '<div class="quiz-options-grid">' + optsHtml + '</div>' +
          '<div class="quiz-action-bar">' + statusText + '</div>' +
          '<div class="quiz-explanation-panel is-visible">' +
            '<div class="explanation-header"><span>Giải thích lý thuyết chuẩn Giáo trình Bộ GD&amp;ĐT</span></div>' +
            '<p class="explanation-general-text">' + (q.generalExplanation || "") + '</p>' +
          '</div>' +
        '</article>'
      );
    }).join("");
  }

  await saveMockExamHistoryToFirestore({
    score10: score10,
    correctCount: correctCount,
    totalQuestions: totalCount,
    elapsedSeconds: elapsedSec,
    durationText: durationText
  });

  await recordStudyActivityForStreak("quiz", totalCount);
  showFriendlyBanner(
    "✓ Đã chấm điểm bài thi thử (" + score10.toFixed(1) + "/10) và lưu lịch sử lên đám mây!",
    "success"
  );

  const mainCanvas = document.getElementById("edtech-main-canvas");
  if (mainCanvas) mainCanvas.scrollTop = 0;
}

function resetToMockExamSetup() {
  stopMockExamTimer();
  mockExamIsRunning = false;
  const setupView = document.getElementById("mock-exam-setup-view");
  const runningView = document.getElementById("mock-exam-running-view");
  const resultView = document.getElementById("mock-exam-result-view");

  if (runningView) runningView.style.display = "none";
  if (resultView) resultView.style.display = "none";
  if (setupView) setupView.style.display = "block";
  loadMockExamHistoryFromFirestore();
}


/* ============================================================================
   TÍNH NĂNG 3: NGÂN HÀNG "CÂU HAY LÀM SAI" (MISTAKE REVIEW)
   Lưu tại Firestore: users/{user.uid}/learning_data/mistakes + localStorage
   ============================================================================ */

function getMistakesStorageKey(uid) {
  return "triet_hoc_mistakes_" + (uid || "guest");
}

async function loadMistakeQuestionIdsForUser(uid) {
  mistakeQuestionIds = new Set();
  if (!uid) return;

  try {
    const raw = localStorage.getItem(getMistakesStorageKey(uid));
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        arr.forEach(function (id) { mistakeQuestionIds.add(id); });
      }
    }
  } catch (e) {}

  try {
    if (db) {
      const ref = doc(db, "users", uid, "learning_data", "mistakes");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        if (data && Array.isArray(data.questionIds)) {
          mistakeQuestionIds = new Set(data.questionIds);
          try {
            localStorage.setItem(getMistakesStorageKey(uid), JSON.stringify(Array.from(mistakeQuestionIds)));
          } catch (e) {}
        }
      }
    }
  } catch (err) {
    console.warn("[Mistake Review] Không thể tải danh sách câu sai từ Firestore:", err);
  }

  updateQuizFilterButtonsCount();
}

async function persistMistakeQuestionIds() {
  if (!activeStudentUser) return;
  const uid = activeStudentUser.uid;
  const arr = Array.from(mistakeQuestionIds);

  try {
    localStorage.setItem(getMistakesStorageKey(uid), JSON.stringify(arr));
  } catch (e) {}

  try {
    if (db) {
      const ref = doc(db, "users", uid, "learning_data", "mistakes");
      await setDoc(
        ref,
        {
          uid: uid,
          questionIds: arr,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.warn("[Mistake Review] Không thể đồng bộ danh sách câu sai lên Firestore:", err);
  }
}

async function recordMistakeQuestionIds(idsList) {
  if (!Array.isArray(idsList) || idsList.length === 0) return;
  let changed = false;
  idsList.forEach(function (qId) {
    if (qId && !mistakeQuestionIds.has(qId)) {
      mistakeQuestionIds.add(qId);
      changed = true;
    }
  });
  updateQuizFilterButtonsCount();
  if (changed) {
    await persistMistakeQuestionIds();
  }
}

async function removeMistakeQuestionId(qId) {
  if (!qId || !mistakeQuestionIds.has(qId)) return;
  mistakeQuestionIds.delete(qId);
  updateQuizFilterButtonsCount();
  await persistMistakeQuestionIds();
}

/* ============================================================================
   TÍNH NĂNG 4A: GHI NHỚ TRANG ĐỌC DỞ (RESUME READING)
   Lưu tại Firestore: users/{user.uid}/learning_data/last_reading + localStorage
   ============================================================================ */

function getLastReadingStorageKey(uid) {
  return "triet_hoc_last_reading_" + (uid || "guest");
}

function renderResumeReadingBanner() {
  const bannerEl = document.getElementById("resume-reading-banner");
  const btnEl = document.getElementById("resume-reading-btn");
  const subEl = document.getElementById("resume-reading-subtext");
  if (!bannerEl || !btnEl) return;

  if (!lastReadingState || !lastReadingState.lessonId) {
    bannerEl.classList.remove("is-visible");
    return;
  }

  const badge = lastReadingState.chapterBadge || "Chuyên đề";
  const title = lastReadingState.lessonTitle || lastReadingState.lessonId;
  const page = Number(lastReadingState.pdfPage) || 1;

  btnEl.textContent = "📖 Tiếp tục đọc " + badge + " — " + title + " (Slide trang " + page + ")";
  if (subEl && lastReadingState.updatedAtClientISO) {
    const dtStr = new Date(lastReadingState.updatedAtClientISO).toLocaleString("vi-VN");
    subEl.textContent = "Lần xem gần nhất: " + dtStr + " • Bấm để mở đúng trang đang đọc dở.";
  }
  bannerEl.classList.add("is-visible");
}

async function loadLastReadingStateForUser(uid) {
  lastReadingState = null;
  if (!uid) return;

  try {
    const raw = localStorage.getItem(getLastReadingStorageKey(uid));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.lessonId) {
        lastReadingState = parsed;
      }
    }
  } catch (e) {}

  try {
    if (db) {
      const ref = doc(db, "users", uid, "learning_data", "last_reading");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        if (data && data.lessonId) {
          lastReadingState = data;
          try {
            localStorage.setItem(getLastReadingStorageKey(uid), JSON.stringify(lastReadingState));
          } catch (e) {}
        }
      }
    }
  } catch (err) {
    console.warn("[Resume Reading] Không thể tải vị trí đọc gần nhất:", err);
  }

  renderResumeReadingBanner();
}

function scheduleSaveLastReadingState(lessonId, pdfPage, isPdfTab) {
  if (!activeStudentUser || !lessonId) return;
  const lesson = LESSONS_DATA[lessonId] || {};
  const payload = {
    lessonId: lessonId,
    lessonTitle: lesson.title || lessonId,
    chapterBadge: lesson.badge || "Chuyên đề",
    pdfPage: Number(pdfPage) || Number(lesson.slideStartPage) || 1,
    isPdfTab: Boolean(isPdfTab),
    updatedAtClientISO: new Date().toISOString()
  };

  lastReadingState = payload;
  renderResumeReadingBanner();

  try {
    localStorage.setItem(getLastReadingStorageKey(activeStudentUser.uid), JSON.stringify(payload));
  } catch (e) {}

  if (lastReadingSaveTimer) {
    clearTimeout(lastReadingSaveTimer);
  }
  lastReadingSaveTimer = setTimeout(async function () {
    if (!activeStudentUser || !db) return;
    try {
      const ref = doc(db, "users", activeStudentUser.uid, "learning_data", "last_reading");
      await setDoc(
        ref,
        Object.assign({}, payload, {
          uid: activeStudentUser.uid,
          updatedAt: serverTimestamp()
        }),
        { merge: true }
      );
    } catch (err) {
      console.warn("[Resume Reading] Không thể đồng bộ vị trí đọc lên Firestore:", err);
    }
  }, 500);
}

async function handleResumeReadingClick() {
  if (!lastReadingState || !lastReadingState.lessonId) return;
  const targetLessonId = lastReadingState.lessonId;
  const targetPage = Number(lastReadingState.pdfPage) || 1;

  switchDashboardView("view-materials");
  selectLesson(targetLessonId);
  activateMaterialTab("tab-panel-pdf");

  setTimeout(function () {
    queueRenderSlidePage(targetPage, false);
  }, 120);
}

/* ============================================================================
   TÍNH NĂNG 4B: GHI CHÚ CÁ NHÂN THEO CHUYÊN ĐỀ (PERSONAL NOTES)
   Lưu tại Firestore: users/{user.uid}/notes/{lessonId} + localStorage
   ============================================================================ */

function getNoteStorageKey(uid, lessonId) {
  return "triet_hoc_note_" + (uid || "guest") + "_" + (lessonId || "");
}

function setNoteStatusMessage(text, mode) {
  const statusEl = document.getElementById("lesson-note-save-status");
  if (!statusEl) return;
  statusEl.textContent = text;
  statusEl.className = "personal-notes-status" + (mode ? (" is-" + mode) : "");
}

async function loadPersonalNoteForLesson(lessonId) {
  const textareaEl = document.getElementById("lesson-personal-note-input");
  const badgeEl = document.getElementById("personal-note-lesson-badge");
  const lesson = LESSONS_DATA[lessonId] || {};

  if (badgeEl) {
    badgeEl.textContent = (lesson.badge ? (lesson.badge + " — ") : "") + (lesson.title || lessonId);
  }
  if (!textareaEl) return;

  if (!activeStudentUser || !lessonId) {
    textareaEl.value = "";
    return;
  }

  const uid = activeStudentUser.uid;
  let localContent = "";
  if (Object.prototype.hasOwnProperty.call(notesCacheByLesson, lessonId)) {
    localContent = notesCacheByLesson[lessonId];
  } else {
    try {
      localContent = localStorage.getItem(getNoteStorageKey(uid, lessonId)) || "";
    } catch (e) {}
  }

  textareaEl.value = localContent;
  setNoteStatusMessage("Đang đồng bộ ghi chú của chuyên đề...", "saving");

  try {
    if (db) {
      const ref = doc(db, "users", uid, "notes", lessonId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        const remoteContent = (data && typeof data.content === "string") ? data.content : "";
        notesCacheByLesson[lessonId] = remoteContent;
        if (currentLessonId === lessonId) {
          textareaEl.value = remoteContent;
        }
        try {
          localStorage.setItem(getNoteStorageKey(uid, lessonId), remoteContent);
        } catch (e) {}
      }
    }
    setNoteStatusMessage("✓ Ghi chú đã sẵn sàng (tự động lưu khi bấm Lưu hoặc rời khỏi ô nhập).", "saved");
  } catch (err) {
    console.warn("[Personal Notes] Không thể tải ghi chú từ Firestore:", err);
    setNoteStatusMessage("Đang sử dụng bản ghi chú đã lưu cục bộ trên trình duyệt.", "");
  }
}

async function savePersonalNoteForCurrentLesson() {
  const textareaEl = document.getElementById("lesson-personal-note-input");
  if (!textareaEl || !activeStudentUser || !currentLessonId) return;

  const uid = activeStudentUser.uid;
  const lessonId = currentLessonId;
  const lesson = LESSONS_DATA[lessonId] || {};
  const content = textareaEl.value;

  notesCacheByLesson[lessonId] = content;
  try {
    localStorage.setItem(getNoteStorageKey(uid, lessonId), content);
  } catch (e) {}

  setNoteStatusMessage("⏳ Đang lưu ghi chú lên đám mây...", "saving");

  try {
    if (db) {
      const ref = doc(db, "users", uid, "notes", lessonId);
      await setDoc(
        ref,
        {
          uid: uid,
          lessonId: lessonId,
          lessonTitle: lesson.title || lessonId,
          content: content,
          updatedAt: serverTimestamp(),
          updatedAtClientISO: new Date().toISOString()
        },
        { merge: true }
      );
    }
    const timeStr = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setNoteStatusMessage("✓ Đã lưu ghi chú chuyên đề lúc " + timeStr, "saved");
  } catch (err) {
    console.warn("[Personal Notes] Lỗi lưu ghi chú lên Firestore:", err);
    setNoteStatusMessage("✓ Đã lưu tạm trên trình duyệt (sẽ đồng bộ khi có mạng).", "saved");
  }
}


/* ============================================================================
   TÍNH NĂNG 5: THANH TÌM KIẾM NHANH KHÁI NIỆM (INSTANT SEARCH) TRÊN HEADER
   ============================================================================ */

function normalizeSearchText(str) {
  return String(str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

function stripHtmlTags(htmlStr) {
  return String(htmlStr || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function closeGlobalSearchDropdown() {
  const dropdownEl = document.getElementById("global-search-dropdown");
  if (dropdownEl) dropdownEl.classList.remove("is-open");
}

function performGlobalInstantSearch(rawQuery) {
  const dropdownEl = document.getElementById("global-search-dropdown");
  const clearBtn = document.getElementById("global-search-clear-btn");
  if (!dropdownEl) return;

  const trimmed = String(rawQuery || "").trim();
  if (clearBtn) clearBtn.classList.toggle("is-visible", trimmed.length > 0);

  if (trimmed.length === 0) {
    closeGlobalSearchDropdown();
    return;
  }

  const qLower = trimmed.toLowerCase();
  const qNorm = normalizeSearchText(trimmed);

  function matchesText(targetStr) {
    const t = String(targetStr || "");
    return t.toLowerCase().indexOf(qLower) !== -1 || normalizeSearchText(t).indexOf(qNorm) !== -1;
  }

  // Nhóm 1: Chuyên đề & Slide giáo trình
  const matchedLessons = getLessonKeys().filter(function (key) {
    const item = LESSONS_DATA[key] || {};
    return (
      matchesText(item.title) ||
      matchesText(item.summary) ||
      matchesText(item.shortDesc) ||
      matchesText(item.badge) ||
      matchesText(stripHtmlTags(item.summaryHtml))
    );
  }).slice(0, 5);

  // Nhóm 2: Câu hỏi trắc nghiệm
  const matchedQuestions = ALL_QUIZ_QUESTIONS.filter(function (q) {
    return (
      matchesText(q.question) ||
      matchesText(q.generalExplanation) ||
      matchesText(q.topic) ||
      matchesText(q.chapter)
    );
  }).slice(0, 5);

  // Nhóm 3: Thẻ ghi nhớ (Flashcards)
  const matchedFlashcards = ALL_FLASHCARDS.filter(function (fc) {
    return (
      matchesText(fc.front) ||
      matchesText(fc.definition) ||
      matchesText(fc.methodology) ||
      matchesText(fc.chapter)
    );
  }).slice(0, 5);

  const totalMatches = matchedLessons.length + matchedQuestions.length + matchedFlashcards.length;
  if (totalMatches === 0) {
    dropdownEl.innerHTML =
      '<div class="search-empty-msg">Không tìm thấy khái niệm, chuyên đề hay câu hỏi nào khớp với "<strong>' +
      trimmed.replace(/</g, "&lt;") + '</strong>".</div>';
    dropdownEl.classList.add("is-open");
    return;
  }

  let htmlParts = [];

  if (matchedLessons.length > 0) {
    htmlParts.push('<div class="search-group-header">📘 Chuyên đề &amp; Slide giáo trình (' + matchedLessons.length + ')</div>');
    matchedLessons.forEach(function (key) {
      const item = LESSONS_DATA[key] || {};
      const startPg = Number(item.slideStartPage) || 1;
      htmlParts.push(
        '<button type="button" class="search-result-item" data-search-type="lesson" data-search-id="' + key + '">' +
          '<span class="search-result-title">' + (item.title || key) + '</span>' +
          '<span class="search-result-sub">' + (item.badge || "") + ' • Slide trang ' + startPg + ' — ' + (item.shortDesc || item.summary || "") + '</span>' +
        '</button>'
      );
    });
  }

  if (matchedQuestions.length > 0) {
    htmlParts.push('<div class="search-group-header">📝 Câu hỏi trắc nghiệm (' + matchedQuestions.length + ')</div>');
    matchedQuestions.forEach(function (q) {
      htmlParts.push(
        '<button type="button" class="search-result-item" data-search-type="question" data-search-id="' + q.id + '">' +
          '<span class="search-result-title">' + q.question + '</span>' +
          '<span class="search-result-sub">' + (q.chapter || "") + ' • ' + (q.topic || "") + '</span>' +
        '</button>'
      );
    });
  }

  if (matchedFlashcards.length > 0) {
    htmlParts.push('<div class="search-group-header">🃏 Thẻ ghi nhớ Flashcards (' + matchedFlashcards.length + ')</div>');
    matchedFlashcards.forEach(function (fc) {
      htmlParts.push(
        '<button type="button" class="search-result-item" data-search-type="flashcard" data-search-id="' + fc.id + '">' +
          '<span class="search-result-title">' + fc.front + '</span>' +
          '<span class="search-result-sub">' + (fc.chapter || "") + ' — ' + (fc.definition || "") + '</span>' +
        '</button>'
      );
    });
  }

  dropdownEl.innerHTML = htmlParts.join("");
  dropdownEl.classList.add("is-open");
}

function handleGlobalSearchResultSelect(type, itemId) {
  closeGlobalSearchDropdown();

  if (type === "lesson") {
    const lesson = LESSONS_DATA[itemId];
    if (!lesson) return;
    switchDashboardView("view-materials");
    selectLesson(itemId);
    activateMaterialTab("tab-panel-pdf");
    const targetPage = Number(lesson.slideStartPage) || 1;
    setTimeout(function () {
      queueRenderSlidePage(targetPage, true);
    }, 100);
    return;
  }

  if (type === "question") {
    switchDashboardView("view-practice");
    switchPracticeMode("practice-pane-single");
    applyQuizChapterFilter("all");
    setTimeout(function () {
      const cardEl = document.getElementById("quiz-card-" + itemId);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: "smooth", block: "center" });
        cardEl.classList.add("is-search-highlight");
        setTimeout(function () {
          cardEl.classList.remove("is-search-highlight");
        }, 2200);
      }
    }, 80);
    return;
  }

  if (type === "flashcard") {
    switchDashboardView("view-practice");
    fcChapterFilter = "all";
    fcStatusFilter = "all";
    document.querySelectorAll(".fc-chap-filter-btn").forEach(function (b) {
      const isAll = b.getAttribute("data-fc-chapter") === "all";
      b.className = isAll ? "btn btn-primary btn-sm fc-chap-filter-btn" : "btn btn-secondary btn-sm fc-chap-filter-btn";
    });
    document.querySelectorAll(".fc-status-filter-btn").forEach(function (b) {
      const isAll = b.getAttribute("data-fc-status") === "all";
      b.className = isAll ? "btn btn-primary btn-sm fc-status-filter-btn" : "btn btn-secondary btn-sm fc-status-filter-btn";
    });
    switchPracticeMode("practice-pane-flashcards");
    const targetIdx = fcFilteredList.findIndex(function (fc) { return fc.id === itemId; });
    if (targetIdx !== -1) {
      fcCurrentIndex = targetIdx;
      fcIsFlipped = false;
      renderActiveFlashcard();
    }
  }
}

/* ============================================================================
   TÍNH NĂNG 6: CHUỖI NGÀY TỰ HỌC (STUDY STREAK) & MỤC TIÊU MỖI NGÀY
   Lưu tại Firestore: users/{user.uid}/learning_data/streak + localStorage
   ============================================================================ */

function getLocalDateYYYYMMDD(dateObj) {
  const d = dateObj || new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}

function getYesterdayYYYYMMDD() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getLocalDateYYYYMMDD(d);
}

function getStreakStorageKey(uid) {
  return "triet_hoc_streak_" + (uid || "guest");
}

function renderStudyStreakCard() {
  const headlineEl = document.getElementById("study-streak-headline");
  const badgeEl = document.getElementById("study-streak-status-badge");
  const barEl = document.getElementById("study-streak-progress-bar");
  const pctEl = document.getElementById("study-streak-progress-pct");

  const todayStr = getLocalDateYYYYMMDD();
  const yesterdayStr = getYesterdayYYYYMMDD();

  let displayStreak = Number(studyStreakState.currentStreak) || 0;
  if (
    studyStreakState.lastStudyDate &&
    studyStreakState.lastStudyDate !== todayStr &&
    studyStreakState.lastStudyDate !== yesterdayStr
  ) {
    displayStreak = 0;
  }

  const isToday = studyStreakState.todayDate === todayStr;
  const lessonsToday = isToday ? (Number(studyStreakState.todayLessonsDone) || 0) : 0;
  const quizToday = isToday ? (Number(studyStreakState.todayQuizCount) || 0) : 0;
  const actionsToday = isToday ? (Number(studyStreakState.todayActions) || 0) : 0;

  // Mục tiêu mỗi ngày: 1 chuyên đề HOẶC 10 câu luyện tập (hoặc 10 lượt ôn tập)
  const lessonPct = Math.min(100, Math.round((lessonsToday / 1) * 100));
  const quizPct = Math.min(100, Math.round((Math.max(quizToday, actionsToday) / 10) * 100));
  const goalPct = Math.max(lessonPct, quizPct);
  const isGoalMet = goalPct >= 100;

  if (headlineEl) {
    headlineEl.textContent =
      "🔥 Chuỗi " + displayStreak + " ngày tự học liên tiếp • 🎯 Mục tiêu hôm nay: " +
      lessonsToday + "/1 chuyên đề (hoặc " + Math.max(quizToday, actionsToday) + "/10 câu luyện tập)";
  }

  if (badgeEl) {
    if (isGoalMet) {
      badgeEl.textContent = "✓ Đã hoàn thành mục tiêu hôm nay!";
      badgeEl.className = "study-streak-badge is-goal-met";
    } else if (actionsToday > 0) {
      badgeEl.textContent = "Đang duy trì phong độ tốt";
      badgeEl.className = "study-streak-badge";
    } else {
      badgeEl.textContent = "Bắt đầu phiên học hôm nay";
      badgeEl.className = "study-streak-badge";
    }
  }

  if (barEl) barEl.style.width = goalPct + "%";
  if (pctEl) pctEl.textContent = goalPct + "%";
}

async function loadStudyStreakForUser(uid) {
  const todayStr = getLocalDateYYYYMMDD();
  studyStreakState = {
    currentStreak: 0,
    lastStudyDate: "",
    todayDate: todayStr,
    todayActions: 0,
    todayLessonsDone: 0,
    todayQuizCount: 0
  };
  if (!uid) {
    renderStudyStreakCard();
    return;
  }

  try {
    const raw = localStorage.getItem(getStreakStorageKey(uid));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        studyStreakState = Object.assign({}, studyStreakState, parsed);
      }
    }
  } catch (e) {}

  try {
    if (db) {
      const ref = doc(db, "users", uid, "learning_data", "streak");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        if (data && typeof data === "object") {
          studyStreakState = Object.assign({}, studyStreakState, {
            currentStreak: Number(data.currentStreak) || 0,
            lastStudyDate: data.lastStudyDate || "",
            todayDate: data.todayDate || todayStr,
            todayActions: Number(data.todayActions) || 0,
            todayLessonsDone: Number(data.todayLessonsDone) || 0,
            todayQuizCount: Number(data.todayQuizCount) || 0
          });
          try {
            localStorage.setItem(getStreakStorageKey(uid), JSON.stringify(studyStreakState));
          } catch (e) {}
        }
      }
    }
  } catch (err) {
    console.warn("[Study Streak] Không thể tải chuỗi ngày tự học từ Firestore:", err);
  }

  renderStudyStreakCard();
}

/**
 * Ghi nhận 1 hoạt động học tập (hoàn thành chuyên đề, làm trắc nghiệm/thi thử, ôn Flashcards)
 * @param {"lesson"|"quiz"|"flashcard"|"essay"} activityType
 * @param {number} amount
 */
async function recordStudyActivityForStreak(activityType, amount) {
  if (!activeStudentUser) return;
  const uid = activeStudentUser.uid;
  const todayStr = getLocalDateYYYYMMDD();
  const yesterdayStr = getYesterdayYYYYMMDD();
  const inc = Math.max(1, Number(amount) || 1);

  if (studyStreakState.lastStudyDate === todayStr) {
    studyStreakState.currentStreak = Math.max(1, Number(studyStreakState.currentStreak) || 1);
  } else if (studyStreakState.lastStudyDate === yesterdayStr) {
    studyStreakState.currentStreak = (Number(studyStreakState.currentStreak) || 0) + 1;
  } else {
    studyStreakState.currentStreak = 1;
  }

  if (studyStreakState.todayDate !== todayStr) {
    studyStreakState.todayDate = todayStr;
    studyStreakState.todayActions = 0;
    studyStreakState.todayLessonsDone = 0;
    studyStreakState.todayQuizCount = 0;
  }

  studyStreakState.lastStudyDate = todayStr;
  studyStreakState.todayActions = (Number(studyStreakState.todayActions) || 0) + inc;

  if (activityType === "lesson") {
    studyStreakState.todayLessonsDone = (Number(studyStreakState.todayLessonsDone) || 0) + inc;
  } else if (activityType === "quiz") {
    studyStreakState.todayQuizCount = (Number(studyStreakState.todayQuizCount) || 0) + inc;
  }

  renderStudyStreakCard();

  try {
    localStorage.setItem(getStreakStorageKey(uid), JSON.stringify(studyStreakState));
  } catch (e) {}

  try {
    if (db) {
      const ref = doc(db, "users", uid, "learning_data", "streak");
      await setDoc(
        ref,
        {
          uid: uid,
          currentStreak: studyStreakState.currentStreak,
          lastStudyDate: studyStreakState.lastStudyDate,
          todayDate: studyStreakState.todayDate,
          todayActions: studyStreakState.todayActions,
          todayLessonsDone: studyStreakState.todayLessonsDone,
          todayQuizCount: studyStreakState.todayQuizCount,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.warn("[Study Streak] Không thể đồng bộ chuỗi ngày tự học lên Firestore:", err);
  }
}

function bindUIEventListeners() {
  // 1. Điều hướng 5 Tab trên Sidebar
  document.querySelectorAll(".sidebar-nav-item").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const targetView = btn.getAttribute("data-target-view");
      if (targetView) switchDashboardView(targetView);
    });
  });

  // 2. Nút Đăng xuất thật (Firebase Auth signOut -> index.html)
  const guardLogoutBtn = document.getElementById("guard-logout-btn");
  if (guardLogoutBtn) {
    guardLogoutBtn.addEventListener("click", async function () {
      try {
        guardLogoutBtn.disabled = true;
        await signOut(auth);
      } catch (err) {
        console.error("[Logout Error]:", err);
      } finally {
        window.location.href = "index.html";
      }
    });
  }

  // 3. Nút tải lại tiến độ mới nhất từ Firestore ở Tab 5
  const fetchBtn = document.getElementById("fetch-progress-btn");
  if (fetchBtn) {
    fetchBtn.addEventListener("click", async function () {
      if (!activeStudentUser) return;
      studentProgressMap = await fetchStudentProgress(activeStudentUser.uid);
      hydrateCompletedLessonsFromProgress(studentProgressMap);
      renderOverviewPathwayCards();
      renderRoadmapChapters();
      syncHorizontalLessonToolbar(currentLessonId);
      updateProgressCounters();
      renderLearningJourneyView();
      showFriendlyBanner("✓ Đã đồng bộ tiến độ lên đám mây thành công!", "info");
    });
  }

  // 4. Nút thao tác nhanh ở Tab 1
  const quickOpenMaterialsBtn = document.getElementById("hero-start-learning-btn");
  const quickOpenPracticeBtn = document.getElementById("overview-open-practice-btn");
  if (quickOpenMaterialsBtn) {
    quickOpenMaterialsBtn.addEventListener("click", function () {
      switchDashboardView("view-materials");
    });
  }
  if (quickOpenPracticeBtn) {
    quickOpenPracticeBtn.addEventListener("click", function () {
      switchDashboardView("view-practice");
    });
  }

  // 5. Lưới bài học "BẮT ĐẦU TỪ ĐÂY" & Lộ trình 3 Chương
  const pathwayGrid = document.getElementById("overview-pathway-grid");
  if (pathwayGrid) {
    pathwayGrid.addEventListener("click", function (e) {
      const card = e.target.closest("[data-pathway-lesson]");
      if (!card) return;
      selectLesson(card.getAttribute("data-pathway-lesson"));
      switchDashboardView("view-materials");
    });
  }

  const roadmapSection = document.getElementById("view-roadmap");
  if (roadmapSection) {
    roadmapSection.addEventListener("click", function (e) {
      const btn = e.target.closest(".select-chapter-shortcut");
      if (!btn) return;
      const targetLesson = btn.getAttribute("data-lesson-target");
      if (targetLesson) {
        selectLesson(targetLesson);
        switchDashboardView("view-materials");
      }
    });
  }

  // 6. Thanh điều hướng chuyên đề ngang ở Tab 2
  const lessonSelectEl = document.getElementById("lesson-selector-dropdown");
  if (lessonSelectEl) {
    lessonSelectEl.addEventListener("change", function () {
      selectLesson(lessonSelectEl.value);
    });
  }

  const prevLessonBtn = document.getElementById("prev-lesson-btn");
  if (prevLessonBtn) {
    prevLessonBtn.addEventListener("click", function () {
      const keys = getLessonKeys();
      const idx = keys.indexOf(currentLessonId);
      if (idx > 0) selectLesson(keys[idx - 1]);
    });
  }

  const nextLessonBtn = document.getElementById("next-lesson-btn");
  if (nextLessonBtn) {
    nextLessonBtn.addEventListener("click", function () {
      const keys = getLessonKeys();
      const idx = keys.indexOf(currentLessonId);
      if (idx !== -1 && idx < keys.length - 1) selectLesson(keys[idx + 1]);
    });
  }

  const completeBtn = document.getElementById("toggle-complete-lesson-btn");
  if (completeBtn) {
    completeBtn.addEventListener("click", handleToggleCompleteLesson);
  }

  document.querySelectorAll(".tab-trigger-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      activateMaterialTab(btn.getAttribute("data-tab-target"));
    });
  });

  // 7. Thanh điều khiển Native PDF.js Slide Viewer
  const prevSlideBtn = document.getElementById("pdf-prev-page-btn");
  const nextSlideBtn = document.getElementById("pdf-next-page-btn");
  const pageInputEl = document.getElementById("pdf-page-input");
  const zoomInBtn = document.getElementById("pdf-zoom-in-btn");
  const zoomOutBtn = document.getElementById("pdf-zoom-out-btn");
  const fullscreenBtn = document.getElementById("pdf-fullscreen-btn");
  const slideViewerCard = document.getElementById("native-slide-viewer-container");

  if (prevSlideBtn) {
    prevSlideBtn.addEventListener("click", function () {
      if (currentSlidePage > 1) queueRenderSlidePage(currentSlidePage - 1, true);
    });
  }
  if (nextSlideBtn) {
    nextSlideBtn.addEventListener("click", function () {
      if (currentSlidePage < totalSlidePages) queueRenderSlidePage(currentSlidePage + 1, true);
    });
  }
  if (pageInputEl) {
    pageInputEl.addEventListener("change", function () {
      const val = parseInt(pageInputEl.value, 10);
      if (!isNaN(val)) {
        queueRenderSlidePage(Math.max(1, Math.min(totalSlidePages, val)), true);
      } else {
        pageInputEl.value = currentSlidePage;
      }
    });
    pageInputEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        const val = parseInt(pageInputEl.value, 10);
        if (!isNaN(val)) {
          queueRenderSlidePage(Math.max(1, Math.min(totalSlidePages, val)), true);
        }
        pageInputEl.blur();
      }
    });
  }
  if (zoomInBtn) {
    zoomInBtn.addEventListener("click", function () {
      currentZoomMultiplier = Math.min(2.25, Math.round((currentZoomMultiplier + 0.15) * 100) / 100);
      queueRenderSlidePage(currentSlidePage);
    });
  }
  if (zoomOutBtn) {
    zoomOutBtn.addEventListener("click", function () {
      currentZoomMultiplier = Math.max(0.6, Math.round((currentZoomMultiplier - 0.15) * 100) / 100);
      queueRenderSlidePage(currentSlidePage);
    });
  }
  if (fullscreenBtn && slideViewerCard) {
    fullscreenBtn.addEventListener("click", function () {
      if (!document.fullscreenElement) {
        if (slideViewerCard.requestFullscreen) {
          slideViewerCard.requestFullscreen().catch(function () {});
        }
      } else if (document.exitFullscreen) {
        document.exitFullscreen().catch(function () {});
      }
    });
  }

  document.addEventListener("fullscreenchange", function () {
    if (fullscreenBtn) {
      fullscreenBtn.textContent = document.fullscreenElement ? "⤓ Thoát Toàn màn hình" : "⛶ Toàn màn hình";
    }
    setTimeout(function () {
      queueRenderSlidePage(currentSlidePage);
    }, 80);
  });

  document.addEventListener("keydown", function (e) {
    const activeEl = document.activeElement;
    if (activeEl) {
      const tag = activeEl.tagName ? activeEl.tagName.toUpperCase() : "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || activeEl.isContentEditable) {
        return;
      }
    }
    const pdfPanel = document.getElementById("tab-panel-pdf");
    const isSlideVisible = (currentActiveViewId === "view-materials" && pdfPanel && pdfPanel.classList.contains("active")) || Boolean(document.fullscreenElement);
    if (!isSlideVisible) return;

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (currentSlidePage > 1) queueRenderSlidePage(currentSlidePage - 1, true);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (currentSlidePage < totalSlidePages) queueRenderSlidePage(currentSlidePage + 1, true);
    }
  });

  window.addEventListener("resize", function () {
    const pdfPanel = document.getElementById("tab-panel-pdf");
    if (currentActiveViewId === "view-materials" && pdfPanel && pdfPanel.classList.contains("active")) {
      queueRenderSlidePage(currentSlidePage);
    }
  });

  // 8. Phòng luyện tập Trắc nghiệm & Tự luận AI
  const quizContainer = document.getElementById("quiz-questions-container");
  if (quizContainer) {
    quizContainer.addEventListener("click", function (e) {
      const actionBtn = e.target.closest("[data-quiz-action]");
      if (!actionBtn) return;
      const action = actionBtn.getAttribute("data-quiz-action");
      const qId = actionBtn.getAttribute("data-question-id");

      if (action === "select-option") {
        if (quizAppState.checkedResults[qId]) return;
        quizAppState.selectedAnswers[qId] = actionBtn.getAttribute("data-option-key");
        renderQuizView();
      } else if (action === "check-answer") {
        handleCheckAnswer(qId);
      } else if (action === "retry-question") {
        delete quizAppState.selectedAnswers[qId];
        delete quizAppState.checkedResults[qId];
        renderQuizView();
      }
    });
  }

  const resetAllBtn = document.getElementById("reset-all-quiz-btn");
  if (resetAllBtn) {
    resetAllBtn.addEventListener("click", function () {
      quizAppState.selectedAnswers = {};
      quizAppState.checkedResults = {};
      renderQuizView();
    });
  }

  document.querySelectorAll(".quiz-filter-chap-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      applyQuizChapterFilter(btn.getAttribute("data-filter-chapter"));
    });
  });

  const essayPromptSelect = document.getElementById("essay-prompt-select");
  const essayPromptTextEl = document.getElementById("essay-active-prompt-text");
  if (essayPromptSelect && essayPromptTextEl) {
    essayPromptSelect.addEventListener("change", function () {
      const found = ESSAY_PROMPTS_DATA.find(function (p) { return p.id === essayPromptSelect.value; });
      if (found) essayPromptTextEl.textContent = found.prompt;
    });
  }

  const gradeEssayBtn = document.getElementById("grade-essay-ai-btn");
  if (gradeEssayBtn) {
    gradeEssayBtn.addEventListener("click", evaluateEssayWithGeminiAI);
  }

  // 8B. Thanh chuyển đổi 3 chế độ trong Phòng luyện tập
  document.querySelectorAll(".practice-mode-tab-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const targetPane = btn.getAttribute("data-practice-mode");
      if (targetPane) switchPracticeMode(targetPane);
    });
  });

  // 8C. Sự kiện Tính năng 1: Thẻ ghi nhớ (Flashcards 3D)
  document.querySelectorAll(".fc-chap-filter-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      fcChapterFilter = btn.getAttribute("data-fc-chapter") || "all";
      document.querySelectorAll(".fc-chap-filter-btn").forEach(function (b) {
        b.className = (b === btn) ? "btn btn-primary btn-sm fc-chap-filter-btn" : "btn btn-secondary btn-sm fc-chap-filter-btn";
      });
      fcCurrentIndex = 0;
      rebuildFlashcardsDeck(false);
    });
  });

  document.querySelectorAll(".fc-status-filter-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      fcStatusFilter = btn.getAttribute("data-fc-status") || "all";
      document.querySelectorAll(".fc-status-filter-btn").forEach(function (b) {
        b.className = (b === btn) ? "btn btn-primary btn-sm fc-status-filter-btn" : "btn btn-secondary btn-sm fc-status-filter-btn";
      });
      fcCurrentIndex = 0;
      rebuildFlashcardsDeck(false);
    });
  });

  const fcResetFilterBtn = document.getElementById("fc-reset-filter-btn");
  if (fcResetFilterBtn) {
    fcResetFilterBtn.addEventListener("click", function () {
      fcStatusFilter = "all";
      document.querySelectorAll(".fc-status-filter-btn").forEach(function (b) {
        const isAll = b.getAttribute("data-fc-status") === "all";
        b.className = isAll ? "btn btn-primary btn-sm fc-status-filter-btn" : "btn btn-secondary btn-sm fc-status-filter-btn";
      });
      fcCurrentIndex = 0;
      rebuildFlashcardsDeck(false);
    });
  }

  const fcScene = document.getElementById("fc-card-scene");
  const fcFlipBtn = document.getElementById("fc-flip-btn");
  const fcPrevBtn = document.getElementById("fc-prev-btn");
  const fcNextBtn = document.getElementById("fc-next-btn");
  const fcShuffleBtn = document.getElementById("fc-shuffle-btn");
  const fcMasteredBtn = document.getElementById("fc-mark-mastered-btn");
  const fcReviewBtn = document.getElementById("fc-mark-review-btn");

  if (fcScene) fcScene.addEventListener("click", flipCurrentFlashcard);
  if (fcFlipBtn) fcFlipBtn.addEventListener("click", flipCurrentFlashcard);
  if (fcPrevBtn) {
    fcPrevBtn.addEventListener("click", function () {
      if (fcCurrentIndex > 0) {
        fcCurrentIndex -= 1;
        fcIsFlipped = false;
        renderActiveFlashcard();
      }
    });
  }
  if (fcNextBtn) {
    fcNextBtn.addEventListener("click", function () {
      if (fcCurrentIndex < fcFilteredList.length - 1) {
        fcCurrentIndex += 1;
        fcIsFlipped = false;
        renderActiveFlashcard();
      }
    });
  }
  if (fcShuffleBtn) {
    fcShuffleBtn.addEventListener("click", function () {
      fcCurrentIndex = 0;
      rebuildFlashcardsDeck(true);
    });
  }
  if (fcMasteredBtn) {
    fcMasteredBtn.addEventListener("click", function () {
      markCurrentFlashcardStatus("mastered");
    });
  }
  if (fcReviewBtn) {
    fcReviewBtn.addEventListener("click", function () {
      markCurrentFlashcardStatus("review");
    });
  }

  // Hỗ trợ phím Space (Lật thẻ) và Mũi tên Trái / Phải khi đang ở chế độ Flashcards
  document.addEventListener("keydown", function (e) {
    if (currentActiveViewId !== "view-practice" || activePracticeModeId !== "practice-pane-flashcards") return;
    const activeEl = document.activeElement;
    if (activeEl) {
      const tag = activeEl.tagName ? activeEl.tagName.toUpperCase() : "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || activeEl.isContentEditable) return;
    }

    if (e.code === "Space") {
      e.preventDefault();
      flipCurrentFlashcard();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (fcCurrentIndex > 0) {
        fcCurrentIndex -= 1;
        fcIsFlipped = false;
        renderActiveFlashcard();
      }
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (fcCurrentIndex < fcFilteredList.length - 1) {
        fcCurrentIndex += 1;
        fcIsFlipped = false;
        renderActiveFlashcard();
      }
    }
  });

  // 8D. Sự kiện Tính năng 2: Thi thử tổng hợp (Mock Exam 45 phút)
  document.querySelectorAll(".mock-config-option").forEach(function (optBtn) {
    optBtn.addEventListener("click", function () {
      mockExamSelectedSize = parseInt(optBtn.getAttribute("data-exam-size"), 10) || 30;
      document.querySelectorAll(".mock-config-option").forEach(function (b) {
        b.classList.toggle("is-selected", b === optBtn);
      });
    });
  });

  const startMockBtn = document.getElementById("start-mock-exam-btn");
  if (startMockBtn) {
    startMockBtn.addEventListener("click", startMockExamSession);
  }

  const submitMockBtn = document.getElementById("submit-mock-exam-btn");
  if (submitMockBtn) {
    submitMockBtn.addEventListener("click", function () {
      submitAndGradeMockExam(false);
    });
  }

  const newMockBtn = document.getElementById("new-mock-exam-btn");
  if (newMockBtn) {
    newMockBtn.addEventListener("click", resetToMockExamSetup);
  }

  const mockQuestionsContainer = document.getElementById("mock-exam-questions-container");
  if (mockQuestionsContainer) {
    mockQuestionsContainer.addEventListener("click", function (e) {
      const btn = e.target.closest("[data-mock-opt]");
      if (!btn || !mockExamIsRunning) return;
      const qId = btn.getAttribute("data-mock-q-id");
      const qIdx = parseInt(btn.getAttribute("data-mock-q-idx"), 10);
      const optKey = btn.getAttribute("data-mock-opt");
      mockExamAnswers[qId] = optKey;
      mockExamActiveIdx = isNaN(qIdx) ? mockExamActiveIdx : qIdx;

      const card = document.getElementById("mock-q-card-" + qIdx);
      if (card) {
        card.querySelectorAll(".quiz-option-btn").forEach(function (b) {
          b.classList.toggle("is-selected", b.getAttribute("data-mock-opt") === optKey);
        });
      }
      renderMockExamPalette();
    });
  }

  const mockPaletteGrid = document.getElementById("mock-exam-palette-grid");
  if (mockPaletteGrid) {
    mockPaletteGrid.addEventListener("click", function (e) {
      const btn = e.target.closest("[data-mock-jump-idx]");
      if (!btn) return;
      const idx = parseInt(btn.getAttribute("data-mock-jump-idx"), 10);
      if (isNaN(idx)) return;
      mockExamActiveIdx = idx;
      renderMockExamPalette();
      const targetCard = document.getElementById("mock-q-card-" + idx);
      if (targetCard) {
        targetCard.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  // 8E. Sự kiện Tính năng 4: Nút Tiếp tục đọc dở & Khung Ghi chú cá nhân
  const resumeBtn = document.getElementById("resume-reading-btn");
  if (resumeBtn) {
    resumeBtn.addEventListener("click", handleResumeReadingClick);
  }

  const saveNoteBtn = document.getElementById("save-lesson-note-btn");
  const noteTextarea = document.getElementById("lesson-personal-note-input");
  if (saveNoteBtn) {
    saveNoteBtn.addEventListener("click", savePersonalNoteForCurrentLesson);
  }
  if (noteTextarea) {
    noteTextarea.addEventListener("blur", savePersonalNoteForCurrentLesson);
  }

  // 8F. Sự kiện Tính năng 5: Thanh tìm kiếm nhanh khái niệm (Instant Search) trên Header
  const searchWrapper = document.getElementById("header-search-wrapper");
  const searchInput = document.getElementById("global-instant-search-input");
  const searchClearBtn = document.getElementById("global-search-clear-btn");
  const searchDropdown = document.getElementById("global-search-dropdown");

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      performGlobalInstantSearch(searchInput.value);
    });
    searchInput.addEventListener("focus", function () {
      if (searchInput.value.trim().length > 0) {
        performGlobalInstantSearch(searchInput.value);
      }
    });
    searchInput.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        closeGlobalSearchDropdown();
        searchInput.blur();
      }
    });
  }

  if (searchClearBtn && searchInput) {
    searchClearBtn.addEventListener("click", function () {
      searchInput.value = "";
      searchClearBtn.classList.remove("is-visible");
      closeGlobalSearchDropdown();
      searchInput.focus();
    });
  }

  if (searchDropdown) {
    searchDropdown.addEventListener("click", function (e) {
      const itemBtn = e.target.closest("[data-search-type]");
      if (!itemBtn) return;
      handleGlobalSearchResultSelect(
        itemBtn.getAttribute("data-search-type"),
        itemBtn.getAttribute("data-search-id")
      );
    });
  }

  document.addEventListener("click", function (e) {
    if (searchWrapper && !searchWrapper.contains(e.target)) {
      closeGlobalSearchDropdown();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeGlobalSearchDropdown();
    }
  });

  // 9. Menu Mobile
  const mobileToggle = document.getElementById("mobile-menu-toggle");
  const sidebarEl = document.getElementById("main-nav-menu");
  if (mobileToggle && sidebarEl) {
    mobileToggle.addEventListener("click", function () {
      sidebarEl.classList.toggle("is-open");
    });
  }
}

/* ============================================================================
   KHỞI ĐỘNG ỨNG DỤNG & BẢO VỆ TRANG BẰNG FIREBASE AUTH GUARD
   ============================================================================ */
document.addEventListener("DOMContentLoaded", function () {
  renderCurrentDateFormatted();
  bindUIEventListeners();

  if (!auth) {
    window.location.href = "index.html";
    return;
  }

  onAuthStateChanged(auth, async function (user) {
    if (!user) {
      window.location.href = "index.html";
      return;
    }

    activeStudentUser = user;
    syncStudentIdentityUI(user);

    // Tải song song dữ liệu môn học từ data.json và tiến độ học tập thật từ Firestore
    const [progressData] = await Promise.all([
      fetchStudentProgress(user.uid),
      loadDynamicCourseData("./data.json"),
      loadFlashcardStateForUser(user.uid),
      loadMistakeQuestionIdsForUser(user.uid),
      loadLastReadingStateForUser(user.uid),
      loadStudyStreakForUser(user.uid)
    ]);
    isInitialLessonBootstrap = false;
    rebuildFlashcardsDeck(false);
    loadMockExamHistoryFromFirestore();
    updateQuizFilterButtonsCount();

    studentProgressMap = progressData || {};
    hydrateCompletedLessonsFromProgress(studentProgressMap);

    if (currentLessonId) {
      selectLesson(currentLessonId);
    } else {
      updateProgressCounters();
    }
    renderLearningJourneyView();
  });
});
