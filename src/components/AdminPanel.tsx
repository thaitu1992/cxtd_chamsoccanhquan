import { useState, useEffect } from "react";
import { 
  Settings as SettingsIcon, Users, CheckCircle, Clock, Trash2, 
  Eye, EyeOff, Save, Key, Globe, Mail, Phone, MapPin, Search, 
  Download, Send, Check, ShieldAlert, Plus, HelpCircle, FileText
} from "lucide-react";
import { Lead, Settings, FormFieldConfig } from "../types";

interface AdminPanelProps {
  onSettingsSaved?: (newSettings: Settings) => void;
  savedSettings: Settings;
}

export default function AdminPanel({ onSettingsSaved, savedSettings }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<"leads" | "form-config" | "notifications" | "info">("leads");
  
  // Leads management states
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [savingLeadId, setSavingLeadId] = useState<string | null>(null);
  
  // Settings modification states
  const [settings, setSettings] = useState<Settings>(savedSettings);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showTelegramToken, setShowTelegramToken] = useState(false);
  const [telegramTestLoading, setTelegramTestLoading] = useState(false);
  const [telegramTestResult, setTelegramTestResult] = useState<{success: boolean; message: string} | null>(null);
  const [googleSheetTestLoading, setGoogleSheetTestLoading] = useState(false);
  const [googleSheetTestResult, setGoogleSheetTestResult] = useState<{success: boolean; message: string} | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [showScriptModal, setShowScriptModal] = useState(false);

  // Load leads
  const fetchLeads = async () => {
    setLeadsLoading(true);
    try {
      const res = await fetch("/api/leads");
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      }
    } catch (err) {
      console.error("Error drawing leads:", err);
    } finally {
      setLeadsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    setSettings(savedSettings);
  }, [savedSettings]);

  // Sync settings when savedSettings arrives
  const saveSettingsToServer = async (newSettings: Settings) => {
    setSaveLoading(true);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });
      if (res.ok) {
        const data = await res.json();
        setSaveSuccess(true);
        if (onSettingsSaved) {
          onSettingsSaved(newSettings);
        }
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Error updating settings:", err);
      alert("Lỗi lưu cấu hình sân vườn");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleUpdateLeadStatus = async (leadId: string, status: string, note?: string) => {
    setSavingLeadId(leadId);
    try {
      const res = await fetch("/api/leads/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leadId, status, note }),
      });
      if (res.ok) {
        const updated = await res.json();
        setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, status: status as any, note } : l));
        if (selectedLead && selectedLead.id === leadId) {
          setSelectedLead({ ...selectedLead, status: status as any, note });
        }
      }
    } catch (err) {
      console.error("Error updating status:", err);
    } finally {
      setSavingLeadId(null);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa khách hàng này khỏi danh sách? Thao tác này không thể thu hồi.")) return;
    
    try {
      const res = await fetch("/api/leads/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leadId }),
      });
      if (res.ok) {
        setLeads((prev) => prev.filter((l) => l.id !== leadId));
        if (selectedLead && selectedLead.id === leadId) {
          setSelectedLead(null);
        }
      }
    } catch (err) {
      console.error("Error deleting lead:", err);
    }
  };

  // Test Telegram Telegram
  const handleTestTelegram = async () => {
    setTelegramTestLoading(true);
    setTelegramTestResult(null);
    try {
      const res = await fetch("/api/test-telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botToken: settings.notifications.telegram.botToken,
          chatId: settings.notifications.telegram.chatId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTelegramTestResult({ success: true, message: data.message });
      } else {
        setTelegramTestResult({ success: false, message: data.error });
      }
    } catch (err) {
      setTelegramTestResult({ success: false, message: "Lỗi kết nối máy chủ gửi tin thử" });
    } finally {
      setTelegramTestLoading(false);
    }
  };

  // Test Google Sheet Connection
  const handleTestGoogleSheet = async () => {
    setGoogleSheetTestLoading(true);
    setGoogleSheetTestResult(null);
    try {
      const res = await fetch("/api/test-googlesheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webAppUrl: settings.notifications.googleSheet?.webAppUrl,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setGoogleSheetTestResult({ success: true, message: data.message });
      } else {
        setGoogleSheetTestResult({ success: false, message: data.error });
      }
    } catch (err) {
      setGoogleSheetTestResult({ success: false, message: "Lỗi kết nối máy chủ gửi tin thử Google Sheet" });
    } finally {
      setGoogleSheetTestLoading(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (leads.length === 0) return;
    
    // CSV Header with BOM for vietnamese in Excel
    let csvContent = "\uFEFF";
    csvContent += "Mã,Họ Tên,Số Điện Thoại,Email,Địa Chỉ,Diện Tích (m2),Tần Suất,Dự Toán (VND),Hạng Mục Quan Tâm,Yêu Cầu Chi Tiết,Trạng Thái,Ghi Chú,Ngày Đăng Ký\n";
    
    leads.forEach((l) => {
      const servicesStr = l.services ? `"${l.services.join(", ")}"` : '""';
      const detailStr = l.message ? `"${l.message.replace(/"/g, '""')}"` : '""';
      const noteStr = l.note ? `"${l.note.replace(/"/g, '""')}"` : '""';
      const addressStr = l.address ? `"${l.address.replace(/"/g, '""')}"` : '""';
      
      const row = [
        l.id,
        `"${l.name}"`,
        `'${l.phone}`, // leading single quote protects leading zero in some csv parsers
        l.email ? `"${l.email}"` : '""',
        addressStr,
        l.area || "",
        l.frequency || "",
        l.estimatedBudget || "",
        servicesStr,
        detailStr,
        l.status === "new" ? "Mới" : l.status === "contacting" ? "Đang liên hệ" : l.status === "completed" ? "Đã chốt" : "Đã hủy",
        noteStr,
        new Date(l.createdAt).toLocaleDateString("vi-VN"),
      ].join(",");
      
      csvContent += row + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `CayXanhThuDo_KhachHang_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter and search
  const filteredLeads = leads.filter((lead) => {
    const matchesQuery = 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery) ||
      (lead.message || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.address || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    
    return matchesQuery && matchesStatus;
  });

  const leadsCount = {
    total: leads.length,
    new: leads.filter((l) => l.status === "new").length,
    contacting: leads.filter((l) => l.status === "contacting").length,
    completed: leads.filter((l) => l.status === "completed").length,
    cancelled: leads.filter((l) => l.status === "cancelled").length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" id="admin-panel-container">
      {/* Title Header */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-800 flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-brand-600 animate-spin-slow" />
            Hệ Thống Quản Trị Sân Vườn Cây Xanh Thủ Đô
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Thiết lập đầu thu Lead khách hàng, tùy chỉnh Form nhập nhanh, cấu hình cảnh báo Telegram thời gian thực khi chạy Ads.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchLeads}
            className="px-3.5 py-1.5 bg-white text-slate-600 hover:text-brand-700 text-xs font-semibold border border-slate-200 rounded-lg hover:shadow-sm"
          >
            Đồng bộ Leads
          </button>
          <span className="text-xs text-slate-400 font-mono self-center">
            Môi trường: LIVE SERVER
          </span>
        </div>
      </div>

      {/* Main Grid Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Navigation Rail */}
        <div className="lg:col-span-3 space-y-2">
          {[
            { id: "leads", label: "Hộp Thư Khách Hàng", icon: Users, count: leadsCount.new ? leadsCount.new : null, countType: "danger" },
            { id: "form-config", label: "Tùy Biến Ô Nhập (Form)", icon: FileText },
            { id: "notifications" as const, label: "Kết Nối Telegram & Webhook", icon: Globe },
            { id: "info", label: "Thông Tin Doanh Nghiệp / Ads", icon: Phone },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center justify-between p-3.5 text-left text-xs md:text-sm font-semibold rounded-xl transition-all ${
                  isActive 
                    ? "bg-brand-600 text-white shadow-md shadow-brand-200/50" 
                    : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-100 hover:border-slate-200"
                }`}
                id={`admin-tab-${tab.id}`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{tab.label}</span>
                </div>
                {tab.count !== null && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isActive ? "bg-white text-brand-700" : "bg-red-500 text-white animate-pulse"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}

          <div className="bg-brand-50 rounded-2xl p-4.5 border border-brand-100/60 mt-6 space-y-1">
            <h4 className="text-xs font-bold text-brand-900 uppercase tracking-wider flex items-center gap-1.5">
              💡 Chỉ dẫn cho Ads:
            </h4>
            <p className="text-[11px] text-brand-800 leading-relaxed">
              Bật thông báo <strong>Telegram</strong> phía dưới để nhận Lead ngay khi khách điền mẫu trên điện thoại. Hỗ trợ phản hồi tư vấn siêu tốc trong 5 phút hạ gục đối thủ cạnh tranh!
            </p>
          </div>

          {/* Quick Google Sheets integration card at the very bottom of the sidebar */}
          <div className="bg-emerald-50/75 rounded-2xl p-4 md:p-4.5 border border-emerald-100 mt-4 space-y-3 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-lg">📊</span>
              <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                Mã nguồn Google Sheets
              </h4>
            </div>
            <p className="text-[11.5px] text-emerald-800 leading-relaxed">
              Tự động đẩy Lead sang Google Sheet bằng cách dán mã <strong>doPost</strong> Apps Script. Nhấp để lấy mã ngay!
            </p>
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const code = `function doPost(e) {
  try {
    var jsonString = e.postData.contents;
    var data = JSON.parse(jsonString);
    
    // ID của bảng tính Google Sheet của bạn
    var sheetId = "1AH0dbRA-2VFrghQNt4blfhwTfGfAJuUQbHrlmIluU_g";
    var ss = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName("Trang tinh1");
    if (!sheet) {
      sheet = ss.getSheets()[0]; // Fallback về trang tính đầu tiên
    }
    
    // Thêm dòng mới chứa thông tin Lead
    sheet.appendRow([
      data.createdAt || new Date().toLocaleString("vi-VN", {timeZone: "Asia/Ho_Chi_Minh"}),
      data.id || "",
      data.name || "",
      data.phone || "",
      data.email || "",
      data.address || "",
      data.area || "",
      data.services || "",
      data.frequency || "",
      data.message || "",
      data.estimatedBudget ? data.estimatedBudget.toLocaleString("vi-VN") + " VNĐ" : ""
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ "status": "success" }))
                         .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": error.toString() }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}`;
                  navigator.clipboard.writeText(code);
                  setCopiedScript(true);
                  setTimeout(() => setCopiedScript(false), 3000);
                }}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-98 transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                {copiedScript ? "Đã chép mã script! ✓" : "Sao chép mã Google Script (doPost)"}
              </button>

              <button
                type="button"
                onClick={() => setShowScriptModal(true)}
                className="w-full py-2 bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98"
              >
                <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
                Hướng dẫn cài đặt
              </button>
            </div>
          </div>
        </div>

        {/* Content Box */}
        <div className="lg:col-span-9 bg-white rounded-2xl shadow-sm border border-slate-100 min-h-[500px]">
          
          {/* TAB 1: Leads Inbox */}
          {activeTab === "leads" && (
            <div className="p-4 md:p-6 space-y-6">
              {/* Highlight metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">TẤT CẢ LEADS</span>
                  <span className="text-lg md:text-xl font-bold font-mono text-slate-800">{leadsCount.total}</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">MỚI CHƯA GỌI</span>
                  </div>
                  <span className="text-lg md:text-xl font-bold font-mono text-red-600">{leadsCount.new}</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">ĐANG LIÊN HỆ</span>
                  <span className="text-lg md:text-xl font-bold font-mono text-amber-600">{leadsCount.contacting}</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">ĐÃ CHỐT</span>
                  <span className="text-lg md:text-xl font-bold font-mono text-emerald-600">{leadsCount.completed}</span>
                </div>
              </div>

              {/* Filtering components */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm tên, sđt, địa chỉ hoặc ghi chú..."
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                    >
                      Bỏ lọc
                    </button>
                  )}
                </div>

                <div className="flex gap-2 shrink-0">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-slate-200 rounded-lg text-xs md:text-sm px-3.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="new">🆕 Lead Mới</option>
                    <option value="contacting">☎️ Đang liên hệ</option>
                    <option value="completed">✅ Đã chốt hợp đồng</option>
                    <option value="cancelled">❌ Đã hủy</option>
                  </select>

                  <button
                    onClick={handleExportCSV}
                    disabled={leads.length === 0}
                    className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-xs md:text-sm font-semibold ${
                      leads.length === 0
                        ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 active:scale-97 cursor-pointer"
                    }`}
                  >
                    <Download className="w-4 h-4" />
                    Tải Excel (.csv)
                  </button>
                </div>
              </div>

              {/* Leads Content */}
              {leadsLoading ? (
                <div className="text-center py-16 text-slate-400">
                  <div className="inline-block animate-spin h-6 w-6 border-2 border-brand-500 border-t-transparent rounded-full mb-2"></div>
                  <p className="text-xs font-mono">Đang truy lục dữ liệu khách từ server...</p>
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl">
                  <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-600">Không tìm thấy khách hàng nào</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    {searchQuery || statusFilter !== "all" 
                      ? "Không tìm thấy lead nào khớp với bộ lọc tìm kiếm hiện tại." 
                      : "Chưa có lượt khách hàng đăng ký điền form hoặc tính toán trên website."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Lead Master List */}
                  <div className={`space-y-2 md:col-span-6 ${selectedLead ? "max-h-[500px] overflow-y-auto pr-1" : "md:col-span-12"}`}>
                    {filteredLeads.map((lead) => {
                      const isSelected = selectedLead?.id === lead.id;
                      return (
                        <div
                          key={lead.id}
                          onClick={() => setSelectedLead(lead)}
                          className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                            isSelected 
                              ? "bg-brand-50/50 border-brand-500 shadow-sm" 
                              : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="text-sm font-semibold text-slate-800">{lead.name}</h4>
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                  lead.status === "new" 
                                    ? "bg-red-100 text-red-700 border border-red-200" 
                                    : lead.status === "contacting"
                                    ? "bg-amber-100 text-amber-700 border border-amber-200"
                                    : lead.status === "completed"
                                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                    : "bg-slate-100 text-slate-500 border border-slate-200"
                                }`}>
                                  {lead.status === "new" 
                                    ? "Mới" 
                                    : lead.status === "contacting"
                                    ? "Đã gọi"
                                    : lead.status === "completed"
                                    ? "Thành công"
                                    : "Hủy"}
                                </span>
                              </div>
                              <span className="text-xs font-mono font-bold text-slate-500 block mt-1">
                                {lead.phone}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(lead.createdAt).toLocaleDateString("vi-VN")}
                            </span>
                          </div>

                          <div className="mt-2.5 text-xs text-slate-500 flex justify-between gap-2 border-t border-slate-100 pt-2.5">
                            <span className="truncate">
                              📌 {lead.services && lead.services.length > 0 
                                ? lead.services.slice(0, 2).join(", ") + (lead.services.length > 2 ? "..." : "")
                                : "Chưa chọn dịch vụ"}
                            </span>
                            <span className="font-semibold text-brand-700 whitespace-nowrap shrink-0 font-mono">
                              {lead.estimatedBudget ? `~${lead.estimatedBudget.toLocaleString()}đ` : ""}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Lead Details Drawer */}
                  {selectedLead && (
                    <div className="md:col-span-6 bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4 max-h-[500px] overflow-y-auto">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                        <div>
                          <span className="text-[10px] font-mono text-slate-400 font-bold uppercase block">MÃ CHĂM SÓC: {selectedLead.id}</span>
                          <h4 className="text-base font-display font-bold text-slate-800">Chi Tiết Thông Tin Lead</h4>
                        </div>
                        <button
                          onClick={() => setSelectedLead(null)}
                          className="text-xs text-slate-400 hover:text-slate-600 font-bold bg-white px-2 py-1 rounded border border-slate-200"
                        >
                          Đóng
                        </button>
                      </div>

                      <div className="space-y-3.5 text-xs text-slate-700">
                        <div>
                          <span className="text-slate-400 block font-medium">Họ tên:</span>
                          <span className="text-sm font-semibold text-slate-800">{selectedLead.name}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Số điện thoại:</span>
                          <a href={`tel:${selectedLead.phone}`} className="text-sm font-bold text-brand-700 hover:underline">
                            📞 {selectedLead.phone} (Gọi trực tiếp)
                          </a>
                        </div>
                        {selectedLead.email && (
                          <div>
                            <span className="text-slate-400 block font-medium">Email liên hệ:</span>
                            <span>{selectedLead.email}</span>
                          </div>
                        )}
                        {selectedLead.address && (
                          <div>
                            <span className="text-slate-400 block font-medium">Địa chỉ cần dọn dẹp/khảo sát:</span>
                            <span className="font-medium text-slate-800">📍 {selectedLead.address}</span>
                          </div>
                        )}
                        {selectedLead.area && (
                          <div>
                            <span className="text-slate-400 block font-medium">Diện tích sân mộc:</span>
                            <span className="font-mono font-bold text-slate-800">{selectedLead.area} m²</span>
                          </div>
                        )}
                        {selectedLead.frequency && (
                          <div>
                            <span className="text-slate-400 block font-medium">Tần suất mong muốn:</span>
                            <span className="bg-brand-100 text-brand-900 border border-brand-200 px-2 py-0.5 rounded font-mono text-[10px] font-bold inline-block">
                              🕒 {selectedLead.frequency}
                            </span>
                          </div>
                        )}

                        {selectedLead.estimatedBudget && (
                          <div className="bg-brand-50 p-3 rounded-lg border border-brand-100">
                            <span className="text-slate-500 block font-semibold text-[10px] uppercase">Dự toán tự tính ban đầu của khách:</span>
                            <span className="text-base font-bold font-mono text-brand-800">{selectedLead.estimatedBudget.toLocaleString("vi-VN")} VNĐ</span>
                          </div>
                        )}

                        {selectedLead.services && selectedLead.services.length > 0 && (
                          <div>
                            <span className="text-slate-400 block font-medium">Dịch vụ yêu cầu:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {selectedLead.services.map((s, idx) => (
                                <span key={idx} className="bg-white px-2 py-1 border border-slate-200 rounded text-[11px] font-medium text-slate-700">
                                  ✓ {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {selectedLead.message && (
                          <div>
                            <span className="text-slate-400 block font-medium">Ghi chú yêu cầu của khách:</span>
                            <p className="bg-white p-3 rounded-lg border border-slate-200 mt-1 italic text-slate-600 leading-relaxed text-xs">
                              &ldquo;{selectedLead.message}&rdquo;
                            </p>
                          </div>
                        )}

                        <div className="border-t border-slate-200 pt-3">
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            Trạng thái chăm sóc:
                          </label>
                          <select
                            value={selectedLead.status}
                            disabled={savingLeadId !== null}
                            onChange={(e) => handleUpdateLeadStatus(selectedLead.id, e.target.value, selectedLead.note)}
                            className="w-full border border-slate-200 bg-white rounded-lg p-2 text-xs focus:ring-1 focus:ring-brand-500"
                          >
                            <option value="new">🆕 Lead Mới nhận</option>
                            <option value="contacting">☎️ Đang liên hệ gọi điện</option>
                            <option value="completed">✅ Đã ký hợp đồng thành công</option>
                            <option value="cancelled">❌ Đã hủy bỏ</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            Ghi chú nội bộ (Môi giới/Quản lý ghi chú):
                          </label>
                          <textarea
                            value={selectedLead.note || ""}
                            onChange={(e) => {
                              setSelectedLead({ ...selectedLead, note: e.target.value });
                            }}
                            placeholder="Ghi nội dung trao đổi, báo giá sau đàm phán tại đây..."
                            className="w-full h-20 bg-white border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateLeadStatus(selectedLead.id, selectedLead.status, selectedLead.note)}
                            disabled={savingLeadId !== null}
                            className="bg-brand-600 hover:bg-brand-700 text-white font-bold p-1.5 rounded-lg text-[11px] mt-1.5 flex items-center justify-center gap-1 w-full"
                          >
                            <Save className="w-3.5 h-3.5" />
                            {savingLeadId === selectedLead.id ? "Đang lưu..." : "Lưu ghi chú nội bộ"}
                          </button>
                        </div>

                        <div className="pt-2 border-t border-slate-200">
                          <button
                            type="button"
                            onClick={() => handleDeleteLead(selectedLead.id)}
                            className="text-[11px] text-red-600 hover:text-red-800 font-semibold flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Xóa khách hàng này ra khỏi Leadbase
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Form Configuration */}
          {activeTab === "form-config" && (
            <div className="p-4 md:p-6 space-y-6">
              <div>
                <h3 className="text-base md:text-lg font-display font-bold text-slate-800">Cấu Hình Các Ô Nhập Điền Form</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Mở rộng hoặc thu hẹp số lượng ô nhập biểu mẫu của Landing Page khi chạy Ads. Hạn chế ô để tăng tỷ lệ điền (Conversion Rate), mở rộng ô để tránh spam và phân loại khách hàng chất lượng.
                </p>
              </div>

              <div className="space-y-4 border border-slate-100 rounded-xl p-4.5 bg-slate-50/50">
                {/* Headers */}
                <div className="grid grid-cols-12 gap-3 pb-2 border-b border-slate-200 text-xs font-semibold text-slate-400">
                  <div className="col-span-6">TÊN TRƯỜNG DỮ LIỆU</div>
                  <div className="col-span-3 text-center">HIỂN THỊ</div>
                  <div className="col-span-3 text-center">BẮT BUỘC</div>
                </div>

                {/* Name */}
                <div className="grid grid-cols-12 gap-3 items-center py-2 text-xs md:text-sm">
                  <div className="col-span-6 font-semibold text-slate-700">Họ và tên khách hàng</div>
                  <div className="col-span-3 text-center">
                    <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded font-mono">BẮT BUỘC HIỂN THỊ</span>
                  </div>
                  <div className="col-span-3 text-center">
                    <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded font-mono">BẮT BUỘC</span>
                  </div>
                </div>

                {/* Phone */}
                <div className="grid grid-cols-12 gap-3 items-center py-2 text-xs md:text-sm border-t border-slate-100">
                  <div className="col-span-6 font-semibold text-slate-700">Hotline / Số điện thoại di động</div>
                  <div className="col-span-3 text-center">
                    <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded font-mono">BẮT BUỘC HIỂN THỊ</span>
                  </div>
                  <div className="col-span-3 text-center">
                    <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded font-mono">BẮT BUỘC</span>
                  </div>
                </div>

                {/* Other standard togglable fields */}
                {[
                  { key: "email", label: "Địa chỉ Email" },
                  { key: "address", label: "Địa chỉ sân vườn đề xuất lắp đặt/bảo vệ" },
                  { key: "area", label: "Diện tích khu vườn (m²)" },
                  { key: "services", label: "Gói công việc / dịch vụ quan tâm" },
                  { key: "message", label: "Yêu cầu tự luận cụ thể khác" },
                ].map(({ key, label }) => {
                  const item = settings.fields[key as keyof typeof settings.fields];
                  return (
                    <div key={key} className="grid grid-cols-12 gap-3 items-center py-2.5 border-t border-slate-100 text-xs md:text-sm">
                      <div className="col-span-6 space-y-0.5">
                        <span className="font-semibold text-slate-700 block">{label}</span>
                        <input
                          type="text"
                          value={item.label}
                          onChange={(e) => {
                            const updated = { ...settings };
                            updated.fields[key as keyof typeof settings.fields].label = e.target.value;
                            setSettings(updated);
                          }}
                          className="text-[11px] font-mono border border-slate-200 px-2 py-1 rounded w-full max-w-sm"
                          placeholder="Mác gợi nhắc (Placeholder)"
                        />
                      </div>
                      
                      <div className="col-span-3 text-center">
                        <input
                          type="checkbox"
                          checked={item.visible}
                          onChange={(e) => {
                            const updated = { ...settings };
                            updated.fields[key as keyof typeof settings.fields].visible = e.target.checked;
                            // If hide field, also turn off required
                            if (!e.target.checked) {
                              updated.fields[key as keyof typeof settings.fields].required = false;
                            }
                            setSettings(updated);
                          }}
                          className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500 cursor-pointer"
                        />
                      </div>

                      <div className="col-span-3 text-center">
                        <input
                          type="checkbox"
                          checked={item.required}
                          disabled={!item.visible}
                          onChange={(e) => {
                            const updated = { ...settings };
                            updated.fields[key as keyof typeof settings.fields].required = e.target.checked;
                            setSettings(updated);
                          }}
                          className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500 cursor-pointer disabled:opacity-30"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Actions Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                {saveSuccess && (
                  <span className="text-xs text-emerald-600 font-semibold self-center flex items-center gap-1 animate-pulse">
                    <Check className="w-4 h-4" /> Hệ thống đã lưu các thay đổi!
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => saveSettingsToServer(settings)}
                  disabled={saveLoading}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md shadow-brand-100 cursor-pointer"
                  id="admin-save-form-config-btn"
                >
                  {saveLoading ? "Đang xử lý..." : "Lưu Thay Đổi Form"}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Notifications Integration (Telegram + Webhook) */}
          {activeTab === "notifications" && (
            <div className="p-4 md:p-6 space-y-6">
              <div>
                <h3 className="text-base md:text-lg font-display font-bold text-slate-800">Cổng Thông Báo Tức Thì Trực Tiếp (Ads Alerts)</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Đẩy thông tin khách hàng điền form ngay lập tức về điện thoại thông qua Telegram Bot hoặc chuyển tiếp tiếp vận tự động qua đối tác CRM (như Getfly, Haravan hay LadiPage Webhook API).
                </p>
              </div>

              {/* SECTION: Telegram integration */}
              <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-5 space-y-4">
                <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200">
                  <div className="flex gap-3 items-center">
                    <span className="text-xl">✈️</span>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">Cảnh Báo Di Động Qua Telegram Bot</h4>
                      <p className="text-[11px] text-slate-400">Dịch vụ nhận chuông báo điện thoại tức thì miễn phí 100%.</p>
                    </div>
                  </div>
                  
                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications.telegram.enabled}
                      onChange={(e) => {
                        const updated = { ...settings };
                        updated.notifications.telegram.enabled = e.target.checked;
                        setSettings(updated);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                  </label>
                </div>

                {settings.notifications.telegram.enabled && (
                  <div className="space-y-4.5 pt-2 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Bot Token */}
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-bold text-slate-600 flex items-center justify-between">
                          <span>1. Bot Token của Telegram (HTTP API Token):</span>
                          <a 
                            href="https://t.me/BotFather" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[10px] text-brand-600 hover:underline flex items-center gap-0.5"
                          >
                            Tạo Bot với @BotFather <Send className="w-2.5 h-2.5" />
                          </a>
                        </label>
                        <div className="relative">
                          <input
                            type={showTelegramToken ? "text" : "password"}
                            value={settings.notifications.telegram.botToken}
                            onChange={(e) => {
                              const updated = { ...settings };
                              updated.notifications.telegram.botToken = e.target.value;
                              setSettings(updated);
                            }}
                            placeholder="Nhập chuỗi token, VD: 123456789:ABCdef-gHijKLm..."
                            className="w-full text-xs font-mono border border-slate-200 bg-white rounded-lg p-2.5 pr-10 focus:ring-1 focus:ring-brand-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowTelegramToken(!showTelegramToken)}
                            className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showTelegramToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Chat ID */}
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-bold text-slate-600 flex items-center justify-between">
                          <span>2. ID Trò Chuyện (Telegram Chat ID hoặc Group ID):</span>
                          <a 
                            href="https://t.me/userinfobot" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[10px] text-brand-600 hover:underline flex items-center gap-0.5"
                          >
                            Lấy Chat ID từ @userinfobot <Send className="w-2.5 h-2.5" />
                          </a>
                        </label>
                        <input
                          type="text"
                          value={settings.notifications.telegram.chatId}
                          onChange={(e) => {
                            const updated = { ...settings };
                            updated.notifications.telegram.chatId = e.target.value;
                            setSettings(updated);
                          }}
                          placeholder="Nhập ID, VD: 87654321 hoặc Chat Group ID âm: -100123456789"
                          className="w-full text-xs font-mono border border-slate-200 bg-white rounded-lg p-2.5 focus:ring-1 focus:ring-brand-500"
                        />
                      </div>
                    </div>

                    {/* Test alert block */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                      <span className="text-[11px] font-semibold text-slate-600 block">Kiểm thử kết nối báo về điện thoại:</span>
                      
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleTestTelegram}
                          disabled={telegramTestLoading || !settings.notifications.telegram.botToken || !settings.notifications.telegram.chatId}
                          className="flex items-center gap-1.5 bg-brand-100 hover:bg-brand-200 text-brand-800 text-xs font-bold px-3 py-2 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" />
                          {telegramTestLoading ? "Hệ thống đang bắn thử..." : "Bắn một Lead thử nghiệm về Telegram"}
                        </button>
                      </div>

                      {telegramTestResult && (
                        <div className={`p-2.5 rounded text-xs leading-relaxed font-semibold font-mono ${
                          telegramTestResult.success ? "bg-green-50 text-emerald-800 border-l-4 border-green-500" : "bg-red-50 text-red-800 border-l-4 border-red-500"
                        }`}>
                          {telegramTestResult.success ? "✓ Thành công! " : "✗ Thất bại: "}
                          {telegramTestResult.message}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Webhook JSON trigger */}
              <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-5 space-y-4">
                <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200">
                  <div className="flex gap-3 items-center">
                    <span className="text-xl">🌐</span>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">Chuyển tiếp qua Webhook API</h4>
                      <p className="text-[11px] text-slate-400">Đồng bộ tự động thông tin đăng ký (JSON POST method) sang hệ thống bên thứ ba.</p>
                    </div>
                  </div>
                  
                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications.webhook.enabled}
                      onChange={(e) => {
                        const updated = { ...settings };
                        updated.notifications.webhook.enabled = e.target.checked;
                        setSettings(updated);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                  </label>
                </div>

                {settings.notifications.webhook.enabled && (
                  <div className="animate-fadeIn">
                    <label className="text-xs font-bold text-slate-600 block mb-1.5">
                      Đường dẫn URL tiếp nhận Webhook (Endpoint URL):
                    </label>
                    <input
                      type="url"
                      value={settings.notifications.webhook.url}
                      onChange={(e) => {
                        const updated = { ...settings };
                        updated.notifications.webhook.url = e.target.value;
                        setSettings(updated);
                      }}
                      placeholder="https://crm-api.yourcompany.com/v1/leads-webhook"
                      className="w-full text-xs font-mono border border-slate-200 bg-white rounded-lg p-2.5 focus:ring-1 focus:ring-brand-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block leading-relaxed">
                      *Khi có biểu mẫu gửi đi, server sẽ gửi một yêu cầu HTTP POST kèm Header <code>Content-Type: application/json</code> chứa gói tin đối tượng Lead cho bạn xử lý.
                    </span>
                  </div>
                )}
              </div>

              {/* Google Sheet Direct Synchronization */}
              <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-5 space-y-4">
                <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200">
                  <div className="flex gap-3 items-center">
                    <span className="text-xl">📊</span>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">Kết nối trực tiếp Google Sheet</h4>
                      <p className="text-[11px] text-slate-400">Tự động đẩy thông tin Lead mới về bảng tính của bạn theo thời gian thực.</p>
                    </div>
                  </div>
                  
                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications.googleSheet?.enabled || false}
                      onChange={(e) => {
                        const updated = { ...settings };
                        updated.notifications.googleSheet = {
                          enabled: e.target.checked,
                          webAppUrl: settings.notifications.googleSheet?.webAppUrl || ""
                        };
                        setSettings(updated);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                  </label>
                </div>

                {(settings.notifications.googleSheet?.enabled) && (
                  <div className="space-y-4.5 pt-2 animate-fadeIn">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 block">
                        Đường dẫn Google Apps Script Web App URL:
                      </label>
                      <input
                        type="url"
                        value={settings.notifications.googleSheet?.webAppUrl || ""}
                        onChange={(e) => {
                          const updated = { ...settings };
                          updated.notifications.googleSheet = {
                            enabled: settings.notifications.googleSheet?.enabled || false,
                            webAppUrl: e.target.value
                          };
                          setSettings(updated);
                        }}
                        placeholder="https://script.google.com/macros/s/AKfycbz.../exec"
                        className="w-full text-xs font-mono border border-slate-200 bg-white rounded-lg p-2.5 focus:ring-1 focus:ring-brand-500"
                      />
                      <span className="text-[10px] text-slate-400 block leading-relaxed">
                        *Lưu ý dán URL của Web App sau khi Deploy dạng Google Apps Script (phần quyền truy cập chọn Anyone).
                      </span>
                    </div>

                    {/* Google Apps Script Guidelines & Clipboard Copy Code */}
                    <div className="bg-white p-4.5 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          📋 Hướng dẫn cài đặt Google Apps Script:
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const code = `function doPost(e) {
  try {
    var jsonString = e.postData.contents;
    var data = JSON.parse(jsonString);
    
    // ID của bảng tính Google Sheet của bạn
    var sheetId = "1AH0dbRA-2VFrghQNt4blfhwTfGfAJuUQbHrlmIluU_g";
    var ss = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName("Trang tinh1");
    if (!sheet) {
      sheet = ss.getSheets()[0]; // Fallback về trang tính đầu tiên
    }
    
    // Thêm dòng mới chứa thông tin Lead
    sheet.appendRow([
      data.createdAt || new Date().toLocaleString("vi-VN", {timeZone: "Asia/Ho_Chi_Minh"}),
      data.id || "",
      data.name || "",
      data.phone || "",
      data.email || "",
      data.address || "",
      data.area || "",
      data.services || "",
      data.frequency || "",
      data.message || "",
      data.estimatedBudget ? data.estimatedBudget.toLocaleString("vi-VN") + " VNĐ" : ""
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ "status": "success" }))
                         .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": error.toString() }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}`;
                            navigator.clipboard.writeText(code);
                            setCopiedScript(true);
                            setTimeout(() => setCopiedScript(false), 3000);
                          }}
                          className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 font-bold rounded text-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          {copiedScript ? "Đã sao chép! ✓" : "Sao chép mã Apps Script"}
                        </button>
                      </div>

                      <div className="text-[11px] text-slate-600 space-y-1.5 leading-relaxed">
                        <p>1. Mở Google Sheet <a href="https://docs.google.com/spreadsheets/d/1AH0dbRA-2VFrghQNt4blfhwTfGfAJuUQbHrlmIluU_g/edit" target="_blank" rel="noreferrer" className="text-brand-600 hover:underline font-semibold">TẠI ĐÂY</a>.</p>
                        <p>2. Trên menu, chọn <strong>Tiện ích mở rộng (Extensions)</strong> &gt; <strong>Apps Script</strong>.</p>
                        <p>3. Xóa mọi mã hiện có và dán đoạn mã Apps Script nhận dữ liệu đã sao chép ở trên.</p>
                        <p>4. Nhấp <strong>Triển khai (Deploy)</strong> &gt; <strong>Tạo bản triển khai mới (New deployment)</strong>.</p>
                        <p>5. Chọn loại là <strong>Ứng dụng web (Web app)</strong>. Phần cấu hình: chạy dưới tên bạn (Me), quyền truy cập: <strong>Mọi người (Anyone)</strong>.</p>
                        <p>6. Tạo bản triển khai, cấp quyền truy cập của Google, rồi sao chép URL ứng dụng web nhận được và dán vào ô cấu hình phía trên.</p>
                      </div>
                    </div>

                    {/* Test alert block */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                      <span className="text-[11px] font-semibold text-slate-600 block">Kiểm thử bắn dữ liệu sang Google Sheet:</span>
                      
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleTestGoogleSheet}
                          disabled={googleSheetTestLoading || !settings.notifications.googleSheet?.webAppUrl}
                          className="flex items-center gap-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold px-3 py-2 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" />
                          {googleSheetTestLoading ? "Đang đẩy dữ liệu thử..." : "Bắn một Lead thử nghiệm sang Google Sheet"}
                        </button>
                      </div>

                      {googleSheetTestResult && (
                        <div className={`p-2.5 rounded text-xs leading-relaxed font-semibold font-mono ${
                          googleSheetTestResult.success ? "bg-green-50 text-emerald-800 border-l-4 border-green-500" : "bg-red-50 text-red-800 border-l-4 border-red-500"
                        }`}>
                          {googleSheetTestResult.success ? "✓ Thành công! " : "✗ Thất bại: "}
                          {googleSheetTestResult.message}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Save change actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                {saveSuccess && (
                  <span className="text-xs text-emerald-600 font-semibold self-center flex items-center gap-1 animate-pulse">
                    <Check className="w-4 h-4" /> Đã ghi nhận thay đổi!
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => saveSettingsToServer(settings)}
                  disabled={saveLoading}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md shadow-brand-100 cursor-pointer"
                  id="admin-save-notif-config-btn"
                >
                  {saveLoading ? "Đang lưu..." : "Lưu Thay Đổi Kết Nối"}
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: Business info / Ads dynamic */}
          {activeTab === "info" && (
            <div className="p-4 md:p-6 space-y-6">
              <div>
                <h3 className="text-base md:text-lg font-display font-bold text-slate-800">Thông Tin Khách Hàng Thấy Trên Landing Page</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Đồng bộ số hotline, Zalo chat, địa chỉ cơ sở hiển thị trực tiếp lên chân trang Landing Page giúp tối ưu tăng điểm chất lượng cho các chiến dịch chạy Ads của Google hay Facebook.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Company legal name */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-600 block">Tên hiển thị Công ty / Thương hiệu:</label>
                  <input
                    type="text"
                    value={settings.info.companyName}
                    onChange={(e) => {
                      const updated = { ...settings };
                      updated.info.companyName = e.target.value;
                      setSettings(updated);
                    }}
                    className="w-full border border-slate-200 bg-white rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                {/* Primary phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 block">Số Hotline gọi điện trực tiếp (Điện thoại):</label>
                  <input
                    type="text"
                    value={settings.info.primaryPhone}
                    onChange={(e) => {
                      const updated = { ...settings };
                      updated.info.primaryPhone = e.target.value;
                      setSettings(updated);
                    }}
                    className="w-full border border-slate-200 bg-white rounded-lg p-2.5 text-xs font-mono focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                {/* Zalo hotline */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 block">Số điện thoại Zalo Chat (Không dấu cách gạch nối):</label>
                  <input
                    type="text"
                    value={settings.info.zaloNumber}
                    onChange={(e) => {
                      const updated = { ...settings };
                      updated.info.zaloNumber = e.target.value;
                      setSettings(updated);
                    }}
                    className="w-full border border-slate-200 bg-white rounded-lg p-2.5 text-xs font-mono focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                {/* Company email address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 block">Email giao dịch chính thức:</label>
                  <input
                    type="email"
                    value={settings.info.email}
                    onChange={(e) => {
                      const updated = { ...settings };
                      updated.info.email = e.target.value;
                      setSettings(updated);
                    }}
                    className="w-full border border-slate-200 bg-white rounded-lg p-2.5 text-xs font-mono focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                {/* Working hours */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 block">Giờ giấc phục vụ / ca trực hotline:</label>
                  <input
                    type="text"
                    value={settings.info.workHours}
                    onChange={(e) => {
                      const updated = { ...settings };
                      updated.info.workHours = e.target.value;
                      setSettings(updated);
                    }}
                    className="w-full border border-slate-200 bg-white rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                {/* Legal Address */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-600 block">Địa chỉ trụ sở chính:</label>
                  <input
                    type="text"
                    value={settings.info.address}
                    onChange={(e) => {
                      const updated = { ...settings };
                      updated.info.address = e.target.value;
                      setSettings(updated);
                    }}
                    className="w-full border border-slate-200 bg-white rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                {saveSuccess && (
                  <span className="text-xs text-emerald-600 font-semibold self-center flex items-center gap-1 animate-pulse">
                    <Check className="w-4 h-4" /> Cấu hình doanh nghiệp đã cập nhật!
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => saveSettingsToServer(settings)}
                  disabled={saveLoading}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md shadow-brand-100 cursor-pointer"
                  id="admin-save-info-btn"
                >
                  {saveLoading ? "Đang lưu..." : "Cập Nhật Thông Tin Hiển Thị"}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {showScriptModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={() => setShowScriptModal(false)}>
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[85vh] overflow-y-auto space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📊</span>
                <div>
                  <h3 className="text-base md:text-lg font-bold text-slate-800">Cấu hình Google Sheets Apps Script (doPost)</h3>
                  <p className="text-xs text-slate-400">Cách cài đặt tự động đẩy dữ liệu sang Google Sheet của bạn</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowScriptModal(false)}
                className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 leading-relaxed">
                <strong>💡 Lưu ý quan trọng:</strong> Khi triển khai ứng dụng web (Web App) trên Google Sheets Apps Script, bạn cần cấu hình quyền truy cập <strong>Mọi người (Anyone)</strong> để Server có thể đẩy dữ liệu biểu mẫu sang được.
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block font-sans">Các bước thực hiện nhanh:</span>
                <ol className="text-xs text-slate-600 space-y-2 list-decimal pl-4.5 leading-relaxed font-sans">
                  <li>Mở file Google Sheet của bạn và copy URL hoặc lấy ID từ URL của sheet đó. Bạn có thể dùng trực tiếp sheet mẫu của Cây Xanh Thủ Đô bằng cách nhấp <a href="https://docs.google.com/spreadsheets/d/1AH0dbRA-2VFrghQNt4blfhwTfGfAJuUQbHrlmIluU_g/edit" target="_blank" rel="noreferrer" className="text-brand-600 hover:underline font-bold">tại đây</a> và chọn <b>Tệp (File) &gt; Tạo bản sao (Make a copy)</b>.</li>
                  <li>Trên menu của Google Sheet mới của bạn, chọn <strong>Tiện ích mở rộng (Extensions)</strong> &gt; <strong>Apps Script</strong>.</li>
                  <li>Xóa sạch toàn bộ code mặc định có sẵn dán dính vào đó đoạn mã <strong>doPost(e)</strong> bên dưới.</li>
                  <li>Tìm dòng <code>var sheetId = "1AH0dbRA-2VFrghQNt4blfhwTfGfAJuUQbHrlmIluU_g";</code> trong code và thay thế bằng ID Google Sheet thực tế của bạn.</li>
                  <li>Nhấp nút <strong>Triển khai (Deploy)</strong> ở góc trên bên phải &gt; Chọn <strong>Tạo bản triển khai mới (New deployment)</strong>.</li>
                  <li>Chọn biểu tượng bánh răng bên cạnh 'Chọn loại' và chọn <strong>Ứng dụng web (Web app)</strong>.</li>
                  <li>Phần cấu hình: Chạy dưới dạng: <b>Tôi (Me)</b>, Quyền truy cập: <b>Mọi người (Anyone)</b>. Nhấp Triển khai.</li>
                  <li>Nếu Google yêu cầu cấp quyền, hãy đăng nhập chọn tài khoản của bạn, chọn Advanced &gt; Go to Untitled project (unsafe), nhấp <b>Allow</b>.</li>
                  <li>Sao chép <b>URL Ứng dụng web (Web App URL)</b> nhận được dán vào phần cấu hình Web App URL trong mục <strong>Cấu hình thông báo &gt; Google Sheet</strong>.</li>
                </ol>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center bg-slate-900 px-4 py-2 rounded-t-xl text-white">
                  <span className="text-[11px] font-mono font-bold text-slate-400">Google Apps Script Code (doPost.js)</span>
                  <button
                    type="button"
                    onClick={() => {
                      const code = `function doPost(e) {
  try {
    var jsonString = e.postData.contents;
    var data = JSON.parse(jsonString);
    
    // ID của bảng tính Google Sheet của bạn
    var sheetId = "1AH0dbRA-2VFrghQNt4blfhwTfGfAJuUQbHrlmIluU_g";
    var ss = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName("Trang tinh1");
    if (!sheet) {
      sheet = ss.getSheets()[0]; // Fallback về trang tính đầu tiên
    }
    
    // Thêm dòng mới chứa thông tin Lead
    sheet.appendRow([
      data.createdAt || new Date().toLocaleString("vi-VN", {timeZone: "Asia/Ho_Chi_Minh"}),
      data.id || "",
      data.name || "",
      data.phone || "",
      data.email || "",
      data.address || "",
      data.area || "",
      data.services || "",
      data.frequency || "",
      data.message || "",
      data.estimatedBudget ? data.estimatedBudget.toLocaleString("vi-VN") + " VNĐ" : ""
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ "status": "success" }))
                         .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": error.toString() }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}`;
                      navigator.clipboard.writeText(code);
                      setCopiedScript(true);
                      setTimeout(() => setCopiedScript(false), 3000);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-2.5 py-1 rounded-md transition-colors"
                  >
                    {copiedScript ? "Đã sao chép! ✓" : "Sao chép toàn bộ"}
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 text-emerald-400 font-mono text-[10.5px] rounded-b-xl overflow-x-auto max-h-56 leading-relaxed select-all">
{`function doPost(e) {
  try {
    var jsonString = e.postData.contents;
    var data = JSON.parse(jsonString);
    
    // ID của bảng tính Google Sheet của bạn
    var sheetId = "1AH0dbRA-2VFrghQNt4blfhwTfGfAJuUQbHrlmIluU_g";
    var ss = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName("Trang tinh1");
    if (!sheet) {
      sheet = ss.getSheets()[0]; // Fallback về trang tính đầu tiên
    }
    
    // Thêm dòng mới chứa thông tin Lead
    sheet.appendRow([
      data.createdAt || new Date().toLocaleString("vi-VN", {timeZone: "Asia/Ho_Chi_Minh"}),
      data.id || "",
      data.name || "",
      data.phone || "",
      data.email || "",
      data.address || "",
      data.area || "",
      data.services || "",
      data.frequency || "",
      data.message || "",
      data.estimatedBudget ? data.estimatedBudget.toLocaleString("vi-VN") + " VNĐ" : ""
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ "status": "success" }))
                         .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": error.toString() }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}`}
                </pre>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowScriptModal(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Đã hiểu & Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
