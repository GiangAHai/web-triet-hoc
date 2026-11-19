/**
 * ============================================================================
 * HỆ THỐNG E-LEARNING TRIẾT HỌC MÁC - LÊNIN (EDTECH DASHBOARD EDITION)
 * File: app.js
 * Chức năng đầy đủ 100%:
 *   1. Điều hướng 5 Tab trên Sidebar (Tổng quan, Học liệu, Luyện tập, Lộ trình, Hành trình).
 *   2. Không gian học liệu nâng cấp:
 *      - Thanh điều hướng ngang (<select> 6 chuyên đề + Bài trước/Bài tiếp theo + Đánh dấu hoàn thành đồng bộ Firestore).
 *      - Tab 1 (Mặc định mở): Đổ trực tiếp trường "summaryHtml" từ data.json vào <div id="summary-reader" class="summary-article">.
 *      - Tab 2: Nhúng trực tiếp Giáo trình chuẩn Bộ GD&ĐT (PDF) qua trường "textbookPdfLink" (width 100%, height calc(100vh - 235px)).
 *   3. Auth Guard & Đăng nhập Google (Firebase Auth + đồng bộ Tên & Avatar sinh viên).
 *   4. Tự động lưu điểm trắc nghiệm & tự luận lên Firestore: users/{uid}/progress/{chapter_id}.
 *   5. Chấm điểm tự luận bằng Gemini API kèm nhận xét học thuật chi tiết.
 * ============================================================================
 */

const GDRIVE_DEFAULT_PDF = "https://drive.google.com/file/d/1eFvBU8LjSScNjx-r9qTTzUHMYVrJmArq/preview";

const LESSONS_ORDER = ["ch1-bai1", "ch1-bai2", "ch2-bai1", "ch2-bai2", "ch3-bai1", "ch3-bai2"];

const LESSONS_DATA = {
  "ch1-bai1": {
    "chapterId": "chuong_1",
    "badge": "Chương 1 • Chuyên đề 1.1",
    "pages": "Giáo trình Bộ GD&ĐT: Trang 11 – 48",
    "title": "1.1. Triết học và vấn đề cơ bản của triết học",
    "summary": "Làm rõ nguồn gốc nhận thức và nguồn gốc xã hội của triết học; phân tích hai mặt của vấn đề cơ bản của triết học (bản thể luận và nhận thức luận), từ đó phân định chủ nghĩa duy vật và chủ nghĩa duy tâm.",
    "summaryHtml": "<div class=\"summary-doc-header\">\n  <span class=\"summary-kicker\">CHƯƠNG 1 • CHUYÊN ĐỀ 1.1 (TRANG 11 – 48)</span>\n  <h2>1.1. Triết học và vấn đề cơ bản của triết học</h2>\n  <p class=\"summary-lead\">Tóm tắt lý thuyết trọng tâm theo Giáo trình Triết học Mác - Lênin (Bộ Giáo dục và Đào tạo): Nguồn gốc ra đời của triết học, bản chất thế giới quan và hai mặt của vấn đề cơ bản của triết học.</p>\n</div>\n\n<h3>1. Khái lược về Triết học và Nguồn gốc ra đời</h3>\n<p>Triết học ra đời vào khoảng <strong>thế kỷ VIII đến thế kỷ VI trước Công nguyên (TCN)</strong> tại các trung tâm văn minh lớn của nhân loại cổ đại như Ấn Độ, Trung Hoa và Hy Lạp. Theo chiết tự tiếng Hy Lạp cổ, <em>Philosophia</em> có nghĩa là <strong>yêu mến sự thông thái</strong> — vừa mang tính định hướng nhận thức bản chất tối hậu của vũ trụ, vừa thể hiện khát vọng vươn tới chân lý của con người.</p>\n<ul>\n  <li><strong>Nguồn gốc nhận thức:</strong> Triết học chỉ xuất hiện khi kho tàng tri thức riêng lẻ của con người về tự nhiên và xã hội đã tích lũy đến một trình độ nhất định, đồng thời năng lực <em>tư duy trừu tượng, khái quát hóa</em> của con người đủ sức rút ra những quy luật chung nhất từ muôn vàn sự vật cụ thể.</li>\n  <li><strong>Nguồn gốc xã hội:</strong> Triết học ra đời khi nền sản xuất xã hội đã phát triển đến mức xuất hiện sự <strong>phân công lao động xã hội</strong> thành lao động chân tay và lao động trí óc, cùng với sự phân hóa giai cấp trong xã hội chiếm hữu nô lệ.</li>\n  <li><strong>Định nghĩa chuẩn:</strong> Triết học là hệ thống quan điểm lý luận chung nhất về thế giới và vị trí của con người trong thế giới đó; là khoa học về những quy luật vận động, phát triển chung nhất của tự nhiên, xã hội và tư duy.</li>\n</ul>\n\n<blockquote>\n  “Vấn đề cơ bản lớn của mọi triết học, đặc biệt là của triết học hiện đại, là vấn đề quan hệ giữa tư duy với tồn tại (giữa ý thức với vật chất, giữa tinh thần với giới tự nhiên).”\n  <cite>— Ph. Ăngghen (Lút-vích Phơ-bách và sự cáo chung của triết học cổ điển Đức)</cite>\n</blockquote>\n\n<h3>2. Nội dung hai mặt của Vấn đề cơ bản của Triết học</h3>\n<p>Mọi học thuyết triết học trong lịch sử, dù đa dạng đến đâu, đều phải trực tiếp hoặc gián tiếp giải quyết mối quan hệ giữa <strong>vật chất (tồn tại)</strong> và <strong>ý thức (tư duy)</strong> trên hai phương diện cốt lõi:</p>\n<ul>\n  <li><strong>Mặt thứ nhất (Bản thể luận):</strong> Trả lời câu hỏi: <em>Giữa ý thức và vật chất thì cái nào có trước, cái nào có sau, cái nào quyết định cái nào?</em>\n    <ul>\n      <li><strong>Chủ nghĩa duy vật (Materialism):</strong> Khẳng định bản chất thế giới là vật chất; vật chất là tính thứ nhất (có trước), ý thức là tính thứ hai (có sau), vật chất quyết định ý thức. Lịch sử chủ nghĩa duy vật trải qua 3 hình thức: <em>Chủ nghĩa duy vật chất phác cổ đại</em>, <em>Chủ nghĩa duy vật siêu hình thế kỷ XVII–XVIII</em>, và đỉnh cao là <em>Chủ nghĩa duy vật biện chứng</em> do C. Mác, Ph. Ăngghen sáng lập, V.I. Lênin phát triển.</li>\n      <li><strong>Chủ nghĩa duy tâm (Idealism):</strong> Khẳng định ý thức, tinh thần là tính thứ nhất, có trước và sản sinh ra giới tự nhiên. Chia thành 2 phái: <em>Duy tâm chủ quan</em> (coi cảm giác, ý thức cá nhân quyết định sự tồn tại của sự vật) và <em>Duy tâm khách quan</em> (coi “Ý niệm tuyệt đối”, “Tinh thần thế giới” tồn tại khách quan trước tự nhiên).</li>\n    </ul>\n  </li>\n  <li><strong>Mặt thứ hai (Nhận thức luận):</strong> Trả lời câu hỏi: <em>Con người có khả năng nhận thức được thế giới khách quan hay không?</em>\n    <ul>\n      <li><strong>Thuyết khả tri (Khả tri luận):</strong> Đa số các nhà triết học duy vật và duy tâm đều khẳng định con người về nguyên tắc hoàn toàn có thể nhận thức được bản chất và quy luật của sự vật.</li>\n      <li><strong>Thuyết bất khả tri (Bất khả tri luận):</strong> Phủ nhận khả năng nhận thức bản chất thế giới của con người (tiêu biểu là D. Hume, I. Kant), cho rằng con người chỉ biết được “hiện tượng” bề ngoài chứ không thể chạm tới “vật tự nó”.</li>\n    </ul>\n  </li>\n</ul>\n\n<h3>3. Sự đối lập giữa Phương pháp Biện chứng và Phương pháp Siêu hình</h3>\n<ul>\n  <li><strong>Phương pháp siêu hình:</strong> Nhận thức đối tượng ở trạng thái <em>cô lập, tách rời, tĩnh tại</em>; nếu có biến đổi thì chỉ là sự tăng giảm thuần túy về lượng do nguyên nhân bên ngoài (“cây gỗ chỉ là cây gỗ”).</li>\n  <li><strong>Phương pháp biện chứng:</strong> Nhận thức đối tượng trong các <em>mối liên hệ phổ biến vốn có</em> và trong trạng thái <em>vận động, biến đổi, phát triển không ngừng</em> cả về lượng lẫn về chất do sự đấu tranh của các mặt đối lập bên trong sự vật.</li>\n</ul>\n\n<div class=\"summary-takeaway-box\">\n  <strong>💡 Ý nghĩa phương pháp luận đối với sinh viên:</strong> Việc phân định rạch ròi hai mặt của vấn đề cơ bản của triết học giúp người học xác lập <strong>thế giới quan duy vật khoa học</strong>, kiên quyết xuất phát từ hiện thực khách quan trong nghiên cứu khoa học và học tập, đồng thời giữ vững niềm tin vào khả năng nhận thức, sáng tạo tri thức mới của nhân loại.\n</div>",
    "textbookPdfLink": "https://drive.google.com/file/d/1eFvBU8LjSScNjx-r9qTTzUHMYVrJmArq/preview",
    "pdfLink": "https://drive.google.com/file/d/1eFvBU8LjSScNjx-r9qTTzUHMYVrJmArq/preview",
    "pdfFile": "Giao-trinh-Triet-hoc-Mac-Lenin-Bo-GDDT.pdf",
    "videoUrl": "https://www.youtube-nocookie.com/embed/fH8tB2f9M2E?rel=0"
  },
  "ch1-bai2": {
    "chapterId": "chuong_1",
    "badge": "Chương 1 • Chuyên đề 1.2",
    "pages": "Giáo trình Bộ GD&ĐT: Trang 49 – 116",
    "title": "1.2. Triết học Mác - Lênin và vai trò trong đời sống xã hội",
    "summary": "Phân tích những điều kiện lịch sử, tiền đề khoa học tự nhiên và tiền đề lý luận cho sự ra đời của Triết học Mác; làm rõ chức năng thế giới quan và chức năng phương pháp luận.",
    "summaryHtml": "<div class=\"summary-doc-header\">\n  <span class=\"summary-kicker\">CHƯƠNG 1 • CHUYÊN ĐỀ 1.2 (TRANG 49 – 116)</span>\n  <h2>1.2. Triết học Mác - Lênin và vai trò trong đời sống xã hội</h2>\n  <p class=\"summary-lead\">Tóm tắt các điều kiện kinh tế - xã hội, nguồn gốc lý luận, tiền đề khoa học tự nhiên cho sự ra đời của Triết học Mác và hai chức năng cơ bản của Triết học Mác - Lênin.</p>\n</div>\n\n<h3>1. Những điều kiện lịch sử của sự ra đời Triết học Mác</h3>\n<p>Triết học Mác ra đời vào những năm 40 của thế kỷ XIX là một tất yếu lịch sử, hội tụ đầy đủ 3 điều kiện và tiền đề khách quan:</p>\n<ul>\n  <li><strong>Điều kiện kinh tế - xã hội:</strong> Sự củng cố và phát triển của phương thức sản xuất tư bản chủ nghĩa trong điều kiện cách mạng công nghiệp làm bộc lộ gay gắt mâu thuẫn giữa lực lượng sản xuất mang tính xã hội hóa cao với quan hệ sản xuất tư bản chủ nghĩa. Giai cấp vô sản bước lên vũ đài chính trị như một lực lượng độc lập (khởi nghĩa Lyon ở Pháp, phong trào Hiến chương ở Anh, khởi nghĩa Silesia ở Đức), đòi hỏi một học thuyết lý luận khoa học dẫn đường.</li>\n  <li><strong>Nguồn gốc lý luận trực tiếp:</strong> C. Mác và Ph. Ăngghen kế thừa có phê phán đỉnh cao tư tưởng nhân loại, trực tiếp nhất là <strong>Triết học cổ điển Đức</strong> (hạt nhân hợp lý trong phép biện chứng của <em>G.W.F. Hegel</em> và chủ nghĩa duy vật nhân bản của <em>L. Feuerbach</em>), Kinh tế chính trị học cổ điển Anh (A. Smith, D. Ricardo) và Chủ nghĩa xã hội không tưởng Pháp (Saint-Simon, Fourier).</li>\n  <li><strong>Tiền đề khoa học tự nhiên:</strong> Ba phát minh vĩ đại thế kỷ XIX đã đánh đổ quan niệm siêu hình và chứng minh tính thống nhất vật chất, vận động liên tục của giới tự nhiên:\n    <ul>\n      <li><em>Định luật bảo toàn và chuyển hóa năng lượng</em> (J.R. Mayer, J.P. Joule).</li>\n      <li><em>Học thuyết tế bào</em> (M.J. Schleiden và T. Schwann).</li>\n      <li><em>Học thuyết tiến hóa</em> (Charles Darwin).</li>\n    </ul>\n  </li>\n</ul>\n\n<blockquote>\n  “Các nhà triết học đã chỉ giải thích thế giới bằng nhiều cách khác nhau, song vấn đề là cải tạo thế giới.”\n  <cite>— C. Mác (Luận cương về Phơ-bách, 1845)</cite>\n</blockquote>\n\n<h3>2. Thực chất bước ngoặt cách mạng trong Triết học do C. Mác và Ph. Ăngghen thực hiện</h3>\n<ul>\n  <li><strong>Thống nhất Chủ nghĩa duy vật với Phép biện chứng:</strong> Khắc phục triệt để sự tách rời giữa chủ nghĩa duy vật siêu hình và phép biện chứng duy tâm trước đó để xây dựng <strong>Chủ nghĩa duy vật biện chứng</strong>.</li>\n  <li><strong>Sáng tạo ra Chủ nghĩa duy vật lịch sử:</strong> Lần đầu tiên trong lịch sử tư tưởng, C. Mác và Ph. Ăngghen mở rộng chủ nghĩa duy vật biện chứng vào việc nghiên cứu lĩnh vực xã hội, chỉ ra quy luật vận động khách quan của lịch sử thông qua học thuyết Hình thái kinh tế - xã hội.</li>\n  <li><strong>Thống nhất giữa Lý luận và Thực tiễn:</strong> Biến triết học từ vũ khí tinh thần giải thích thế giới thành công cụ khoa học để giai cấp công nhân và nhân dân lao động cải tạo thế giới.</li>\n</ul>\n\n<h3>3. Hai chức năng cơ bản của Triết học Mác - Lênin</h3>\n<ul>\n  <li><strong>Chức năng thế giới quan:</strong> Định hướng cho con người nhận thức đúng đắn thế giới hiện thực khách quan và vị trí, vai trò chủ thể của mình; xây dựng nhân sinh quan cách mạng, khoa học, chống lại mê tín dị đoan và thái độ bi quan, hoài nghi.</li>\n  <li><strong>Chức năng phương pháp luận:</strong> Trang bị hệ thống các nguyên tắc phương pháp luận chung nhất (<em>Nguyên tắc khách quan, Nguyên tắc toàn diện, Nguyên tắc phát triển, Nguyên tắc lịch sử - cụ thể</em>) cho hoạt động nhận thức khoa học và hoạt động thực tiễn.</li>\n</ul>\n\n<div class=\"summary-takeaway-box\">\n  <strong>💡 Ý nghĩa thực tiễn hiện nay:</strong> Trong bối cảnh Cách mạng công nghiệp lần thứ tư (4.0) và hội nhập quốc tế, Triết học Mác - Lênin là nền tảng tư tưởng giúp sinh viên phân tích đúng bản chất các biến động kinh tế - xã hội và giữ vững bản lĩnh khoa học.\n</div>",
    "textbookPdfLink": "https://drive.google.com/file/d/1eFvBU8LjSScNjx-r9qTTzUHMYVrJmArq/preview",
    "pdfLink": "https://drive.google.com/file/d/1eFvBU8LjSScNjx-r9qTTzUHMYVrJmArq/preview",
    "pdfFile": "Giao-trinh-Triet-hoc-Mac-Lenin-Bo-GDDT.pdf",
    "videoUrl": "https://www.youtube-nocookie.com/embed/fH8tB2f9M2E?rel=0"
  },
  "ch2-bai1": {
    "chapterId": "chuong_2",
    "badge": "Chương 2 • Chuyên đề 2.1",
    "pages": "Giáo trình Bộ GD&ĐT: Trang 117 – 182",
    "title": "2.1. Vật chất và ý thức; mối quan hệ biện chứng",
    "summary": "Phân tích định nghĩa kinh điển của V.I. Lênin về phạm trù Vật chất; nguồn gốc, bản chất của Ý thức; mối quan hệ biện chứng giữa vật chất và ý thức cùng nguyên tắc tôn trọng khách quan.",
    "summaryHtml": "<div class=\"summary-doc-header\">\n  <span class=\"summary-kicker\">CHƯƠNG 2 • CHUYÊN ĐỀ 2.1 (TRANG 117 – 182)</span>\n  <h2>2.1. Vật chất và ý thức; mối quan hệ biện chứng</h2>\n  <p class=\"summary-lead\">Tóm tắt định nghĩa kinh điển của V.I. Lênin về phạm trù Vật chất, nguồn gốc & bản chất của Ý thức, và nguyên tắc phương pháp luận Tôn trọng khách quan kết hợp phát huy tính năng động chủ quan.</p>\n</div>\n\n<h3>1. Phạm trù Vật chất và phương thức tồn tại của Vật chất</h3>\n<p>Cuối thế kỷ XIX - đầu thế kỷ XX, các phát minh vật lý học vi mô (tia X, hiện tượng phóng xạ, điện tử) làm khủng hoảng quan niệm duy vật siêu hình vốn đồng nhất vật chất với nguyên tử. Để bảo vệ và phát triển chủ nghĩa duy vật, V.I. Lênin đã đưa ra định nghĩa kinh điển:</p>\n\n<blockquote>\n  “Vật chất là một phạm trù triết học dùng để chỉ thực tại khách quan được đem lại cho con người trong cảm giác, được cảm giác của chúng ta chép lại, chụp lại, phản ánh, và tồn tại không lệ thuộc vào cảm giác.”\n  <cite>— V.I. Lênin (Chủ nghĩa duy vật và chủ nghĩa kinh nghiệm phê phán)</cite>\n</blockquote>\n\n<ul>\n  <li><strong>Thuộc tính cơ bản nhất của vật chất:</strong> Là thuộc tính <strong>tồn tại khách quan</strong> — tồn tại bên ngoài, độc lập và không phụ thuộc vào cảm giác, ý thức của con người, bất kể con người đã nhận thức được nó hay chưa.</li>\n  <li><strong>Phương thức và hình thức tồn tại của vật chất:</strong>\n    <ul>\n      <li><strong>Vận động:</strong> Là mọi sự biến đổi nói chung, là phương thức tồn tại và thuộc tính cố hữu của vật chất (bao gồm 5 hình thức: cơ học, vật lý, hóa học, sinh học, xã hội).</li>\n      <li><strong>Không gian và thời gian:</strong> Là những hình thức tồn tại khách quan của vật chất đang vận động.</li>\n    </ul>\n  </li>\n</ul>\n\n<h3>2. Nguồn gốc và Bản chất của Ý thức</h3>\n<ul>\n  <li><strong>Nguồn gốc tự nhiên (Điều kiện cần):</strong> Gồm hai yếu tố không tách rời là <em>bộ óc con người</em> (cơ quan vật chất có tổ chức cao nhất) và <em>thế giới khách quan</em> tác động lên bộ óc tạo ra quá trình phản ánh.</li>\n  <li><strong>Nguồn gốc xã hội (Điều kiện đủ và quyết định trực tiếp):</strong> Gồm <strong>Lao động</strong> và <strong>Ngôn ngữ</strong>. Lao động giúp con người cải tạo tự nhiên, hoàn thiện giác quan và bộ óc; Ngôn ngữ là <em>“cái vỏ vật chất của tư duy”</em>, giúp con người khái quát hóa, trừu tượng hóa và truyền đạt kinh nghiệm lịch sử.</li>\n  <li><strong>Bản chất của ý thức:</strong> Là <strong>hình ảnh chủ quan của thế giới khách quan</strong>; là quá trình phản ánh tích cực, năng động, sáng tạo hiện thực khách quan của bộ óc con người, mang bản chất lịch sử - xã hội sâu sắc.</li>\n</ul>\n\n<h3>3. Mối quan hệ biện chứng giữa Vật chất và Ý thức</h3>\n<ul>\n  <li><strong>Vai trò quyết định của vật chất đối với ý thức:</strong> Vật chất quyết định <em>nguồn gốc</em>, <em>nội dung</em>, <em>bản chất</em> và <em>sự vận động, biến đổi</em> của ý thức. Khi điều kiện vật chất, kinh tế thay đổi thì sớm hay muộn tư duy, ý thức cũng thay đổi theo.</li>\n  <li><strong>Tính độc lập tương đối và sự tác động trở lại của ý thức:</strong> Ý thức một khi ra đời có thể tác động trở lại vật chất <strong>thông qua hoạt động thực tiễn của con người</strong> theo hai hướng: nếu phản ánh đúng quy luật khách quan sẽ thúc đẩy xã hội phát triển; nếu phản ánh sai lệch, duy ý chí sẽ kìm hãm sự phát triển.</li>\n</ul>\n\n<div class=\"summary-takeaway-box\">\n  <strong>💡 Ý nghĩa phương pháp luận (Nguyên tắc Tôn trọng khách quan):</strong> Trong nhận thức và hoạt động thực tiễn, mọi chủ trương, kế hoạch phải <strong>xuất phát từ thực tế khách quan, tôn trọng và hành động theo quy luật khách quan</strong> (chống bệnh chủ quan duy ý chí); đồng thời phải <strong>phát huy tính năng động chủ quan</strong>, đề cao tri thức khoa học và ý chí vượt khó (chống thái độ thụ động, ỷ lại).\n</div>",
    "textbookPdfLink": "https://drive.google.com/file/d/1eFvBU8LjSScNjx-r9qTTzUHMYVrJmArq/preview",
    "pdfLink": "https://drive.google.com/file/d/1eFvBU8LjSScNjx-r9qTTzUHMYVrJmArq/preview",
    "pdfFile": "Giao-trinh-Triet-hoc-Mac-Lenin-Bo-GDDT.pdf",
    "videoUrl": "https://www.youtube-nocookie.com/embed/fH8tB2f9M2E?rel=0"
  },
  "ch2-bai2": {
    "chapterId": "chuong_2",
    "badge": "Chương 2 • Chuyên đề 2.2",
    "pages": "Giáo trình Bộ GD&ĐT: Trang 183 – 286",
    "title": "2.2. Hai nguyên lý & Ba quy luật cơ bản của phép biện chứng",
    "summary": "Hệ thống hóa 2 nguyên lý (Mối liên hệ phổ biến, Sự phát triển) và 3 quy luật cơ bản (Lượng - Chất, Thống nhất và đấu tranh của các mặt đối lập, Phủ định của phủ định).",
    "summaryHtml": "<div class=\"summary-doc-header\">\n  <span class=\"summary-kicker\">CHƯƠNG 2 • CHUYÊN ĐỀ 2.2 (TRANG 183 – 286)</span>\n  <h2>2.2. Hai nguyên lý & Ba quy luật cơ bản của phép biện chứng</h2>\n  <p class=\"summary-lead\">Hệ thống hóa 2 nguyên lý nền tảng (Mối liên hệ phổ biến, Sự phát triển) và 3 quy luật cơ bản chi phối cách thức, nguồn gốc và khuynh hướng vận động của thế giới.</p>\n</div>\n\n<h3>1. Hai Nguyên lý cơ bản của Phép biện chứng duy vật</h3>\n<ul>\n  <li><strong>Nguyên lý về mối liên hệ phổ biến:</strong> Khẳng định mọi sự vật, hiện tượng trong thế giới không tồn tại biệt lập mà luôn tác động, ràng buộc, chuyển hóa lẫn nhau. Mối liên hệ mang <em>tính khách quan, tính phổ biến và tính đa dạng, phong phú</em>.\n    <br>→ <strong>Ý nghĩa phương pháp luận:</strong> Rút ra <strong>Quan điểm Toàn diện</strong> (xem xét sự vật trong tất cả các mặt, các mối liên hệ, tránh phiến diện, chiết trung, ngụy biện) và <strong>Quan điểm Lịch sử - Cụ thể</strong>.</li>\n  <li><strong>Nguyên lý về sự phát triển:</strong> Phát triển là quá trình vận động tiến lên từ thấp đến cao, từ đơn giản đến phức tạp, từ kém hoàn thiện đến hoàn thiện hơn.\n    <br>→ <strong>Ý nghĩa phương pháp luận:</strong> Rút ra <strong>Quan điểm Phát triển</strong> (đặt sự vật trong xu hướng vận động đi lên, phát hiện và ủng hộ cái mới tiến bộ, khắc phục tư tưởng bảo thủ, định kiến).</li>\n</ul>\n\n<blockquote>\n  “Phép biện chứng chẳng qua chỉ là môn khoa học về những quy luật phổ biến của sự vận động và sự phát triển của tự nhiên, của xã hội loài người và của tư duy.”\n  <cite>— Ph. Ăngghen (Chống Đuy-rinh)</cite>\n</blockquote>\n\n<h3>2. Ba Quy luật cơ bản của Phép biện chứng duy vật</h3>\n<ul>\n  <li><strong>(1) Quy luật chuyển hóa từ những sự thay đổi về lượng dẫn đến những sự thay đổi về chất và ngược lại (Quy luật Lượng - Chất):</strong>\n    <ul>\n      <li><strong>Vị trí:</strong> Chỉ ra <strong>CÁCH THỨC</strong> của sự vận động, phát triển.</li>\n      <li><strong>Nội dung cốt lõi:</strong> Mọi sự vật là sự thống nhất giữa <em>Chất</em> (tính quy định khách quan làm sự vật là nó) và <em>Lượng</em> (quy mô, trình độ, tốc độ). Sự tích lũy dần dần về lượng trong giới hạn <strong>Độ</strong> khi đạt tới <strong>Điểm nút</strong> tất yếu dẫn tới việc thực hiện <strong>Bước nhảy</strong> để chuyển hóa thành chất mới.</li>\n      <li><strong>Ý nghĩa phương pháp luận:</strong> Phải kiên trì tích lũy về lượng để làm biến đổi về chất; khắc phục tư tưởng nôn nóng đốt cháy giai đoạn (<strong>“tả khuynh”</strong>) hoặc bảo thủ, trì trệ không dám thực hiện bước nhảy khi đã đủ lượng (<strong>“hữu khuynh”</strong>).</li>\n    </ul>\n  </li>\n  <li><strong>(2) Quy luật thống nhất và đấu tranh của các mặt đối lập (Quy luật Mâu thuẫn):</strong>\n    <ul>\n      <li><strong>Vị trí:</strong> Là <strong>“hạt nhân của phép biện chứng”</strong>, chỉ ra <strong>NGUỒN GỐC và ĐỘNG LỰC</strong> bên trong của mọi sự vận động, phát triển.</li>\n      <li><strong>Nội dung cốt lõi:</strong> Sự thống nhất của các mặt đối lập là tương đối, tạm thời; sự đấu tranh giữa các mặt đối lập là tuyệt đối, dẫn tới việc giải quyết mâu thuẫn và sự ra đời của sự vật mới.</li>\n    </ul>\n  </li>\n  <li><strong>(3) Quy luật phủ định của phủ định:</strong>\n    <ul>\n      <li><strong>Vị trí:</strong> Chỉ ra <strong>KHUYNH HƯỚNG</strong> (con đường xoáy ốc) của sự phát triển.</li>\n      <li><strong>Nội dung cốt lõi:</strong> Phủ định biện chứng mang <em>tính khách quan</em> và <em>tính kế thừa</em> (lọc bỏ yếu tố lỗi thời, giữ lại hạt nhân tích cực). Trải qua ít nhất hai lần phủ định, sự vật dường như quay lại điểm xuất phát nhưng trên cơ sở cao hơn (đường xoáy ốc).</li>\n    </ul>\n  </li>\n</ul>\n\n<div class=\"summary-takeaway-box\">\n  <strong>💡 Vận dụng thực tiễn cho sinh viên:</strong> Trong học tập đại học, hãy tích lũy kiến thức nền tảng đều đặn từng học kỳ (tích lũy về lượng trong giới hạn Độ) để tạo bước nhảy vững chắc về năng lực chuyên môn khi làm đồ án tốt nghiệp và đi làm thực tế.\n</div>",
    "textbookPdfLink": "https://drive.google.com/file/d/1eFvBU8LjSScNjx-r9qTTzUHMYVrJmArq/preview",
    "pdfLink": "https://drive.google.com/file/d/1eFvBU8LjSScNjx-r9qTTzUHMYVrJmArq/preview",
    "pdfFile": "Giao-trinh-Triet-hoc-Mac-Lenin-Bo-GDDT.pdf",
    "videoUrl": "https://www.youtube-nocookie.com/embed/fH8tB2f9M2E?rel=0"
  },
  "ch3-bai1": {
    "chapterId": "chuong_3",
    "badge": "Chương 3 • Chuyên đề 3.1",
    "pages": "Giáo trình Bộ GD&ĐT: Trang 287 – 348",
    "title": "3.1. Học thuyết hình thái kinh tế - xã hội",
    "summary": "Phân tích cấu trúc hình thái kinh tế - xã hội; quy luật quan hệ sản xuất phù hợp với trình độ phát triển của lực lượng sản xuất; biện chứng giữa cơ sở hạ tầng và kiến trúc thượng tầng.",
    "summaryHtml": "<div class=\"summary-doc-header\">\n  <span class=\"summary-kicker\">CHƯƠNG 3 • CHUYÊN ĐỀ 3.1 (TRANG 287 – 348)</span>\n  <h2>3.1. Học thuyết hình thái kinh tế - xã hội</h2>\n  <p class=\"summary-lead\">Tóm tắt vai trò quyết định của sản xuất vật chất, quy luật quan hệ sản xuất phù hợp với trình độ phát triển của lực lượng sản xuất, và biện chứng giữa Cơ sở hạ tầng với Kiến trúc thượng tầng.</p>\n</div>\n\n<h3>1. Sản xuất vật chất là cơ sở của sự tồn tại và phát triển xã hội</h3>\n<p>Để tồn tại và phát triển, con người trước hết phải ăn, mặc, ở — tức là phải tiến hành <strong>sản xuất vật chất</strong>. Phương thức sản xuất là cách thức con người thực hiện quá trình sản xuất vật chất ở những giai đoạn lịch sử nhất định, là sự thống nhất biện chứng giữa <strong>Lực lượng sản xuất (LLSX)</strong> và <strong>Quan hệ sản xuất (QHSX)</strong>.</p>\n\n<blockquote>\n  “Những thời đại kinh tế khác nhau không phải ở chỗ chúng sản xuất ra cái gì, mà là ở chỗ chúng sản xuất bằng cách nào, với những tư liệu lao động nào.”\n  <cite>— C. Mác (Tư bản, Quyển I)</cite>\n</blockquote>\n\n<h3>2. Quy luật Quan hệ sản xuất phù hợp với trình độ phát triển của Lực lượng sản xuất</h3>\n<ul>\n  <li><strong>Lực lượng sản xuất (Nội dung vật chất - kỹ thuật):</strong> Gồm <em>Người lao động</em> (nhân tố hàng đầu, giữ vai trò quyết định) và <em>Tư liệu sản xuất</em> (trong đó <strong>công cụ lao động</strong> là yếu tố động nhất, cách mạng nhất). Ngày nay, <strong>khoa học và công nghệ đã trở thành lực lượng sản xuất trực tiếp</strong>.</li>\n  <li><strong>Quan hệ sản xuất (Hình thức kinh tế - xã hội):</strong> Gồm 3 mặt: (1) Quan hệ sở hữu đối với tư liệu sản xuất (giữ vai trò quyết định bản chất QHSX); (2) Quan hệ trong tổ chức và quản lý sản xuất; (3) Quan hệ trong phân phối sản phẩm lao động.</li>\n  <li><strong>Mối quan hệ biện chứng:</strong>\n    <ul>\n      <li>LLSX vận động, phát triển không ngừng và <strong>quyết định sự hình thành, biến đổi của QHSX</strong>.</li>\n      <li>QHSX có tính độc lập tương đối và <strong>tác động trở lại LLSX</strong>: nếu phù hợp sẽ tạo địa bàn thúc đẩy LLSX phát triển; nếu lỗi thời hoặc vượt trước giả tạo sẽ kìm hãm LLSX.</li>\n    </ul>\n  </li>\n</ul>\n\n<h3>3. Biện chứng giữa Cơ sở hạ tầng (CSHT) và Kiến trúc thượng tầng (KTTT)</h3>\n<ul>\n  <li><strong>Cơ sở hạ tầng:</strong> Là toàn bộ những quan hệ sản xuất của một xã hội trong sự vận động hiện thực của chúng hợp thành cơ cấu kinh tế của xã hội đó (bao gồm QHSX thống trị, QHSX tàn dư và QHSX mầm mống).</li>\n  <li><strong>Kiến trúc thượng tầng:</strong> Là toàn bộ những quan điểm, tư tưởng xã hội (chính trị, pháp quyền, đạo đức, triết học, tôn giáo...) cùng với những thiết chế xã hội tương ứng (Nhà nước, đảng phái, giáo hội...) được hình thành trên một cơ sở hạ tầng nhất định. Trong đó, <strong>Nhà nước</strong> là thiết chế có quyền lực mạnh mẽ nhất.</li>\n  <li><strong>Quy luật vận động:</strong> Cơ sở hạ tầng quyết định nguồn gốc, cơ cấu và sự biến đổi của Kiến trúc thượng tầng; ngược lại, Kiến trúc thượng tầng tác động mạnh mẽ trở lại nhằm bảo vệ, duy trì và củng cố Cơ sở hạ tầng đã sinh ra nó.</li>\n</ul>\n\n<div class=\"summary-takeaway-box\">\n  <strong>💡 Sự vận dụng của Đảng Cộng sản Việt Nam:</strong> Học thuyết Hình thái kinh tế - xã hội là cơ sở lý luận khoa học cho đường lối <strong>quá độ lên chủ nghĩa xã hội bỏ qua chế độ tư bản chủ nghĩa ở Việt Nam</strong> — phát triển nền kinh tế thị trường định hướng XHCN nhiều thành phần đi đôi với xây dựng Nhà nước pháp quyền XHCN.\n</div>",
    "textbookPdfLink": "https://drive.google.com/file/d/1eFvBU8LjSScNjx-r9qTTzUHMYVrJmArq/preview",
    "pdfLink": "https://drive.google.com/file/d/1eFvBU8LjSScNjx-r9qTTzUHMYVrJmArq/preview",
    "pdfFile": "Giao-trinh-Triet-hoc-Mac-Lenin-Bo-GDDT.pdf",
    "videoUrl": "https://www.youtube-nocookie.com/embed/fH8tB2f9M2E?rel=0"
  },
  "ch3-bai2": {
    "chapterId": "chuong_3",
    "badge": "Chương 3 • Chuyên đề 3.2",
    "pages": "Giáo trình Bộ GD&ĐT: Trang 349 – 445",
    "title": "3.2. Tồn tại xã hội, ý thức xã hội & triết học về con người",
    "summary": "Làm rõ mối quan hệ biện chứng giữa tồn tại xã hội và ý thức xã hội (tính độc lập tương đối của ý thức xã hội); bản chất con người là tổng hòa các quan hệ xã hội.",
    "summaryHtml": "<div class=\"summary-doc-header\">\n  <span class=\"summary-kicker\">CHƯƠNG 3 • CHUYÊN ĐỀ 3.2 (TRANG 349 – 445)</span>\n  <h2>3.2. Tồn tại xã hội, ý thức xã hội & triết học về con người</h2>\n  <p class=\"summary-lead\">Tóm tắt mối quan hệ biện chứng giữa tồn tại xã hội và ý thức xã hội, 5 biểu hiện tính độc lập tương đối của ý thức xã hội, và quan niệm duy vật lịch sử về bản chất con người.</p>\n</div>\n\n<h3>1. Biện chứng giữa Tồn tại xã hội và Ý thức xã hội</h3>\n<ul>\n  <li><strong>Tồn tại xã hội:</strong> Là toàn bộ sinh hoạt vật chất và những điều kiện sinh hoạt vật chất của xã hội, bao gồm 3 yếu tố cơ bản: (1) Điều kiện tự nhiên, địa lý; (2) Dân số và mật độ dân số; (3) <strong>Phương thức sản xuất vật chất</strong> (yếu tố giữ vai trò quyết định nhất).</li>\n  <li><strong>Ý thức xã hội:</strong> Là mặt tinh thần của đời sống xã hội, bao gồm tâm lý xã hội và hệ tư tưởng xã hội được nảy sinh từ tồn tại xã hội và phản ánh tồn tại xã hội trong những giai đoạn lịch sử nhất định.</li>\n  <li><strong>Vai trò quyết định của Tồn tại xã hội:</strong> Tồn tại xã hội như thế nào thì ý thức xã hội như thế đó; khi tồn tại xã hội (đặc biệt là phương thức sản xuất) biến đổi thì sớm hay muộn những tư tưởng, quan điểm chính trị, pháp quyền, đạo đức cũng biến đổi theo.</li>\n</ul>\n\n<h3>2. Năm biểu hiện Tính độc lập tương đối của Ý thức xã hội</h3>\n<ul>\n  <li><strong>Thứ nhất — Ý thức xã hội thường lạc hậu hơn so với tồn tại xã hội:</strong> Do sức ỳ của thói quen, tập quán truyền thống và do các lực lượng bảo thủ muốn duy trì tư tưởng cũ.</li>\n  <li><strong>Thứ hai — Ý thức xã hội có thể vượt trước tồn tại xã hội:</strong> Những tư tưởng khoa học và tiến bộ có thể dự báo đúng xu hướng phát triển tương lai của xã hội.</li>\n  <li><strong>Thứ ba — Ý thức xã hội có tính kế thừa trong sự phát triển:</strong> Các thời đại sau luôn tiếp thu, chọn lọc những giá trị tư tưởng, văn hóa của thời đại trước.</li>\n  <li><strong>Thứ tư — Sự tác động qua lại giữa các hình thái ý thức xã hội:</strong> Chính trị, pháp quyền, đạo đức, khoa học, nghệ thuật, tôn giáo luôn thâm nhập, ảnh hưởng lẫn nhau.</li>\n  <li><strong>Thứ năm — Ý thức xã hội tác động trở lại tồn tại xã hội:</strong> Tư tưởng tiến bộ, khoa học thúc đẩy xã hội phát triển; tư tưởng phản động, lạc hậu kìm hãm xã hội.</li>\n</ul>\n\n<blockquote>\n  “Bản chất con người không phải là một cái trừu tượng cố hữu của cá nhân riêng biệt. Trong tính hiện thực của nó, bản chất con người là tổng hòa những quan hệ xã hội.”\n  <cite>— C. Mác (Luận cương về Phơ-bách, Luận điểm số 6)</cite>\n</blockquote>\n\n<h3>3. Triết học Mác - Lênin về Con người và Quần chúng nhân dân</h3>\n<ul>\n  <li><strong>Con người là một thực thể sinh học - xã hội:</strong> Mặt sinh học là tiền đề vật chất tự nhiên tất yếu; mặt xã hội (thông qua lao động và giao tiếp xã hội) là yếu tố quy định bản chất người.</li>\n  <li><strong>Con người vừa là sản phẩm của lịch sử, vừa là chủ thể sáng tạo ra lịch sử:</strong> Thông qua hoạt động thực tiễn cải tạo tự nhiên và cải tạo xã hội, con người tự sáng tạo ra chính bản thân mình.</li>\n  <li><strong>Vai trò của quần chúng nhân dân:</strong> Quần chúng nhân dân là lực lượng sản xuất cơ bản của xã hội, là động lực cơ bản của mọi cuộc cách mạng xã hội và là người sáng tạo ra các giá trị văn hóa tinh thần.</li>\n</ul>\n\n<div class=\"summary-takeaway-box\">\n  <strong>💡 Ý nghĩa phương pháp luận:</strong> Phát huy nhân tố con người Việt Nam toàn diện (Đức - Trí - Thể - Mỹ), lấy con người làm trung tâm, vừa là mục tiêu vừa là động lực của sự nghiệp công nghiệp hóa, hiện đại hóa đất nước.\n</div>",
    "textbookPdfLink": "https://drive.google.com/file/d/1eFvBU8LjSScNjx-r9qTTzUHMYVrJmArq/preview",
    "pdfLink": "https://drive.google.com/file/d/1eFvBU8LjSScNjx-r9qTTzUHMYVrJmArq/preview",
    "pdfFile": "Giao-trinh-Triet-hoc-Mac-Lenin-Bo-GDDT.pdf",
    "videoUrl": "https://www.youtube-nocookie.com/embed/fH8tB2f9M2E?rel=0"
  }
};

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
    },
    "chapterId": "chuong_2",
    "chapterTitle": "Chủ nghĩa duy vật biện chứng",
    "pdfLink": "https://drive.google.com/file/d/1eFvBU8LjSScNjx-r9qTTzUHMYVrJmArq/preview"
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
    "pdfLink": "https://drive.google.com/file/d/1eFvBU8LjSScNjx-r9qTTzUHMYVrJmArq/preview"
  }
];

const ESSAY_PROMPTS_DATA = [
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
    title: "Triết học và vai trò của triết học trong đời sống xã hội"
  },
  {
    chapterId: "chuong_2",
    chapterNumber: "Chương 02",
    title: "Chủ nghĩa duy vật biện chứng"
  },
  {
    chapterId: "chuong_3",
    chapterNumber: "Chương 03",
    title: "Chủ nghĩa duy vật lịch sử"
  }
];

let currentActiveViewId = "view-overview";
let currentLessonId = "ch1-bai1";
let completedLessons = new Set(["ch1-bai1", "ch1-bai2"]);

const quizAppState = {
  questions: FALLBACK_QUIZ_DATA.slice(),
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
  if (!gridEl) return;

  gridEl.innerHTML = LESSONS_ORDER.map(function(key, idx) {
    const item = LESSONS_DATA[key];
    const isDone = completedLessons.has(key);
    return (
      '<button type="button" class="pathway-lesson-card' + (isDone ? ' is-done' : '') + '" data-pathway-lesson="' + key + '">' +
        '<div class="pathway-card-left">' +
          '<span class="pathway-number-circle">' + (idx + 1) + '</span>' +
          '<div class="pathway-card-text">' +
            '<div style="font-size:0.72rem;font-weight:700;color:var(--color-primary-active);margin-bottom:2px;">' +
              item.badge + (isDone ? ' • ✓ Đã hoàn thành' : '') +
            '</div>' +
            '<div class="pathway-card-title">' + item.title + '</div>' +
            '<div class="pathway-card-desc">' + item.summary + '</div>' +
          '</div>' +
        '</div>' +
        '<span class="pathway-arrow" aria-hidden="true">&gt;</span>' +
      '</button>'
    );
  }).join("");
}

/**
 * TAB 1 (MẶC ĐỊNH): Đổ trực tiếp nội dung HTML từ trường "summaryHtml" của data.json
 * vào khung đọc chuẩn web <div id="summary-reader" class="summary-article">
 */
function renderSummaryReader(lessonId) {
  const lesson = LESSONS_DATA[lessonId];
  const readerEl = document.getElementById("summary-reader");
  if (!readerEl || !lesson) return;

  readerEl.innerHTML = lesson.summaryHtml || (
    "<h2>" + lesson.title + "</h2><p>" + (lesson.summary || "") + "</p>"
  );
}

/**
 * TAB 2: Nhúng file PDF giáo trình gốc từ trường "textbookPdfLink" trong data.json
 * Kích thước chuẩn: width="100%", height="calc(100vh - 235px)", min-height="550px"
 */
function renderPdfIframe(lessonId) {
  const lesson = LESSONS_DATA[lessonId];
  const iframe = document.getElementById("pdf-viewer-frame");
  if (!iframe || !lesson) return;

  iframe.setAttribute("width", "100%");
  iframe.style.width = "100%";
  iframe.style.height = "calc(100vh - 235px)";
  iframe.style.minHeight = "550px";
  iframe.removeAttribute("srcdoc");

  const targetPdfLink = lesson.textbookPdfLink || lesson.pdfLink || GDRIVE_DEFAULT_PDF;
  if (iframe.getAttribute("src") !== targetPdfLink) {
    iframe.src = targetPdfLink;
  }
}

/**
 * Cập nhật thẻ <select> chuyên đề và trạng thái 2 nút "← Bài trước" / "Bài tiếp theo"
 */
function syncHorizontalLessonToolbar(lessonId) {
  const selectEl = document.getElementById("lesson-selector-dropdown");
  if (selectEl) {
    Array.from(selectEl.options).forEach(function(opt) {
      const optId = opt.value;
      const item = LESSONS_DATA[optId];
      if (item) {
        const checkPrefix = completedLessons.has(optId) ? "✓ " : "○ ";
        opt.textContent = checkPrefix + item.badge.split("•")[0].trim() + " — " + item.title;
      }
    });
    selectEl.value = lessonId;
  }

  const currentIdx = LESSONS_ORDER.indexOf(lessonId);
  const prevBtn = document.getElementById("prev-lesson-btn");
  const nextBtn = document.getElementById("next-lesson-btn");
  if (prevBtn) prevBtn.disabled = (currentIdx <= 0);
  if (nextBtn) nextBtn.disabled = (currentIdx === -1 || currentIdx >= LESSONS_ORDER.length - 1);

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

function selectLesson(lessonId) {
  const lesson = LESSONS_DATA[lessonId];
  if (!lesson) return;
  currentLessonId = lessonId;

  const badgeEl = document.getElementById("active-lesson-chapter-badge");
  const pagesEl = document.getElementById("active-lesson-pages-meta");
  const titleEl = document.getElementById("active-lesson-title");
  const summaryEl = document.getElementById("active-lesson-summary");
  const pdfLabelEl = document.getElementById("pdf-filename-label");

  if (badgeEl) badgeEl.textContent = lesson.badge;
  if (pagesEl) pagesEl.textContent = lesson.pages;
  if (titleEl) titleEl.textContent = lesson.title;
  if (summaryEl) summaryEl.textContent = lesson.summary;
  if (pdfLabelEl) pdfLabelEl.textContent = lesson.pdfFile + " (" + lesson.pages + ")";

  document.querySelectorAll(".lesson-item-btn").forEach(function(btn) {
    const id = btn.getAttribute("data-lesson-id");
    btn.classList.toggle("active", id === lessonId);
    btn.classList.toggle("completed", completedLessons.has(id));
  });

  syncHorizontalLessonToolbar(lessonId);
  renderSummaryReader(lessonId);
  renderPdfIframe(lessonId);
  renderOverviewPathwayCards();
  updateProgressCounters();
}

/**
 * Lưu trạng thái hoàn thành chuyên đề lên Firebase Firestore (users/{uid}/progress/{chapter_id})
 * và đồng bộ lại tiến độ (ví dụ: 2/6 chuyên đề)
 */
function saveLessonCompletionToFirestore(lessonId) {
  const lesson = LESSONS_DATA[lessonId];
  if (!lesson) return;

  if (!activeStudentUser) {
    activeStudentUser = mockFirestoreUsersDb["sv_maclenin_2026"].profile;
    syncStudentIdentityUI(activeStudentUser);
  }

  const targetChapterId = lesson.chapterId || "chuong_1";
  const userProgress = mockFirestoreUsersDb[activeStudentUser.uid].progress;
  const prevDoc = userProgress[targetChapterId] || {
    uid: activeStudentUser.uid,
    chapterId: targetChapterId,
    chapterTitle: lesson.badge.split("•")[0].trim(),
    lastScore: 8.5,
    highestScore: 8.5,
    correctCount: 8,
    totalQuestions: 10,
    accuracyPercent: 85,
    attempts: 1,
    isPassed: true
  };

  const chapterCompletedList = LESSONS_ORDER.filter(function(k) {
    return LESSONS_DATA[k].chapterId === targetChapterId && completedLessons.has(k);
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
  const totalCount = LESSONS_ORDER.length;
  const isNowDone = completedLessons.has(lessonId);

  const autoBadge = document.getElementById("header-autosave-badge");
  if (autoBadge) {
    autoBadge.textContent = "✓ Tiến độ Firestore: " + doneCount + "/" + totalCount + " chuyên đề";
  }

  showFirebaseToast(
    (isNowDone ? "✓ Đã đánh dấu hoàn thành " : "↺ Đã bỏ đánh dấu hoàn thành ") +
    lesson.title + " • Đồng bộ Firestore (users/" + activeStudentUser.uid + "/progress/" + targetChapterId + ") — Tiến độ: " + doneCount + "/" + totalCount + " chuyên đề.",
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
}

function updateProgressCounters() {
  const totalLessons = LESSONS_ORDER.length;
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

  if (overviewGpaEl) overviewGpaEl.textContent = gpa;
  if (overviewAttemptsEl) overviewAttemptsEl.textContent = totalAttempts + " bài";
  if (overviewLessonsEl) overviewLessonsEl.textContent = completedLessons.size + " / " + LESSONS_ORDER.length;
}

function showFirebaseToast(msg, type) {
  const bannerEl = document.getElementById("firebase-toast-banner");
  if (!bannerEl) return;
  bannerEl.textContent = msg;
  bannerEl.className = "firebase-toast-banner is-shown toast-" + (type || "info");
}

async function fetchQuizQuestions(jsonPath) {
  try {
    const response = await fetch(jsonPath, { cache: "no-store" });
    if (!response.ok) throw new Error("HTTP " + response.status);
    const parsedData = await response.json();

    if (parsedData && parsedData.lessons && typeof parsedData.lessons === "object") {
      Object.keys(parsedData.lessons).forEach(function(k) {
        if (LESSONS_DATA[k]) {
          if (parsedData.lessons[k].summaryHtml) {
            LESSONS_DATA[k].summaryHtml = parsedData.lessons[k].summaryHtml;
          }
          if (parsedData.lessons[k].textbookPdfLink) {
            LESSONS_DATA[k].textbookPdfLink = parsedData.lessons[k].textbookPdfLink;
          }
          if (parsedData.lessons[k].pdfLink) {
            LESSONS_DATA[k].pdfLink = parsedData.lessons[k].pdfLink;
          }
        }
      });
      renderSummaryReader(currentLessonId);
      renderPdfIframe(currentLessonId);
    }

    if (Array.isArray(parsedData)) return parsedData;
    if (parsedData && Array.isArray(parsedData.questions)) return parsedData.questions;
    return FALLBACK_QUIZ_DATA;
  } catch (err) {
    return FALLBACK_QUIZ_DATA;
  }
}

function extractChapterIdAutomatically(questionObj) {
  if (questionObj && questionObj.chapterId) return questionObj.chapterId;
  const params = new URLSearchParams(window.location.search);
  if (params.get("chapter")) return params.get("chapter");
  if (questionObj && questionObj.id) {
    if (questionObj.id.indexOf("ch1") !== -1) return "chuong_1";
    if (questionObj.id.indexOf("ch3") !== -1) return "chuong_3";
  }
  return "chuong_2";
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

  const score10 = Math.round((correctCount / totalCount) * 100) / 10;
  const accuracy = Math.round((correctCount / totalCount) * 100);

  const userProgress = mockFirestoreUsersDb[activeStudentUser.uid].progress;
  const prevDoc = userProgress[targetChapterId] || null;
  const highest = prevDoc ? Math.max(prevDoc.highestScore, score10) : score10;
  const attempts = prevDoc ? (prevDoc.attempts + 1) : 1;

  userProgress[targetChapterId] = {
    uid: activeStudentUser.uid,
    chapterId: targetChapterId,
    chapterTitle: chapterTitle || targetChapterId,
    lastScore: score10,
    highestScore: highest,
    correctCount: correctCount,
    totalQuestions: totalCount,
    accuracyPercent: accuracy,
    attempts: attempts,
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
  const qId = questionObj.id;
  const currentSelected = quizAppState.selectedAnswers[qId] || null;
  const checkedInfo = quizAppState.checkedResults[qId] || null;
  const isChecked = Boolean(checkedInfo);

  let cardStateClass = "";
  if (isChecked) {
    cardStateClass = checkedInfo.isCorrect ? " is-checked-correct" : " is-checked-wrong";
  }

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

  const breakdownItemsHtml = questionObj.options.map(function(opt) {
    const isOptCorrect = opt.key === questionObj.correctAnswer;
    const itemClass = isOptCorrect ? "explain-correct" : "explain-wrong";
    const reasonText = (questionObj.optionExplanations && questionObj.optionExplanations[opt.key]) ? questionObj.optionExplanations[opt.key] : "";
    return '<div class="explanation-option-item ' + itemClass + '"><strong>Phương án ' + opt.key + ':</strong> ' + reasonText + '</div>';
  }).join("");

  return (
    '<article class="quiz-card' + cardStateClass + '" id="quiz-card-' + qId + '">' +
      '<div class="quiz-card-meta">' +
        '<span class="quiz-question-number">Câu 0' + (index + 1) + ' • ' + questionObj.chapter + '</span>' +
        '<span class="quiz-topic-tag">' + questionObj.topic + ' (' + questionObj.difficulty + ')</span>' +
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
        '<p class="explanation-general-text">' + questionObj.generalExplanation + '</p>' +
        '<div class="explanation-breakdown-list">' + breakdownItemsHtml + '</div>' +
      '</div>' +
    '</article>'
  );
}

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

function renderQuizView() {
  const container = document.getElementById("quiz-questions-container");
  if (!container) return;
  container.innerHTML = quizAppState.questions.map(function(q, idx) {
    return buildQuestionCardMarkup(q, idx);
  }).join("");
  updateQuizScoreboard();
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
  const chapterQuestions = FALLBACK_QUIZ_DATA.filter(function(q) {
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
    questionObj.chapterTitle || questionObj.chapter
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
  const promptObj = ESSAY_PROMPTS_DATA.find(function(p) { return p.id === selectedPromptId; }) || ESSAY_PROMPTS_DATA[1];

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
    const matchedKeywords = promptObj.rubricKeywords.filter(function(kw) {
      return lowerAns.indexOf(kw.toLowerCase()) !== -1;
    });
    const wordCount = studentText.split(/\s+/).length;
    const baseScore = 6.5 + Math.min(2.5, matchedKeywords.length * 0.45) + (wordCount > 60 ? 0.5 : 0);
    finalScore10 = Math.round(Math.min(9.5, baseScore) * 10) / 10;

    feedbackHtml =
      '<div style="display:flex;flex-direction:column;gap:0.45rem;">' +
        '<div style="font-size:1rem;font-weight:800;color:var(--color-primary-active);">Điểm Tự luận AI: ' + finalScore10.toFixed(1) + ' / 10 (' + promptObj.chapterTitle + ')</div>' +
        '<div><strong>• Thuật ngữ triết học đã vận dụng (' + matchedKeywords.length + '/' + promptObj.rubricKeywords.length + '):</strong> ' +
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

  renderCurrentDateFormatted();
  syncStudentIdentityUI(activeStudentUser);
  renderOverviewPathwayCards();
  selectLesson(currentLessonId);
  renderStage4LearningJourney(activeStudentUser.uid);

  const inlineJsonUri = "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ lessons: LESSONS_DATA, questions: FALLBACK_QUIZ_DATA }));
  fetchQuizQuestions(inlineJsonUri).then(function(qs) {
    quizAppState.questions = qs;
    renderQuizView();
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

  // Sự kiện Thanh điều hướng chuyên đề 1 hàng ngang (<select> + Bài trước + Bài tiếp theo + Đánh dấu hoàn thành)
  const lessonSelectEl = document.getElementById("lesson-selector-dropdown");
  if (lessonSelectEl) {
    lessonSelectEl.addEventListener("change", function() {
      selectLesson(lessonSelectEl.value);
    });
  }

  const prevLessonBtn = document.getElementById("prev-lesson-btn");
  if (prevLessonBtn) {
    prevLessonBtn.addEventListener("click", function() {
      const idx = LESSONS_ORDER.indexOf(currentLessonId);
      if (idx > 0) selectLesson(LESSONS_ORDER[idx - 1]);
    });
  }

  const nextLessonBtn = document.getElementById("next-lesson-btn");
  if (nextLessonBtn) {
    nextLessonBtn.addEventListener("click", function() {
      const idx = LESSONS_ORDER.indexOf(currentLessonId);
      if (idx !== -1 && idx < LESSONS_ORDER.length - 1) selectLesson(LESSONS_ORDER[idx + 1]);
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

  document.querySelectorAll(".select-chapter-shortcut").forEach(function(btn) {
    btn.addEventListener("click", function() {
      selectLesson(btn.getAttribute("data-lesson-target"));
      switchDashboardView("view-materials");
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

  const filterChapBtns = document.querySelectorAll(".quiz-filter-chap-btn");
  filterChapBtns.forEach(function(btn) {
    btn.addEventListener("click", function() {
      const chapFilter = btn.getAttribute("data-filter-chapter");
      filterChapBtns.forEach(function(b) {
        b.className = (b === btn) ? "btn btn-primary btn-sm quiz-filter-chap-btn" : "btn btn-secondary btn-sm quiz-filter-chap-btn";
      });
      quizAppState.questions = (chapFilter === "all")
        ? FALLBACK_QUIZ_DATA.slice()
        : FALLBACK_QUIZ_DATA.filter(function(q) { return q.chapterId === chapFilter; });
      renderQuizView();
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
    if (el) el.addEventListener("click", function() { renderPdfIframe(currentLessonId); });
  });
});
