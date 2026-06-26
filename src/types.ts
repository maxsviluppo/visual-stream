export interface VisualStreamPost {
  id: string;
  title: string;
  price?: string;
  description?: string;
  mediaType: "image" | "video";
  mediaUrl: string;
  ctaText?: string;
  whatsappMessage?: string;
  tags?: string[];
  createdAt: string;
  expiresAt?: string | null;
  clickCount: number;
  overlayText?: string;
  overlayX?: number; // percentage from left
  overlayY?: number; // percentage from top
}

export interface CreatorSettings {
  whatsappNumber: string; // WhatsApp number for CTA, e.g. "393281234567"
  streamTitle: string; // Custom title for the landing page
  streamSubtitle: string; // Custom subtitle
  notificationEmail?: string; // Predefined email for reservation notifications
}
