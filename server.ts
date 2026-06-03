import express from "express";
import path from "path";
import fs from "fs/promises";
import { createServer as createViteServer } from "vite";
import { Lead, Settings } from "./src/types";

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), "data");
const LEADS_FILE = path.join(DATA_DIR, "leads.json");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

// Default initial settings
const DEFAULT_SETTINGS: Settings = {
  fields: {
    name: { visible: true, required: true, label: "Họ và tên" },
    phone: { visible: true, required: true, label: "Số điện thoại" },
    email: { visible: true, required: false, label: "Địa chỉ Email" },
    address: { visible: true, required: false, label: "Địa chỉ cần chăm sóc / khảo sát" },
    area: { visible: true, required: false, label: "Diện tích sân vườn (m²)" },
    services: { visible: true, required: false, label: "Dịch vụ quan tâm" },
    message: { visible: true, required: false, label: "Yêu cầu bổ sung" },
  },
  notifications: {
    telegram: {
      enabled: false,
      botToken: "",
      chatId: "",
    },
    webhook: {
      enabled: false,
      url: "",
    },
    email: {
      enabled: false,
      destination: "",
    },
    googleSheet: {
      enabled: false,
      webAppUrl: "",
    },
  },
  info: {
    companyName: "Cây Xanh Thủ Đô",
    primaryPhone: "0777.080.111",
    zaloNumber: "0777080111",
    address: "Khu Đô Thị Ocear Pack I, Q.Gia Lâm, TP.Hà Nội",
    email: "cayxanhthudo001@gmail.com",
    workHours: "08:00 - 18:00 (Tất cả các ngày trong tuần)",
  },
};

// Check and initialize data directory & files
async function initData() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    // Check Leads file
    try {
      await fs.access(LEADS_FILE);
    } catch {
      await fs.writeFile(LEADS_FILE, JSON.stringify([], null, 2), "utf-8");
      console.log("Initialized empty leads database.");
    }

    // Check Settings file
    try {
      await fs.access(SETTINGS_FILE);
    } catch {
      await fs.writeFile(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2), "utf-8");
      console.log("Initialized default settings.");
    }
  } catch (error) {
    console.error("Error initializing data directory:", error);
  }
}

async function readLeads(): Promise<Lead[]> {
  try {
    const content = await fs.readFile(LEADS_FILE, "utf-8");
    return JSON.parse(content);
  } catch (err) {
    console.error("Error reading leads file, returning empty array:", err);
    return [];
  }
}

async function writeLeads(leads: Lead[]) {
  await fs.writeFile(LEADS_FILE, JSON.stringify(leads, null, 2), "utf-8");
}

async function readSettings(): Promise<Settings> {
  try {
    const content = await fs.readFile(SETTINGS_FILE, "utf-8");
    const parsed = JSON.parse(content);
    
    // Ensure nested googleSheet structure is merged correctly
    const mergedNotifications = { 
      ...DEFAULT_SETTINGS.notifications, 
      ...parsed.notifications 
    };
    if (parsed.notifications && parsed.notifications.googleSheet) {
      mergedNotifications.googleSheet = {
        ...DEFAULT_SETTINGS.notifications.googleSheet,
        ...parsed.notifications.googleSheet
      };
    }

    return {
      fields: { ...DEFAULT_SETTINGS.fields, ...parsed.fields },
      notifications: mergedNotifications,
      info: { ...DEFAULT_SETTINGS.info, ...parsed.info },
    };
  } catch (err) {
    console.error("Error reading settings file, returning default:", err);
    return DEFAULT_SETTINGS;
  }
}

async function writeSettings(settings: Settings) {
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
}

// Push Telegram Alert Helper
async function sendTelegramAlert(botToken: string, chatId: string, lead: Lead, appUrl: string) {
  if (!botToken || !chatId) return;
  
  const text = `🌱 **[YÊU CẦU CHĂM SÓC CẢNH QUAN MỚI]** 🌱\n\n` +
    `👤 **Khách hàng:** ${lead.name}\n` +
    `📞 **Điện thoại:** [${lead.phone}](tel:${lead.phone})\n` +
    (lead.email ? `✉️ **Email:** ${lead.email}\n` : "") +
    (lead.address ? `📍 **Địa chỉ:** ${lead.address}\n` : "") +
    (lead.area ? `📐 **Diện tích:** ${lead.area} m²\n` : "") +
    (lead.frequency ? `⏳ **Tần suất:** ${lead.frequency}\n` : "") +
    (lead.estimatedBudget ? `💰 **Dự toán:** ~${lead.estimatedBudget.toLocaleString('vi-VN')} VNĐ\n` : "") +
    (lead.services && lead.services.length > 0 ? `🛠️ **Dịch vụ:** ${lead.services.join(", ")}\n` : "") +
    (lead.message ? `📝 **Yêu cầu chi tiết:** ${lead.message}\n` : "") +
    `\n📅 **Thời gian nhận:** ${new Date(lead.createdAt).toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'})}\n` +
    `🔗 Xem chi tiết tại: ${appUrl}/admin`;

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "Markdown",
      }),
    });
    const result = await res.json();
    if (!result.ok) {
      console.error("Telegram API Error:", result);
    } else {
      console.log("Telegram alert sent successfully.");
    }
  } catch (error) {
    console.error("Failed to send Telegram alert:", error);
  }
}

// Push Webhook Helper
async function sendWebhook(webhookUrl: string, lead: Lead) {
  if (!webhookUrl) return;
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "form_submission",
        timestamp: new Date().toISOString(),
        data: lead,
      }),
    });
    console.log(`Webhook triggered to ${webhookUrl}. Response status: ${response.status}`);
  } catch (err) {
    console.error("Webhook trigger failed:", err);
  }
}

// Push Google Sheet Simple Request Helper (Content-Type text/plain to avoid CORS)
async function sendGoogleSheet(webAppUrl: string, lead: Lead): Promise<{ success: boolean; message: string; status?: number }> {
  if (!webAppUrl) {
    return { success: false, message: "Đường dẫn URL Web App rỗng" };
  }
  try {
    const formattedData = {
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      email: lead.email || "",
      address: lead.address || "",
      area: lead.area || "",
      services: lead.services ? lead.services.join(", ") : "",
      frequency: lead.frequency || "",
      message: lead.message || "",
      estimatedBudget: lead.estimatedBudget || "",
      createdAt: new Date(lead.createdAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }),
    };

    const response = await fetch(webAppUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(formattedData),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error(`Google Sheet Web App error status: ${response.status} - ${text}`);
      return {
        success: false,
        status: response.status,
        message: `Máy chủ Google Apps Script trả về lỗi ${response.status}: ${text || "Lỗi dịch vụ"}`
      };
    }

    const bodyText = await response.text().catch(() => "");
    // Google Web App can return error messages inside a successful 200 HTTP response if the script caught an error.
    // E.g., ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": "Exception: ..." }))
    try {
      const parsed = JSON.parse(bodyText);
      if (parsed && (parsed.status === "error" || parsed.success === false)) {
        return {
          success: false,
          status: response.status,
          message: `Lỗi từ Google Apps Script: ${parsed.message || "Không thể lưu vào Sheet"}`
        };
      }
    } catch {
      // Not a JSON response or failed to parse, but HTTP status was OK.
    }

    console.log(`Google Sheet simple request sent to ${webAppUrl}. Status: ${response.status}`);
    return {
      success: true,
      status: response.status,
      message: `Đã kết nối thành công! Google Sheet phản hồi: ${bodyText || "OK"}`
    };
  } catch (err: any) {
    console.error("Google Sheet simple request failed:", err);
    return {
      success: false,
      message: `Lỗi kết nối mạng đến Google Apps Script. Vui lòng kiểm tra lại URL hoặc cấu hình Đã triển khai của bạn. Chi tiết: ${err.message || err.toString()}`
    };
  }
}

async function startServer() {
  await initData();

  const app = express();
  app.use(express.json());

  // API Route: Get settings
  app.get("/api/image-proxy", async (req, res) => {
    const imageUrl = req.query.url as string;
    if (!imageUrl) {
      return res.status(400).send("No URL provided");
    }
    try {
      const response = await fetch(imageUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
          "Referer": "https://decoxdesign.com/",
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      const buffer = await response.arrayBuffer();
      const contentType = response.headers.get("content-type") || "image/png";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 24 hours
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error("Image proxy failed for URL:", imageUrl, error);
      res.status(500).send("Failed to stream image");
    }
  });

  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await readSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to read settings" });
    }
  });

  // API Route: Save settings
  app.post("/api/settings", async (req, res) => {
    try {
      await writeSettings(req.body);
      res.json({ success: true, message: "Cấu hình đã lưu thành công!" });
    } catch (error) {
      res.status(500).json({ error: "Failed to save settings" });
    }
  });

  // API Route: Get leads
  app.get("/api/leads", async (req, res) => {
    try {
      const leads = await readLeads();
      // Sort newest first
      leads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.json(leads);
    } catch (error) {
      res.status(500).json({ error: "Failed to load leads" });
    }
  });

  // API Route: Submit new lead
  app.post("/api/leads", async (req, res) => {
    try {
      const settings = await readSettings();
      const leads = await readLeads();
      
      const newLead: Lead = {
        id: "L" + Math.random().toString(36).substr(2, 9).toUpperCase(),
        name: req.body.name || "Khách hàng ẩn danh",
        phone: req.body.phone || "",
        email: req.body.email,
        address: req.body.address,
        area: req.body.area ? Number(req.body.area) : undefined,
        services: req.body.services || [],
        frequency: req.body.frequency,
        message: req.body.message,
        status: "new",
        createdAt: new Date().toISOString(),
        estimatedBudget: req.body.estimatedBudget ? Number(req.body.estimatedBudget) : undefined,
      };

      if (!newLead.phone) {
        return res.status(400).json({ error: "Số điện thoại là bắt buộc" });
      }

      leads.push(newLead);
      await writeLeads(leads);

      // Trigger asynchronous notifications so that lead save is responsive
      const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
      
      if (settings.notifications.telegram.enabled) {
        sendTelegramAlert(
          settings.notifications.telegram.botToken,
          settings.notifications.telegram.chatId,
          newLead,
          appUrl
        );
      }

      if (settings.notifications.webhook.enabled) {
        sendWebhook(settings.notifications.webhook.url, newLead);
      }

      if (settings.notifications.googleSheet && settings.notifications.googleSheet.enabled) {
        sendGoogleSheet(settings.notifications.googleSheet.webAppUrl, newLead);
      }

      res.status(201).json({ success: true, data: newLead });
    } catch (error) {
      console.error("Error submitting lead:", error);
      res.status(500).json({ error: "Không thể gửi thông tin khách hàng" });
    }
  });

  // API Route: Update lead status/notes
  app.post("/api/leads/update-status", async (req, res) => {
    try {
      const { id, status, note } = req.body;
      const leads = await readLeads();
      const index = leads.findIndex((l) => l.id === id);
      
      if (index === -1) {
        return res.status(404).json({ error: "Không tìm thấy khách hàng này" });
      }

      if (status) leads[index].status = status;
      if (note !== undefined) leads[index].note = note;

      await writeLeads(leads);
      res.json({ success: true, data: leads[index] });
    } catch (error) {
      res.status(500).json({ error: "Không thể cập nhật trạng thái" });
    }
  });

  // API Route: Delete lead
  app.post("/api/leads/delete", async (req, res) => {
    try {
      const { id } = req.body;
      let leads = await readLeads();
      const updated = leads.filter((l) => l.id !== id);
      
      if (leads.length === updated.length) {
        return res.status(404).json({ error: "Không tìm thấy khách hàng" });
      }

      await writeLeads(updated);
      res.json({ success: true, message: "Xóa khách hàng thành công!" });
    } catch (error) {
      res.status(500).json({ error: "Không thể xóa khách hàng" });
    }
  });

  // API Route: Test telegram alert
  app.post("/api/test-telegram", async (req, res) => {
    try {
      const { botToken, chatId } = req.body;
      if (!botToken || !chatId) {
        return res.status(400).json({ error: "Vui lòng nhập Bot Token và Chat ID để kiểm thử" });
      }
      
      const testLead: Lead = {
        id: "TEST-L1",
        name: "Nguyên Văn Kiểm Thử 🌱",
        phone: "0900000000",
        email: "test@example.com",
        address: "Thử Nghiệm Kỹ Thuật, Thảo Điền, Quận 2",
        area: 150,
        frequency: "Định kỳ tháng",
        services: ["Cắt tỉa Bonsai nghệ thuật", "Phun thuốc ngừa sâu bệnh định kỳ"],
        message: "Đây là tin nhắn thử nghiệm hệ thống cảnh báo tức thì từ trang quản trị Cây Xanh Thủ Đô.",
        status: "new",
        createdAt: new Date().toISOString(),
        estimatedBudget: 8500000,
      };

      const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
      await sendTelegramAlert(botToken, chatId, testLead, appUrl);
      res.json({ success: true, message: "Yêu cầu kiểm thử đã gửi! Hãy kiểm tra kênh Telegram của bạn." });
    } catch (error) {
      res.status(500).json({ error: "Gửi kiểm thử thất bại" });
    }
  });

  // API Route: Test Google Sheet simple request
  app.post("/api/test-googlesheet", async (req, res) => {
    try {
      const { webAppUrl } = req.body;
      if (!webAppUrl) {
        return res.status(400).json({ error: "Vui lòng nhập URL Web App của Google Apps Script để thử nghiệm" });
      }
      
      const testLead: Lead = {
        id: "TEST-GG1",
        name: "Khách Thử Nghiệm Google Sheet 📊",
        phone: "0777010222",
        email: "test-sheet@example.com",
        address: "Mẫu Gửi Thử Sân Vườn, Ciputra, Hà Nội",
        area: 250,
        frequency: "Định kỳ tuần",
        services: ["Thiết kế cải tạo sân vườn biệt thự", "Chăm sóc định kỳ hàng tuần"],
        message: "Yêu cầu gửi thử nghiệm từ trang quản trị Cây Xanh Thủ Đô để xác thực kết nối Google Sheet thành công.",
        status: "new",
        createdAt: new Date().toISOString(),
        estimatedBudget: 12000000,
      };

      const result = await sendGoogleSheet(webAppUrl, testLead);
      if (result.success) {
        res.json({ success: true, message: result.message });
      } else {
        res.status(400).json({ error: result.message });
      }
    } catch (error: any) {
      res.status(500).json({ error: "Gửi thử nghiệm đi thất bại: " + (error.message || error.toString()) });
    }
  });

  // Phục vụ các hình ảnh từ thư mục gốc nếu có yêu cầu tệp tin input_file_*.png
  app.get("/input_file_:num.png", async (req, res) => {
    const num = req.params.num;
    const filePath = path.join(process.cwd(), `input_file_${num}.png`);
    try {
      await fs.access(filePath);
      res.sendFile(filePath);
    } catch {
      res.status(404).send("Not found");
    }
  });

  // Vite development middleware or static production serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
