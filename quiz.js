/**
 * ============================================================================
 * HỆ THỐNG E-LEARNING TRIẾT HỌC MÁC - LÊNIN
 * File: quiz.js
 * Nhiệm vụ: Tải ngân hàng câu hỏi từ data.json qua Fetch API, hiển thị giao diện
 *           trắc nghiệm, kiểm tra đáp án (Xanh: Đúng / Đỏ: Sai) và bung giải thích.
 * Kiến trúc: Các hàm đơn nhiệm (Modular Functions) dễ bảo trì và mở rộng.
 * ============================================================================
 */

// Dữ liệu dự phòng (Fallback) giúp trang vẫn hoạt động mượt nếu mở trực tiếp bằng giao thức file://
const FALLBACK_QUIZ_DATA = [
  {
    "id": "q_ch2_01",
    "chapter": "Chương 2: Chủ nghĩa duy vật biện chứng",
    "topic": "Vật chất và Ý thức",
    "difficulty": "Thông hiểu & Vận dụng",
    "question": "Theo quan điểm của Chủ nghĩa duy vật biện chứng, yếu tố nào đóng vai trò là nguồn gốc xã hội trực tiếp và quan trọng nhất quyết định sự hình thành và phát triển của ý thức con người?",
    "options": [
      {
        "key": "A",
        "text": "Sự phát triển hoàn thiện của bộ óc con người và hệ thần kinh trung ương qua hàng triệu năm tiến hóa sinh học."
      },
      {
        "key": "B",
        "text": "Hoạt động lao động thực tiễn và sự ra đời của ngôn ngữ trong mối quan hệ xã hội giữa con người với con người."
      },
      {
        "key": "C",
        "text": "Sự tác động trực tiếp của các hiện tượng tự nhiên khách quan lên năm giác quan của con người."
      },
      {
        "key": "D",
        "text": "Sự khai sáng của một lực lượng tinh thần tối cao hoặc ý niệm tuyệt đối tồn tại trước giới tự nhiên."
      }
    ],
    "correctAnswer": "B",
    "generalExplanation": "Theo Giáo trình Triết học Mác - Lênin (Bộ GD&ĐT, trang 152 - 159), ý thức có hai nguồn gốc là nguồn gốc tự nhiên và nguồn gốc xã hội. Trong đó, nguồn gốc tự nhiên (bộ óc người và thế giới khách quan) chỉ là điều kiện cần; còn nguồn gốc xã hội (bao gồm Lao động và Ngôn ngữ) mới là yếu tố quyết định trực tiếp nhất để chuyển biến bộ óc vượn thành bộ óc người và hình thành ý thức.",
    "optionExplanations": {
      "A": "SAI — Bộ óc con người và hệ thần kinh trung ương thuộc về nguồn gốc tự nhiên (tiền đề sinh học vật chất), không phải là nguồn gốc xã hội.",
      "B": "ĐÚNG — Thông qua lao động cải tạo tự nhiên, con người bộc lộ thuộc tính của sự vật và nảy sinh nhu cầu giao tiếp, dẫn tới sự ra đời của ngôn ngữ ('vỏ vật chất của tư duy'). Đây là nguồn gốc xã hội quyết định trực tiếp sự hình thành ý thức.",
      "C": "SAI — Thế giới khách quan tác động lên giác quan tạo ra sự phản ánh tâm lý mới chỉ thuộc về nguồn gốc tự nhiên của ý thức.",
      "D": "SAI — Đây là quan điểm của Chủ nghĩa duy tâm khách quan (như Hegel, Plato), hoàn toàn đối lập với Chủ nghĩa duy vật biện chứng."
    }
  },
  {
    "id": "q_ch2_02",
    "chapter": "Chương 2: Chủ nghĩa duy vật biện chứng",
    "topic": "Ba quy luật cơ bản của phép biện chứng duy vật",
    "difficulty": "Vận dụng cao",
    "question": "Một sinh viên chưa tích lũy đủ kiến thức nền tảng của môn học nhưng đã nôn nóng muốn làm ngay đề thi tổng hợp nâng cao dẫn đến kết quả thất bại. Dưới góc độ Quy luật chuyển hóa từ những sự thay đổi về lượng dẫn đến những sự thay đổi về chất và ngược lại, sai lầm này là biểu hiện của khuynh hướng nào?",
    "options": [
      {
        "key": "A",
        "text": "Khuynh hướng 'hữu khuynh' — bảo thủ, trì trệ, không dám thực hiện bước nhảy dù đã tích lũy đủ về lượng."
      },
      {
        "key": "B",
        "text": "Khuynh hướng 'tả khuynh' — chủ quan, nóng vội, muốn thực hiện bước nhảy về chất khi chưa tích lũy đủ về lượng tại điểm nút."
      },
      {
        "key": "C",
        "text": "Khuynh hướng 'chiết trung' — lắp ghép vô nguyên tắc các mặt đối lập mà không phân biệt đâu là mâu thuẫn cơ bản."
      },
      {
        "key": "D",
        "text": "Khuynh hướng 'phủ định sạch trơn' — bác bỏ hoàn toàn tri thức cũ mà không kế thừa những hạt nhân hợp lý."
      }
    ],
    "correctAnswer": "B",
    "generalExplanation": "Theo Giáo trình Triết học Mác - Lênin (Bộ GD&ĐT, trang 245 - 246), mọi sự thay đổi về chất chỉ có thể diễn ra khi sự tích lũy về lượng đã đạt tới giới hạn Điểm nút. Trong hoạt động nhận thức và thực tiễn, việc bất chấp quy luật Lượng - Chất thường dẫn tới hai sai lầm cực đoan là 'tả khuynh' (nôn nóng đốt cháy giai đoạn) hoặc 'hữu khuynh' (bảo thủ, do dự).",
    "optionExplanations": {
      "A": "SAI — 'Hữu khuynh' là sai lầm ngược lại: khi lượng đã tích lũy đủ đến điểm nút nhưng vẫn e dè, không dám thực hiện bước nhảy để chuyển hóa về chất.",
      "B": "ĐÚNG — 'Tả khuynh' là biểu hiện của bệnh chủ quan, duy ý chí, nôn nóng muốn có ngay sự biến đổi về chất (đạt điểm cao ở đề nâng cao) khi chưa kiên trì tích lũy đủ về lượng (kiến thức cơ bản từng chương).",
      "C": "SAI — Thuyết chiết trung là sai lầm khi vận dụng nguyên tắc toàn diện (Nguyên lý về mối liên hệ phổ biến), không phải nội dung của quy luật Lượng - Chất.",
      "D": "SAI — 'Phủ định sạch trơn' (phủ định siêu hình) là sai lầm khi vi phạm Quy luật phủ định của phủ định."
    }
  }
];

// Kho lưu trữ trạng thái phiên luyện tập (In-memory State)
const quizAppState = {
  questions: [],
  selectedAnswers: {},   // Lưu phương án sinh viên đang chọn: { [questionId]: "A" | "B" | "C" | "D" }
  checkedResults: {}     // Lưu kết quả sau khi bấm "Kiểm tra": { [questionId]: { isCorrect: boolean, chosen: string } }
};

/**
 * 1. Hàm đọc dữ liệu câu hỏi từ file data.json bằng Fetch API
 * @param {string} jsonPath - Đường dẫn tới file JSON ngân hàng câu hỏi
 * @returns {Promise<Array>} Danh sách câu hỏi trắc nghiệm
 */
async function fetchQuizQuestions(jsonPath) {
  try {
    const response = await fetch(jsonPath, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Không thể tải file dữ liệu câu hỏi (HTTP " + response.status + ")");
    }
    const questions = await response.json();
    return Array.isArray(questions) ? questions : FALLBACK_QUIZ_DATA;
  } catch (error) {
    // Khi chạy cục bộ không qua HTTP Server hoặc trong môi trường sandbox, sử dụng bản sao data.json chuẩn
    return FALLBACK_QUIZ_DATA;
  }
}

/**
 * 2. Hàm tạo chuỗi HTML cho từng thẻ câu hỏi trắc nghiệm
 * @param {Object} questionObj - Đối tượng câu hỏi từ data.json
 * @param {number} index - Số thứ tự câu hỏi (bắt đầu từ 0)
 * @returns {string} Chuỗi HTML của thẻ câu hỏi
 */
function buildQuestionCardMarkup(questionObj, index) {
  const qId = questionObj.id;
  const currentSelected = quizAppState.selectedAnswers[qId] || null;
  const checkedInfo = quizAppState.checkedResults[qId] || null;
  const isChecked = Boolean(checkedInfo);

  // Xác định class viền thẻ câu hỏi sau khi đã kiểm tra
  let cardStateClass = "";
  if (isChecked) {
    cardStateClass = checkedInfo.isCorrect ? " is-checked-correct" : " is-checked-wrong";
  }

  // Tạo danh sách các nút phương án A, B, C, D
  const optionsHtml = questionObj.options.map(function(opt) {
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

    const disabledAttr = isChecked ? " disabled" : "";

    return (
      '<button type="button" class="quiz-option-btn' + optionStateClass + '"' +
      ' data-quiz-action="select-option"' +
      ' data-question-id="' + qId + '"' +
      ' data-option-key="' + opt.key + '"' +
      disabledAttr + '>' +
        '<span class="quiz-option-key">' + opt.key + '</span>' +
        '<span class="quiz-option-content">' + opt.text + '</span>' +
      '</button>'
    );
  }).join("");

  // Tạo thông báo trạng thái Đúng / Sai trên thanh tác vụ
  let feedbackBadgeHtml = '<span class="quiz-feedback-status" id="feedback-status-' + qId + '">Hãy chọn 1 đáp án và ấn "Kiểm tra"</span>';
  if (isChecked) {
    if (checkedInfo.isCorrect) {
      feedbackBadgeHtml =
        '<span class="quiz-feedback-status status-correct" id="feedback-status-' + qId + '">' +
          '✓ Chính xác! Bạn đã nắm vững bản chất triết học của câu hỏi này.' +
        '</span>';
    } else {
      feedbackBadgeHtml =
        '<span class="quiz-feedback-status status-wrong" id="feedback-status-' + qId + '">' +
          '✕ Chưa chính xác (Bạn chọn ' + checkedInfo.chosen + ', đáp án đúng là ' + questionObj.correctAnswer + '). Xem giải thích bên dưới.' +
        '</span>';
    }
  }

  // Tạo chi tiết phân tích từng đáp án tại sao đúng / tại sao sai
  const breakdownItemsHtml = questionObj.options.map(function(opt) {
    const isOptCorrect = opt.key === questionObj.correctAnswer;
    const itemClass = isOptCorrect ? "explain-correct" : "explain-wrong";
    const reasonText = (questionObj.optionExplanations && questionObj.optionExplanations[opt.key])
      ? questionObj.optionExplanations[opt.key]
      : "";
    return (
      '<div class="explanation-option-item ' + itemClass + '">' +
        '<strong>Phương án ' + opt.key + ':</strong> ' + reasonText +
      '</div>'
    );
  }).join("");

  const explanationVisibleClass = isChecked ? " is-visible" : "";

  return (
    '<article class="quiz-card' + cardStateClass + '" id="quiz-card-' + qId + '">' +
      '<div class="quiz-card-meta">' +
        '<span class="quiz-question-number">Câu hỏi 0' + (index + 1) + ' • ' + questionObj.chapter + '</span>' +
        '<span class="quiz-topic-tag">' + questionObj.topic + ' (' + questionObj.difficulty + ')</span>' +
      '</div>' +
      '<h3 class="quiz-question-title">' + questionObj.question + '</h3>' +
      '<div class="quiz-options-grid" role="radiogroup" aria-label="Các lựa chọn câu ' + (index + 1) + '">' +
        optionsHtml +
      '</div>' +
      '<div class="quiz-action-bar">' +
        feedbackBadgeHtml +
        '<div style="display: flex; gap: 0.5rem;">' +
          (isChecked
            ? '<button type="button" class="btn btn-secondary btn-sm" data-quiz-action="retry-question" data-question-id="' + qId + '">Làm lại câu này</button>'
            : '<button type="button" class="btn btn-primary btn-sm" data-quiz-action="check-answer" data-question-id="' + qId + '">Kiểm tra</button>'
          ) +
        '</div>' +
      '</div>' +
      '<div class="quiz-explanation-panel' + explanationVisibleClass + '" id="explanation-panel-' + qId + '">' +
        '<div class="explanation-header">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>' +
          '<span>Giải thích học thuật &amp; Phân tích Tại sao Đúng / Sai</span>' +
        '</div>' +
        '<p class="explanation-general-text">' + questionObj.generalExplanation + '</p>' +
        '<div class="explanation-breakdown-list">' +
          breakdownItemsHtml +
        '</div>' +
      '</div>' +
    '</article>'
  );
}

/**
 * 3. Hàm hiển thị toàn bộ danh sách câu hỏi và cập nhật bảng thống kê điểm
 */
function renderQuizView() {
  const container = document.getElementById("quiz-questions-container");
  if (!container) return;

  container.innerHTML = quizAppState.questions.map(function(q, idx) {
    return buildQuestionCardMarkup(q, idx);
  }).join("");

  updateQuizScoreboard();
}

/**
 * 4. Hàm cập nhật thống kê số câu đã kiểm tra và số câu trả lời đúng
 */
function updateQuizScoreboard() {
  const totalCount = quizAppState.questions.length;
  const checkedKeys = Object.keys(quizAppState.checkedResults);
  const answeredCount = checkedKeys.length;
  const correctCount = checkedKeys.filter(function(k) {
    return quizAppState.checkedResults[k].isCorrect;
  }).length;

  const totalEl = document.getElementById("quiz-stat-total");
  const answeredEl = document.getElementById("quiz-stat-answered");
  const correctEl = document.getElementById("quiz-stat-correct");

  if (totalEl) totalEl.textContent = totalCount + " câu";
  if (answeredEl) answeredEl.textContent = answeredCount + "/" + totalCount + " câu";
  if (correctEl) correctEl.textContent = correctCount + "/" + totalCount + " đúng";
}

/**
 * 5. Hàm xử lý khi sinh viên chọn 1 phương án trả lời (A, B, C, hoặc D)
 * @param {string} questionId - Mã định danh câu hỏi
 * @param {string} optionKey - Ký hiệu phương án được chọn
 */
function handleSelectOption(questionId, optionKey) {
  if (quizAppState.checkedResults[questionId]) return;
  quizAppState.selectedAnswers[questionId] = optionKey;
  renderQuizView();
}

/**
 * 6. Hàm xử lý khi sinh viên ấn nút "Kiểm tra"
 *    Hiển thị màu Xanh (đúng), Đỏ (sai) và bung khung lời giải thích chi tiết
 * @param {string} questionId - Mã định danh câu hỏi
 */
function handleCheckAnswer(questionId) {
  const chosenOption = quizAppState.selectedAnswers[questionId];
  if (!chosenOption) {
    const statusEl = document.getElementById("feedback-status-" + questionId);
    if (statusEl) {
      statusEl.className = "quiz-feedback-status status-warning";
      statusEl.textContent = "⚠ Vui lòng chọn một phương án (A, B, C hoặc D) trước khi ấn Kiểm tra!";
    }
    return;
  }

  const questionObj = quizAppState.questions.find(function(q) {
    return q.id === questionId;
  });
  if (!questionObj) return;

  const isCorrect = chosenOption === questionObj.correctAnswer;
  quizAppState.checkedResults[questionId] = {
    isCorrect: isCorrect,
    chosen: chosenOption
  };

  renderQuizView();
}

/**
 * 7. Hàm đặt lại (Reset) một câu hỏi hoặc toàn bộ bài luyện tập
 * @param {string|null} questionId - Nếu truyền mã câu hỏi thì chỉ làm lại câu đó; nếu bỏ trống thì làm lại tất cả
 */
function handleResetQuiz(questionId) {
  if (questionId) {
    delete quizAppState.selectedAnswers[questionId];
    delete quizAppState.checkedResults[questionId];
  } else {
    quizAppState.selectedAnswers = {};
    quizAppState.checkedResults = {};
  }
  renderQuizView();
}

/**
 * 8. Hàm gắn bộ lắng nghe sự kiện tập trung (Event Delegation) cho khu vực trắc nghiệm
 */
function bindQuizEvents() {
  const container = document.getElementById("quiz-questions-container");
  if (container) {
    container.addEventListener("click", function(event) {
      const actionBtn = event.target.closest("[data-quiz-action]");
      if (!actionBtn) return;

      const actionType = actionBtn.getAttribute("data-quiz-action");
      const questionId = actionBtn.getAttribute("data-question-id");

      if (actionType === "select-option") {
        const optionKey = actionBtn.getAttribute("data-option-key");
        handleSelectOption(questionId, optionKey);
      } else if (actionType === "check-answer") {
        handleCheckAnswer(questionId);
      } else if (actionType === "retry-question") {
        handleResetQuiz(questionId);
      }
    });
  }

  const resetAllBtn = document.getElementById("reset-all-quiz-btn");
  if (resetAllBtn) {
    resetAllBtn.addEventListener("click", function() {
      handleResetQuiz(null);
    });
  }
}

/**
 * 9. Hàm khởi tạo Phòng luyện tập tư duy (Entry Point)
 * @param {string} dataSourceUrl - Đường dẫn file JSON cần nạp qua Fetch API
 */
async function initPhilosophyQuiz(dataSourceUrl) {
  const loadedQuestions = await fetchQuizQuestions(dataSourceUrl);
  quizAppState.questions = loadedQuestions;
  renderQuizView();
  bindQuizEvents();
}

// Khởi chạy tự động khi mở trang quiz.html
document.addEventListener('DOMContentLoaded', function() {
  const defaultJsonUrl = 'data.json';
  initPhilosophyQuiz(defaultJsonUrl);
});
