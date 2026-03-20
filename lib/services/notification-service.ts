/**
 * Serviço de notificações push
 * Gerencia lembretes e sugestões personalizadas
 */

import * as Notifications from "expo-notifications";
import { Cigar, Review } from "@/lib/context/data-context";
import { analyticsService } from "./analytics-service";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  } as any),
});

interface NotificationConfig {
  oldCigarsDaysThreshold: number; // Dias para considerar um charuto "antigo"
  enableOldCigarsReminder: boolean;
  enableSimilarCigarSuggestions: boolean;
  enableMilestoneNotifications: boolean;
}

class NotificationService {
  private config: NotificationConfig = {
    oldCigarsDaysThreshold: 90,
    enableOldCigarsReminder: true,
    enableSimilarCigarSuggestions: true,
    enableMilestoneNotifications: true,
  };

  /**
   * Inicializar notificações
   */
  async initialize(): Promise<void> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        console.warn("Permissão de notificações não concedida");
      }
    } catch (error) {
      console.error("Erro ao inicializar notificações:", error);
    }
  }

  /**
   * Agendar notificação local
   */
  async scheduleNotification(
    title: string,
    body: string,
    delayInSeconds: number = 5
  ): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: "default",
          badge: 1,
        },
        trigger: {
          seconds: delayInSeconds,
        } as any,
      });

      return notificationId;
    } catch (error) {
      console.error("Erro ao agendar notificação:", error);
      return "";
    }
  }

  /**
   * Enviar notificação imediata
   */
  async sendNotification(title: string, body: string): Promise<void> {
    await this.scheduleNotification(title, body, 1);
  }

  /**
   * Verificar e enviar lembretes de charutos antigos
   */
  async checkAndSendOldCigarsReminders(
    cigars: Cigar[],
    reviews: Review[]
  ): Promise<void> {
    if (!this.config.enableOldCigarsReminder) return;

    const oldCigars = analyticsService.calculateOldCigars(
      cigars,
      reviews,
      this.config.oldCigarsDaysThreshold
    );

    if (oldCigars.length > 0) {
      const cigar = oldCigars[0]; // Pegar o primeiro
      await this.sendNotification(
        "Charuto Antigo na Coleção",
        `Você tem ${oldCigars.length} charuto(s) que não fuma há muito tempo. Que tal fumar um ${cigar.brand} ${cigar.name}?`
      );
    }
  }

  /**
   * Enviar sugestões de charutos similares
   */
  async sendSimilarCigarSuggestion(
    cigar: Cigar,
    allCigars: Cigar[],
    reviews: Review[]
  ): Promise<void> {
    if (!this.config.enableSimilarCigarSuggestions) return;

    const similar = analyticsService.calculateSimilarCigars(cigar, allCigars, reviews);

    if (similar.length > 0) {
      const suggestion = similar[0];
      await this.sendNotification(
        "Sugestão Personalizada",
        `Você gostou de ${cigar.brand}. Que tal experimentar ${suggestion.brand} ${suggestion.name}?`
      );
    }
  }

  /**
   * Enviar notificação de marco (milestone)
   */
  async sendMilestoneNotification(milestone: string, count: number): Promise<void> {
    if (!this.config.enableMilestoneNotifications) return;

    const messages: Record<string, string> = {
      cigars_10: "Parabéns! Você tem 10 charutos na sua coleção!",
      cigars_50: "Incrível! Sua coleção atingiu 50 charutos!",
      cigars_100: "Fantástico! Você tem 100 charutos na sua coleção!",
      reviews_10: "Excelente! Você fez 10 reviews!",
      reviews_50: "Impressionante! Você tem 50 reviews!",
      reviews_100: "Espetacular! Você completou 100 reviews!",
    };

    const message = messages[`${milestone}_${count}`];
    if (message) {
      await this.sendNotification("Marco Alcançado! 🎉", message);
    }
  }

  /**
   * Agendar notificações periódicas
   */
  async schedulePeriodicReminders(
    cigars: Cigar[],
    reviews: Review[]
  ): Promise<void> {
    try {
      // Cancelar notificações anteriores
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Agendar lembretes semanais
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Hora de Fumar!",
          body: "Que tal saborear um charuto hoje?",
          sound: "default",
        },
        trigger: {
          weekday: 5, // Sexta-feira
          hour: 19,
          minute: 0,
        } as any,
      });

      // Agendar lembretes de charutos antigos
      await this.checkAndSendOldCigarsReminders(cigars, reviews);
    } catch (error) {
      console.error("Erro ao agendar notificações periódicas:", error);
    }
  }

  /**
   * Atualizar configurações de notificações
   */
  updateConfig(newConfig: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Obter configurações atuais
   */
  getConfig(): NotificationConfig {
    return { ...this.config };
  }

  /**
   * Cancelar todas as notificações agendadas
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error("Erro ao cancelar notificações:", error);
    }
  }
}

export const notificationService = new NotificationService();
