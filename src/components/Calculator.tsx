import { useState, useMemo } from "react";
import { Sliders, Calculator as CalcIcon, Sprout, ClipboardCheck } from "lucide-react";

interface AddonOption {
  id: string;
  label: string;
  pricePerM2: number;
}

interface CalculatorProps {
  onSelectedEstimate: (details: {
    area: number;
    frequency: string;
    services: string[];
    estimate: number;
  }) => void;
}

const FREQUENCY_OPTIONS = [
  { id: "weekly", label: "Chăm sóc hàng tuần (2 - 3 buổi/tuần)", factor: 1.8, desc: "Phù hợp biệt thự sân vườn cao cấp, hồ cá Koi cần vệ sinh liên tục." },
  { id: "monthly", label: "Chăm sóc định kỳ tháng (2 - 4 buổi/tháng)", factor: 0.8, desc: "Phương án phổ biến cho nhà phố, sân vườn vừa và nhỏ cần duy trì vẻ đẹp." },
  { id: "onetime", label: "Tổng dọn dẹp vệ sinh một lần", factor: 1.2, desc: "Xử lý khẩn cấp trước sự kiện hoặc hồi sinh vườn bị bỏ hoang lâu ngày." },
];

const ADDONS: AddonOption[] = [
  { id: "grass", label: "Cắt tỉa thảm cỏ, nhổ cỏ dại & chăm sóc dinh dưỡng", pricePerM2: 12000 },
  { id: "bonsai", label: "Cắt tạo dáng Bonsai, cắt tỉa cành nhánh tầm cao", pricePerM2: 6000 },
  { id: "disease", label: "Bón phân hữu cơ & phun vi sinh trừ sâu hại lá", pricePerM2: 4000 },
  { id: "koi", label: "Vệ sinh mặt hồ cá Koi, lọc nước thảo mộc sinh học", pricePerM2: 3000 },
];

export default function Calculator({ onSelectedEstimate }: CalculatorProps) {
  const [area, setArea] = useState<number>(80);
  const [frequency, setFrequency] = useState<string>("monthly");
  const [selectedAddons, setSelectedAddons] = useState<string[]>(["grass", "disease"]);

  const toggleAddon = (id: string) => {
    setSelectedAddons((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const currentFrequency = useMemo(() => {
    return FREQUENCY_OPTIONS.find((f) => f.id === frequency) || FREQUENCY_OPTIONS[1];
  }, [frequency]);

  const estimatedTotal = useMemo(() => {
    if (selectedAddons.length === 0) return 0;
    
    // Sum pricing per m2
    const totalRate = selectedAddons.reduce((sum, addonId) => {
      const addon = ADDONS.find((a) => a.id === addonId);
      return sum + (addon ? addon.pricePerM2 : 0);
    }, 0);

    // Calculate base, apply frequency factor
    let rawTotal = area * totalRate * currentFrequency.factor * 1000;
    
    // Minimal pricing floor based on frequency
    let minFloor = 650000;
    if (frequency === "weekly") minFloor = 2200000;
    if (frequency === "onetime") minFloor = 950000;

    return Math.max(minFloor, Math.round(rawTotal / 10000) * 10000);
  }, [area, frequency, selectedAddons]);

  const handleApply = () => {
    const servicesList = selectedAddons.map((id) => ADDONS.find((a) => a.id === id)?.label || "");
    const vietnameseFreqLabel = currentFrequency.label.split(" (")[0]; // Clean Vietnamese label
    
    onSelectedEstimate({
      area,
      frequency: vietnameseFreqLabel,
      services: servicesList,
      estimate: estimatedTotal,
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-brand-100 max-w-4xl mx-auto my-10" id="calculator-section">
      <div className="bg-gradient-to-r from-brand-700 to-brand-800 text-white p-6 flex items-center gap-3">
        <div className="bg-brand-600 p-2.5 rounded-lg">
          <CalcIcon className="w-6 h-6 text-emerald-50" />
        </div>
        <div>
          <h3 className="text-xl font-display font-bold">Dự Toán Chi Phí Sân Vườn Thông Minh</h3>
          <p className="text-xs text-brand-100 mt-1">
            Báo giá minh bạch, ước tính tức thì dựa theo diện tích thực tế. Tiết kiệm tới 15% khi thanh toán dài hạn.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-100 p-4 md:p-8">
        {/* Left Side Controls */}
        <div className="md:col-span-7 space-y-6 pb-6 md:pb-0 md:pr-8">
          {/* Garden Area Area */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-brand-600" />
                Diện tích sân vườn khảo sát:
              </label>
              <span className="text-lg font-bold text-brand-700 font-mono">{area} m²</span>
            </div>
            
            {/* Range Slider layout */}
            <input
              type="range"
              min="15"
              max="500"
              step="5"
              value={area}
              onChange={(e) => setArea(Number(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-brand-600"
            />
            
            {/* Quick selectors */}
            <div className="flex gap-2.5 mt-3 overflow-x-auto pb-1">
              {[25, 50, 100, 150, 250, 400].map((v) => (
                <button
                  type="button"
                  key={v}
                  onClick={() => setArea(v)}
                  className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors border ${
                    area === v
                      ? "bg-brand-100 text-brand-800 border-brand-400 font-semibold"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  🏡 {v} m²
                </button>
              ))}
            </div>
          </div>

          {/* Core Services Selected */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-3">
              2. Chọn các gói công việc cụ thể:
            </label>
            <div className="space-y-2.5">
              {ADDONS.map((addon) => {
                const isActive = selectedAddons.includes(addon.id);
                return (
                  <button
                    type="button"
                    key={addon.id}
                    onClick={() => toggleAddon(addon.id)}
                    className={`w-full flex items-start text-left p-3 rounded-xl border transition-all ${
                      isActive
                        ? "bg-brand-50/70 border-brand-500 shadow-md-brand shadow-brand-100/50"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center h-5 mt-0.5">
                      <input
                        type="checkbox"
                        checked={isActive}
                        readOnly
                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4.5 w-4.5"
                      />
                    </div>
                    <div className="ml-3">
                      <span className="text-xs md:text-sm font-medium text-slate-800 block">
                        {addon.label}
                      </span>
                      <span className="text-xs text-slate-400 font-mono mt-0.5 block">
                        Đơn giá ước lượng: ~{addon.pricePerM2.toLocaleString("vi-VN")}đ/m²
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Frequency Option Select */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-3">
              3. Chọn tần suất chăm sóc mong muốn:
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {FREQUENCY_OPTIONS.map((freq) => (
                <button
                  type="button"
                  key={freq.id}
                  onClick={() => setFrequency(freq.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    frequency === freq.id
                      ? "bg-brand-50/70 border-brand-500 shadow-sm"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs md:text-sm font-semibold text-slate-800">{freq.label}</span>
                    <span className="text-xs font-mono text-brand-600 font-medium font-bold">
                      x{freq.factor} Hệ số
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{freq.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side Results & CTA */}
        <div className="md:col-span-5 flex flex-col justify-between p-6 md:p-8 md:pl-8 bg-slate-50/80">
          <div className="space-y-6">
            <h4 className="text-base font-display font-bold text-slate-800 border-b border-slate-200 pb-2">
              Báo Giá Dự Toán Sơ Bộ
            </h4>
            
            <div className="space-y-3.5">
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>Diện tích tính:</span>
                <span className="font-semibold text-slate-700">{area} m²</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>Hạng mục bảo dưỡng:</span>
                <span className="font-semibold text-slate-700">{selectedAddons.length} mục chọn</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>Tần suất ưu tiên:</span>
                <span className="font-semibold text-slate-700 truncate max-w-[150px]">
                  {currentFrequency.label.split(" (")[0]}
                </span>
              </div>
            </div>

            <div className="bg-brand-100/50 border border-brand-200 rounded-2xl p-5 text-center my-4 space-y-1">
              <span className="text-xs text-emerald-800 font-medium uppercase tracking-wider block">
                Tổng chi phí bảo quản định kỳ / tháng
              </span>
              {estimatedTotal > 0 ? (
                <>
                  <div className="text-2xl md:text-3xl font-mono font-bold text-brand-800">
                    {estimatedTotal.toLocaleString("vi-VN")} VNĐ
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    *Mức chi phí thực tế có thể thấp hơn sau khi khảo sát thực tế cây cảnh quý.
                  </p>
                </>
              ) : (
                <div className="text-sm text-slate-500 py-3 italic">
                  Vui lòng chọn ít nhất một công việc để áp dụng tính toán.
                </div>
              )}
            </div>

            <div className="text-xs text-slate-500 space-y-2">
              <div className="flex items-center gap-1.5 text-brand-700 font-semibold">
                <ClipboardCheck className="w-4 h-4" /> Báo giá này bao gồm:
              </div>
              <ul className="list-disc list-inside pl-1 space-y-1">
                <li>Vật tư bón phân & dinh dưỡng gốc định kỳ</li>
                <li>Hóa chất diệt nấm sinh học an toàn cho trẻ nhỏ</li>
                <li>Chi phí kỹ sư khảo sát ban đầu (Trị giá 500k - Miễn Phí)</li>
                <li>Công dọn dẹp vệ sinh rác cỏ sau cắt mút</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-4">
            <button
              type="button"
              disabled={estimatedTotal === 0}
              onClick={handleApply}
              className={`w-full py-4.5 px-4 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
                estimatedTotal === 0
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                  : "bg-brand-600 hover:bg-brand-700 text-white hover:shadow-brand-300 active:scale-98 cursor-pointer"
              }`}
            >
              <Sprout className="w-5 h-5 animate-pulse" />
              Điền nhanh vào mẫu gửi đi ⬇
            </button>
            <p className="text-[10px] text-center text-slate-400 mt-2">
              Hệ thống sẽ đồng bộ thông số vừa chọn này vào Form Đăng Ký để tiện khảo sát thực tế.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
