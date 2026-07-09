import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export interface NotificationSettings {
  enabled: boolean;
  visitRequests: boolean;
  medicationReminders: boolean;
  lowStockAlerts: boolean;
  chatMessages: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  visitRequests: true,
  medicationReminders: true,
  lowStockAlerts: true,
  chatMessages: true,
};

class NotificationService {
  private settings: NotificationSettings = DEFAULT_SETTINGS;

  constructor() {
    this.loadSettings();
  }

  // Load settings from LocalStorage
  public loadSettings(): NotificationSettings {
    try {
      const saved = localStorage.getItem('pulse_notification_settings');
      if (saved) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } else {
        this.settings = DEFAULT_SETTINGS;
      }
    } catch (e) {
      this.settings = DEFAULT_SETTINGS;
    }
    return this.settings;
  }

  // Save settings to LocalStorage
  public saveSettings(newSettings: NotificationSettings) {
    this.settings = newSettings;
    localStorage.setItem('pulse_notification_settings', JSON.stringify(newSettings));
  }

  // Request notifications permission from device/browser
  public async requestPermission(): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      try {
        const result = await LocalNotifications.requestPermissions();
        return result.display === 'granted';
      } catch (e) {
        console.error('Failed to request native notification permissions:', e);
        return false;
      }
    } else {
      if (!('Notification' in window)) return false;
      if (Notification.permission === 'granted') return true;
      if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
      return false;
    }
  }

  // Send a physical device or browser notification
  public async sendNotification(
    title: string,
    body: string,
    category: keyof Omit<NotificationSettings, 'enabled'>
  ) {
    // 1. Check if notifications are enabled globally
    if (!this.settings.enabled) return;

    // 2. Check if this specific category is enabled
    if (!this.settings[category]) return;

    // Request permissions if not already granted
    const granted = await this.requestPermission();
    if (!granted) return;

    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              title,
              body,
              id: Math.floor(Math.random() * 1000000),
              schedule: { at: new Date(Date.now() + 50) }, // Trigger immediately (50ms offset)
              sound: 'default',
              actionTypeId: 'OPEN_APP',
              extra: { category }
            }
          ]
        });
      } catch (e) {
        console.error('Failed to send native notification:', e);
      }
    } else {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico', // or logo link
        });
      } catch (e) {
        console.error('Failed to send web notification:', e);
      }
    }
  }
}

export const notificationService = new NotificationService();
