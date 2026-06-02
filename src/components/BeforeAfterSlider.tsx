import { useState, useRef, MouseEvent, TouchEvent } from "react";

export default function BeforeAfterSlider() {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8" id="before-after-section">
      <div className="text-center mb-6">
        <span className="bg-brand-100 text-brand-800 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
          Mục Sát Thực Tế
        </span>
        <h3 className="text-2xl md:text-3xl font-display font-bold text-slate-800 mt-2">
          Sự Khác Biệt Thực Tế Không Gian
        </h3>
        <p className="text-sm text-slate-500 max-w-lg mx-auto mt-1">
          Kéo thanh gạt ở giữa để xem hình ảnh bàn giao thực tế trước và sau khi được kỹ sư Cây Xanh Thủ Đô quy hoạch, chăm sóc.
        </p>
      </div>

      <div
        ref={containerRef}
        className="relative h-[250px] md:h-[450px] w-full rounded-2xl overflow-hidden shadow-xl border-4 border-white cursor-ew-resize select-none"
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        onMouseDown={() => setIsDragging(true)}
        onTouchStart={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onTouchEnd={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
      >
        {/* Before - Overgrown/unpolished landscape */}
        <div className="absolute inset-0 bg-slate-900">
          <img 
            src="/api/image-proxy?url=https://decoxdesign.com/upload/images/thiet-ke-canh-quan-san-vuon-10-2.png" 
            alt="Trước khi chăm sóc bón phân" 
            className="w-full h-full object-cover filter grayscale contrast-125 brightness-45 blur-[0.3px]"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.style.backgroundColor = '#451a03';
            }}
          />
          <div className="absolute inset-0 bg-black/25 animate-pulse" />
          <div className="absolute inset-0 flex flex-col justify-end p-6 bg-gradient-to-t from-black/95 via-black/40 to-transparent">
            <span className="absolute top-4 left-4 bg-amber-700 text-white text-[10px] md:text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider z-10 shadow-md">
              Hiện Trạng (Sân cỏ hoang tàn, cây héo nấm lá)
            </span>
            <div className="text-slate-300 max-w-xs md:max-w-md space-y-1">
              <p className="font-semibold text-white text-sm md:text-lg">Sân vườn hoang rậm, đầy cỏ dại</p>
              <p className="text-[10px] md:text-xs text-slate-300">Cỏ tạp mọc um tùm xâm lấn thảm cỏ gốc, bonsai mất phom thế nghệ thuật, sâu bọ nấm lá tàn phá gây xơ xác mất mỹ quan.</p>
            </div>
          </div>
        </div>

        {/* After - Manicured backyard oasis */}
        <div
          className="absolute inset-0 bg-emerald-950 overflow-hidden"
          style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
        >
          <img 
            src="/api/image-proxy?url=https://decoxdesign.com/upload/images/thiet-ke-canh-quan-san-vuon-1-3.png" 
            alt="Sau khi kỹ sư chăm sóc tận tình" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.style.backgroundColor = '#064e3b';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-6">
            <span className="absolute top-4 left-4 bg-emerald-600 text-white text-[10px] md:text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider z-10 shadow-md">
              Bàn Giao Hoàn Mỹ (Cây Xanh Thủ Đô)
            </span>
            <div className="text-green-50 max-w-xs md:max-w-md space-y-1">
              <p className="font-semibold text-white text-sm md:text-lg">Cực phẩm sinh thái mướt phẳng lỳ</p>
              <p className="text-[10px] md:text-xs text-emerald-200">Cỏ nhung phẳng mướt, cắt tỉa dọn rác xanh phẳng phiu, bón phân hữu cơ độc quyền và dưỡng chất mượt mà từ gốc.</p>
            </div>
          </div>
        </div>

        {/* Sliding Line Slider */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20"
          style={{ left: `${sliderPosition}%` }}
        >
          {/* Central Handle Button */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white hover:bg-green-50 text-brand-700 rounded-full shadow-2xl flex items-center justify-center border-2 border-brand-500 select-none z-30 transition-shadow">
            <span className="text-lg font-bold">↔</span>
          </div>
        </div>
      </div>
    </div>
  );
}
