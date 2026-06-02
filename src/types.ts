export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  area?: number; // Garden size in m2
  services?: string[]; // Selected services
  frequency?: string; // Daily, Weekly, Monthly, one-time, etc.
  message?: string;
  status: 'new' | 'contacting' | 'completed' | 'cancelled';
  note?: string;
  createdAt: string;
  estimatedBudget?: number;
}

export interface FormFieldConfig {
  visible: boolean;
  required: boolean;
  label: string;
}

export interface Settings {
  fields: {
    name: FormFieldConfig;
    phone: FormFieldConfig;
    email: FormFieldConfig;
    address: FormFieldConfig;
    area: FormFieldConfig;
    services: FormFieldConfig;
    message: FormFieldConfig;
  };
  notifications: {
    telegram: {
      enabled: boolean;
      botToken: string;
      chatId: string;
    };
    webhook: {
      enabled: boolean;
      url: string;
    };
    email: {
      enabled: boolean;
      destination: string;
    };
  };
  info: {
    companyName: string;
    primaryPhone: string;
    zaloNumber: string;
    address: string;
    email: string;
    workHours: string;
  };
}
