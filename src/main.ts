import './style.css';
import { MatrixRenderer } from './matrix';
import { getDesires, addDesire, deleteDesire, updateDesire } from './storage';
import type { Desire } from './types';

// アプリケーションの状態
let desires: Desire[] = [];
let renderer: MatrixRenderer;
let editingDesireId: string | null = null; // 編集中の物慾ID（nullなら新規追加モード）

// 物慾を削除して再描画
function handleDelete(id: string): void {
    deleteDesire(id);
    desires = getDesires();
    refreshMatrix();
}

// 物慾の位置を更新
function handleUpdate(id: string, x: number, y: number): void {
    updateDesire(id, { x, y });
    desires = getDesires();
}

// 物慾クリック時の処理（詳細表示）
function handleClick(desire: Desire): void {
    editingDesireId = desire.id;
    showFormWithData(desire);
}

// マトリクスを再描画
function refreshMatrix(): void {
    renderer.refresh(desires, handleDelete, handleUpdate, handleClick);
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

    if (editingDesireId) {
        // 編集モード: 既存データを更新
        updateDesire(editingDesireId, {
            name: name.trim(),
            importance,
            urgency,
            imageUrl: imageUrl.trim() || undefined,
            webUrl: webUrl.trim() || undefined,
            note: note.trim() || undefined
        });
    } else {
        // 新規追加モード
        addDesire({
            name: name.trim(),
            importance,
            urgency,
            imageUrl: imageUrl.trim() || undefined,
            webUrl: webUrl.trim() || undefined,
            note: note.trim() || undefined
        });
    }

    // 状態を更新して再描画
    desires = getDesires();
    refreshMatrix();

    // フォームをリセットして閉じる
    form.reset();
    editingDesireId = null;
    updateSubmitButton();
    hideForm();
}

// フォームを新規追加モードで表示（トグル動作）
function showForm(): void {
    const formPanel = document.getElementById('form-panel');

    // フォームが既に開いている場合は閉じる
    if (formPanel && !formPanel.classList.contains('hidden')) {
        hideForm();
        return;
    }

    editingDesireId = null;
    updateFormTitle('物慾を追加');
    updateSubmitButtonText('追加');
    hideDeleteButton();

    const addBtn = document.getElementById('add-btn');
    if (formPanel) {
        formPanel.classList.remove('hidden');
    }
    if (addBtn) {
        addBtn.classList.add('disabled');
    }
}

// フォームを詳細表示モードで表示
function showFormWithData(desire: Desire): void {
    updateFormTitle('物慾の詳細');
    updateSubmitButtonText('保存');
    showDeleteButton();

    // フォームにデータを設定
    const nameInput = document.getElementById('name') as HTMLInputElement;
    const importanceSelect = document.getElementById('importance') as HTMLSelectElement;
    const urgencySelect = document.getElementById('urgency') as HTMLSelectElement;
    const imageUrlInput = document.getElementById('imageUrl') as HTMLInputElement;
    const webUrlInput = document.getElementById('webUrl') as HTMLInputElement;
    const noteTextarea = document.getElementById('note') as HTMLTextAreaElement;

    if (nameInput) nameInput.value = desire.name;
    if (importanceSelect) importanceSelect.value = desire.importance;
    if (urgencySelect) urgencySelect.value = desire.urgency;
    if (imageUrlInput) imageUrlInput.value = desire.imageUrl || '';
    if (webUrlInput) webUrlInput.value = desire.webUrl || '';
    if (noteTextarea) noteTextarea.value = desire.note || '';

    updateSubmitButton();

    const formPanel = document.getElementById('form-panel');
    const addBtn = document.getElementById('add-btn');
    if (formPanel) {
        formPanel.classList.remove('hidden');
    }
    if (addBtn) {
        addBtn.classList.add('disabled');
    }
}

// フォームを非表示
function hideForm(): void {
    const formPanel = document.getElementById('form-panel');
    const addBtn = document.getElementById('add-btn');
    const form = document.getElementById('desire-form') as HTMLFormElement;

    if (formPanel) {
        formPanel.classList.add('hidden');
    }
    if (addBtn) {
        addBtn.classList.remove('disabled');
    }
    // フォームをリセット
    if (form) {
        form.reset();
    }
    editingDesireId = null;
    updateSubmitButton();
}

// フォームタイトルを更新
function updateFormTitle(title: string): void {
    const titleElement = document.getElementById('form-title');
    if (titleElement) {
        titleElement.textContent = title;
    }
}

// 送信ボタンのテキストを更新
function updateSubmitButtonText(text: string): void {
    const submitBtn = document.querySelector('.btn-submit') as HTMLButtonElement;
    if (submitBtn) {
        submitBtn.textContent = text;
    }
}

// 削除ボタンを表示
function showDeleteButton(): void {
    const deleteBtn = document.getElementById('delete-btn');
    if (deleteBtn) {
        deleteBtn.style.display = 'block';
    }
}

// 削除ボタンを非表示
function hideDeleteButton(): void {
    const deleteBtn = document.getElementById('delete-btn');
    if (deleteBtn) {
        deleteBtn.style.display = 'none';
    }
}

// 削除ボタンクリック時の処理
function handleDeleteClick(): void {
    if (editingDesireId && confirm('この物慾を削除しますか？')) {
        handleDelete(editingDesireId);
        hideForm();
    }
}

// 追加ボタンの有効/無効を更新
function updateSubmitButton(): void {
    const nameInput = document.getElementById('name') as HTMLInputElement;
    const submitBtn = document.querySelector('.btn-submit') as HTMLButtonElement;
    if (nameInput && submitBtn) {
        submitBtn.disabled = !nameInput.value.trim();
    }
}

// アプリケーション初期化
function init(): void {
    // 保存済みデータを読み込み
    desires = getDesires();

    // マトリクスレンダラーを初期化
    renderer = new MatrixRenderer('#matrix');
    refreshMatrix();

    // フォームイベントを設定
    const form = document.getElementById('desire-form');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }

    // 名前フィールドの入力監視（追加ボタンの有効/無効）
    const nameInput = document.getElementById('name');
    if (nameInput) {
        nameInput.addEventListener('input', updateSubmitButton);
    }

    // 初期状態で追加ボタンを無効化
    updateSubmitButton();

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

    // 削除ボタンのクリック
    const deleteBtn = document.getElementById('delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', handleDeleteClick);
    }

    // ウィンドウリサイズ時に再描画
    window.addEventListener('resize', () => {
        refreshMatrix();
    });
}

// DOMContentLoaded時に初期化
document.addEventListener('DOMContentLoaded', init);
