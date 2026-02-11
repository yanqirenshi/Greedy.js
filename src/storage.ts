import type { Desire } from './types';

// JSONデータをimport
import initialData from './desires.json';

// LocalStorageのキー
const STORAGE_KEY = 'greedy-desires';

// データ変換ヘルパー
function parseDesires(items: any[]): Desire[] {
    return items.map(item => ({
        ...item,
        createdAt: new Date(item.createdAt)
    }));
}

// 物慾リストを取得
export function getDesires(): Desire[] {
    const data = localStorage.getItem(STORAGE_KEY);

    // データがない場合は初期データを使用
    if (!data) {
        const initial = parseDesires(initialData);
        if (initial.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
        }
        return initial;
    }

    try {
        const parsed = JSON.parse(data);
        return parseDesires(parsed);
    } catch {
        console.error('データの読み込みに失敗しました');
        return [];
    }
}

// 物慾を保存
export function saveDesires(desires: Desire[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(desires));
}

// 物慾を追加
export function addDesire(desire: Omit<Desire, 'id' | 'createdAt'>): Desire {
    const newDesire: Desire = {
        ...desire,
        id: crypto.randomUUID(),
        createdAt: new Date()
    };

    const desires = getDesires();
    desires.push(newDesire);
    saveDesires(desires);

    return newDesire;
}

// 物慾を削除
export function deleteDesire(id: string): void {
    const desires = getDesires();
    const filtered = desires.filter(d => d.id !== id);
    saveDesires(filtered);
}

// 物慾を更新
export function updateDesire(id: string, updates: Partial<Desire>): void {
    const desires = getDesires();
    const index = desires.findIndex(d => d.id === id);
    if (index !== -1) {
        desires[index] = { ...desires[index], ...updates };
        saveDesires(desires);
    }
}
// データを初期化（LocalStorageをクリア）
export function resetDesires(): void {
    localStorage.removeItem(STORAGE_KEY);
}
