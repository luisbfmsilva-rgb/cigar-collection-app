/**
 * Serviço de estatísticas e análise de dados
 * Calcula métricas sobre a coleção de charutos e reviews
 */

import { Cigar, Review } from "@/lib/context/data-context";

export interface AnalyticsData {
  totalCigars: number;
  totalReviews: number;
  averageRating: number;
  topFlavors: { flavor: string; count: number }[];
  ratingTrend: { month: string; averageRating: number }[];
  smokingTrend: { month: string; count: number }[];
  topBrands: { brand: string; count: number }[];
  topVitolas: { vitola: string; count: number }[];
  averageSmokingTime: number;
}

class AnalyticsService {
  /**
   * Calcular estatísticas gerais
   */
  calculateAnalytics(cigars: Cigar[], reviews: Review[]): AnalyticsData {
    const totalCigars = cigars.length;
    const totalReviews = reviews.length;

    // Calcular nota média
    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.finalScore, 0) / totalReviews
        : 0;

    // Top sabores
    const topFlavors = this.calculateTopFlavors(reviews);

    // Tendência de notas por mês
    const ratingTrend = this.calculateRatingTrend(reviews);

    // Tendência de fumadas por mês
    const smokingTrend = this.calculateSmokingTrend(reviews);

    // Top marcas
    const topBrands = this.calculateTopBrands(cigars);

    // Top vitolas
    const topVitolas = this.calculateTopVitolas(cigars);

    // Tempo médio de fumada
    const averageSmokingTime = this.calculateAverageSmokingTime(reviews);

    return {
      totalCigars,
      totalReviews,
      averageRating,
      topFlavors,
      ratingTrend,
      smokingTrend,
      topBrands,
      topVitolas,
      averageSmokingTime,
    };
  }

  /**
   * Calcular top sabores
   */
  private calculateTopFlavors(
    reviews: Review[]
  ): { flavor: string; count: number }[] {
    const flavorCounts: Record<string, number> = {};

    reviews.forEach((review) => {
      review.flavorsIdentified.forEach((flavor) => {
        flavorCounts[flavor] = (flavorCounts[flavor] || 0) + 1;
      });
    });

    return Object.entries(flavorCounts)
      .map(([flavor, count]) => ({ flavor, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Calcular tendência de notas por mês
   */
  private calculateRatingTrend(
    reviews: Review[]
  ): { month: string; averageRating: number }[] {
    const monthlyRatings: Record<string, number[]> = {};

    reviews.forEach((review) => {
      const date = new Date(review.tastingDate);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      if (!monthlyRatings[month]) {
        monthlyRatings[month] = [];
      }
      monthlyRatings[month].push(review.finalScore);
    });

    return Object.entries(monthlyRatings)
      .map(([month, ratings]) => ({
        month,
        averageRating: ratings.reduce((a, b) => a + b, 0) / ratings.length,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Calcular tendência de fumadas por mês
   */
  private calculateSmokingTrend(
    reviews: Review[]
  ): { month: string; count: number }[] {
    const monthlyCounts: Record<string, number> = {};

    reviews.forEach((review) => {
      const date = new Date(review.tastingDate);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
    });

    return Object.entries(monthlyCounts)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Calcular top marcas
   */
  private calculateTopBrands(
    cigars: Cigar[]
  ): { brand: string; count: number }[] {
    const brandCounts: Record<string, number> = {};

    cigars.forEach((cigar) => {
      brandCounts[cigar.brand] = (brandCounts[cigar.brand] || 0) + cigar.quantity;
    });

    return Object.entries(brandCounts)
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Calcular top vitolas
   */
  private calculateTopVitolas(
    cigars: Cigar[]
  ): { vitola: string; count: number }[] {
    const vitolaCounts: Record<string, number> = {};

    cigars.forEach((cigar) => {
      vitolaCounts[cigar.vitola] = (vitolaCounts[cigar.vitola] || 0) + cigar.quantity;
    });

    return Object.entries(vitolaCounts)
      .map(([vitola, count]) => ({ vitola, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Calcular tempo médio de fumada
   */
  private calculateAverageSmokingTime(reviews: Review[]): number {
    const reviewsWithTime = reviews.filter((r) => r.smokingTime);

    if (reviewsWithTime.length === 0) return 0;

    const totalTime = reviewsWithTime.reduce((sum, r) => sum + (r.smokingTime || 0), 0);
    return Math.round(totalTime / reviewsWithTime.length);
  }

  /**
   * Calcular charutos antigos (não fumados há muito tempo)
   */
  calculateOldCigars(cigars: Cigar[], reviews: Review[], daysThreshold: number = 90): Cigar[] {
    const now = Date.now();
    const thresholdMs = daysThreshold * 24 * 60 * 60 * 1000;

    // Encontrar charutos que não foram fumados recentemente
    const smokedCigarIds = new Set(
      reviews
        .filter((r) => now - new Date(r.tastingDate).getTime() < thresholdMs)
        .map((r) => r.cigarId)
    );

    return cigars.filter(
      (c) =>
        !smokedCigarIds.has(c.id) &&
        now - new Date(c.createdAt).getTime() > thresholdMs
    );
  }

  /**
   * Calcular charutos similares aos favoritos
   */
  calculateSimilarCigars(
    cigar: Cigar,
    allCigars: Cigar[],
    reviews: Review[]
  ): Cigar[] {
    // Encontrar charutos com mesma marca ou vitola
    const similar = allCigars.filter(
      (c) =>
        c.id !== cigar.id &&
        (c.brand === cigar.brand || c.vitola === cigar.vitola)
    );

    // Ordenar por avaliação média (se houver reviews)
    return similar.sort((a, b) => {
      const aReviews = reviews.filter((r) => r.cigarId === a.id);
      const bReviews = reviews.filter((r) => r.cigarId === b.id);

      const aAvg =
        aReviews.length > 0
          ? aReviews.reduce((sum, r) => sum + r.finalScore, 0) / aReviews.length
          : 0;
      const bAvg =
        bReviews.length > 0
          ? bReviews.reduce((sum, r) => sum + r.finalScore, 0) / bReviews.length
          : 0;

      return bAvg - aAvg;
    });
  }
}

export const analyticsService = new AnalyticsService();
