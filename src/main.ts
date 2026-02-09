import './style.css';
import { MatrixRenderer } from './matrix';
import { getDesires, addDesire, deleteDesire, updateDesire } from './storage';
import type { Desire } from './types';

// アプリケーションの状態
let desires: Desire[] = [];
let renderer: MatrixRenderer;

// 物慾を削除して再描画
function handleDelete(id: string): void {
    deleteDesire(id);
    desires = getDesires();
    renderer.refresh(desires, handleDelete, handleUpdate);
}

// 物慾の位置を更新
function handleUpdate(id: string, x: number, y: number): void {
    updateDesire(id, { x, y });
    desires = getDesires();
}

// フォーム送信時の処理
function handleFormSubmit(event: Event): void {
    event.preventDefault();

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    const name = formData.get('name') as string;
    const importance = formData.get('importance') as 'low' | 'high';
    const urgency = formData.get('urgency') as 'low' | 'high';
    const imageUrl = formData.get('imageUrl') as string;
    const webUrl = formData.get('webUrl') as string;
    const note = formData.get('note') as string;

    // バリデーション
    if (!name.trim()) {
        alert('名前を入力してください');
        return;
    }

    // 物慾を追加
    addDesire({
        name: name.trim(),
        importance,
        urgency,
        imageUrl: imageUrl.trim() || undefined,
        webUrl: webUrl.trim() || undefined,
        note: note.trim() || undefined
    });

    // 状態を更新して再描画
    desires = getDesires();
    renderer.refresh(desires, handleDelete, handleUpdate);

    // フォームをリセットして閉じる
    form.reset();
    hideForm();
}

// フォームを表示
function showForm(): void {
    const formPanel = document.getElementById('form-panel');
    if (formPanel) {
        formPanel.classList.remove('hidden');
    }
}

// フォームを非表示
function hideForm(): void {
    const formPanel = document.getElementById('form-panel');
    if (formPanel) {
        formPanel.classList.add('hidden');
    }
}

// アプリケーション初期化
function init(): void {
    // 保存済みデータを読み込み
    desires = getDesires();

    // マトリクスレンダラーを初期化
    renderer = new MatrixRenderer('#matrix');
    renderer.refresh(desires, handleDelete, handleUpdate);

    // フォームイベントを設定
    const form = document.getElementById('desire-form');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }

    // 追加ボタンのクリックでフォームを表示
    const addBtn = document.getElementById('add-btn');
    if (addBtn) {
        addBtn.addEventListener('click', showForm);
    }

    // 閉じるボタンのクリックでフォームを非表示
    const closeBtn = document.getElementById('close-form-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideForm);
    }

    // ウィンドウリサイズ時に再描画
    window.addEventListener('resize', () => {
        renderer.refresh(desires, handleDelete, handleUpdate);
    });
}

// DOMContentLoaded時に初期化
document.addEventListener('DOMContentLoaded', init);
