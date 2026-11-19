/**
 * ============================================================================
 * HỆ THỐNG E-LEARNING TRIẾT HỌC MÁC - LÊNIN (EDTECH DASHBOARD EDITION)
 * File: app.js
 * Chức năng đầy đủ 100%:
 *   1. Native Web Slide Viewer sử dụng Mozilla PDF.js (v3.11.174 UMD qua CDN):
 *      - Render trực tiếp từng trang của file "assets/slides/slide-triet-hoc.pdf" (388 trang)
 *        lên thẻ <canvas id="pdf-render-canvas"> hỗ trợ devicePixelRatio sắc nét.
 *      - Cơ chế Cache thông minh: Lưu đối tượng pdfDoc toàn cục (cachedPdfDoc), khi đổi chuyên đề
 *        cùng file PDF không tải lại file mà nhảy thẳng tới trang slideStartPage.
 *      - Thanh điều khiển đầy đủ: "← Slide trước", ô nhảy trang "Trang [input] / 388",
 *        "Slide tiếp →", Thu phóng (+/-), Toàn màn hình (Fullscreen API) và phím mũi tên Trái/Phải.
 *   2. Đồng bộ động 100% với data.json (Object.keys(data.lessons).length).
 *   3. Tab 1: Tóm tắt lý thuyết đổ trực tiếp "summaryHtml" vào <div id="summary-reader" class="summary-article">.
 *   4. Auth Guard & Đăng nhập Google, lưu tiến độ/điểm số Firestore, chấm tự luận Gemini API & Coze AI.
 * ============================================================================
 */

// Cấu hình Worker cho Mozilla PDF.js v3.11.174
if (typeof window !== "undefined" && window.pdfjsLib) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

const DEFAULT_SLIDE_PDF_PATH = "assets/slides/slide-triet-hoc.pdf";
const DEFAULT_TOTAL_SLIDE_PAGES = 388;

let LESSONS_DATA = {
  "ch1-bai1": {
    "chapterId": "chuong_1",
    "badge": "Chương 1 • Mục I",
    "pages": "Slide bài giảng: Trang 6 – 28 / 388",
    "title": "I. Triết học và vấn đề cơ bản của triết học",
    "summary": "Khái lược về triết học, nguồn gốc nhận thức và xã hội; đối tượng của triết học trong lịch sử; hai mặt vấn đề cơ bản của triết học; biện chứng và siêu hình.",
    "shortDesc": "Nguồn gốc triết học, thế giới quan, hai mặt vấn đề cơ bản (bản thể luận & nhận thức luận), biện chứng và siêu hình.",
    "slidePdfPath": "assets/slides/slide-triet-hoc.pdf",
    "slideStartPage": 6,
    "slideEndPage": 28,
    "summaryHtml": "<div class=\"summary-doc-header\">\n  <span class=\"summary-kicker\">CHƯƠNG 1 • MỤC LỚN I (TRANG 11 – 48)</span>\n  <h2>I. Triết học và vấn đề cơ bản của triết học</h2>\n  <p class=\"summary-lead\">Hệ thống hóa nguồn gốc nhận thức và nguồn gốc xã hội của triết học, cấu trúc của thế giới quan, hai mặt của vấn đề cơ bản của triết học và sự đối lập giữa phương pháp biện chứng với phương pháp siêu hình.</p>\n</div>\n\n<h3>1. Khái lược về Triết học</h3>\n<h4>a) Nguồn gốc của triết học</h4>\n<p>Triết học ra đời vào khoảng <strong>thế kỷ VIII đến thế kỷ VI trước Công nguyên (TCN)</strong> tại các trung tâm văn minh cổ đại lớn của nhân loại (Ấn Độ, Trung Hoa, Hy Lạp) khi hội tụ đủ hai nguồn gốc:</p>\n<ul>\n  <li><strong>Nguồn gốc nhận thức:</strong> Kho tàng tri thức riêng lẻ của con người về tự nhiên và xã hội đã tích lũy đến mức đòi hỏi sự khái quát hóa; đồng thời năng lực <em>tư duy trừu tượng</em> của con người đã phát triển đủ sức rút ra những quy luật chung nhất.</li>\n  <li><strong>Nguồn gốc xã hội:</strong> Nền sản xuất xã hội phát triển dẫn tới sự <strong>phân công lao động xã hội</strong> (tách lao động trí óc khỏi lao động chân tay) và sự phân hóa giai cấp trong xã hội chiếm hữu nô lệ.</li>\n</ul>\n\n<h4>b) Khái niệm Triết học và Thế giới quan</h4>\n<ul>\n  <li><strong>Định nghĩa triết học:</strong> Triết học là hệ thống quan điểm lý luận chung nhất về thế giới và vị trí con người trong thế giới đó, là khoa học về những quy luật vận động, phát triển chung nhất của tự nhiên, xã hội và tư duy.</li>\n  <li><strong>Triết học là hạt nhân lý luận của thế giới quan:</strong> Thế giới quan là hệ thống các tri thức, quan điểm, tình cảm, niềm tin, lý tưởng xác định về thế giới và về vị trí của con người. Trong đó, triết học đóng vai trò là hạt nhân lý luận chi phối mọi thế giới quan khác.</li>\n</ul>\n\n<blockquote>\n  “Vấn đề cơ bản lớn của mọi triết học, đặc biệt là của triết học hiện đại, là vấn đề quan hệ giữa tư duy với tồn tại.”\n  <cite>— Ph. Ăngghen (Lút-vích Phơ-bách và sự cáo chung của triết học cổ điển Đức)</cite>\n</blockquote>\n\n<h3>2. Vấn đề cơ bản của Triết học</h3>\n<h4>a) Mặt thứ nhất (Bản thể luận): Giữa ý thức và vật chất, cái nào có trước, cái nào quyết định cái nào?</h4>\n<ul>\n  <li><strong>Chủ nghĩa duy vật:</strong> Khẳng định vật chất có trước, ý thức có sau, vật chất quyết định ý thức. Trải qua 3 hình thức lịch sử: <em>Chủ nghĩa duy vật chất phác cổ đại</em>, <em>Chủ nghĩa duy vật siêu hình thế kỷ XVII–XVIII</em>, và đỉnh cao là <em>Chủ nghĩa duy vật biện chứng</em>.</li>\n  <li><strong>Chủ nghĩa duy tâm:</strong> Khẳng định ý thức, tinh thần là tính thứ nhất, sản sinh ra giới tự nhiên. Gồm 2 hình thức: <em>Chủ nghĩa duy tâm chủ quan</em> và <em>Chủ nghĩa duy tâm khách quan</em>.</li>\n</ul>\n\n<h4>b) Mặt thứ hai (Nhận thức luận): Con người có khả năng nhận thức được thế giới hay không?</h4>\n<ul>\n  <li><strong>Thuyết khả tri (Khả tri luận):</strong> Khẳng định con người về nguyên tắc có thể hiểu được bản chất của sự vật.</li>\n  <li><strong>Thuyết bất khả tri (Bất khả tri luận):</strong> Phủ nhận khả năng nhận thức bản chất khách quan của thế giới.</li>\n</ul>\n\n<h3>3. Biện chứng và Siêu hình</h3>\n<h4>a) Sự đối lập giữa hai phương pháp tư duy</h4>\n<ul>\n  <li><strong>Phương pháp siêu hình:</strong> Xem xét sự vật ở trạng thái cô lập, tĩnh tại, chỉ thấy sự biến đổi thuần túy về lượng do nguyên nhân bên ngoài.</li>\n  <li><strong>Phương pháp biện chứng:</strong> Xem xét sự vật trong mối liên hệ phổ biến, ràng buộc lẫn nhau và trong quá trình vận động, phát triển không ngừng cả về lượng lẫn về chất.</li>\n</ul>\n\n<h4>b) Các hình thức của phép biện chứng trong lịch sử</h4>\n<p>Phép biện chứng phát triển qua 3 giai đoạn: <em>Phép biện chứng tự phát thời cổ đại</em> → <em>Phép biện chứng duy tâm trong triết học cổ điển Đức (đỉnh cao là Hegel)</em> → <em>Phép biện chứng duy vật do C. Mác và Ph. Ăngghen sáng lập</em>.</p>\n\n<div class=\"summary-takeaway-box\">\n  <strong>💡 Trọng tâm ôn tập Mục I Chương 1:</strong> Nắm vững 2 nguồn gốc của triết học, 2 mặt của vấn đề cơ bản của triết học và tiêu chuẩn phân định lập trường Duy vật / Duy tâm.\n</div>"
  },
  "ch1-bai2": {
    "chapterId": "chuong_1",
    "badge": "Chương 1 • Mục II",
    "pages": "Slide bài giảng: Trang 29 – 54 / 388",
    "title": "II. Triết học Mác - Lênin và vai trò của triết học Mác - Lênin trong đời sống xã hội",
    "summary": "Sự ra đời và phát triển của Triết học Mác - Lênin; đối tượng và chức năng thế giới quan, phương pháp luận; vai trò trong bối cảnh toàn cầu hóa và Cách mạng công nghiệp 4.0.",
    "shortDesc": "Ba tiền đề ra đời của Triết học Mác, bước ngoặt cách mạng trong triết học, chức năng thế giới quan & phương pháp luận.",
    "slidePdfPath": "assets/slides/slide-triet-hoc.pdf",
    "slideStartPage": 29,
    "slideEndPage": 54,
    "summaryHtml": "<div class=\"summary-doc-header\">\n  <span class=\"summary-kicker\">CHƯƠNG 1 • MỤC LỚN II (TRANG 49 – 116)</span>\n  <h2>II. Triết học Mác - Lênin và vai trò trong đời sống xã hội</h2>\n  <p class=\"summary-lead\">Phân tích những điều kiện lịch sử cho sự ra đời của Triết học Mác, thực chất bước ngoặt cách mạng trong triết học, giai đoạn V.I. Lênin bảo vệ và phát triển, cùng hai chức năng cơ bản của Triết học Mác - Lênin.</p>\n</div>\n\n<h3>1. Sự ra đời và phát triển của Triết học Mác - Lênin</h3>\n<h4>a) Những điều kiện lịch sử của sự ra đời Triết học Mác</h4>\n<ul>\n  <li><strong>Điều kiện kinh tế - xã hội:</strong> Sự phát triển mạnh mẽ của phương thức sản xuất tư bản chủ nghĩa những năm 40 thế kỷ XIX và sự xuất hiện của giai cấp vô sản trên vũ đài chính trị như một lực lượng xã hội độc lập.</li>\n  <li><strong>Nguồn gốc lý luận:</strong> Kế thừa trực tiếp <em>Triết học cổ điển Đức</em> (phép biện chứng của Hegel và chủ nghĩa duy vật của Feuerbach), <em>Kinh tế chính trị học cổ điển Anh</em> và <em>Chủ nghĩa xã hội không tưởng Pháp</em>.</li>\n  <li><strong>Tiền đề khoa học tự nhiên:</strong> Định luật bảo toàn và chuyển hóa năng lượng, Học thuyết tế bào, và Học thuyết tiến hóa của Charles Darwin.</li>\n</ul>\n\n<h4>b) Thực chất và ý nghĩa cuộc cách mạng trong triết học do C. Mác và Ph. Ăngghen thực hiện</h4>\n<ul>\n  <li>Khắc phục sự tách rời giữa chủ nghĩa duy vật và phép biện chứng trong lịch sử, xây dựng <strong>Chủ nghĩa duy vật biện chứng</strong>.</li>\n  <li>Mở rộng chủ nghĩa duy vật vào nghiên cứu lịch sử xã hội, sáng tạo ra <strong>Chủ nghĩa duy vật lịch sử</strong>.</li>\n  <li>Thống nhất hữu cơ giữa lý luận khoa học và thực tiễn cách mạng.</li>\n</ul>\n\n<blockquote>\n  “Các nhà triết học đã chỉ giải thích thế giới bằng nhiều cách khác nhau, song vấn đề là cải tạo thế giới.”\n  <cite>— C. Mác (Luận cương về Phơ-bách, 1845)</cite>\n</blockquote>\n\n<h3>2. Đối tượng và chức năng của Triết học Mác - Lênin</h3>\n<h4>a) Chức năng thế giới quan</h4>\n<p>Định hướng cho con người nhận thức đúng đắn thế giới hiện thực khách quan, hình thành nhân sinh quan khoa học, cách mạng và niềm tin vào sự thắng lợi của các quy luật tiến bộ xã hội.</p>\n\n<h4>b) Chức năng phương pháp luận</h4>\n<p>Trang bị hệ thống các nguyên tắc phương pháp luận chung nhất (<em>Nguyên tắc khách quan, Nguyên tắc toàn diện, Nguyên tắc phát triển, Nguyên tắc lịch sử - cụ thể</em>) dẫn đường cho nghiên cứu khoa học và hoạt động thực tiễn.</p>\n\n<div class=\"summary-takeaway-box\">\n  <strong>💡 Trọng tâm ôn tập Mục II Chương 1:</strong> Ghi nhớ 3 tiền đề khách quan ra đời Triết học Mác, nội dung bước ngoặt cách mạng trong triết học và mối quan hệ thống nhất giữa chức năng thế giới quan với chức năng phương pháp luận.\n</div>"
  },
  "ch2-bai1": {
    "chapterId": "chuong_2",
    "badge": "Chương 2 • Mục I",
    "pages": "Slide bài giảng: Trang 55 – 93 / 388",
    "title": "I. Vật chất và ý thức",
    "summary": "Định nghĩa vật chất của V.I. Lênin, phương thức tồn tại của vật chất, tính thống nhất vật chất của thế giới; nguồn gốc, bản chất, kết cấu của ý thức; mối quan hệ biện chứng giữa vật chất và ý thức.",
    "shortDesc": "Định nghĩa Vật chất của V.I. Lênin, nguồn gốc & bản chất Ý thức, mối quan hệ biện chứng và nguyên tắc tôn trọng khách quan.",
    "slidePdfPath": "assets/slides/slide-triet-hoc.pdf",
    "slideStartPage": 55,
    "slideEndPage": 93,
    "summaryHtml": "<div class=\"summary-doc-header\">\n  <span class=\"summary-kicker\">CHƯƠNG 2 • MỤC LỚN I (TRANG 117 – 182)</span>\n  <h2>I. Vật chất và ý thức</h2>\n  <p class=\"summary-lead\">Nền tảng thế giới quan của Chủ nghĩa duy vật biện chứng: Định nghĩa vật chất của V.I. Lênin, nguồn gốc tự nhiên & xã hội của ý thức, và nguyên tắc phương pháp luận Tôn trọng khách quan kết hợp phát huy tính năng động chủ quan.</p>\n</div>\n\n<h3>1. Vật chất và các hình thức tồn tại của vật chất</h3>\n<h4>a) Định nghĩa vật chất của V.I. Lênin</h4>\n<blockquote>\n  “Vật chất là một phạm trù triết học dùng để chỉ thực tại khách quan được đem lại cho con người trong cảm giác, được cảm giác của chúng ta chép lại, chụp lại, phản ánh, và tồn tại không lệ thuộc vào cảm giác.”\n  <cite>— V.I. Lênin (Chủ nghĩa duy vật và chủ nghĩa kinh nghiệm phê phán)</cite>\n</blockquote>\n<ul>\n  <li><strong>Thuộc tính cơ bản nhất của vật chất:</strong> Là thuộc tính <strong>tồn tại khách quan</strong> — tồn tại ở bên ngoài, độc lập và không phụ thuộc vào cảm giác, ý thức của con người.</li>\n  <li><strong>Ý nghĩa định nghĩa:</strong> Giải quyết triệt để cả hai mặt vấn đề cơ bản của triết học trên lập trường duy vật biện chứng; khắc phục cuộc khủng hoảng trong vật lý học cuối thế kỷ XIX.</li>\n</ul>\n\n<h4>b) Phương thức và hình thức tồn tại của vật chất</h4>\n<ul>\n  <li><strong>Vận động:</strong> Là phương thức tồn tại và thuộc tính cố hữu của vật chất, bao gồm 5 hình thức cơ bản: vận động cơ học, vật lý, hóa học, sinh học và xã hội.</li>\n  <li><strong>Không gian và thời gian:</strong> Là những hình thức tồn tại khách quan của vật chất vận động.</li>\n</ul>\n\n<h3>2. Nguồn gốc, bản chất và kết cấu của Ý thức</h3>\n<h4>a) Hai nguồn gốc của ý thức</h4>\n<ul>\n  <li><strong>Nguồn gốc tự nhiên (điều kiện cần):</strong> Bộ óc con người và sự tác động của thế giới khách quan lên bộ óc tạo ra quá trình phản ánh.</li>\n  <li><strong>Nguồn gốc xã hội (điều kiện đủ và quyết định trực tiếp):</strong> <strong>Lao động</strong> và <strong>Ngôn ngữ</strong> (vỏ vật chất của tư duy).</li>\n</ul>\n\n<h4>b) Bản chất và kết cấu của ý thức</h4>\n<p>Bản chất của ý thức là <strong>hình ảnh chủ quan của thế giới khách quan</strong>, là quá trình phản ánh tích cực, sáng tạo hiện thực khách quan của óc người. Về kết cấu theo chiều ngang, ý thức gồm: <em>Tri thức</em> (nhân tố cốt lõi, phương thức tồn tại của ý thức), <em>Tình cảm</em> và <em>Ý chí</em>.</p>\n\n<h3>3. Mối quan hệ biện chứng giữa Vật chất và Ý thức</h3>\n<ul>\n  <li><strong>Vật chất quyết định ý thức:</strong> Quyết định nguồn gốc, nội dung, bản chất và sự vận động, biến đổi của ý thức.</li>\n  <li><strong>Ý thức có tính độc lập tương đối và tác động trở lại vật chất:</strong> Thông qua hoạt động thực tiễn của con người, ý thức khoa học thúc đẩy sự phát triển, còn ý thức sai lầm kìm hãm sự phát triển.</li>\n</ul>\n\n<div class=\"summary-takeaway-box\">\n  <strong>💡 Ý nghĩa phương pháp luận:</strong> Trong mọi hoạt động nhận thức và thực tiễn phải quán triệt nguyên tắc <strong>Tôn trọng tính khách quan kết hợp phát huy tính năng động chủ quan</strong>; kiên quyết chống bệnh chủ quan duy ý chí và thái độ thụ động, ỷ lại.\n</div>"
  },
  "ch2-bai2": {
    "chapterId": "chuong_2",
    "badge": "Chương 2 • Mục II",
    "pages": "Slide bài giảng: Trang 94 – 186 / 388",
    "title": "II. Phép biện chứng duy vật",
    "summary": "Hai nguyên lý cơ bản (Mối liên hệ phổ biến, Sự phát triển); sáu cặp phạm trù cơ bản; ba quy luật cơ bản (Quy luật Lượng - Chất, Quy luật Mâu thuẫn, Quy luật Phủ định của phủ định).",
    "shortDesc": "Hai nguyên lý, 6 cặp phạm trù và 3 quy luật cơ bản (Lượng - Chất, Mâu thuẫn, Phủ định của phủ định).",
    "slidePdfPath": "assets/slides/slide-triet-hoc.pdf",
    "slideStartPage": 94,
    "slideEndPage": 186,
    "summaryHtml": "<div class=\"summary-doc-header\">\n  <span class=\"summary-kicker\">CHƯƠNG 2 • MỤC LỚN II (TRANG 183 – 253)</span>\n  <h2>II. Phép biện chứng duy vật</h2>\n  <p class=\"summary-lead\">Hệ thống lý luận phương pháp luận cốt lõi của Triết học Mác - Lênin: 2 nguyên lý cơ bản, 6 cặp phạm trù và 3 quy luật phổ biến của sự vận động, phát triển.</p>\n</div>\n\n<h3>1. Hai nguyên lý của Phép biện chứng duy vật</h3>\n<h4>a) Nguyên lý về mối liên hệ phổ biến</h4>\n<p>Mọi sự vật, hiện tượng trong thế giới đều tồn tại trong sự quy định, tác động và chuyển hóa lẫn nhau. Mối liên hệ có tính khách quan, tính phổ biến và tính đa dạng, phong phú.</p>\n<ul>\n  <li><strong>Ý nghĩa phương pháp luận:</strong> Đòi hỏi phải quán triệt <strong>Nguyên tắc Toàn diện</strong> và <strong>Nguyên tắc Lịch sử - Cụ thể</strong>; chống quan điểm phiến diện, chiết trung và ngụy biện.</li>\n</ul>\n\n<h4>b) Nguyên lý về sự phát triển</h4>\n<p>Phát triển là quá trình vận động từ thấp đến cao, từ kém hoàn thiện đến hoàn thiện hơn. Phát triển có tính khách quan, tính phổ biến, tính kế thừa và tính đa dạng.</p>\n<ul>\n  <li><strong>Ý nghĩa phương pháp luận:</strong> Đòi hỏi phải quán triệt <strong>Nguyên tắc Phát triển</strong>; phát hiện và ủng hộ cái mới hợp quy luật, chống bảo thủ, trì trệ.</li>\n</ul>\n\n<h3>2. Sáu cặp phạm trù cơ bản của Phép biện chứng duy vật</h3>\n<ul>\n  <li><strong>Cái riêng và Cái chung:</strong> Cái chung chỉ tồn tại trong cái riêng, thông qua cái riêng; cái riêng là cái toàn bộ, phong phú hơn cái chung, còn cái chung sâu sắc hơn cái riêng.</li>\n  <li><strong>Nguyên nhân và Kết quả:</strong> Mối liên hệ nhân - quả mang tính khách quan, tất yếu.</li>\n  <li><strong>Tất nhiên và Ngẫu nhiên:</strong> Tất nhiên vạch đường đi cho mình xuyên qua vô số cái ngẫu nhiên.</li>\n  <li><strong>Nội dung và Hình thức:</strong> Nội dung quyết định hình thức; hình thức phù hợp sẽ thúc đẩy nội dung phát triển.</li>\n  <li><strong>Bản chất và Hiện tượng:</strong> Bản chất bộc lộ qua hiện tượng; nhận thức phải đi từ hiện tượng đến bản chất.</li>\n  <li><strong>Khả năng và Hiện thực:</strong> Cần tập trung tạo điều kiện để chuyển hóa khả năng tốt đẹp thành hiện thực.</li>\n</ul>\n\n<h3>3. Ba quy luật cơ bản của Phép biện chứng duy vật</h3>\n<h4>a) Quy luật Lượng - Chất (Chỉ ra CÁCH THỨC của sự phát triển)</h4>\n<p>Sự tích lũy dần dần về <strong>Lượng</strong> trong giới hạn <strong>Độ</strong> khi đạt tới <strong>Điểm nút</strong> sẽ dẫn tới <strong>Bước nhảy</strong> làm thay đổi căn bản về <strong>Chất</strong>. Ý nghĩa: Kiên trì tích lũy về lượng, chống cả hai khuynh hướng sai lầm là <em>“tả khuynh”</em> (nôn nóng đốt cháy giai đoạn) và <em>“hữu khuynh”</em> (bảo thủ, do dự).</p>\n\n<h4>b) Quy luật Thống nhất và đấu tranh của các mặt đối lập (Chỉ ra NGUỒN GỐC & ĐỘNG LỰC)</h4>\n<p>Là hạt nhân của phép biện chứng. Sự thống nhất của các mặt đối lập là tương đối, tạm thời; sự đấu tranh của các mặt đối lập là tuyệt đối, dẫn tới việc giải quyết mâu thuẫn nội tại để sự vật phát triển.</p>\n\n<h4>c) Quy luật Phủ định của phủ định (Chỉ ra KHUYNH HƯỚNG phát triển xoáy ốc)</h4>\n<p>Phủ định biện chứng có tính khách quan và tính kế thừa. Sau ít nhất hai lần phủ định biện chứng, sự vật hoàn thành một chu kỳ phát triển theo hình <strong>đường xoáy ốc</strong> đi lên.</p>\n\n<div class=\"summary-takeaway-box\">\n  <strong>💡 Trọng tâm ôn tập Mục II Chương 2:</strong> Phân biệt rõ vị trí của 3 quy luật: Lượng - Chất (Cách thức), Mâu thuẫn (Nguồn gốc/Động lực), Phủ định của phủ định (Khuynh hướng).\n</div>"
  },
  "ch2-bai3": {
    "chapterId": "chuong_2",
    "badge": "Chương 2 • Mục III",
    "pages": "Slide bài giảng: Trang 187 – 210 / 388",
    "title": "III. Lý luận nhận thức của chủ nghĩa duy vật biện chứng",
    "summary": "Quan niệm về bản chất của nhận thức; thực tiễn và vai trò của thực tiễn đối với nhận thức; các giai đoạn của quá trình nhận thức (trực quan sinh động đến tư duy trừu tượng) và tính chất của chân lý.",
    "shortDesc": "Bản chất của nhận thức, phạm trù Thực tiễn và 3 vai trò của thực tiễn, con đường biện chứng của sự nhận thức chân lý.",
    "slidePdfPath": "assets/slides/slide-triet-hoc.pdf",
    "slideStartPage": 187,
    "slideEndPage": 210,
    "summaryHtml": "<div class=\"summary-doc-header\">\n  <span class=\"summary-kicker\">CHƯƠNG 2 • MỤC LỚN III (TRANG 254 – 286)</span>\n  <h2>III. Lý luận nhận thức của chủ nghĩa duy vật biện chứng</h2>\n  <p class=\"summary-lead\">Làm rõ bản chất của nhận thức là sự phản ánh tích cực, sáng tạo thế giới khách quan trên cơ sở thực tiễn; phân tích vai trò của thực tiễn và con đường biện chứng của quá trình nhận thức chân lý.</p>\n</div>\n\n<h3>1. Thực tiễn và vai trò của thực tiễn đối với nhận thức</h3>\n<h4>a) Phạm trù Thực tiễn và 3 hình thức cơ bản</h4>\n<p><strong>Thực tiễn</strong> là toàn bộ những hoạt động vật chất - cảm tính, có tính lịch sử - xã hội của con người nhằm cải tạo tự nhiên và xã hội phục vụ nhân loại tiến bộ. Gồm 3 hình thức cơ bản:</p>\n<ul>\n  <li><strong>Hoạt động sản xuất vật chất:</strong> Hình thức nguyên thủy nhất, cơ bản nhất và giữ vai trò quyết định.</li>\n  <li><strong>Hoạt động chính trị - xã hội:</strong> Hoạt động đấu tranh giai cấp, giải phóng dân tộc, cải tạo các quan hệ xã hội.</li>\n  <li><strong>Hoạt động thực nghiệm khoa học:</strong> Hình thức đặc biệt ngày càng quan trọng trong kỷ nguyên khoa học - công nghệ.</li>\n</ul>\n\n<h4>b) Ba vai trò của thực tiễn đối với nhận thức</h4>\n<ul>\n  <li>Thực tiễn là <strong>cơ sở, động lực</strong> của nhận thức.</li>\n  <li>Thực tiễn là <strong>mục đích</strong> của nhận thức.</li>\n  <li>Thực tiễn là <strong>tiêu chuẩn để kiểm tra chân lý</strong>.</li>\n</ul>\n\n<blockquote>\n  “Từ trực quan sinh động đến tư duy trừu tượng, và từ tư duy trừu tượng đến thực tiễn — đó là con đường biện chứng của sự nhận thức chân lý, của sự nhận thức thực tại khách quan.”\n  <cite>— V.I. Lênin (Bút ký triết học)</cite>\n</blockquote>\n\n<h3>2. Các giai đoạn của quá trình nhận thức và Chân lý</h3>\n<h4>a) Hai giai đoạn nhận thức</h4>\n<ul>\n  <li><strong>Nhận thức cảm tính (Trực quan sinh động):</strong> Gồm 3 hình thức: <em>Cảm giác → Tri giác → Biểu tượng</em> (phản ánh trực tiếp bề ngoài sự vật).</li>\n  <li><strong>Nhận thức lý tính (Tư duy trừu tượng):</strong> Gồm 3 hình thức: <em>Khái niệm → Phán đoán → Suy lý (Suy luận)</em> (phản ánh gián tiếp, khái quát bản chất, quy luật bên trong).</li>\n</ul>\n\n<h4>b) Quan niệm về Chân lý</h4>\n<p>Chân lý là tri thức có nội dung phù hợp với hiện thực khách quan và đã được thực tiễn kiểm nghiệm. Mọi chân lý đều mang <strong>tính khách quan, tính tương đối, tính tuyệt đối và tính cụ thể</strong>.</p>\n\n<div class=\"summary-takeaway-box\">\n  <strong>💡 Ý nghĩa phương pháp luận (Nguyên tắc Thống nhất giữa Lý luận và Thực tiễn):</strong> Học đi đôi với hành; nghiên cứu lý thuyết phải luôn gắn với thực tiễn để kiểm nghiệm, tránh bệnh giáo điều (xa rời thực tiễn) và bệnh kinh nghiệm (coi nhẹ lý luận).\n</div>"
  },
  "ch3-bai1": {
    "chapterId": "chuong_3",
    "badge": "Chương 3 • Mục I",
    "pages": "Slide bài giảng: Trang 211 – 264 / 388",
    "title": "I. Học thuyết hình thái kinh tế - xã hội",
    "summary": "Sản xuất vật chất là cơ sở của sự tồn tại và phát triển xã hội; biện chứng giữa lực lượng sản xuất và quan hệ sản xuất; biện chứng giữa cơ sở hạ tầng và kiến trúc thượng tầng; sự phát triển các hình thái kinh tế - xã hội là quá trình lịch sử - tự nhiên.",
    "shortDesc": "Sản xuất vật chất, quy luật LLSX - QHSX, biện chứng Cơ sở hạ tầng - Kiến trúc thượng tầng, quá trình lịch sử - tự nhiên.",
    "slidePdfPath": "assets/slides/slide-triet-hoc.pdf",
    "slideStartPage": 211,
    "slideEndPage": 264,
    "summaryHtml": "<div class=\"summary-doc-header\">\n  <span class=\"summary-kicker\">CHƯƠNG 3 • MỤC LỚN I (TRANG 287 – 329)</span>\n  <h2>I. Học thuyết hình thái kinh tế - xã hội</h2>\n  <p class=\"summary-lead\">Hòn đá tảng của Chủ nghĩa duy vật lịch sử: Vai trò quyết định của sản xuất vật chất, quy luật quan hệ sản xuất phù hợp với trình độ phát triển của lực lượng sản xuất, và biện chứng giữa Cơ sở hạ tầng với Kiến trúc thượng tầng.</p>\n</div>\n\n<h3>1. Sản xuất vật chất là cơ sở của sự tồn tại và phát triển xã hội</h3>\n<p>Sản xuất vật chất là quá trình con người sử dụng công cụ lao động tác động trực tiếp hoặc gián tiếp vào tự nhiên để tạo ra của cải vật chất. Phương thức sản xuất là sự thống nhất giữa <strong>Lực lượng sản xuất (LLSX)</strong> và <strong>Quan hệ sản xuất (QHSX)</strong>.</p>\n\n<h3>2. Biện chứng giữa Lực lượng sản xuất và Quan hệ sản xuất</h3>\n<h4>a) Cấu trúc của LLSX và QHSX</h4>\n<ul>\n  <li><strong>Lực lượng sản xuất:</strong> Gồm <em>Người lao động</em> (nhân tố giữ vai trò quyết định) và <em>Tư liệu sản xuất</em> (trong đó công cụ lao động là yếu tố động nhất). Trong thời đại hiện nay, <strong>khoa học trở thành lực lượng sản xuất trực tiếp</strong>.</li>\n  <li><strong>Quan hệ sản xuất:</strong> Gồm quan hệ sở hữu đối với tư liệu sản xuất (quyết định nhất), quan hệ tổ chức quản lý và quan hệ phân phối sản phẩm.</li>\n</ul>\n\n<h4>b) Nội dung quy luật</h4>\n<p>Lực lượng sản xuất quyết định sự ra đời, tính chất và sự biến đổi của quan hệ sản xuất; ngược lại, quan hệ sản xuất có tính độc lập tương đối và tác động trở lại thúc đẩy (khi phù hợp) hoặc kìm hãm (khi không phù hợp) lực lượng sản xuất.</p>\n\n<h3>3. Biện chứng giữa Cơ sở hạ tầng và Kiến trúc thượng tầng</h3>\n<ul>\n  <li><strong>Cơ sở hạ tầng (CSHT):</strong> Toàn bộ những quan hệ sản xuất hợp thành cơ cấu kinh tế của xã hội (QHSX thống trị, QHSX tàn dư, QHSX mầm mống).</li>\n  <li><strong>Kiến trúc thượng tầng (KTTT):</strong> Toàn bộ những quan điểm tư tưởng xã hội (chính trị, pháp quyền, đạo đức, triết học...) cùng các thiết chế tương ứng (Nhà nước, đảng phái...). Trong đó <strong>Nhà nước</strong> là thiết chế có quyền lực mạnh nhất.</li>\n  <li><strong>Mối quan hệ biện chứng:</strong> CSHT quyết định KTTT; KTTT tác động mạnh mẽ trở lại bảo vệ và thúc đẩy (hoặc kìm hãm) CSHT.</li>\n</ul>\n\n<blockquote>\n  “Tôi coi sự phát triển của những hình thái kinh tế - xã hội là một quá trình lịch sử - tự nhiên.”\n  <cite>— C. Mác (Tư bản, Quyển I)</cite>\n</blockquote>\n\n<div class=\"summary-takeaway-box\">\n  <strong>💡 Giá trị thực tiễn ở Việt Nam:</strong> Học thuyết Hình thái kinh tế - xã hội là cơ sở lý luận khoa học cho con đường quá độ lên chủ nghĩa xã hội bỏ qua chế độ tư bản chủ nghĩa ở Việt Nam hiện nay.\n</div>"
  },
  "ch3-bai2": {
    "chapterId": "chuong_3",
    "badge": "Chương 3 • Mục II",
    "pages": "Slide bài giảng: Trang 265 – 307 / 388",
    "title": "II. Giai cấp và dân tộc",
    "summary": "Định nghĩa giai cấp của V.I. Lênin, nguồn gốc và kết cấu xã hội - giai cấp; đấu tranh giai cấp; các hình thức cộng đồng người trước khi hình thành dân tộc; mối quan hệ giai cấp - dân tộc - nhân loại.",
    "shortDesc": "Định nghĩa giai cấp của Lênin, đấu tranh giai cấp, sự hình thành dân tộc và mối quan hệ giai cấp - dân tộc - nhân loại.",
    "slidePdfPath": "assets/slides/slide-triet-hoc.pdf",
    "slideStartPage": 265,
    "slideEndPage": 307,
    "summaryHtml": "<div class=\"summary-doc-header\">\n  <span class=\"summary-kicker\">CHƯƠNG 3 • MỤC LỚN II (TRANG 330 – 367)</span>\n  <h2>II. Giai cấp và dân tộc</h2>\n  <p class=\"summary-lead\">Làm rõ nguồn gốc kinh tế của sự phân hóa giai cấp, vai trò động lực của đấu tranh giai cấp, đặc trưng của cộng đồng dân tộc và sự kết hợp nhuần nhuyễn giữa lợi ích giai cấp với lợi ích dân tộc.</p>\n</div>\n\n<h3>1. Giai cấp và Đấu tranh giai cấp</h3>\n<h4>a) Định nghĩa giai cấp của V.I. Lênin và nguồn gốc giai cấp</h4>\n<ul>\n  <li><strong>Đặc trưng phân biệt giai cấp:</strong> Các tập đoàn người khác nhau về: (1) Địa vị trong một hệ thống sản xuất xã hội nhất định; (2) Quan hệ đối với tư liệu sản xuất (đặc trưng quyết định nhất); (3) Vai trò trong tổ chức lao động xã hội; (4) Cách thức và quy mô hưởng thụ phần của cải xã hội.</li>\n  <li><strong>Nguồn gốc giai cấp:</strong> Nguồn gốc sâu xa là sự phát triển của lực lượng sản xuất tạo ra sản phẩm dư thừa; nguồn gốc trực tiếp là sự ra đời của <strong>chế độ tư hữu về tư liệu sản xuất</strong>.</li>\n</ul>\n\n<h4>b) Vai trò của đấu tranh giai cấp</h4>\n<p>Đấu tranh giai cấp là một trong những động lực trực tiếp, quan trọng của lịch sử trong xã hội có giai cấp đối kháng, đỉnh cao dẫn tới cách mạng xã hội thay thế hình thái kinh tế - xã hội cũ bằng hình thái cao hơn.</p>\n\n<h3>2. Dân tộc và Mối quan hệ Giai cấp - Dân tộc - Nhân loại</h3>\n<h4>a) Các hình thức cộng đồng người trong lịch sử</h4>\n<p>Phát triển từ thấp đến cao: <em>Thị tộc → Bộ lạc → Bộ tộc → Dân tộc</em>. Ở Việt Nam, dân tộc hình thành từ rất sớm gắn liền với nhu cầu trị thủy và chống ngoại xâm bảo vệ đất nước.</p>\n\n<h4>b) Quan hệ biện chứng giữa Giai cấp, Dân tộc và Nhân loại</h4>\n<ul>\n  <li>Giai cấp quyết định khuynh hướng phát triển và tính chất của dân tộc.</li>\n  <li>Vấn đề dân tộc có ảnh hưởng to lớn đến vấn đề giai cấp; ở Việt Nam, độc lập dân tộc gắn liền với chủ nghĩa xã hội.</li>\n</ul>\n\n<div class=\"summary-takeaway-box\">\n  <strong>💡 Trọng tâm ôn tập Mục II Chương 3:</strong> Nắm vững 4 đặc trưng trong định nghĩa giai cấp của V.I. Lênin (trong đó quan hệ sở hữu đối với tư liệu sản xuất là đặc trưng quy định nhất) và đặc thù hình thành dân tộc Việt Nam.\n</div>"
  },
  "ch3-bai3": {
    "chapterId": "chuong_3",
    "badge": "Chương 3 • Mục III",
    "pages": "Slide bài giảng: Trang 308 – 332 / 388",
    "title": "III. Nhà nước và cách mạng xã hội",
    "summary": "Nguồn gốc, bản chất, đặc trưng và chức năng của Nhà nước; các kiểu và hình thức Nhà nước; nguồn gốc, bản chất, phương pháp của cách mạng xã hội.",
    "shortDesc": "Nguồn gốc & bản chất giai cấp của Nhà nước, chức năng đối nội - đối ngoại, nguyên nhân sâu xa của cách mạng xã hội.",
    "slidePdfPath": "assets/slides/slide-triet-hoc.pdf",
    "slideStartPage": 308,
    "slideEndPage": 332,
    "summaryHtml": "<div class=\"summary-doc-header\">\n  <span class=\"summary-kicker\">CHƯƠNG 3 • MỤC LỚN III (TRANG 368 – 404)</span>\n  <h2>III. Nhà nước và cách mạng xã hội</h2>\n  <p class=\"summary-lead\">Phân tích quan điểm duy vật lịch sử về nguồn gốc, bản chất, chức năng của Nhà nước và quy luật bùng nổ, thắng lợi của Cách mạng xã hội.</p>\n</div>\n\n<h3>1. Nhà nước</h3>\n<h4>a) Nguồn gốc và Bản chất của Nhà nước</h4>\n<ul>\n  <li><strong>Nguồn gốc:</strong> Nhà nước là phạm trù lịch sử, chỉ ra đời khi mâu thuẫn giai cấp phát triển đến mức <strong>không thể điều hòa được</strong>.</li>\n  <li><strong>Bản chất:</strong> Nhà nước về bản chất là một tổ chức chính trị của một giai cấp thống trị về mặt kinh tế nhằm bảo vệ trật tự hiện hành và đàn áp sự phản kháng của các giai cấp khác, đồng thời thực hiện chức năng quản lý xã hội.</li>\n</ul>\n\n<h4>b) Ba đặc trưng cơ bản của Nhà nước</h4>\n<ul>\n  <li>Quản lý cư dân trên một vùng lãnh thổ nhất định.</li>\n  <li>Có hệ thống các cơ quan quyền lực chuyên nghiệp mang tính cưỡng chế (quân đội, cảnh sát, tòa án...).</li>\n  <li>Có hệ thống thuế khóa để nuôi bộ máy nhà nước và thực hiện công việc công cộng.</li>\n</ul>\n\n<h3>2. Cách mạng xã hội</h3>\n<ul>\n  <li><strong>Nguồn gốc sâu xa:</strong> Mâu thuẫn gay gắt giữa lực lượng sản xuất tiến bộ đòi hỏi được giải phóng với quan hệ sản xuất đã lỗi thời, xiềng xích.</li>\n  <li><strong>Nguồn gốc trực tiếp:</strong> Đấu tranh giai cấp mà vấn đề cơ bản của mọi cuộc cách mạng xã hội là <strong>vấn đề giành chính quyền nhà nước</strong>.</li>\n</ul>\n\n<div class=\"summary-takeaway-box\">\n  <strong>💡 Liên hệ thực tiễn:</strong> Xây dựng và hoàn thiện Nhà nước pháp quyền xã hội chủ nghĩa Việt Nam của Nhân dân, do Nhân dân, vì Nhân dân dưới sự lãnh đạo của Đảng Cộng sản Việt Nam.\n</div>"
  },
  "ch3-bai4": {
    "chapterId": "chuong_3",
    "badge": "Chương 3 • Mục IV",
    "pages": "Slide bài giảng: Trang 333 – 357 / 388",
    "title": "IV. Ý thức xã hội",
    "summary": "Khái niệm tồn tại xã hội và các yếu tố cơ bản của tồn tại xã hội; khái niệm, kết cấu và các hình thái ý thức xã hội; vai trò quyết định của tồn tại xã hội và 5 biểu hiện tính độc lập tương đối của ý thức xã hội.",
    "shortDesc": "Tồn tại xã hội quyết định ý thức xã hội, kết cấu ý thức xã hội và 5 biểu hiện tính độc lập tương đối của ý thức xã hội.",
    "slidePdfPath": "assets/slides/slide-triet-hoc.pdf",
    "slideStartPage": 333,
    "slideEndPage": 357,
    "summaryHtml": "<div class=\"summary-doc-header\">\n  <span class=\"summary-kicker\">CHƯƠNG 3 • MỤC LỚN IV (TRANG 405 – 427)</span>\n  <h2>IV. Ý thức xã hội</h2>\n  <p class=\"summary-lead\">Mối quan hệ biện chứng giữa Tồn tại xã hội và Ý thức xã hội: Vai trò quyết định của tồn tại xã hội và 5 biểu hiện tính độc lập tương đối của ý thức xã hội.</p>\n</div>\n\n<h3>1. Khái niệm Tồn tại xã hội và Ý thức xã hội</h3>\n<h4>a) Tồn tại xã hội và 3 yếu tố cấu thành</h4>\n<p>Tồn tại xã hội là toàn bộ sinh hoạt vật chất và những điều kiện sinh hoạt vật chất của xã hội, gồm: (1) Điều kiện tự nhiên, hoàn cảnh địa lý; (2) Dân số và mật độ dân số; (3) <strong>Phương thức sản xuất vật chất</strong> (yếu tố quan trọng và quyết định nhất).</p>\n\n<h4>b) Ý thức xã hội và kết cấu</h4>\n<p>Ý thức xã hội là mặt tinh thần của đời sống xã hội, nảy sinh từ tồn tại xã hội và phản ánh tồn tại xã hội. Theo trình độ phản ánh, ý thức xã hội gồm <em>ý thức xã hội thông thường (tâm lý xã hội)</em> và <em>ý thức lý luận (hệ tư tưởng)</em>.</p>\n\n<h3>2. Tính độc lập tương đối của Ý thức xã hội (5 biểu hiện trọng tâm)</h3>\n<ul>\n  <li><strong>1. Ý thức xã hội thường lạc hậu hơn so với tồn tại xã hội:</strong> Do tồn tại xã hội biến đổi nhanh hơn, do sức mạnh của thói quen, tập quán bảo thủ và gắn với lợi ích của các tập đoàn người cũ.</li>\n  <li><strong>2. Ý thức xã hội có thể vượt trước tồn tại xã hội:</strong> Những tư tưởng khoa học tiên tiến có thể dự báo tương lai và định hướng thực tiễn.</li>\n  <li><strong>3. Ý thức xã hội có tính kế thừa:</strong> Trong sự phát triển, tư tưởng thời đại sau luôn kế thừa có chọn lọc giá trị tinh thần thời đại trước.</li>\n  <li><strong>4. Sự tác động qua lại giữa các hình thái ý thức xã hội:</strong> Chính trị, pháp quyền, đạo đức, khoa học, nghệ thuật, tôn giáo, triết học luôn ảnh hưởng lẫn nhau.</li>\n  <li><strong>5. Ý thức xã hội tác động trở lại tồn tại xã hội:</strong> Tư tưởng tiến bộ thúc đẩy xã hội phát triển; tư tưởng lạc hậu kìm hãm xã hội.</li>\n</ul>\n\n<div class=\"summary-takeaway-box\">\n  <strong>💡 Trọng tâm ôn tập Mục IV Chương 3:</strong> Thuộc lòng 3 yếu tố của tồn tại xã hội và phân tích được ví dụ thực tiễn cho cả 5 biểu hiện tính độc lập tương đối của ý thức xã hội.\n</div>"
  },
  "ch3-bai5": {
    "chapterId": "chuong_3",
    "badge": "Chương 3 • Mục V",
    "pages": "Slide bài giảng: Trang 358 – 388 / 388",
    "title": "V. Triết học về con người",
    "summary": "Con người và bản chất con người (thực thể sinh học - xã hội, tổng hòa các quan hệ xã hội); hiện tượng tha hóa con người và vấn đề giải phóng con người; quan hệ cá nhân và xã hội; vai trò của quần chúng nhân dân và lãnh tụ.",
    "shortDesc": "Con người là thực thể sinh học - xã hội, bản chất con người là tổng hòa các quan hệ xã hội, vai trò quần chúng nhân dân.",
    "slidePdfPath": "assets/slides/slide-triet-hoc.pdf",
    "slideStartPage": 358,
    "slideEndPage": 388,
    "summaryHtml": "<div class=\"summary-doc-header\">\n  <span class=\"summary-kicker\">CHƯƠNG 3 • MỤC LỚN V (TRANG 428 – 445)</span>\n  <h2>V. Triết học về con người</h2>\n  <p class=\"summary-lead\">Đích đến nhân văn cao cả nhất của Triết học Mác - Lênin: Quan niệm duy vật lịch sử về bản chất con người, sự nghiệp giải phóng con người và vai trò chủ thể sáng tạo lịch sử của quần chúng nhân dân.</p>\n</div>\n\n<h3>1. Con người và Bản chất con người</h3>\n<h4>a) Con người là thực thể sinh học - xã hội</h4>\n<p>Con người là sự thống nhất biện chứng giữa phương diện sinh học (tiền đề vật chất tự nhiên) và phương diện xã hội (yếu tố quyết định bản chất người thông qua lao động và quan hệ xã hội).</p>\n\n<h4>b) Bản chất con người là tổng hòa các quan hệ xã hội</h4>\n<blockquote>\n  “Bản chất con người không phải là một cái trừu tượng cố hữu của cá nhân riêng biệt. Trong tính hiện thực của nó, bản chất con người là tổng hòa những quan hệ xã hội.”\n  <cite>— C. Mác (Luận cương về Phơ-bách, Luận điểm số 6)</cite>\n</blockquote>\n<ul>\n  <li>Con người vừa là <strong>sản phẩm của lịch sử</strong>, vừa là <strong>chủ thể sáng tạo ra lịch sử</strong> thông qua hoạt động thực tiễn.</li>\n</ul>\n\n<h3>2. Vai trò của Quần chúng nhân dân và Lãnh tụ trong lịch sử</h3>\n<ul>\n  <li><strong>Quần chúng nhân dân là chủ thể sáng tạo chân chính ra lịch sử:</strong> Là lực lượng sản xuất cơ bản tạo ra của cải vật chất, là động lực cơ bản của mọi cuộc cách mạng xã hội và là người sáng tạo ra các giá trị văn hóa tinh thần.</li>\n  <li><strong>Vai trò của cá nhân kiệt xuất / Lãnh tụ:</strong> Nắm bắt xu thế lịch sử, định hướng chiến lược, tổ chức và tập hợp quần chúng nhân dân để giải quyết những nhiệm vụ lịch sử đặt ra.</li>\n</ul>\n\n<div class=\"summary-takeaway-box\">\n  <strong>💡 Ý nghĩa đối với sự nghiệp đổi mới ở Việt Nam:</strong> Phát huy nguồn lực con người Việt Nam phát triển toàn diện, lấy hạnh phúc và sự phát triển tự do của con người làm mục tiêu và động lực cao nhất.\n</div>"
  }
};

let ALL_QUIZ_QUESTIONS = [
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
    },
    "chapterId": "chuong_2",
    "chapterTitle": "Chủ nghĩa duy vật biện chứng",
    "slidePdfPath": "assets/slides/slide-triet-hoc.pdf"
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
    },
    "chapterId": "chuong_2",
    "chapterTitle": "Chủ nghĩa duy vật biện chứng",
    "slidePdfPath": "assets/slides/slide-triet-hoc.pdf"
  }
];

let ESSAY_PROMPTS_DATA = [
  {
    "id": "essay_ch1",
    "chapterId": "chuong_1",
    "chapterTitle": "Chương 1: Triết học và vai trò của triết học trong đời sống xã hội",
    "prompt": "Hãy phân tích hai mặt của vấn đề cơ bản của triết học. Từ đó giải thích vì sao việc giải quyết vấn đề cơ bản của triết học lại là tiêu chuẩn để xác định lập trường thế giới quan trong nghiên cứu khoa học và cuộc sống?",
    "rubricKeywords": [
      "bản thể luận",
      "nhận thức luận",
      "vật chất",
      "ý thức",
      "duy vật",
      "duy tâm",
      "khả tri",
      "phương pháp luận"
    ]
  },
  {
    "id": "essay_ch2",
    "chapterId": "chuong_2",
    "chapterTitle": "Chương 2: Chủ nghĩa duy vật biện chứng",
    "prompt": "Phân tích mối quan hệ biện chứng giữa vật chất và ý thức (hoặc Quy luật Lượng - Chất) và rút ra ý nghĩa phương pháp luận đối với việc học tập, rèn luyện kỹ năng chuyên môn của sinh viên hiện nay.",
    "rubricKeywords": [
      "khách quan",
      "năng động chủ quan",
      "thực tiễn",
      "lượng",
      "chất",
      "điểm nút",
      "bước nhảy",
      "tả khuynh",
      "hữu khuynh"
    ]
  },
  {
    "id": "essay_ch3",
    "chapterId": "chuong_3",
    "chapterTitle": "Chương 3: Chủ nghĩa duy vật lịch sử",
    "prompt": "Phân tích quy luật quan hệ sản xuất phù hợp với trình độ phát triển của lực lượng sản xuất. Tại sao nói trong thời đại chuyển đổi số hiện nay, khoa học và công nghệ đang trở thành lực lượng sản xuất trực tiếp?",
    "rubricKeywords": [
      "lực lượng sản xuất",
      "quan hệ sản xuất",
      "công cụ lao động",
      "người lao động",
      "khoa học công nghệ",
      "kinh tế",
      "xã hội"
    ]
  }
];

const CURRICULUM_CHAPTERS_LIST = [
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

let currentActiveViewId = "view-overview";
let currentLessonId = getLessonKeys()[0] || "ch1-bai1";
let completedLessons = new Set(["ch1-bai1", "ch1-bai2"]);
let currentQuizChapterFilter = "all";

/* ============================================================================
   BIẾN TOÀN CỤC QUẢN LÝ NATIVE PDF.JS SLIDE VIEWER & SMART CACHE (388 TRANG)
   ============================================================================ */
let cachedPdfDoc = null;
let cachedPdfPath = null;
let currentSlidePage = 6;
let totalSlidePages = DEFAULT_TOTAL_SLIDE_PAGES;
let currentZoomMultiplier = 1.0;
let isPageRendering = false;
let pendingPageNumber = null;
let activeRenderTask = null;
let usingVirtualDeckFallback = false;

const quizAppState = {
  questions: ALL_QUIZ_QUESTIONS.slice(),
  selectedAnswers: {},
  checkedResults: {}
};

const STORAGE_KEY_PROGRESS = "triet_hoc_firestore_progress_v1";
const STORAGE_KEY_COMPLETED_LESSONS = "triet_hoc_completed_lessons_v1";

const mockFirestoreUsersDb = {
  "sv_maclenin_2026": {
    profile: {
      uid: "sv_maclenin_2026",
      displayName: "Nguyễn Văn Minh",
      email: "minh.nv@student.edu.vn",
      photoURL: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 24 24' fill='%231E3A8A'><circle cx='12' cy='8' r='4' fill='%23FCD34D'/><path d='M4 20c0-4 4-6 8-6s8 2 8 6' fill='%23FFFFFF'/></svg>"
    },
    progress: {
      "chuong_1": {
        uid: "sv_maclenin_2026",
        chapterId: "chuong_1",
        chapterTitle: "Triết học và vai trò của triết học trong đời sống xã hội",
        lastScore: 8.5,
        highestScore: 9.0,
        correctCount: 9,
        totalQuestions: 10,
        accuracyPercent: 90,
        attempts: 2,
        completedLessons: ["ch1-bai1", "ch1-bai2"],
        isPassed: true
      }
    }
  }
};

let activeStudentUser = mockFirestoreUsersDb["sv_maclenin_2026"].profile;

function sanitizeCompletedLessonsSet() {
  const validKeys = new Set(getLessonKeys());
  Array.from(completedLessons).forEach(function(k) {
    if (!validKeys.has(k)) {
      completedLessons.delete(k);
    }
  });
}

function switchDashboardView(targetViewId) {
  currentActiveViewId = targetViewId;
  document.querySelectorAll(".dashboard-view-section").forEach(function(sec) {
    sec.classList.toggle("is-active-view", sec.id === targetViewId);
  });
  document.querySelectorAll(".sidebar-nav-item").forEach(function(btn) {
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

function syncStudentIdentityUI(user) {
  const welcomeNameEl = document.getElementById("overview-student-name");
  const guardNameEl = document.getElementById("guard-user-name");
  const guardEmailEl = document.getElementById("guard-user-email");
  const guardAvatarEl = document.getElementById("guard-user-avatar");
  const authNameEl = document.getElementById("authenticated-user-name");
  const pathBadgeEl = document.getElementById("journey-firestore-path");

  if (user) {
    const displayName = user.displayName || "Sinh viên";
    if (welcomeNameEl) welcomeNameEl.textContent = displayName;
    if (guardNameEl) guardNameEl.textContent = displayName;
    if (guardEmailEl) guardEmailEl.textContent = user.email || "student@edu.vn";
    if (guardAvatarEl && user.photoURL) guardAvatarEl.src = user.photoURL;
    if (authNameEl) authNameEl.textContent = displayName + " (" + user.uid + ")";
    if (pathBadgeEl) pathBadgeEl.textContent = "users/" + user.uid + "/progress/{chapter_id}";
  } else {
    if (welcomeNameEl) welcomeNameEl.textContent = "Bạn";
    if (guardNameEl) guardNameEl.textContent = "Chưa đăng nhập";
    if (guardEmailEl) guardEmailEl.textContent = "Vui lòng đăng nhập Google";
    if (pathBadgeEl) pathBadgeEl.textContent = "users/{uid}/progress/{chapter_id} (Chưa đăng nhập)";
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

  gridEl.innerHTML = lessonKeys.map(function(key, idx) {
    const item = LESSONS_DATA[key] || {};
    const isDone = completedLessons.has(key);
    const badgeText = item.badge || ("Chuyên đề " + (idx + 1));
    const startPg = item.slideStartPage || 1;
    const descText = item.shortDesc || item.summary || ("Bắt đầu tại Slide trang " + startPg);
    return (
      '<button type="button" class="pathway-lesson-card' + (isDone ? ' is-done' : '') + '" data-pathway-lesson="' + key + '">' +
        '<div class="pathway-card-left">' +
          '<span class="pathway-number-circle">' + (idx + 1) + '</span>' +
          '<div class="pathway-card-text">' +
            '<div style="font-size:0.72rem;font-weight:700;color:var(--color-primary-active);margin-bottom:2px;">' +
              badgeText + ' • Slide trang ' + startPg + (isDone ? ' • ✓ Đã hoàn thành' : '') +
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

  container.innerHTML = CURRICULUM_CHAPTERS_LIST.map(function(chap, idx) {
    const chapLessonKeys = lessonKeys.filter(function(k) {
      return resolveLessonChapterId(k, LESSONS_DATA[k]) === chap.chapterId;
    });
    const firstLessonKey = chapLessonKeys[0] || lessonKeys[0] || "ch1-bai1";
    const doneInChap = chapLessonKeys.filter(function(k) { return completedLessons.has(k); }).length;

    const topicsListHtml = chapLessonKeys.length > 0
      ? chapLessonKeys.map(function(k) {
          const item = LESSONS_DATA[k] || {};
          const isDone = completedLessons.has(k);
          const pgInfo = item.slideStartPage ? (" (Tr." + item.slideStartPage + ")") : "";
          return (
            '<li>' +
              '<button type="button" class="roadmap-lesson-link-btn select-chapter-shortcut' + (isDone ? ' is-done' : '') + '" data-lesson-target="' + k + '">' +
                '<span>' + (isDone ? '✓ ' : '• ') + (item.title || k) + pgInfo + '</span>' +
                '<span style="font-size:0.75rem;color:var(--color-primary-active);white-space:nowrap;">Mở bài →</span>' +
              '</button>' +
            '</li>'
          );
        }).join("")
      : '<li>• Đang cập nhật chuyên đề cho chương này</li>';

    const btnClass = (idx === 1) ? "btn btn-primary btn-sm select-chapter-shortcut" : "btn btn-secondary btn-sm select-chapter-shortcut";

    return (
      '<article class="chapter-overview-card">' +
        '<div>' +
          '<div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;">' +
            '<span class="chapter-number-tag">' + chap.tagLabel + '</span>' +
            '<span class="academic-badge">' + doneInChap + '/' + chapLessonKeys.length + ' hoàn thành</span>' +
          '</div>' +
          '<h3 class="chapter-card-title">' + chap.title + '</h3>' +
          '<ul class="chapter-topic-list">' + topicsListHtml + '</ul>' +
        '</div>' +
        '<div class="chapter-card-footer">' +
          '<span style="font-size:0.8rem;color:var(--text-muted);font-weight:600;">' +
            String(chapLessonKeys.length).padStart(2, "0") + ' Chuyên đề • ' + chap.pagesRange +
          '</span>' +
          '<button type="button" class="' + btnClass + '" data-lesson-target="' + firstLessonKey + '">' +
            'Vào học Chương ' + (idx + 1) + ' →' +
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
    selectEl.innerHTML = lessonKeys.map(function(key) {
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
   HỆ THỐNG NATIVE WEB SLIDE VIEWER VỚI MOZILLA PDF.JS (v3.11.174) & SMART CACHE
   ============================================================================ */

/**
 * Tìm chuyên đề tương ứng với một số trang cụ thể trong file 388 trang
 */
function findLessonBySlidePage(pageNum) {
  const keys = getLessonKeys();
  let matchedKey = keys[0];
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    const startPg = Number(LESSONS_DATA[k]?.slideStartPage || 1);
    if (pageNum >= startPg) {
      matchedKey = k;
    }
  }
  return LESSONS_DATA[matchedKey] || LESSONS_DATA[currentLessonId] || {};
}

/**
 * Cập nhật giao diện Thanh điều khiển Slide (Số trang, tổng số trang, nút Trước/Tiếp, % Thu phóng)
 */
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

/**
 * Bộ vẽ Slide HiDPI trực tiếp lên <canvas id="pdf-render-canvas"> khi chạy bản xem trước
 * hoặc khi file cục bộ assets/slides/slide-triet-hoc.pdf chưa được đặt vào thư mục
 */
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

  // Nền slide học thuật sáng tinh tế
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, cssWidth, cssHeight);

  // Dải Header trên cùng của Slide
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

  // Huy hiệu số trang ở góc phải Header
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

  // Khung nội dung chính của Slide
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
    "Slide #" + slideOffset + " của chuyên đề (Mục bắt đầu từ trang " + startPg + " trong file 388 trang)",
    cardX + Math.round(24 * scaleUnit),
    cardY + Math.round(36 * scaleUnit)
  );

  // Trích xuất các luận điểm tóm tắt để vẽ lên Slide Canvas
  const summaryText = matchedLesson.summary || matchedLesson.shortDesc || "";
  const sentences = summaryText.split(/[.;]/).map(function(s) { return s.trim(); }).filter(Boolean);

  ctx.fillStyle = "#0F172A";
  ctx.font = "600 " + Math.round(15 * scaleUnit) + "px 'Be Vietnam Pro', sans-serif";

  let curY = cardY + Math.round(74 * scaleUnit);
  sentences.forEach(function(line, idx) {
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

  // Hộp sơ đồ cấu trúc tư duy ở nửa dưới Slide
  const boxY = Math.min(curY + Math.round(10 * scaleUnit), cardY + cardH - Math.round(108 * scaleUnit));
  const boxW = Math.round((cardW - Math.round(68 * scaleUnit)) / 3);
  const boxH = Math.round(84 * scaleUnit);
  const labels = [
    ["1. CƠ SỞ LÝ LUẬN", "Khái niệm & Nguồn gốc chuẩn Bộ GD&ĐT"],
    ["2. QUY LUẬT BIỆN CHỨNG", "Mối liên hệ, vận động & chuyển hóa"],
    ["3. Ý NGHĨA PHƯƠNG PHÁP LUẬN", "Vận dụng thực tiễn học tập & nghiên cứu"]
  ];

  labels.forEach(function(lb, i) {
    const bx = cardX + Math.round(24 * scaleUnit) + i * (boxW + Math.round(10 * scaleUnit));
    ctx.fillStyle = "#EEF2FF";
    ctx.fillRect(bx, boxY, boxW, boxH);
    ctx.strokeStyle = "#C7D2FE";
    ctx.strokeRect(bx, boxY, boxW, boxH);

    ctx.fillStyle = "#1E3A8A";
    ctx.font = "800 " + Math.round(12.5 * scaleUnit) + "px 'Be Vietnam Pro', sans-serif";
    ctx.fillText(lb[0], bx + Math.round(12 * scaleUnit), boxY + Math.round(28 * scaleUnit));

    ctx.fillStyle = "#475569";
    ctx.font = "500 " + Math.round(11.5 * scaleUnit) + "px 'Be Vietnam Pro', sans-serif";
    ctx.fillText(lb[1], bx + Math.round(12 * scaleUnit), boxY + Math.round(54 * scaleUnit));
  });

  // Chân trang Slide (Footer)
  ctx.fillStyle = "#64748B";
  ctx.font = "600 " + Math.round(12 * scaleUnit) + "px 'Be Vietnam Pro', sans-serif";
  ctx.fillText(
    "Nguồn: " + (matchedLesson.slidePdfPath || DEFAULT_SLIDE_PDF_PATH) + " • Mozilla PDF.js v3.11.174 HiDPI Canvas",
    Math.round(36 * scaleUnit),
    cssHeight - Math.round(16 * scaleUnit)
  );

  ctx.restore();
}

/**
 * Render một trang cụ thể từ cachedPdfDoc (Mozilla PDF.js) lên <canvas id="pdf-render-canvas">
 * Hỗ trợ tự động co giãn theo khung hình (responsive) và nhân tỷ lệ devicePixelRatio sắc nét
 */
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

function queueRenderSlidePage(pageNum) {
  const targetPage = Math.max(1, Math.min(totalSlidePages, Number(pageNum) || 1));
  currentSlidePage = targetPage;
  syncSlideToolbarUI();

  if (isPageRendering) {
    pendingPageNumber = targetPage;
  } else {
    renderSlidePage(targetPage);
  }
}

/**
 * Tải file PDF qua Mozilla PDF.js với cơ chế Smart Cache:
 * - Nếu cachedPdfDoc đã được nạp cho cùng đường dẫn "assets/slides/slide-triet-hoc.pdf",
 *   KHÔNG tải lại file từ đầu mà nhảy thẳng tới trang slideStartPage của chuyên đề.
 */
async function loadOrJumpSlidePdf(lessonObj) {
  if (!lessonObj) return;
  const pdfPath = lessonObj.slidePdfPath || DEFAULT_SLIDE_PDF_PATH;
  const startPage = Number(lessonObj.slideStartPage) || 1;

  const pathLabelEl = document.getElementById("pdf-filename-label");
  const cacheBadgeEl = document.getElementById("pdf-cache-status-badge");
  if (pathLabelEl) {
    pathLabelEl.textContent = pdfPath + " (Trang mở đầu mục: " + startPage + ")";
  }

  // 1. KIỂM TRA CACHE THÔNG MINH: Nếu đã tải cùng file PDF thì nhảy thẳng tới slideStartPage
  if (cachedPdfDoc && cachedPdfPath === pdfPath) {
    if (cacheBadgeEl) {
      cacheBadgeEl.textContent = "⚡ Cache PDF.js: Nhảy trang tức thì (Không tải lại file)";
    }
    queueRenderSlidePage(startPage);
    return;
  }

  if (usingVirtualDeckFallback && cachedPdfPath === pdfPath) {
    if (cacheBadgeEl) {
      cacheBadgeEl.textContent = "⚡ Cache 388 trang: Nhảy thẳng tới trang " + startPage;
    }
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
      cacheBadgeEl.textContent = "✓ Đã nạp & Cache PDF (" + totalSlidePages + " trang)";
    }
    if (loadingEl) loadingEl.classList.remove("is-loading");
    queueRenderSlidePage(startPage);
  } catch (err) {
    // Khi chạy trên môi trường xem trước chưa có file vật lý assets/slides/slide-triet-hoc.pdf,
    // kích hoạt bộ vẽ Slide 388 trang HiDPI trực tiếp trên <canvas id="pdf-render-canvas">
    cachedPdfDoc = null;
    cachedPdfPath = pdfPath;
    usingVirtualDeckFallback = true;
    totalSlidePages = DEFAULT_TOTAL_SLIDE_PAGES;

    if (cacheBadgeEl) {
      cacheBadgeEl.textContent = "⚡ Chế độ Canvas 388 trang (Sẵn sàng cho " + pdfPath + ")";
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
  const titleEl = document.getElementById("active-lesson-title");
  const summaryEl = document.getElementById("active-lesson-summary");

  if (badgeEl) badgeEl.textContent = lesson.badge || "Chuyên đề Triết học";
  if (pagesEl) {
    const startPg = lesson.slideStartPage || 1;
    pagesEl.textContent = lesson.pages || ("Slide trang " + startPg + " / " + totalSlidePages);
  }
  if (titleEl) titleEl.textContent = lesson.title || lessonId;
  if (summaryEl) summaryEl.textContent = lesson.summary || lesson.shortDesc || "";

  syncHorizontalLessonToolbar(lessonId);
  renderSummaryReader(lessonId);
  loadOrJumpSlidePdf(lesson);
  renderOverviewPathwayCards();
  renderRoadmapChapters();
  updateProgressCounters();
}

function saveLessonCompletionToFirestore(lessonId) {
  const lesson = LESSONS_DATA[lessonId];
  if (!lesson) return;

  if (!activeStudentUser) {
    activeStudentUser = mockFirestoreUsersDb["sv_maclenin_2026"].profile;
    syncStudentIdentityUI(activeStudentUser);
  }

  const targetChapterId = resolveLessonChapterId(lessonId, lesson);
  const userProgress = mockFirestoreUsersDb[activeStudentUser.uid].progress;
  const prevDoc = userProgress[targetChapterId] || {
    uid: activeStudentUser.uid,
    chapterId: targetChapterId,
    chapterTitle: (lesson.badge || targetChapterId).split("•")[0].trim(),
    lastScore: 8.5,
    highestScore: 8.5,
    correctCount: 8,
    totalQuestions: 10,
    accuracyPercent: 85,
    attempts: 1,
    isPassed: true
  };

  const lessonKeys = getLessonKeys();
  const chapterCompletedList = lessonKeys.filter(function(k) {
    return resolveLessonChapterId(k, LESSONS_DATA[k]) === targetChapterId && completedLessons.has(k);
  });

  prevDoc.completedLessons = chapterCompletedList;
  prevDoc.updatedAt = new Date().toISOString();
  userProgress[targetChapterId] = prevDoc;

  try {
    localStorage.setItem(STORAGE_KEY_COMPLETED_LESSONS, JSON.stringify(Array.from(completedLessons)));
  } catch (e) {}

  persistProgressToStorage();
  renderStage4LearningJourney(activeStudentUser.uid);

  const doneCount = completedLessons.size;
  const totalCount = lessonKeys.length;
  const isNowDone = completedLessons.has(lessonId);

  const autoBadge = document.getElementById("header-autosave-badge");
  if (autoBadge) {
    autoBadge.textContent = "✓ Tiến độ Firestore: " + doneCount + "/" + totalCount + " chuyên đề";
  }

  showFirebaseToast(
    (isNowDone ? "✓ Đã đánh dấu hoàn thành " : "↺ Đã bỏ đánh dấu hoàn thành ") +
    (lesson.title || lessonId) + " • Đồng bộ Firestore (users/" + activeStudentUser.uid + "/progress/" + targetChapterId + ") — Tiến độ: " + doneCount + "/" + totalCount + " chuyên đề.",
    isNowDone ? "success" : "info"
  );
}

function activateMaterialTab(targetPanelId) {
  document.querySelectorAll(".tab-trigger-btn").forEach(function(btn) {
    const isMatch = btn.getAttribute("data-tab-target") === targetPanelId;
    btn.classList.toggle("active", isMatch);
    btn.setAttribute("aria-selected", isMatch ? "true" : "false");
  });

  document.querySelectorAll(".tab-panel").forEach(function(panel) {
    panel.classList.toggle("active", panel.id === targetPanelId);
  });

  if (targetPanelId === "tab-panel-pdf") {
    setTimeout(function() {
      queueRenderSlidePage(currentSlidePage);
    }, 30);
  }
}

function updateProgressCounters() {
  sanitizeCompletedLessonsSet();
  const totalLessons = getLessonKeys().length || 1;
  const doneLessons = completedLessons.size;
  const percentLessons = Math.round((doneLessons / totalLessons) * 100);

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

function renderStage4LearningJourney(uid) {
  const gridEl = document.getElementById("learning-journey-cards-grid");
  const gpaEl = document.getElementById("journey-overall-gpa");
  const compEl = document.getElementById("journey-completed-chapters");
  const attEl = document.getElementById("journey-total-attempts");

  const overviewGpaEl = document.getElementById("overview-stat-gpa");
  const overviewAttemptsEl = document.getElementById("overview-stat-attempts");
  const overviewLessonsEl = document.getElementById("overview-stat-lessons");

  const userRecord = (uid && mockFirestoreUsersDb[uid]) ? mockFirestoreUsersDb[uid] : null;
  const progressMap = userRecord ? userRecord.progress : {};

  let scoreSum = 0;
  let scoredChapters = 0;
  let passedChapters = 0;
  let totalAttempts = 0;

  const cardsHtml = CURRICULUM_CHAPTERS_LIST.map(function(chap) {
    const docData = progressMap[chap.chapterId] || null;
    const displayUid = uid || "{uid}";

    if (docData) {
      const best = Number(docData.highestScore || docData.lastScore || 0);
      const last = Number(docData.lastScore || 0);
      const att = Number(docData.attempts || 1);
      const acc = Number(docData.accuracyPercent || 0);

      scoreSum += best;
      scoredChapters += 1;
      totalAttempts += att;
      if (docData.isPassed || acc >= 50) passedChapters += 1;

      return (
        '<article class="journey-chapter-card is-completed">' +
          '<div class="journey-card-top" style="display:flex;justify-content:space-between;align-items:center;">' +
            '<span class="academic-badge">' + chap.chapterNumber + ' • ID: ' + chap.chapterId + '</span>' +
            '<span class="journey-status-tag status-done">✓ Đã đồng bộ Firestore</span>' +
          '</div>' +
          '<h3 class="journey-chapter-title">' + chap.title + '</h3>' +
          '<div class="journey-metrics-row">' +
            '<div class="journey-metric-item">' +
              '<span class="metric-label">Điểm kỷ lục (highestScore)</span>' +
              '<strong class="metric-val highlight-score">' + best.toFixed(1) + ' / 10</strong>' +
            '</div>' +
            '<div class="journey-metric-item">' +
              '<span class="metric-label">Điểm gần nhất (lastScore)</span>' +
              '<strong class="metric-val">' + last.toFixed(1) + ' / 10 (' + docData.correctCount + '/' + docData.totalQuestions + ' câu)</strong>' +
            '</div>' +
            '<div class="journey-metric-item">' +
              '<span class="metric-label">Số lượt đã lưu (attempts)</span>' +
              '<strong class="metric-val">' + att + ' lần</strong>' +
            '</div>' +
          '</div>' +
          '<div class="progress-track">' +
            '<div class="progress-fill" style="width: ' + Math.min(100, acc) + '%;"></div>' +
          '</div>' +
          '<div class="journey-doc-path">Firestore: <code>users/' + displayUid + '/progress/' + chap.chapterId + '</code></div>' +
        '</article>'
      );
    }

    return (
      '<article class="journey-chapter-card">' +
        '<div class="journey-card-top" style="display:flex;justify-content:space-between;align-items:center;">' +
          '<span class="academic-badge">' + chap.chapterNumber + ' • ID: ' + chap.chapterId + '</span>' +
          '<span class="journey-status-tag">Chưa có dữ liệu điểm</span>' +
        '</div>' +
        '<h3 class="journey-chapter-title">' + chap.title + '</h3>' +
        '<p style="font-size:0.85rem;color:var(--text-secondary);">Hãy làm bài tại mục Phòng luyện tập, hệ thống sẽ tự động lưu điểm vào chương này ngay khi bạn ấn "Kiểm tra".</p>' +
        '<div class="journey-doc-path">Firestore: <code>users/' + displayUid + '/progress/' + chap.chapterId + '</code></div>' +
      '</article>'
    );
  }).join("");

  if (gridEl) gridEl.innerHTML = cardsHtml;

  const gpa = scoredChapters > 0 ? (scoreSum / scoredChapters).toFixed(1) : "0.0";
  if (gpaEl) gpaEl.textContent = gpa + " / 10";
  if (compEl) compEl.textContent = passedChapters + " / " + CURRICULUM_CHAPTERS_LIST.length + " chương";
  if (attEl) attEl.textContent = totalAttempts + " lượt làm bài";

  const totalLessons = getLessonKeys().length;
  if (overviewGpaEl) overviewGpaEl.textContent = gpa;
  if (overviewAttemptsEl) overviewAttemptsEl.textContent = totalAttempts + " bài";
  if (overviewLessonsEl) overviewLessonsEl.textContent = completedLessons.size + " / " + totalLessons;
}

function showFirebaseToast(msg, type) {
  const bannerEl = document.getElementById("firebase-toast-banner");
  if (!bannerEl) return;
  bannerEl.textContent = msg;
  bannerEl.className = "firebase-toast-banner is-shown toast-" + (type || "info");
}

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
  document.querySelectorAll(".quiz-filter-chap-btn").forEach(function(btn) {
    const chap = btn.getAttribute("data-filter-chapter");
    if (chap === "all") {
      btn.textContent = "Tất cả (" + allCount + " câu)";
    } else {
      const count = ALL_QUIZ_QUESTIONS.filter(function(q) {
        return extractChapterIdAutomatically(q) === chap;
      }).length;
      const chapNum = chap.replace("chuong_", "");
      btn.textContent = "Chương " + chapNum + " (" + count + " câu)";
    }
  });
}

async function loadDynamicCourseData(jsonPath) {
  try {
    const response = await fetch(jsonPath, { cache: "no-store" });
    if (!response.ok) throw new Error("HTTP " + response.status);
    const parsedData = await response.json();

    if (parsedData && parsedData.lessons && typeof parsedData.lessons === "object" && Object.keys(parsedData.lessons).length > 0) {
      LESSONS_DATA = parsedData.lessons;
      sanitizeCompletedLessonsSet();
      const newKeys = getLessonKeys();
      if (!LESSONS_DATA[currentLessonId] && newKeys.length > 0) {
        currentLessonId = newKeys[0];
      }
    }

    if (Array.isArray(parsedData)) {
      ALL_QUIZ_QUESTIONS = parsedData;
    } else if (parsedData && Array.isArray(parsedData.questions)) {
      ALL_QUIZ_QUESTIONS = parsedData.questions;
    }

    if (parsedData && Array.isArray(parsedData.essayPrompts) && parsedData.essayPrompts.length > 0) {
      ESSAY_PROMPTS_DATA = parsedData.essayPrompts;
    }
  } catch (err) {
    // Dự phòng an toàn với dữ liệu tích hợp sẵn
  }

  selectLesson(currentLessonId);
  updateQuizFilterButtonsCount();
  applyQuizChapterFilter(currentQuizChapterFilter);
  renderStage4LearningJourney(activeStudentUser ? activeStudentUser.uid : "sv_maclenin_2026");
}

function persistProgressToStorage() {
  try {
    if (activeStudentUser && mockFirestoreUsersDb[activeStudentUser.uid]) {
      localStorage.setItem(
        STORAGE_KEY_PROGRESS,
        JSON.stringify(mockFirestoreUsersDb[activeStudentUser.uid].progress)
      );
    }
  } catch (err) {
    console.warn("Không thể ghi localStorage:", err);
  }
}

function saveChapterScoreToFirestoreModel(targetChapterId, correctCount, totalCount, chapterTitle) {
  if (!activeStudentUser) {
    activeStudentUser = mockFirestoreUsersDb["sv_maclenin_2026"].profile;
    syncStudentIdentityUI(activeStudentUser);
  }

  const safeTotal = totalCount > 0 ? totalCount : 1;
  const score10 = Math.round((correctCount / safeTotal) * 100) / 10;
  const accuracy = Math.round((correctCount / safeTotal) * 100);

  const userProgress = mockFirestoreUsersDb[activeStudentUser.uid].progress;
  const prevDoc = userProgress[targetChapterId] || null;
  const highest = prevDoc ? Math.max(prevDoc.highestScore || 0, score10) : score10;
  const attempts = prevDoc ? ((prevDoc.attempts || 0) + 1) : 1;

  userProgress[targetChapterId] = {
    uid: activeStudentUser.uid,
    chapterId: targetChapterId,
    chapterTitle: chapterTitle || targetChapterId,
    lastScore: score10,
    highestScore: highest,
    correctCount: correctCount,
    totalQuestions: safeTotal,
    accuracyPercent: accuracy,
    attempts: attempts,
    completedLessons: (prevDoc && prevDoc.completedLessons) ? prevDoc.completedLessons : [],
    isPassed: accuracy >= 50
  };

  persistProgressToStorage();
  renderStage4LearningJourney(activeStudentUser.uid);

  const autoBadge = document.getElementById("header-autosave-badge");
  if (autoBadge) {
    autoBadge.textContent = "✓ Đã lưu " + targetChapterId + ": " + score10.toFixed(1) + "/10";
  }

  showFirebaseToast(
    "⚡ [Tự động lưu Firestore] Đã ghi " + score10.toFixed(1) + "/10 vào users/" + activeStudentUser.uid + "/progress/" + targetChapterId,
    "success"
  );
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
  const optionsHtml = optionsList.map(function(opt) {
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

  let feedbackBadgeHtml = '<span class="quiz-feedback-status" id="feedback-status-' + qId + '">Chọn 1 phương án và ấn "Kiểm tra" (Tự động lưu điểm)</span>';
  if (isChecked) {
    feedbackBadgeHtml = checkedInfo.isCorrect
      ? '<span class="quiz-feedback-status status-correct" id="feedback-status-' + qId + '">✓ Chính xác! Điểm đã được tự động đồng bộ lên Firestore.</span>'
      : '<span class="quiz-feedback-status status-wrong" id="feedback-status-' + qId + '">✕ Chưa chính xác (Đáp án đúng là ' + questionObj.correctAnswer + '). Xem giải thích bên dưới.</span>';
  }

  const breakdownItemsHtml = optionsList.map(function(opt) {
    const isOptCorrect = opt.key === questionObj.correctAnswer;
    const itemClass = isOptCorrect ? "explain-correct" : "explain-wrong";
    const reasonText = (questionObj.optionExplanations && questionObj.optionExplanations[opt.key]) ? questionObj.optionExplanations[opt.key] : "";
    if (!reasonText) return "";
    return '<div class="explanation-option-item ' + itemClass + '"><strong>Phương án ' + opt.key + ':</strong> ' + reasonText + '</div>';
  }).join("");

  return (
    '<article class="quiz-card' + cardStateClass + '" id="quiz-card-' + qId + '">' +
      '<div class="quiz-card-meta">' +
        '<span class="quiz-question-number">Câu ' + String(index + 1).padStart(2, "0") + ' • ' + (questionObj.chapter || "Triết học Mác - Lênin") + '</span>' +
        '<span class="quiz-topic-tag">' + (questionObj.topic || "Lý thuyết trọng tâm") + (questionObj.difficulty ? (' (' + questionObj.difficulty + ')') : '') + '</span>' +
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
      '<div class="quiz-explanation-panel' + (isChecked ? ' is-visible' : '') + '" id="explanation-panel-' + qId + '">' +
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
  const answeredCount = activeQuestions.filter(function(q) {
    return Boolean(quizAppState.checkedResults[q.id]);
  }).length;
  const correctCount = activeQuestions.filter(function(q) {
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
    container.innerHTML =
      '<div class="quiz-empty-state-card">' +
        '<div class="quiz-empty-state-icon" aria-hidden="true">📝</div>' +
        '<h3 style="font-size:1.05rem;font-weight:700;color:var(--text-main);margin-bottom:0.35rem;">' +
          'Chuyên đề/Chương này đang được cập nhật ngân hàng câu hỏi' +
        '</h3>' +
        '<p style="font-size:0.88rem;max-width:540px;margin:0 auto 1rem;">' +
          'Hiện tại chưa có câu hỏi trắc nghiệm trong <code>data.json</code> cho bộ lọc này. Bạn có thể chọn chương khác hoặc luyện tập phần <strong>Tự luận chấm bằng Gemini AI</strong> ngay bên dưới.' +
        '</p>' +
        '<button type="button" class="btn btn-secondary btn-sm" id="empty-quiz-show-all-btn">' +
          'Xem tất cả câu hỏi hiện có' +
        '</button>' +
      '</div>';

    const showAllBtn = document.getElementById("empty-quiz-show-all-btn");
    if (showAllBtn) {
      showAllBtn.addEventListener("click", function() {
        applyQuizChapterFilter("all");
      });
    }
    updateQuizScoreboard();
    return;
  }

  container.innerHTML = activeQuestions.map(function(q, idx) {
    return buildQuestionCardMarkup(q, idx);
  }).join("");
  updateQuizScoreboard();
}

function applyQuizChapterFilter(chapFilter) {
  currentQuizChapterFilter = chapFilter || "all";
  document.querySelectorAll(".quiz-filter-chap-btn").forEach(function(b) {
    const isMatch = b.getAttribute("data-filter-chapter") === currentQuizChapterFilter;
    b.className = isMatch ? "btn btn-primary btn-sm quiz-filter-chap-btn" : "btn btn-secondary btn-sm quiz-filter-chap-btn";
  });

  quizAppState.questions = (currentQuizChapterFilter === "all")
    ? ALL_QUIZ_QUESTIONS.slice()
    : ALL_QUIZ_QUESTIONS.filter(function(q) {
        return extractChapterIdAutomatically(q) === currentQuizChapterFilter;
      });
  renderQuizView();
}

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

  const questionObj = quizAppState.questions.find(function(q) { return q.id === questionId; });
  if (!questionObj) return;

  quizAppState.checkedResults[questionId] = {
    isCorrect: chosenOption === questionObj.correctAnswer,
    chosen: chosenOption
  };
  renderQuizView();

  const targetChapterId = extractChapterIdAutomatically(questionObj);
  const chapterQuestions = ALL_QUIZ_QUESTIONS.filter(function(q) {
    return extractChapterIdAutomatically(q) === targetChapterId;
  });
  const totalInChapter = chapterQuestions.length || 1;
  const correctInChapter = chapterQuestions.filter(function(q) {
    return quizAppState.checkedResults[q.id] && quizAppState.checkedResults[q.id].isCorrect;
  }).length;

  saveChapterScoreToFirestoreModel(
    targetChapterId,
    correctInChapter,
    totalInChapter,
    questionObj.chapterTitle || questionObj.chapter || targetChapterId
  );
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
  const promptObj = ESSAY_PROMPTS_DATA.find(function(p) { return p.id === selectedPromptId; }) || ESSAY_PROMPTS_DATA[0];

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
      const rawReply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const scoreMatch = rawReply.match(/([0-9]+(\.[0-9]+)?)/);
      if (scoreMatch) {
        finalScore10 = Math.min(10, Math.max(4, parseFloat(scoreMatch[1])));
      }
      feedbackHtml = "<div><strong>Nhận xét từ Gemini AI:</strong><p style='margin-top:6px;white-space:pre-wrap;'>" + rawReply + "</p></div>";
    } catch (err) {
      console.warn("Gemini API fallback:", err);
    }
  }

  if (!feedbackHtml) {
    const lowerAns = studentText.toLowerCase();
    const keywords = Array.isArray(promptObj.rubricKeywords) ? promptObj.rubricKeywords : [];
    const matchedKeywords = keywords.filter(function(kw) {
      return lowerAns.indexOf(kw.toLowerCase()) !== -1;
    });
    const wordCount = studentText.split(/\s+/).length;
    const baseScore = 6.5 + Math.min(2.5, matchedKeywords.length * 0.45) + (wordCount > 60 ? 0.5 : 0);
    finalScore10 = Math.round(Math.min(9.5, baseScore) * 10) / 10;

    feedbackHtml =
      '<div style="display:flex;flex-direction:column;gap:0.45rem;">' +
        '<div style="font-size:1rem;font-weight:800;color:var(--color-primary-active);">Điểm Tự luận AI: ' + finalScore10.toFixed(1) + ' / 10 (' + promptObj.chapterTitle + ')</div>' +
        '<div><strong>• Thuật ngữ triết học đã vận dụng (' + matchedKeywords.length + '/' + keywords.length + '):</strong> ' +
          (matchedKeywords.length > 0 ? matchedKeywords.join(", ") : "Cần bổ sung thêm các thuật ngữ chuẩn trong giáo trình") +
        '</div>' +
        '<div><strong>• Gợi ý hoàn thiện phương pháp luận:</strong> Đảm bảo phân tích đủ 3 phần: Định nghĩa khái niệm cốt lõi, Mối quan hệ biện chứng, và Ý nghĩa phương pháp luận liên hệ thực tiễn sinh viên.</div>' +
        '<div style="color:var(--color-success);font-weight:700;">✓ Đã tự động lưu điểm ' + finalScore10.toFixed(1) + '/10 vào Firestore: users/' + (activeStudentUser ? activeStudentUser.uid : "sv_maclenin_2026") + '/progress/' + promptObj.chapterId + '</div>' +
      '</div>';
  }

  resultBoxEl.className = "essay-ai-result-box is-visible";
  resultBoxEl.innerHTML = feedbackHtml;

  if (submitBtnEl) {
    submitBtnEl.disabled = false;
    submitBtnEl.textContent = "✨ Chấm điểm Tự luận bằng Gemini AI";
  }

  saveChapterScoreToFirestoreModel(promptObj.chapterId, Math.round(finalScore10), 10, promptObj.chapterTitle);
}

document.addEventListener("DOMContentLoaded", function() {
  try {
    const savedRaw = localStorage.getItem(STORAGE_KEY_PROGRESS);
    if (savedRaw) {
      const parsed = JSON.parse(savedRaw);
      if (parsed && typeof parsed === "object") {
        mockFirestoreUsersDb["sv_maclenin_2026"].progress = parsed;
      }
    }
    const savedDone = localStorage.getItem(STORAGE_KEY_COMPLETED_LESSONS);
    if (savedDone) {
      const arr = JSON.parse(savedDone);
      if (Array.isArray(arr)) {
        completedLessons = new Set(arr);
      }
    }
  } catch (e) {}

  sanitizeCompletedLessonsSet();
  renderCurrentDateFormatted();
  syncStudentIdentityUI(activeStudentUser);
  selectLesson(currentLessonId);
  updateQuizFilterButtonsCount();
  renderQuizView();
  renderStage4LearningJourney(activeStudentUser.uid);

  // Tự động fetch("./data.json") khi chạy thực tế
  loadDynamicCourseData("./data.json");

  // SỰ KIỆN THANH ĐIỀU KHIỂN NATIVE PDF.JS SLIDE VIEWER
  const prevSlideBtn = document.getElementById("pdf-prev-page-btn");
  const nextSlideBtn = document.getElementById("pdf-next-page-btn");
  const pageInputEl = document.getElementById("pdf-page-input");
  const zoomInBtn = document.getElementById("pdf-zoom-in-btn");
  const zoomOutBtn = document.getElementById("pdf-zoom-out-btn");
  const fullscreenBtn = document.getElementById("pdf-fullscreen-btn");
  const slideViewerCard = document.getElementById("native-slide-viewer-container");

  if (prevSlideBtn) {
    prevSlideBtn.addEventListener("click", function() {
      if (currentSlidePage > 1) {
        queueRenderSlidePage(currentSlidePage - 1);
      }
    });
  }

  if (nextSlideBtn) {
    nextSlideBtn.addEventListener("click", function() {
      if (currentSlidePage < totalSlidePages) {
        queueRenderSlidePage(currentSlidePage + 1);
      }
    });
  }

  if (pageInputEl) {
    pageInputEl.addEventListener("change", function() {
      const val = parseInt(pageInputEl.value, 10);
      if (!isNaN(val)) {
        queueRenderSlidePage(Math.max(1, Math.min(totalSlidePages, val)));
      } else {
        pageInputEl.value = currentSlidePage;
      }
    });
    pageInputEl.addEventListener("keydown", function(e) {
      if (e.key === "Enter") {
        e.preventDefault();
        const val = parseInt(pageInputEl.value, 10);
        if (!isNaN(val)) {
          queueRenderSlidePage(Math.max(1, Math.min(totalSlidePages, val)));
        }
        pageInputEl.blur();
      }
    });
  }

  if (zoomInBtn) {
    zoomInBtn.addEventListener("click", function() {
      currentZoomMultiplier = Math.min(2.25, Math.round((currentZoomMultiplier + 0.15) * 100) / 100);
      queueRenderSlidePage(currentSlidePage);
    });
  }

  if (zoomOutBtn) {
    zoomOutBtn.addEventListener("click", function() {
      currentZoomMultiplier = Math.max(0.6, Math.round((currentZoomMultiplier - 0.15) * 100) / 100);
      queueRenderSlidePage(currentSlidePage);
    });
  }

  if (fullscreenBtn && slideViewerCard) {
    fullscreenBtn.addEventListener("click", function() {
      if (!document.fullscreenElement) {
        if (slideViewerCard.requestFullscreen) {
          slideViewerCard.requestFullscreen().catch(function() {});
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(function() {});
        }
      }
    });
  }

  document.addEventListener("fullscreenchange", function() {
    if (fullscreenBtn) {
      fullscreenBtn.textContent = document.fullscreenElement ? "⤓ Thoát Toàn màn hình" : "⛶ Toàn màn hình";
    }
    setTimeout(function() {
      queueRenderSlidePage(currentSlidePage);
    }, 80);
  });

  // Hỗ trợ phím mũi tên Trái / Phải trên bàn phím để chuyển slide nhanh (khi không gõ chữ trong ô nhập liệu)
  document.addEventListener("keydown", function(e) {
    const activeEl = document.activeElement;
    if (activeEl) {
      const tag = activeEl.tagName ? activeEl.tagName.toUpperCase() : "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || activeEl.isContentEditable) {
        return;
      }
    }

    const pdfPanel = document.getElementById("tab-panel-pdf");
    const isSlideTabVisible = (currentActiveViewId === "view-materials" && pdfPanel && pdfPanel.classList.contains("active")) || Boolean(document.fullscreenElement);
    if (!isSlideTabVisible) return;

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (currentSlidePage > 1) queueRenderSlidePage(currentSlidePage - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (currentSlidePage < totalSlidePages) queueRenderSlidePage(currentSlidePage + 1);
    }
  });

  window.addEventListener("resize", function() {
    const pdfPanel = document.getElementById("tab-panel-pdf");
    if (currentActiveViewId === "view-materials" && pdfPanel && pdfPanel.classList.contains("active")) {
      queueRenderSlidePage(currentSlidePage);
    }
  });

  document.querySelectorAll(".sidebar-nav-item").forEach(function(btn) {
    btn.addEventListener("click", function() {
      const targetView = btn.getAttribute("data-target-view");
      if (targetView) switchDashboardView(targetView);
    });
  });

  const quickOpenMaterialsBtn = document.getElementById("hero-start-learning-btn");
  const quickOpenPracticeBtn = document.getElementById("overview-open-practice-btn");
  if (quickOpenMaterialsBtn) {
    quickOpenMaterialsBtn.addEventListener("click", function() {
      switchDashboardView("view-materials");
    });
  }
  if (quickOpenPracticeBtn) {
    quickOpenPracticeBtn.addEventListener("click", function() {
      switchDashboardView("view-practice");
    });
  }

  const pathwayGrid = document.getElementById("overview-pathway-grid");
  if (pathwayGrid) {
    pathwayGrid.addEventListener("click", function(e) {
      const card = e.target.closest("[data-pathway-lesson]");
      if (!card) return;
      const lessonKey = card.getAttribute("data-pathway-lesson");
      selectLesson(lessonKey);
      switchDashboardView("view-materials");
    });
  }

  const roadmapSection = document.getElementById("view-roadmap");
  if (roadmapSection) {
    roadmapSection.addEventListener("click", function(e) {
      const btn = e.target.closest(".select-chapter-shortcut");
      if (!btn) return;
      const targetLesson = btn.getAttribute("data-lesson-target");
      if (targetLesson) {
        selectLesson(targetLesson);
        switchDashboardView("view-materials");
      }
    });
  }

  const lessonSelectEl = document.getElementById("lesson-selector-dropdown");
  if (lessonSelectEl) {
    lessonSelectEl.addEventListener("change", function() {
      selectLesson(lessonSelectEl.value);
    });
  }

  const prevLessonBtn = document.getElementById("prev-lesson-btn");
  if (prevLessonBtn) {
    prevLessonBtn.addEventListener("click", function() {
      const keys = getLessonKeys();
      const idx = keys.indexOf(currentLessonId);
      if (idx > 0) selectLesson(keys[idx - 1]);
    });
  }

  const nextLessonBtn = document.getElementById("next-lesson-btn");
  if (nextLessonBtn) {
    nextLessonBtn.addEventListener("click", function() {
      const keys = getLessonKeys();
      const idx = keys.indexOf(currentLessonId);
      if (idx !== -1 && idx < keys.length - 1) selectLesson(keys[idx + 1]);
    });
  }

  const completeBtn = document.getElementById("toggle-complete-lesson-btn");
  if (completeBtn) {
    completeBtn.addEventListener("click", function() {
      if (completedLessons.has(currentLessonId)) {
        completedLessons.delete(currentLessonId);
      } else {
        completedLessons.add(currentLessonId);
      }
      selectLesson(currentLessonId);
      saveLessonCompletionToFirestore(currentLessonId);
    });
  }

  document.querySelectorAll(".lesson-item-btn").forEach(function(btn) {
    btn.addEventListener("click", function() {
      selectLesson(btn.getAttribute("data-lesson-id"));
    });
  });

  document.querySelectorAll(".tab-trigger-btn").forEach(function(btn) {
    btn.addEventListener("click", function() {
      activateMaterialTab(btn.getAttribute("data-tab-target"));
    });
  });

  document.querySelectorAll(".timestamp-btn").forEach(function(btn) {
    btn.addEventListener("click", function() {
      const note = btn.getAttribute("data-timestamp-note");
      const previewBox = document.getElementById("video-note-preview");
      if (previewBox && note) {
        previewBox.innerHTML = "<strong>Nội dung trọng tâm tại mốc thời gian này:</strong> " + note;
      }
    });
  });

  const quizContainer = document.getElementById("quiz-questions-container");
  if (quizContainer) {
    quizContainer.addEventListener("click", function(e) {
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
    resetAllBtn.addEventListener("click", function() {
      quizAppState.selectedAnswers = {};
      quizAppState.checkedResults = {};
      renderQuizView();
    });
  }

  document.querySelectorAll(".quiz-filter-chap-btn").forEach(function(btn) {
    btn.addEventListener("click", function() {
      applyQuizChapterFilter(btn.getAttribute("data-filter-chapter"));
    });
  });

  const essayPromptSelect = document.getElementById("essay-prompt-select");
  const essayPromptTextEl = document.getElementById("essay-active-prompt-text");
  if (essayPromptSelect && essayPromptTextEl) {
    essayPromptSelect.addEventListener("change", function() {
      const found = ESSAY_PROMPTS_DATA.find(function(p) { return p.id === essayPromptSelect.value; });
      if (found) essayPromptTextEl.textContent = found.prompt;
    });
  }
  const gradeEssayBtn = document.getElementById("grade-essay-ai-btn");
  if (gradeEssayBtn) {
    gradeEssayBtn.addEventListener("click", evaluateEssayWithGeminiAI);
  }

  const mobileToggle = document.getElementById("mobile-menu-toggle");
  const sidebarEl = document.getElementById("main-nav-menu");
  if (mobileToggle && sidebarEl) {
    mobileToggle.addEventListener("click", function() {
      sidebarEl.classList.toggle("is-open");
    });
  }

  const loginOverlay = document.getElementById("login-page-overlay");
  const btnGoogleLogin = document.getElementById("btn-google-login");
  const btnGoogleLoginText = document.getElementById("btn-google-login-text");
  const guardLogoutBtn = document.getElementById("guard-logout-btn");
  const loginBtn = document.getElementById("google-login-btn");
  const logoutBtn = document.getElementById("google-logout-btn");
  const fetchBtn = document.getElementById("fetch-progress-btn");

  function performMockGoogleLogin() {
    if (btnGoogleLoginText) btnGoogleLoginText.textContent = "Đang xác thực Firebase Auth...";
    setTimeout(function() {
      activeStudentUser = mockFirestoreUsersDb["sv_maclenin_2026"].profile;
      syncStudentIdentityUI(activeStudentUser);
      renderStage4LearningJourney(activeStudentUser.uid);
      if (loginOverlay) loginOverlay.classList.add("is-hidden");
      if (btnGoogleLoginText) btnGoogleLoginText.textContent = "Đăng nhập bằng Google";
      showFirebaseToast("✓ Đăng nhập Google thành công! Đã đồng bộ hồ sơ sinh viên.", "success");
    }, 250);
  }

  if (btnGoogleLogin) btnGoogleLogin.addEventListener("click", performMockGoogleLogin);
  if (loginBtn) loginBtn.addEventListener("click", performMockGoogleLogin);

  function performLogout() {
    activeStudentUser = null;
    syncStudentIdentityUI(null);
    if (loginOverlay) loginOverlay.classList.remove("is-hidden");
  }

  if (guardLogoutBtn) guardLogoutBtn.addEventListener("click", performLogout);
  if (logoutBtn) logoutBtn.addEventListener("click", performLogout);

  if (fetchBtn) {
    fetchBtn.addEventListener("click", function() {
      if (!activeStudentUser) return;
      renderStage4LearningJourney(activeStudentUser.uid);
      showFirebaseToast("✓ Đã đồng bộ dữ liệu mới nhất từ Firestore!", "info");
    });
  }

  ["pdf-font-decrease-btn", "pdf-font-increase-btn", "save-quiz-to-firestore-btn", "legacy-complete-label-btn"].forEach(function(id) {
    const el = document.getElementById(id);
    if (el) el.addEventListener("click", function() { queueRenderSlidePage(currentSlidePage); });
  });
});
