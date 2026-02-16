import type { Desire } from './types';

const API_BASE = '/api/desires';

// 物慾リストを取得
export async function getDesires(): Promise<Desire[]> {
    try {
        const response = await fetch(API_BASE);
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }
        const data = await response.json();
        return data.map((item: any) => ({
            ...item,
            createdAt: new Date(item.createdAt),
            fulfilledDate: item.fulfilledDate ? new Date(item.fulfilledDate) : undefined,
            occurredDate: item.occurredDate ? new Date(item.occurredDate) : new Date(item.createdAt), // 移行措置: 未設定なら作成日
        }));
    } catch (error) {
        console.error('物慾の取得に失敗しました:', error);
        return [];
    }
}

// 物慾を追加
export async function addDesire(desire: Omit<Desire, 'id' | 'createdAt'>): Promise<Desire> {
    const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(desire),
    });

    if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();
    return {
        ...data,
        createdAt: new Date(data.createdAt),
        fulfilledDate: data.fulfilledDate ? new Date(data.fulfilledDate) : undefined,
        occurredDate: data.occurredDate ? new Date(data.occurredDate) : undefined,
    };
}

// 物慾を削除
export async function deleteDesire(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
    }
}

// 物慾を更新
export async function updateDesire(id: string, updates: Partial<Desire>): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
    });

    if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
    }
}

// データを初期化（全件削除してシードを再投入するにはサーバー側で対応が必要）
// フロントエンドではリロードのみ行う
export async function resetDesires(): Promise<void> {
    // 全件取得して全件削除
    const desires = await getDesires();
    for (const desire of desires) {
        await deleteDesire(desire.id);
    }
}
