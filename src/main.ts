import './style.css';
import { MatrixRenderer } from './matrix';
import { getDesires, addDesire, deleteDesire, updateDesire, resetDesires } from './storage';
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
    showDisplayMode(desire);
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

    hideDisplayPanel();

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

// 照会モードを表示
function showDisplayMode(desire: Desire): void {
    const displayPanel = document.getElementById('display-panel');
    const formPanel = document.getElementById('form-panel');
    const addBtn = document.getElementById('add-btn');

    if (displayPanel) {
        // データを設定
        const nameEl = document.getElementById('display-name');
        const importanceEl = document.getElementById('display-importance');
        const urgencyEl = document.getElementById('display-urgency');
        const noteEl = document.getElementById('display-note');
        const imageGroupEl = document.getElementById('display-image-group');
        const imageEl = document.getElementById('display-image');
        const webGroupEl = document.getElementById('display-web-group');
        const webEl = document.getElementById('display-web');

        if (nameEl) nameEl.textContent = desire.name;
        if (importanceEl) importanceEl.textContent = desire.importance === 'high' ? '高' : '低';
        if (urgencyEl) urgencyEl.textContent = desire.urgency === 'high' ? '高' : '低';
        if (noteEl) noteEl.textContent = desire.note || '(なし)';

        // 画像表示
        if (desire.imageUrl && imageEl && imageGroupEl) {
            imageEl.innerHTML = `<img src="${desire.imageUrl}" alt="${desire.name}" style="max-width: 100%; border-radius: 4px;">`;
            imageGroupEl.style.display = 'block';
        } else if (imageGroupEl) {
            imageGroupEl.style.display = 'none';
        }

        // Web URL表示
        if (desire.webUrl && webEl && webGroupEl) {
            webEl.innerHTML = `<a href="${desire.webUrl}" target="_blank" rel="noopener noreferrer">Webページ</a>`;
            webGroupEl.style.display = 'block';
        } else if (webGroupEl) {
            webGroupEl.style.display = 'none';
        }

        // パネルを表示
        displayPanel.classList.remove('hidden');
    }

    // フォームパネルを非表示
    if (formPanel) {
        formPanel.classList.add('hidden');
    }

    // 追加ボタンをdisabled風に
    if (addBtn) {
        addBtn.classList.add('disabled');
    }
}

// 照会モードを非表示
function hideDisplayPanel(): void {
    const displayPanel = document.getElementById('display-panel');
    const addBtn = document.getElementById('add-btn');

    if (displayPanel) {
        displayPanel.classList.add('hidden');
    }

    if (addBtn) {
        addBtn.classList.remove('disabled');
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
    const submitBtn = document.querySelector('#desire-form .btn-submit') as HTMLButtonElement;
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
    // フォーム内の送信ボタンのみを対象にする
    const submitBtn = document.querySelector('#desire-form .btn-submit') as HTMLButtonElement;
    if (nameInput && submitBtn) {
        submitBtn.disabled = !nameInput.value.trim();
    }
}

// JSONエクスポート処理
async function handleExport(): Promise<void> {
    const data = JSON.stringify(desires, null, 2);

    // モダンブラウザ向け File System Access API (保存先選択ダイアログ)
    if ('showSaveFilePicker' in window) {
        try {
            const handle = await (window as any).showSaveFilePicker({
                suggestedName: 'desires.json',
                types: [{
                    description: 'JSON Files',
                    accept: { 'application/json': ['.json'] },
                }],
            });
            const writable = await handle.createWritable();
            await writable.write(data);
            await writable.close();
            return;
        } catch (err: any) {
            // ユーザーがキャンセルした場合
            if (err.name === 'AbortError') {
                return;
            }
            console.error('File save failed:', err);
            // エラー時は従来のダウンロードへフォールバック
        }
    }

    // 従来のダウンロード処理 (フォールバック)
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'desires.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

    // JSON出力ボタンのクリック
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', handleExport);
    }

    // データ初期化ボタンのクリック
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('保存されたデータを削除して初期状態に戻しますか？\n（desires.jsonの内容が再読み込みされます）')) {
                resetDesires();
                location.reload();
            }
        });
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

    // 照会モードの「変更」ボタン
    const editBtn = document.getElementById('edit-btn');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            if (editingDesireId) {
                const desire = desires.find(d => d.id === editingDesireId);
                if (desire) {
                    showFormWithData(desire);
                    hideDisplayPanel();
                }
            }
        });
    }

    // 照会モードの「閉じる」ボタン（×ボタン）
    const closeDisplayBtn = document.getElementById('close-display-btn');
    if (closeDisplayBtn) {
        closeDisplayBtn.addEventListener('click', hideDisplayPanel);
    }

    // 照会モードの「閉じる」ボタン（下部ボタン）
    const closeDisplayBtnBottom = document.getElementById('close-display-btn-bottom');
    if (closeDisplayBtnBottom) {
        closeDisplayBtnBottom.addEventListener('click', hideDisplayPanel);
    }

    // ウィンドウリサイズ時に再描画
    window.addEventListener('resize', () => {
        refreshMatrix();
    });
}

// DOMContentLoaded時に初期化
document.addEventListener('DOMContentLoaded', init);
