import { useState } from "react";
import { ChevronDown, ChevronUp, Droplets } from "lucide-react";

interface FAQItem {
  q: string;
  a: string;
}

const FAQS: FAQItem[] = [
  {
    q: "Chi phí kỹ sư đến khảo sát thực tế và lên phương án thiết kế là bao nhiêu?",
    a: "Hoàn toàn MIỄN PHÍ! Cây Xanh Thủ Đô hỗ trợ cử kỹ sư cảnh quan đến đo đạc diện tích, kiểm tra độ ẩm đất, rà soát dịch bệnh cây cảnh và tư vấn giải pháp trực tiếp tại nhà bạn mà không thu bất kỳ khoản phí khảo sát nào.",
  },
  {
    q: "Tôi có cần chuẩn bị máy móc, dụng cụ cắt hay bón phân không?",
    a: "Không. Đội ngũ nhân viên của chúng tôi sẽ tự trang bị đầy đủ máy cắt cỏ chạy xăng chuyên dụng, máy xịt thuốc áp lực, kéo bấm tỉa cành đa năng, găng tay bảo hộ và phân bón hữu cơ vi sinh sinh học. Bạn chỉ cần cung cấp đầu nguồn nước sạch để tưới cây.",
  },
  {
    q: "Nếu nhân viên vô tình làm hư hỏng, làm chết cây cảnh quý báu của tôi thì sao?",
    a: "Chúng tôi có chính sách Cam Kết Đền Bù rõ ràng xuất hiện trong hợp đồng. Mọi cây cảnh quý của bạn trước khi nhận chăm sóc đều được chụp ảnh hiện trạng và thẩm định giá trị. Nếu do lỗi kỹ thuật chăm sóc không đúng cách dẫn đến chết cây, Cây Xanh Thủ Đô sẽ mua đền bù cây mới tương đương hoặc bồi thường 100% giá trị thực tế của cây đó.",
  },
  {
    q: "Tần suất chăm sóc tốt nhất cho nhà vườn biệt thự là bao nhiêu?",
    a: "Với các biệt thự và nhà vườn cao cấp, chúng tôi khuyến khích tần suất chăm sóc định kỳ từ 2 - 3 buổi/tuần. Điều này giúp thảm cỏ tự nhiên luôn được duy trì ở độ cao chuẩn (khoảng 3cm), kịp thời ngăn ngừa nấm mốc phát sinh trên cây cảnh bonsai đắt tiền và bảo đảm hệ lọc hồ cá Koi chạy luôn định mức trong trẻo nhất.",
  },
  {
    q: "Phương thức ký kết hợp đồng và thanh toán như thế nào?",
    a: "Chúng tôi ký kết hợp đồng điện tử tiện dụng hoặc hợp đồng giấy trực tiếp sau khảo sát. Gia chủ thanh toán linh hoạt cuối mỗi tháng bằng chuyển khoản hoặc tiền mặt, nghiệm thu dựa trên Phiếu Nhật Ký Chăm Sóc được ký bàn giao giữa nhân viên với gia chủ sau mỗi lần chăm sóc vườn.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-12" id="faq-section">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 bg-brand-100 text-brand-800 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
          <Droplets className="w-3 h-3 text-brand-600 animate-bounce" />
          Giải đáp thắc mắc khách hàng
        </div>
        <h3 className="text-2xl md:text-3xl font-display font-bold text-slate-800 mt-2">
          Câu Hỏi Thường Gặp
        </h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
          Các thắc mắc phổ biến về quy trình, báo giá, bồi hoàn của khách chạy quảng cáo tìm kiếm dịch vụ cảnh quan.
        </p>
      </div>

      <div className="space-y-4">
        {FAQS.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-100/80 shadow-xs hover:shadow-md transition-shadow duration-300"
            >
              <button
                type="button"
                onClick={() => toggle(i)}
                className="w-full flex justify-between items-center text-left p-5 md:p-6 font-semibold text-slate-800 hover:text-brand-700 transition-colors"
                id={`faq-btn-${i}`}
              >
                <span className="text-sm md:text-base pr-4">{faq.q}</span>
                {isOpen ? (
                  <ChevronUp className="w-5 h-5 text-brand-600 shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                )}
              </button>
              
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  isOpen ? "max-h-[300px] border-t border-slate-50" : "max-h-0"
                }`}
              >
                <div className="p-5 md:p-6 text-xs md:text-sm text-slate-600 leading-relaxed bg-brand-50/20">
                  {faq.a}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
