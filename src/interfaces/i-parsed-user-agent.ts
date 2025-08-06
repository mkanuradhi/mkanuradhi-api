export interface ParsedUserAgent {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  deviceType: string | null;
  deviceVendor: string | null;
  deviceModel: string | null;
  isBot: boolean;
}