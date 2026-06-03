import React, { useState, useEffect, useRef, FormEvent } from "react";
import { 
  Sprout, Leaf, Scissors, Bug, Droplets, Sparkles, MapPin, Phone, 
  Mail, Clock, Settings as SettingsIcon, MessageSquare, CheckCircle, 
  ExternalLink, Menu, X, ShieldCheck, HeartHandshake, Zap, 
  HelpCircle, ChevronRight, User, AlertCircle, Copy, Check, Lock,
  Star, ShieldAlert, Award
} from "lucide-react";
import BeforeAfterSlider from "./components/BeforeAfterSlider";
import Calculator from "./components/Calculator";
import FAQ from "./components/FAQ";
import AdminPanel from "./components/AdminPanel";
import { Settings, Lead } from "./types";

// Default fallback settings matching the screenshot contact details
const DEFAULT_SETTINGS: Settings = {
  fields: {
    name: { visible: true, required: true, label: "Họ và tên quý khách" },
    phone: { visible: true, required: true, label: "Số điện thoại di động" },
    email: { visible: true, required: false, label: "Địa chi Email" },
    address: { visible: true, required: true, label: "Địa chỉ sân vườn cần chăm sóc / khảo sát" },
    area: { visible: true, required: false, label: "Diện tích ước tính (m²)" },
    services: { visible: true, required: false, label: "Dịch vụ quan tâm" },
    message: { visible: true, required: false, label: "Ghi chú & yêu cầu đặc biệt" },
  },
  notifications: {
    telegram: { enabled: false, botToken: "", chatId: "" },
    webhook: { enabled: false, url: "" },
    email: { enabled: false, destination: "" },
  },
  info: {
    companyName: "Cây Xanh Thủ Đô - Sân Vườn Đẳng Cấp",
    primaryPhone: "0777.080.111",
    zaloNumber: "0777080111",
    address: "Khu Đô Thị Ocean Park I, Q. Gia Lâm, TP. Hà Nội",
    email: "cayxanhthudo001@gmail.com",
    workHours: "08:00 - 18:00 (Tất cả các ngày trong tuần, kể cả ngày lễ)",
  },
};

const PROJECT_IMAGES = [
  { url: "/api/image-proxy?url=https://decoxdesign.com/upload/images/thiet-ke-canh-quan-san-vuon-1-3.png", title: "Cảnh Quan Sân Vườn Biệt Thự Vinhomes", location: "Vinhomes Ocean Park, Gia Lâm, Hà Nội" },
  { url: "/api/image-proxy?url=https://decoxdesign.com/upload/images/thiet-ke-canh-quan-san-vuon-9-2.png", title: "Khuôn Viên Cỏ Nhung Nhật Bản Sạch Sẽ", location: "Khu Biệt Thự Ciputra, Tây Hồ, Hà Nội" },
  { url: "/api/image-proxy?url=https://decoxdesign.com/upload/images/thiet-ke-canh-quan-san-vuon-3-1.png", title: "Cắt Tỉa Bonsai Tùng La Hán Sang Trọng", location: "Villa Sân Vườn, Ecopark Hưng Yên" },
  { url: "/api/image-proxy?url=https://decoxdesign.com/upload/images/thiet-ke-canh-quan-san-vuon-4-1.png", title: "Thảm Cây Xanh mát Lối Đi Dạo Biệt Thự", location: "Khu Đô Thị Splendora, Hoài Đức" },
  { url: "/api/image-proxy?url=https://decoxdesign.com/upload/images/thiet-ke-canh-quan-san-vuon-5-1.png", title: "Quy Hoạch Tiểu Cảnh Sân Vườn Hiện Đại", location: "Biệt thự Đơn Lập, Long Biên, Hà Nội" },
  { url: "/api/image-proxy?url=https://decoxdesign.com/upload/images/thiet-ke-canh-quan-san-vuon-6-1.png", title: "Chữa Trị Sâu Bệnh Bonsai & Cây Công Trình", location: "Nhà Vườn Đồi, Sóc Sơn, Hà Nội" }
];

export default function App() {
  const [isAdminView, setIsAdminView] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);

  // Auto rotate hero slide imagery
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveHeroSlide((prev) => (prev + 1) % PROJECT_IMAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Form input states
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formArea, setFormArea] = useState<number | undefined>(undefined);
  const [formServices, setFormServices] = useState<string[]>([]);
  const [formMessage, setFormMessage] = useState("");
  const [formEstimatedBudget, setFormEstimatedBudget] = useState<number | undefined>(undefined);
  const [formFrequency, setFormFrequency] = useState("");
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; leadId?: string; message?: string } | null>(null);
  const [copiedLeadId, setCopiedLeadId] = useState(false);

  const formSectionRef = useRef<HTMLDivElement>(null);

  // Load configuration from API server
  const loadSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (e) {
      console.error("Unable to draw settings from api, using default fallback:", e);
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Set values from smart calculator to registration form
  const handleCalculatorEstimate = (details: {
    area: number;
    frequency: string;
    services: string[];
    estimate: number;
  }) => {
    setFormArea(details.area);
    setFormFrequency(details.frequency);
    setFormEstimatedBudget(details.estimate);
    setFormServices(details.services);
    
    // Smooth scrolling to form
    if (formSectionRef.current) {
      formSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const toggleServiceInForm = (service: string) => {
    setFormServices((prev) => 
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  };

  const validateForm = () => {
    const tempErrors: Record<string, string> = {};
    if (!formName.trim()) tempErrors.name = "Họ và tên không được bỏ trống";
    
    const cleanPhone = formPhone.replace(/\s+/g, "");
    if (!cleanPhone) {
      tempErrors.phone = "Số điện thoại không được bỏ trống";
    } else if (!/^(0|84)[3|5|7|8|9][0-9]{8}$/.test(cleanPhone)) {
      tempErrors.phone = "Số điện thoại chưa đúng định dạng di động (VD: 0777080111)";
    }

    if (settings.fields.email.visible && settings.fields.email.required && !formEmail.trim()) {
      tempErrors.email = "Địa chỉ email không được bỏ trống";
    }

    if (settings.fields.address.visible && settings.fields.address.required && !formAddress.trim()) {
      tempErrors.address = "Vui lòng nhập địa chỉ cụ thể để kỹ sư đến khảo sát thực địa";
    }

    if (settings.fields.area.visible && settings.fields.area.required && (formArea === undefined || formArea <= 0)) {
      tempErrors.area = "Diện tích sân vườn phải lớn hơn 0 m²";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitLoading(true);
    setSubmitResult(null);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          phone: formPhone,
          email: formEmail || undefined,
          address: formAddress || undefined,
          area: formArea,
          services: formServices,
          frequency: formFrequency || undefined,
          message: formMessage || undefined,
          estimatedBudget: formEstimatedBudget,
        }),
      });

      const responseData = await res.json();
      if (res.ok) {
        setSubmitResult({
          success: true,
          leadId: responseData.data?.id,
          message: "Lên lịch thành công! Đội ngũ Cây Xanh Thủ Đô sẽ gọi lại trong vòng 5-15 phút.",
        });
        
        // Reset inputs
        setFormName("");
        setFormPhone("");
        setFormEmail("");
        setFormAddress("");
        setFormArea(undefined);
        setFormServices([]);
        setFormMessage("");
        setFormEstimatedBudget(undefined);
        setFormFrequency("");
      } else {
        setSubmitResult({
          success: false,
          message: responseData.error || "Gửi thông tin lỗi, mời bạn liên hệ trực tiếp hotline.",
        });
      }
    } catch (err) {
      setSubmitResult({
        success: false,
        message: "Lỗi kết nối máy chủ. Vui lòng thử lại sau giây lát hoặc kết nối trực tiếp hotine.",
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const copyLeadToClipboard = (leadId: string) => {
    navigator.clipboard.writeText(leadId);
    setCopiedLeadId(true);
    setTimeout(() => setCopiedLeadId(false), 2000);
  };

  const MARKETING_SERVICES = [
    { 
      id: "lawn_mower", 
      title: "Chăm Sóc & Cắt Tỉa Thảm Cỏ Tự Nhiên", 
      icon: Leaf, 
      desc: "Nhổ sạch cỏ dại tận gốc, sử dụng máy cắt phẳng mướt đúng tiêu chuẩn 3cm, xới đất bổ sung bón phân hữu cơ vi sinh sinh học xanh nõn nà.", 
      tag: "Dịch Vụ Số 1" 
    },
    { 
      id: "bonsai_art", 
      title: "Uốn Nắn & Cắt Tỉa Bonsai Cổ Thụ", 
      icon: Scissors, 
      desc: "Chuyên gia giàu tay nghề tạo dáng thế Tùng La Hán, Sanh cổ, Vạn Tuế... khống chế chiều cao an toàn và giữ phom nghệ thuật lẫm liệt.", 
      tag: "Nghệ Nhân Tuyển Chọn" 
    },
    { 
      id: "pest_control", 
      title: "Khảo Sát & Trực Tiếp Chữa Trị Sâu Bệnh", 
      icon: Bug, 
      desc: "Tiêu diệt tức thì rầy sáp, rầy lá, bọ trĩ, đốm trắng bằng thuốc thảo mộc hữu cơ có mùi dễ chịu, tuyệt đối an toàn cho sức khỏe gia chủ.", 
      tag: "Công Nghệ Sinh Học" 
    },
    { 
      id: "koi_water", 
      title: "Làm Sạch Bể Cá Koi & Non Bộ Phong Thủy", 
      icon: Sparkles, 
      desc: "Cạo sạch rêu tảo ngấm nghía tại bờ đá, thau bùn đáy hồ sỏi, phục hồi vi sinh lọc nước tuần hoàn, mang lại độ trong veo mát mẻ tuyệt đối.", 
      tag: "Trọn Gói Hồi Sinh" 
    },
    { 
      id: "irrigation_diy", 
      title: "Lắp Đặt Hệ Thống Tưới Nước KTS Tự Động", 
      icon: Droplets, 
      desc: "Thiết kế vòi béc xoay 360 độ cao cấp ẩn dưới thảm cỏ, cài lịch hẹn giờ phun mịn màng qua điện thoại, bảo đảm độ ẩm mượt suốt ngày đêm.", 
      tag: "Giải Pháp 4.0" 
    },
    { 
      id: "master_redesign", 
      title: "Cải Tạo & Thiết Kế Lại Toàn Bộ Sân Vườn Biệt Thự", 
      icon: Sprout, 
      desc: "Quy hoạch tiểu cảnh đá cuội, lát đá dạo thanh nhã, sắp đặt cỏ Nhật đan hoa, thổi sắc thái tươi mới đẳng cấp như khu resort 5 sao.", 
      tag: "Tư Vấn Thiết Kế 3D" 
    },
  ];

  return (
    <div className="relative min-h-screen bg-slate-50 flex flex-col justify-between font-sans" id="app-root-container">
      
      {/* 1. TOP PULSING BULLETIN BAR FOR ADS CONVERSIONS */}
      <div className="bg-emerald-900 text-emerald-50 px-4 py-2.5 text-center text-[11px] md:text-xs font-semibold tracking-wide border-b border-emerald-800 flex justify-center items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
        <span>Hệ thống Cảnh Quan Cây Xanh Thủ Đô - MIỄN PHÍ 100% Khảo sát đo đạc thực nghiệm sân vườn nội ô Hà Nội</span>
        <span className="hidden sm:inline-block">| Hotline 24/7: <strong className="text-yellow-300">{settings.info.primaryPhone}</strong></span>
      </div>

      {/* 2. MAIN HEADER NAVIGATION WITH BACKLINK TO CAYXANHTHUDO.VN */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm" id="main-navigation-header">
        <div className="max-w-7xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
          
          {/* Logo & Slogan Layout matching Cây Xanh Thủ Đô brand */}
          <a href="#" className="flex items-center gap-2.5 text-emerald-800 tracking-tight" id="header-brand-logo">
            <div className="bg-brand-600 p-2 text-white rounded-xl shadow-md">
              <Sprout className="w-5 h-5" />
            </div>
            <div className="font-display">
              <span className="text-base md:text-lg font-black uppercase text-slate-800 leading-none block">
                Cây Xanh Thủ Đô
              </span>
              <span className="text-[9px] text-emerald-600 font-bold tracking-widest uppercase block mt-1">
                Kỹ thuật lâm nghiệp & cảnh quan
              </span>
            </div>
          </a>

          {/* Desktop Nav Actions linking to landing categories */}
          <nav className="hidden lg:flex items-center gap-6 text-xs md:text-sm font-bold text-slate-600" id="desktop-nav-menu">
            <a href="#services-section" className="hover:text-emerald-700 transition-colors">Dịch vụ sân vườn</a>
            <a href="#before-after-section" className="hover:text-emerald-700 transition-colors">Ảnh thực tế</a>
            <a href="#calculator-section" className="hover:text-emerald-700 transition-colors">Tự tính chi phí</a>
            <a href="#villas-gallery-section" className="hover:text-emerald-700 transition-colors">Dự án biệt thự</a>
            <a href="#faq-section" className="hover:text-emerald-700 transition-colors">Câu hỏi thường gặp</a>
            <a 
              href="https://cayxanhthudo.vn" 
              target="_blank" 
              rel="noreferrer"
              className="text-emerald-600 hover:text-emerald-800 transition-all font-semibold flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full text-[11px] border border-emerald-200"
            >
              <span>Website chính: cayxanhthudo.vn</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </nav>

          {/* Right corner admin panel shortcut & CTA links */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsAdminView(!isAdminView);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                isAdminView
                  ? "bg-slate-800 text-white border-slate-900 shadow-md"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 cursor-pointer"
              }`}
              id="admin-portal-switch"
              title="Xem danh sách khách hàng và quản lý cấu hình Form"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isAdminView ? "← Xem Web Ads" : "Quản Lý Lead"}</span>
            </button>

            {/* Quick Calling Button */}
            <a
              href={`tel:${settings.info.primaryPhone.replace(/\./g, "")}`}
              className="hidden sm:inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-red-100"
              id="header-call-btn"
            >
              <Phone className="w-4 h-4 animate-bounce shrink-0" />
              <span>Gọi Ngay: {settings.info.primaryPhone.split(" / ")[0]}</span>
            </a>

            {/* Mobile menu drawer trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
              id="mobile-nav-trigger"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-100 px-4 py-4 space-y-3 animate-fadeIn" id="mobile-nav-panel">
            <nav className="flex flex-col gap-2 text-xs sm:text-sm font-bold text-slate-700">
              <a 
                href="#services-section" 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 w-full hover:bg-slate-50 rounded-lg block"
              >
                🌿 Các hạng mục chăm sóc sân vườn
              </a>
              <a 
                href="#before-after-section" 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 w-full hover:bg-slate-50 rounded-lg block"
              >
                📐 So sánh hình ảnh Trước / Sau
              </a>
              <a 
                href="#calculator-section" 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 w-full hover:bg-slate-50 rounded-lg block"
              >
                💰 Công cụ tính chi phí ước lượng
              </a>
              <a 
                href="https://cayxanhthudo.vn" 
                target="_blank" 
                rel="noreferrer"
                className="p-2 w-full text-emerald-600 hover:bg-emerald-50 rounded-lg flex items-center justify-between"
              >
                <span>🌐 Xem Website CayXanhThuDo.vn</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </nav>
            <div className="pt-2 border-t border-slate-100">
              <a
                href={`tel:${settings.info.primaryPhone.replace(/\./g, "")}`}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md"
              >
                <Phone className="w-4 h-4 animate-bounce" />
                <span>Hotline: {settings.info.primaryPhone.split(" / ")[0]}</span>
              </a>
            </div>
          </div>
        )}
      </header>

      {/* 3. MAIN APP SECTION */}
      <main className="flex-grow">
        {isAdminView ? (
          /* ADMIN LEADS MANAGEMENT */
          <div className="bg-slate-50 min-h-screen py-4 animate-fadeIn">
            <AdminPanel savedSettings={settings} onSettingsSaved={(newS) => setSettings(newS)} />
          </div>
        ) : (
          /* PRESTIGE USER AD-LANDING PAGE */
          <div className="animate-fadeIn" id="landing-page">
            
            {/* EPIC ABOVE-THE-FOLD HERO: 2-COLUMN LADI-STYLE HIGHEST CONVERSION RATE - BRIGHTENED EDITION */}
            <section className="relative bg-gradient-to-br from-slate-50 via-emerald-50/25 to-emerald-100/10 text-slate-800 py-12 lg:py-20 overflow-hidden border-b border-emerald-100/50" id="hero-section">
              {/* Premium background landscape banner image with subtle opacity & blend */}
              <div className="absolute inset-0 z-0 select-none pointer-events-none opacity-[0.06] mix-blend-overlay">
                <img 
                  src="/api/image-proxy?url=https://decoxdesign.com/upload/images/thiet-ke-canh-quan-san-vuon-1-3.png" 
                  alt="Landscape background pattern" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Dynamic luxury ambient lights */}
              <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-1/10 left-10 w-[300px] h-[300px] bg-emerald-600/5 rounded-full blur-2xl pointer-events-none" />

              <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
                
                {/* Left Column: Direct high-trust advertisement text with link badge */}
                <div className="lg:col-span-7 space-y-6 text-left">
                  
                  {/* CAYXANHTHUDO badge */}
                  <a 
                    href="https://cayxanhthudo.vn"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 bg-emerald-100/80 border border-emerald-200 px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-800 hover:bg-emerald-250/95 transition-all shadow-sm"
                  >
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span>Hệ thống trực thuộc đại website: cayxanhthudo.vn</span>
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
                  </a>

                  {/* High impact slogan representing lawn & villa care */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold tracking-widest text-emerald-700 uppercase block">
                      GIẢI PHÁP CHĂM SÓC TOÀN DIỆN - TIẾT KIỆM ĐẾN 20% CHI PHÍ
                    </span>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-black leading-tight tracking-tight uppercase">
                      <span className="text-orange-500">Dịch Vụ Chăm Sóc</span> <br className="hidden md:inline"/>
                      <span className="text-emerald-700">Sân Vườn Biệt Thự</span> <br className="hidden md:inline"/> 
                      <span className="text-orange-500">& Cảnh Quan Số 1 Hà Nội</span>
                    </h1>
                    <div className="w-20 h-1.5 bg-orange-500 rounded-full" />
                  </div>

                  <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed max-w-2xl font-medium">
                    Hồi sinh thảm cỏ nhung Nhật Bản phẳng lỳ nâng tầm giá trị biệt thự, tỉa thế định hình Bonsai quý phái, phun thuốc hữu cơ thảo mộc thảo dược không mùi diệt trừ sâu rầy triệt để, thau sỏi rêu lòng bể cá Koi sạch mát cực hạn. 
                  </p>

                  {/* Real core benefit checklist */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-slate-700 text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                      <span>Khảo sát đo thực địa 0đ trong 2 tiếng</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                      <span>Cam kết đền bù 100% tài sản cây héo úa</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                      <span>Vườn ươm 5ha tại Gia Lâm, Hà Nội</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                      <span>Kỹ sư lâm học đại học chính quy thiết kế</span>
                    </div>
                  </div>

                  {/* Live slider preview inside Hero block */}
                  <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-emerald-100 flex items-center gap-4.5 shadow-sm">
                    <div className="relative aspect-video w-32 md:w-44 rounded-xl overflow-hidden bg-emerald-50 shrink-0 shadow-sm border border-emerald-100 font-display text-emerald-800">
                      <img 
                        src={PROJECT_IMAGES[activeHeroSlide].url} 
                        alt="Villa" 
                        className="w-full h-full object-cover transition-all duration-1000"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="space-y-1 text-left">
                      <span className="text-[9px] font-mono uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                        {PROJECT_IMAGES[activeHeroSlide].location}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-1">
                        {PROJECT_IMAGES[activeHeroSlide].title}
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        Cam kết sống mướt lá, bền vững dạt dào sinh khí.
                      </p>
                    </div>
                  </div>

                  {/* Screenshot card representation with numbers */}
                  <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold">
                    <div className="text-slate-600">
                      Hotline chạy ads trực tiếp: 
                      <a href={`tel:${settings.info.primaryPhone.replace(/\./g, "")}`} className="hover:underline text-rose-600 font-bold block text-sm sm:text-base">
                        {settings.info.primaryPhone}
                      </a>
                    </div>
                    <div className="text-slate-600">
                      Đường dây nóng bổ sung: 
                      <a href="tel:0777010222" className="hover:underline text-emerald-700 font-bold block text-sm sm:text-base">
                        0777.010.222
                      </a>
                    </div>
                  </div>

                </div>

                {/* Right Column: Dynamic Instant Signup Card above the fold */}

                {/* Right Column: Dynamic Instant Signup Card above the fold */}
                <div className="lg:col-span-5" id="hero-instant-registration-card">
                  <div className="bg-white rounded-3xl p-5 sm:p-7 text-slate-800 shadow-2xl border border-slate-100 relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-10 pointer-events-none opacity-50" />
                    
                    <div className="text-center space-y-1.5 mb-5">
                      <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block">
                        Ưu đãi đặc biệt hôm nay
                      </span>
                      <h3 className="text-lg md:text-xl font-display font-extrabold text-slate-800">
                        Đặt Lịch Đo Khảo Sát 0đ
                      </h3>
                      <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                        Cử Kỹ Sư kiểm tra sinh lý đất, đo đạc cây cảnh, tư vấn dáng cỏ tỉ mỉ và báo giá chi tiết tận nơi.
                      </p>
                    </div>

                    {submitResult ? (
                      submitResult.success ? (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center space-y-3.5 py-8">
                          <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
                          <div className="space-y-1">
                            <h4 className="text-base font-bold text-slate-800">Đăng kí thành công!</h4>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              Đội ngũ kỹ sư lâm nghiệp của **Cây Xanh Thủ Đô** sẽ chủ động liên lạc tới hotline di động của anh/chị ngay trong vòng 5-15 phút để tư vấn.
                            </p>
                          </div>
                          {submitResult.leadId && (
                            <div className="bg-white px-3 py-1.5 border border-emerald-100 inline-flex items-center gap-1.5 rounded-lg text-[11px] font-mono text-slate-700">
                              <span>Mã đơn: <strong>{submitResult.leadId}</strong></span>
                              <button
                                type="button"
                                onClick={() => copyLeadToClipboard(submitResult.leadId!)}
                                className="text-[#15803d] hover:text-brand-900 font-semibold flex items-center gap-0.5 ml-1 select-none"
                              >
                                {copiedLeadId ? (
                                  <Check className="w-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3" />
                                )}
                                <span>{copiedLeadId ? "Đã chép" : "Chép"}</span>
                              </button>
                            </div>
                          )}
                          <button
                            onClick={() => setSubmitResult(null)}
                            className="text-[10px] text-slate-500 hover:text-slate-800 bg-white border border-slate-200 py-1.5 px-3 rounded-lg block mx-auto"
                          >
                            Đăng ký thêm cuộc hẹn khác
                          </button>
                        </div>
                      ) : (
                        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-xs space-y-1.5">
                          <AlertCircle className="w-5 h-5 shrink-0" />
                          <div>
                            <strong>Không gửi được mẫu:</strong> {submitResult.message}
                            <button onClick={() => setSubmitResult(null)} className="underline font-bold block mt-1">Quay lại điền thông tin</button>
                          </div>
                        </div>
                      )
                    ) : (
                      <form onSubmit={handleFormSubmit} className="space-y-3">
                        
                        {/* Name */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 block text-left">
                            Họ và tên khách hàng <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input 
                              type="text" 
                              required
                              value={formName}
                              onChange={(e) => setFormName(e.target.value)}
                              placeholder="Anh / Chị..."
                              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                        </div>

                        {/* Phone */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 block text-left">
                            Số điện thoại phục vụ <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input 
                              type="tel" 
                              required
                              value={formPhone}
                              onChange={(e) => setFormPhone(e.target.value)}
                              placeholder="Số thoại di động liên lạc..."
                              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                          {errors.phone && <p className="text-[10px] text-red-500">{errors.phone}</p>}
                        </div>

                        {/* Address */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 block text-left">
                            Địa chỉ biệt thự / căn hộ khảo sát <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input 
                              type="text" 
                              required
                              value={formAddress}
                              onChange={(e) => setFormAddress(e.target.value)}
                              placeholder="Vị trí nhà riêng, khu đô thị..."
                              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                        </div>

                        {/* Area */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <label className="text-[11px] font-bold text-slate-700 block text-left">
                              Diện tích cỏ / sân vườnước lượng
                            </label>
                            <span className="text-[10px] text-emerald-600 font-bold">m²</span>
                          </div>
                          <input 
                            type="number" 
                            value={formArea !== undefined ? formArea : ""}
                            onChange={(e) => setFormArea(e.target.value === "" ? undefined : Number(e.target.value))}
                            placeholder="Ví dụ: 80, 150, 300..."
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>

                        {/* Brief message request */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 block text-left">
                            Yêu cầu cụ thể của anh/chị
                          </label>
                          <textarea 
                            value={formMessage}
                            onChange={(e) => setFormMessage(e.target.value)}
                            placeholder="Nhổ cỏ dại, bón dinh dưỡng, cắt tùng thế, rửa hồ rêu sỏi..."
                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 h-14 resize-none"
                          />
                        </div>

                        {/* Submit Button */}
                        <button
                          type="submit"
                          disabled={submitLoading}
                          className="w-full bg-[#16a34a] hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl shadow-lg transition-all transform hover:scale-[1.01] flex items-center justify-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                          <span>{submitLoading ? "HỆ THỐNG ĐANG GỬI..." : "ĐĂNG KÝ KHẢO SÁT 0Đ & BÁO GIÁ"}</span>
                        </button>
                        
                        <p className="text-[9px] text-center text-slate-400">
                          Bảo mật dữ liệu tuyệt đối. Cam kết không tốn 1 đồng chi phí khảo sát.
                        </p>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* AD-FRIENDLY MULTI-BENEFIT TRUST BAR */}
            <section className="bg-brand-50 border-y border-emerald-100 py-6" id="trustbar-section">
              <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-around items-center gap-5 text-slate-700 text-xs font-bold uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>CAM KẾT ĐỀN CÂY 100% NẾU HÉO ÚA</span>
                </div>
                <div className="w-px h-5 bg-emerald-250 hidden md:block" />
                <div className="flex items-center gap-2">
                  <HeartHandshake className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>KỸ SƯ LÂM HỌC VỮNG TAY NGHỀ CHU ĐÁO</span>
                </div>
                <div className="w-px h-5 bg-emerald-250 hidden md:block" />
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>PHÂN BÓN VI SINH CHUẨN SINH HỌC KHÔNG MÙI</span>
                </div>
              </div>
            </section>

            {/* MAIN CATEGORIES AND CORE BENEFITS */}
            <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 text-center scroll-mt-16" id="services-section">
              <div className="mb-12 space-y-2">
                <span className="bg-emerald-100 text-[#14532d] text-xs font-bold px-3.5 py-1 rounded-full uppercase tracking-wider">
                  Quy Trình Khoa Học - Thẩm Mỹ Đỉnh Cao
                </span>
                <h2 className="text-2xl md:text-4xl font-display font-black text-slate-800 tracking-tight">
                  Các Hạng Mục Chăm Sóc Sân Vườn Biệt Thự chính
                </h2>
                <p className="text-xs sm:text-sm md:text-base text-slate-500 max-w-xl mx-auto leading-relaxed">
                  Thiết kế tinh xảo từ tâm, cải tạo mầm úa, diệt rầy sinh học tự nhiên cứu sống từng lộc xanh, nuôi dưỡng thảm cỏ nhung dịu mát bảo vệ chân ngọc của gia đình.
                </p>
              </div>

              {/* Grid of marketing items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {MARKETING_SERVICES.map((s) => {
                  const Icon = s.icon;
                  const isSelect = formServices.includes(s.title);
                  return (
                    <div
                      key={s.id}
                      className="bg-white rounded-2xl p-6 border border-slate-100 shadow-3xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left flex flex-col justify-between group border-b-4 hover:border-b-emerald-600"
                    >
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white p-3 rounded-xl transition-colors shrink-0">
                            <Icon className="w-5.5 h-5.5" />
                          </div>
                          <span className="bg-slate-100 text-slate-600 font-bold text-[9px] uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                            {s.tag}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <h3 className="text-base font-bold text-slate-800 font-display">
                            {s.title}
                          </h3>
                          <p className="text-xs text-slate-500 leading-relaxed md:line-clamp-3">
                            {s.desc}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-55 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            toggleServiceInForm(s.title);
                            // Auto scroll to form
                            formSectionRef.current?.scrollIntoView({ behavior: "smooth" });
                          }}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                            isSelect
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : "bg-white text-slate-600 hover:text-emerald-700 border-slate-200"
                          }`}
                        >
                          {isSelect ? "✓ Đã Chọn Đăng Ký" : "+ Áp dụng dịch vụ"}
                        </button>
                        <span className="text-[10px] text-slate-400 font-bold">Khảo sát 0đ</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* COMPARATIVE BEFORE / AFTER COMPONENT */}
            <section className="bg-slate-100/60 py-12 md:py-20 border-y border-slate-250/20" id="before-after-section">
              <BeforeAfterSlider />
            </section>

            {/* PREMIUM CLIENTS REVIEWS TIMELINE STATS CAROUSEL */}
            <section className="py-16 md:py-24 bg-white" id="villas-gallery-section">
              <div className="max-w-7xl mx-auto px-4">
                
                <div className="text-center mb-12 space-y-2">
                  <span className="bg-emerald-100 text-[#14532d] text-xs font-bold px-3.5 py-1 rounded-full uppercase tracking-wider">
                    Chính sách tận tâm phục vụ
                  </span>
                  <h2 className="text-2xl md:text-4xl font-display font-black text-slate-800 tracking-tight">
                    Hồ Sơ Năng Lực Sân Vườn Biệt Thự thực tế
                  </h2>
                  <p className="text-xs sm:text-sm md:text-base text-slate-500 max-w-xl mx-auto leading-relaxed">
                    Độc lập thiết kế quy hoạch, làm phẳng thềm mặt tiền cỏ, đắp hòn non bộ, uốn lượn cây xanh dạt dào sức sống tại các phân khu biệt thự nổi bật miền Bắc.
                  </p>
                </div>

                {/* Grid of gallery projects */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
                  {PROJECT_IMAGES.map((img, idx) => (
                    <div 
                      key={idx} 
                      className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-900 shadow-md min-h-[160px] sm:min-h-[220px] md:min-h-[280px] flex flex-col justify-end transition-all"
                    >
                      <img 
                        src={img.url} 
                        alt={img.title} 
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                      
                      <div className="relative z-10 p-3 sm:p-5 text-left space-y-1">
                        <span className="text-[8px] sm:text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest block">
                          {img.location}
                        </span>
                        <h4 className="text-xs sm:text-base font-bold text-white leading-tight font-display tracking-tight">
                          {img.title}
                        </h4>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </section>

            {/* CORE INTERACTIVE PRICE ESTIMATOR FOR LOWER ADS CPI */}
            <section className="bg-slate-50 py-16 md:py-20 border-y border-slate-200/50">
              <div className="max-w-7xl mx-auto px-4">
                
                <div className="text-center mb-8 space-y-2">
                  <span className="bg-emerald-100 text-[#14532d] text-xs font-bold px-3.5 py-1 rounded-full uppercase tracking-wider">
                    Cân đối tài chính minh bạch
                  </span>
                  <h2 className="text-2xl md:text-3xl font-display font-extrabold text-slate-800 tracking-tight">
                    Công Cụ Tự Dự Toán Chi Phí Sân Vườn
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                    Giảm thiều bấp bênh giá cả chạy ads mập mờ! Sử dụng thanh trượt phía dưới để tính toán sơ bộ chi phí cắt cỏ bón phân theo tháng.
                  </p>
                </div>

                <Calculator onSelectedEstimate={handleCalculatorEstimate} />

              </div>
            </section>

            {/* 5-STEP EXQUISITE SERVICE TIMELINE FOR CUSTOMERS GUIDANCE - BRIGHTENED EDITION */}
            <section className="bg-gradient-to-br from-slate-50 via-emerald-50/20 to-white text-slate-800 py-16 md:py-24 border-t border-slate-100" id="process-section">
              <div className="max-w-7xl mx-auto px-4">
                
                <div className="text-center mb-16 space-y-2">
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider font-semibold">
                    Tính toán chuyên nghiệp chuẩn hóa
                  </span>
                  <h3 className="text-2xl md:text-4xl font-display font-black tracking-tight text-slate-900">
                    5 Bước Đưa Thiên Nhiên Vào Biệt Thự Gia Chủ
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                    Nhập cuộc thần tốc, cam kết mướt phẳng rõ ràng nhật ký ghi nhận, gia chủ chỉ cần mỉm cười thưởng trà thư thái.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative">
                  {/* Design timeline line connector */}
                  <div className="hidden md:block absolute top-8 left-[10%] right-[10%] h-0.5 bg-emerald-200 z-0" />
                  
                  {[
                    { step: "01", title: "Khảo Sát Thực Địa", desc: "Đo lường kiểm định độ khô sinh lý rễ đất, khảo nấm mốc trong ngày." },
                    { step: "02", title: "Lên Hồ Sơ Báo Giá", desc: "Tạo lập sơ đồ tính lượng phân vi sinh cần gieo mộc, hợp đồng minh bạch." },
                    { step: "03", title: "Phát Thải Trệt Sâu", desc: "Thau sạch hồ rêu mốc, phun tinh dầu thảo mộc ngăn ngừa côn trùng." },
                    { step: "04", title: "Quy Cắt Định Kỳ", desc: "Xén thảm cỏ mịn phẳng, dọn cỏ hoang dại thủ công bảo hiểm cây xanh." },
                    { step: "05", title: "Nghiệm Thu Thường Nhật", desc: "Phiếu nhật trình chăm bón ký bàn giao sau mỗi buổi trực để đối chiếu." },
                  ].map((node, index) => (
                    <div key={index} className="text-center space-y-3 relative z-10 group">
                      <div className="w-16 h-16 bg-white border-2 border-emerald-500 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white rounded-2xl mx-auto flex items-center justify-center font-mono text-lg font-black shadow-md transition-all duration-300">
                        {node.step}
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-950 group-hover:text-emerald-700 transition-colors">
                          {node.title}
                        </h4>
                        <p className="text-[11px] text-slate-600 leading-relaxed max-w-[180px] mx-auto">
                          {node.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </section>

            {/* EXQUISITE HIGHLIGHT SECTION BOUNCING BACK TO CAYXANHTHUDO.VN */}
            <section className="bg-emerald-50/70 py-16 border-y border-emerald-100">
              <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
                <div className="bg-emerald-100 inline-flex p-3 rounded-2xl text-emerald-800 shadow-inner">
                  <Award className="w-8 h-8 animate-pulse text-yellow-600" />
                </div>
                
                <h3 className="text-2xl sm:text-3xl font-display font-black text-slate-800 tracking-tight">
                  Khám Phá Toàn Bộ Kiệt Tác Tại Website Chính Thức
                </h3>
                
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto font-medium">
                  Để tham khảo trọn bộ Catalgoue hơn 1.000+ sản phẩm cây giống đại thụ biệt thự, tài liệu quy hoạch 3D phong thủy hoàn thảo của dự án và toàn bộ hồ sơ năng lực pháp lý 5 sao của hệ thống chúng tôi, xin quý khách hàng gõ duyệt hoặc truy cập trực tiếp Website Mẹ.
                </p>

                <div className="pt-3">
                  <a 
                    href="https://cayxanhthudo.vn" 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm py-4 px-8 rounded-full shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transition-all transform hover:scale-[1.02]"
                  >
                    <span>TRUY CẬP WEBSITE: WWW.CAYXANHTHUDO.VN</span>
                    <ExternalLink className="w-4.5 h-4.5" />
                  </a>
                </div>
              </div>
            </section>

            {/* SUBMISSION FORM LINK FOR MID-PAGE CLICKS */}
            <section 
              ref={formSectionRef}
              className="py-16 max-w-4xl mx-auto px-4 scroll-mt-20" 
              id="form-registration-section"
            >
              <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xl p-6 md:p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-[100%] opacity-40 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-brand-100 rounded-tr-[100%] opacity-40 pointer-events-none" />

                <div className="relative z-10 space-y-6">
                  
                  <div className="text-center space-y-2">
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      Nhận Khảo Sát Tận Nhà Cực Nhanh 2h
                    </span>
                    <h3 className="text-xl md:text-3xl font-display font-extrabold text-slate-800">
                      Mẫu Đăng Ký Khảo Sát Tiết Kiệm (Không Phí)
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Sau khi điền mẫu tiếp nhận, kỹ sư trưởng của **Cây Xanh Thủ Đô** sẽ trực tiếp gọi điện tư vấn tỉ mỉ các tùy biến sân vườn nhà mình.
                    </p>
                  </div>

                  {submitResult ? (
                    submitResult.success ? (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-4 animate-scaleUp py-10">
                        <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
                        <div className="space-y-1">
                          <h4 className="text-lg font-bold text-slate-800">Yêu Cầu Đã Được Tiếp Nhận!</h4>
                          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                            Cảm ơn quý khách đã tin cậy nâng niu mảnh vườn báu của mình cho Cây Xanh Thủ Đô. Chúng tôi sẽ nhanh chóng tổng hợp thông số và liên hệ lại tư vấn qua số điện thoại của anh/chị ngay.
                          </p>
                        </div>
                        {submitResult.leadId && (
                          <div className="bg-white px-3 py-1.5 border border-emerald-100 inline-flex items-center gap-1.5 rounded-lg text-xs font-mono text-slate-700">
                            <span>Mã số đơn hàng: <strong>{submitResult.leadId}</strong></span>
                            <button
                              type="button"
                              onClick={() => copyLeadToClipboard(submitResult.leadId!)}
                              className="text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-0.5 ml-1 select-none"
                            >
                              {copiedLeadId ? (
                                <Check className="w-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3" />
                              )}
                              <span>{copiedLeadId ? "Đã chép" : "Sao chép"}</span>
                            </button>
                          </div>
                        )}
                        <div>
                          <button
                            type="button"
                            onClick={() => setSubmitResult(null)}
                            className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-xl block mx-auto hover:bg-slate-50"
                          >
                            Đăng ký thêm địa chỉ khác
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-xs text-red-800 space-y-1.5">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <div>
                          <strong>Không gửi được thông tin:</strong> {submitResult.message}
                          <button onClick={() => setSubmitResult(null)} className="underline font-bold block mt-1">Quay lại</button>
                        </div>
                      </div>
                    )
                  ) : (
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                      
                      {/* Synchronized estimated budget marker */}
                      {formEstimatedBudget !== undefined && (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold block text-slate-700">🎯 Đồng bộ tham khảo từ bộ tính giá:</span>
                            <span className="text-[11px] text-slate-500">
                              Diện tich: {formArea}m² | Tần suất: {formFrequency}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block font-bold uppercase leading-none">ƯỚC TÍNH CHI PHÍ</span>
                            <span className="font-extrabold text-emerald-800 font-mono text-sm">~{formEstimatedBudget.toLocaleString("vi-VN")}đ/tháng</span>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Name Input */}
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                            {settings.fields.name.label} <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                              type="text"
                              required
                              value={formName}
                              onChange={(e) => setFormName(e.target.value)}
                              placeholder="Họ và tên hoặc tên xưng hô của quý khách..."
                              className="w-full pl-9 pr-3 py-3 text-xs md:text-sm border rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 border-slate-200"
                            />
                          </div>
                        </div>

                        {/* Phone Input */}
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                            {settings.fields.phone.label} <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                              type="tel"
                              required
                              value={formPhone}
                              onChange={(e) => setFormPhone(e.target.value)}
                              placeholder="Số điện thoại di động chính xác nhận thông tin..."
                              className="w-full pl-9 pr-3 py-3 text-xs md:text-sm border rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 border-slate-200"
                            />
                          </div>
                          {errors.phone && <p className="text-[10px] text-red-500 italic pl-1">{errors.phone}</p>}
                        </div>

                        {/* Area Input */}
                        {settings.fields.area.visible && (
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                              {settings.fields.area.label} {settings.fields.area.required && <span className="text-red-500">*</span>}
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xs font-bold text-slate-400">㎡</span>
                              <input
                                type="number"
                                value={formArea !== undefined ? formArea : ""}
                                onChange={(e) => setFormArea(e.target.value === "" ? undefined : Number(e.target.value))}
                                placeholder="Ví dụ: 80, 150, 300..."
                                className="w-full pl-8 pr-3 py-3 text-xs md:text-sm border rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 border-slate-200"
                              />
                            </div>
                          </div>
                        )}

                        {/* Email Input */}
                        {settings.fields.email.visible && (
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700">
                              {settings.fields.email.label}
                            </label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input
                                type="email"
                                value={formEmail}
                                onChange={(e) => setFormEmail(e.target.value)}
                                placeholder="địa chỉ email nhận báo giá PDF (nếu có)..."
                                className="w-full pl-9 pr-3 py-3 text-xs md:text-sm border rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 border-slate-200"
                              />
                            </div>
                          </div>
                        )}

                        {/* Address Input */}
                        {settings.fields.address.visible && (
                          <div className="space-y-1 sm:col-span-2">
                            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                              {settings.fields.address.label} <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input
                                type="text"
                                required
                                value={formAddress}
                                onChange={(e) => setFormAddress(e.target.value)}
                                placeholder="Nhập địa chỉ nhà, khu đô thị cần đo đạc để kỹ sư đến thực địa..."
                                className="w-full pl-9 pr-3 py-3 text-xs md:text-sm border rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 border-slate-200"
                              />
                            </div>
                          </div>
                        )}

                        {/* Services input options */}
                        {settings.fields.services.visible && (
                          <div className="space-y-1.5 sm:col-span-2">
                            <label className="text-xs font-bold text-slate-700 block text-left">
                              {settings.fields.services.label}
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {[
                                "Bonsai, tạo dáng cây cảnh",
                                "Cắt cỏ nhung định kỳ",
                                "Bón phân, cải hoại rễ rễ",
                                "Chữa sâu, trùng rầy",
                                "Vệ sinh bể cá Koi, non bộ",
                                "Cảnh quan biệt thự tổng rực rỡ",
                              ].map((serv, idx) => {
                                const selected = formServices.includes(serv);
                                return (
                                  <button
                                    type="button"
                                    key={idx}
                                    onClick={() => toggleServiceInForm(serv)}
                                    className={`text-left p-2.5 rounded-xl border text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                                      selected 
                                        ? "bg-emerald-50 border-emerald-500 text-emerald-800 font-bold" 
                                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                    }`}
                                  >
                                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                                      selected ? "bg-emerald-600 border-emerald-600 text-white" : "border-slate-300 bg-white"
                                    }`}>
                                      {selected && <Check className="w-2.5 h-2.5" />}
                                    </div>
                                    <span className="truncate">{serv}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Additional requirements message area */}
                        {settings.fields.message.visible && (
                          <div className="space-y-1 sm:col-span-2">
                            <label className="text-xs font-bold text-slate-700 block text-left">
                              {settings.fields.message.label}
                            </label>
                            <textarea
                              value={formMessage}
                              onChange={(e) => setFormMessage(e.target.value)}
                              placeholder="Anh/chị kể thêm chi tiết thảm vườn, bonsai, non bộ cần chăm sóc..."
                              className="w-full h-24 p-3 text-xs md:text-sm border rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 border-slate-200 resize-none"
                            />
                          </div>
                        )}

                      </div>

                      {/* Submit action */}
                      <div className="pt-3">
                        <button
                          type="submit"
                          disabled={submitLoading}
                          className="w-full bg-[#16a34a] hover:bg-emerald-700 text-white font-bold py-4.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
                        >
                          <Sparkles className="w-4 h-4 text-yellow-300" />
                          <span>{submitLoading ? "VUI LÒNG ĐỢI, HỆ THỐNG ĐANG GỬI..." : "ĐĂNG KÝ KHẢO SÁT 0Đ & BÁO GIÁ LẬP TỨC (MIỄN PHÍ)"}</span>
                        </button>
                        <p className="text-[10px] text-center text-slate-400 mt-2">
                          Sau khi nhận đăng ký, kỹ sư trưởng của **Cây Xanh Thủ Đô** sẽ trực tiếp liên lạc để tư vấn chi tiết cho anh/chị.
                        </p>
                      </div>

                    </form>
                  )}

                </div>
              </div>
            </section>

            {/* HIGH-TRUST CUSTOMERS FEEDBACKS */}
            <section className="bg-slate-100/60 py-16 md:py-24 border-t border-slate-200/20" id="testimonials-section">
              <div className="max-w-7xl mx-auto px-4">
                
                <div className="text-center mb-12 space-y-2">
                  <span className="bg-emerald-100 text-[#14532d] text-xs font-bold px-3.5 py-1 rounded-full uppercase tracking-wider">
                    Niềm tin gửi mầm xanh cho tổ ấm
                  </span>
                  <h3 className="text-2xl md:text-3xl font-display font-bold text-slate-800 tracking-tight">
                    Ý Kiến Khách Hàng Thực Tế
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Khảo sát đánh giá khách quan của các gia chủ biệt thự quy mô tại Ciputra, Vinhomes Riverside và Ecopark.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { 
                      name: "Anh Hoàng Nam", 
                      role: "Chủ biệt thự Vinhomes Riverside, Long Biên", 
                      stars: "⭐⭐⭐⭐⭐", 
                      feedback: "Thảm cỏ tơ tự nhiên nhà mình thỉnh thoảng bị mối đất đắp ụ và sâu rêu phá hoại. May có kỹ sư Cây Xanh Thủ Đô sang tận nơi khảo sát đo đạc 0đ rồi phun chế phẩm an toàn sinh học. Cỏ mọc phẳng lỳ trẻ nhỏ chơi đùa an tâm!" 
                    },
                    { 
                      name: "Chị Thảo Nguyên", 
                      role: "Chủ sở hữu Villa Ngoại Giao Đoàn, Tây Hồ", 
                      stars: "⭐⭐⭐⭐⭐", 
                      feedback: "Sân vườn rộng có hồ cá Koi rất hay bám nấm rêu đen đá cuội bốc mùi tanh khi trời nắng gắt. Cây Xanh Thủ Đô đã cải tạo béc lọc sinh học, cử kỹ thuật nắn tỉa Bonsai rất có hồn pháp lý minh bạch đền bù rõ rệt." 
                    },
                    { 
                      name: "Chú Đức Phát", 
                      role: "Chủ penthouse Đơn lập Ecopark", 
                      stars: "⭐⭐⭐⭐⭐", 
                      feedback: "Kỹ năng thẩm mỹ cắt uốn bonsai của các cháu thợ chuyên nghiệp lễ phép lắm. Có hợp đồng cam kết bồi thường rõ rành nếu cây có mệnh hệ chết rũ, báo giá theo tháng rất tiết kiệm dọn sạch phân bón không hôi thối." 
                    },
                  ].map((elem, i) => (
                    <div key={i} className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-3xs relative flex flex-col justify-between">
                      <span className="text-4xl text-emerald-100 absolute top-4 right-6 font-serif">“</span>
                      <div className="space-y-4">
                        <div className="text-xs text-[#f59e0b] block font-bold leading-none">{elem.stars}</div>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic relative z-10">
                          {elem.feedback}
                        </p>
                      </div>
                      <div className="pt-4 border-t border-slate-50 flex items-center gap-3 mt-4">
                        <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center font-bold text-emerald-800 text-xs">
                          {elem.name.charAt(4)}
                        </div>
                        <div>
                          <span className="text-xs sm:text-sm font-bold text-slate-800 block leading-tight">{elem.name}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{elem.role}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </section>

            {/* ACCORDION FAQS */}
            <section className="bg-white py-12">
              <FAQ />
            </section>

          </div>
        )}
      </main>

      {/* 4. COMPREHENSIVE FOOTER MATCHING THE BRAND */}
      <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-16 pb-24 md:pb-16" id="comprehensive-footer">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 text-xs md:text-sm">
          
          <div className="md:col-span-5 space-y-4 text-left">
            <div className="flex items-center gap-2.5 text-white">
              <div className="bg-brand-600 p-2 rounded-xl text-white">
                <Sprout className="w-5 h-5" />
              </div>
              <span className="font-display text-base md:text-lg font-black uppercase tracking-wider text-white">
                Cây Xanh Thủ Đô
              </span>
            </div>
            
            <p className="text-slate-400 leading-relaxed text-xs">
              Sở hữu hệ thống vườn ươm 5ha sầm uất tại Gia Lâm và Tây Hồ, chúng tôi tự tin mang tới giải pháp bón mạ, cải tạo, trị nấm mốc sâu lá và quy hoa cỏ nhung chất lượng tiết kiệm nhất cho biệt thự Việt Nam.
            </p>

            <div className="space-y-2 text-slate-400 text-xs pt-1">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Trụ sở: {settings.info.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Zalo hỗ trợ trực tuyến: {settings.info.zaloNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Email: {settings.info.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Làm việc: {settings.info.workHours}</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-3 space-y-3 pb-2 text-left">
            <h4 className="font-display font-bold text-white uppercase text-xs tracking-wider border-b border-slate-800 pb-2">
              Liên Kết Nhanh
            </h4>
            <div className="flex flex-col gap-2.5 text-slate-400 text-xs">
              <a href="#services-section" className="hover:text-white transition-colors">🌿 Dịch vụ cỏ & cây</a>
              <a href="#before-after-section" className="hover:text-white transition-colors">📐 So sánh Trước/Sau</a>
              <a href="#villas-gallery-section" className="hover:text-white transition-colors">🏡 Hồ sơ biệt thự</a>
              <a href="#calculator-section" className="hover:text-white transition-colors">💰 Tính toán ngân sách</a>
              <a 
                href="https://cayxanhthudo.vn" 
                target="_blank" 
                rel="noreferrer"
                className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 mt-1"
              >
                <span>🌍 Về Trang Mẹ cayxanhthudo.vn</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="md:col-span-4 space-y-4 text-left">
            <h4 className="font-display font-bold text-white uppercase text-xs tracking-wider border-b border-slate-800 pb-2">
              Bảo Trợ Sinh Trưởng Cỏ Nhật
            </h4>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[11px] leading-relaxed text-slate-400 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                <ShieldCheck className="w-4 h-4 shrink-0" /> Chế độ bảo hiểm cỏ rễ 30 ngày
              </div>
              <p>
                Mọi thảm cỏ gieo trồng hay cải hoại gieo hạt bởi kỹ sư Cây Xanh Thủ Đô đều được chăm sóc dinh dưỡng và hỗ trợ đền bù tưới sâu bệnh suốt 30 ngày đầu gieo trồng hoàn toàn 0đ.
              </p>
            </div>
          </div>
        </div>

        {/* Closing copyright */}
        <div className="max-w-7xl mx-auto px-4 mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-slate-500 font-medium">
          <span>&copy; {new Date().getFullYear()} Cây Xanh Thủ Đô Cảnh Quan Sân Vườn Biệt Thự. All Rights Reserved.</span>
          <div className="flex gap-4">
            <a href="https://cayxanhthudo.vn" target="_blank" rel="noreferrer" className="hover:underline">Điều khoản bảo mật cayxanhthudo.vn</a>
            <a href="#" className="hover:underline">Chính sách bảo dưỡng</a>
          </div>
        </div>
      </footer>

      {/* 5. FLOATING MOBILE-FRIENDLY BOTTOM ACTION STICKY BAR: EXTREMELY CRITICAL FOR HIGH ADS MOBILE CONVERSION */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-3 shadow-lg flex gap-3 lg:hidden animate-slideUp"
        id="mobile-sticky-action-bar"
      >
        {/* Telephone phone link */}
        <a
          href={`tel:${settings.info.primaryPhone.replace(/\./g, "")}`}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold py-3.5 px-2 rounded-xl flex items-center justify-center gap-1 shadow-md shadow-red-200 transition-all text-center"
        >
          <Phone className="w-4 h-4 animate-bounce shrink-0" />
          <span>Gọi Hotline Ngay</span>
        </a>

        {/* Zalo chat */}
        <a
          href={`https://zalo.me/${settings.info.zaloNumber}`}
          target="_blank"
          rel="noreferrer"
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold py-3.5 px-2 rounded-xl flex items-center justify-center gap-1 shadow-md shadow-emerald-250 transition-all text-center"
        >
          <MessageSquare className="w-4 h-4 shrink-0" />
          <span>Nhắn Zalo Tư Vấn</span>
        </a>
      </div>

    </div>
  );
}
