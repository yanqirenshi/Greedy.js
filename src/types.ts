// 物慾データの型定義
export interface Desire {
    id: string;              // 一意のID
    name: string;            // 物慾の名前
    importance: 'low' | 'high';   // 重要度
    urgency: 'low' | 'high';      // 緊急度
    imageUrl?: string;       // 画像URL（任意）
    webUrl?: string;         // 物慾の対象のWebページURL（任意）
    note?: string;           // メモ（任意）
    x?: number;              // X座標（0-1の相対値）
    y?: number;              // Y座標（0-1の相対値）
    createdAt: Date;         // 作成日時
    fulfilledDate?: Date;    // 成就日（任意）
    occurredDate?: Date;     // 発生日（任意・初期値は作成日）
}

// マトリクスの象限を表す型
export type Quadrant = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

// 象限の情報
export interface QuadrantInfo {
    id: Quadrant;
    label: string;
    importance: 'low' | 'high';
    urgency: 'low' | 'high';
    color: string;
}

// 象限の定義（緊急度×重要度） ※X軸が緊急度（左:高、右:低）、Y軸が重要度
export const QUADRANTS: QuadrantInfo[] = [
    { id: 'top-left', label: 'すぐ買う', importance: 'high', urgency: 'high', color: '#EF5350' },
    { id: 'top-right', label: '計画的に', importance: 'high', urgency: 'low', color: '#66BB6A' },
    { id: 'bottom-left', label: 'いつか', importance: 'low', urgency: 'high', color: '#FFB74D' },
    { id: 'bottom-right', label: '不要かも', importance: 'low', urgency: 'low', color: '#78909C' },
];
