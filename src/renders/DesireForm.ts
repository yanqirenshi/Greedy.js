import type { Desire } from '../types';
import { addDesire, updateDesire, getDesires } from '../storage';

// コールバック型定義
export type FormSubmitCallback = () => Promise<void>;
export type FormDeleteCallback = (id: string) => Promise<void>;

// 物慾フォーム・照会パネル管理クラス
export class DesireForm {
    private editingDesireId: string | null = null;
    private onAfterSubmit: FormSubmitCallback;
    private onAfterDelete: FormDeleteCallback;

    constructor(onAfterSubmit: FormSubmitCallback, onAfterDelete: FormDeleteCallback) {
        this.onAfterSubmit = onAfterSubmit;
        this.onAfterDelete = onAfterDelete;
    }

    // 現在編集中のIDを取得
    get currentEditingId(): string | null {
        return this.editingDesireId;
    }

    // イベントリスナーを登録
    init(): void {
        // フォーム送信
        const form = document.getElementById('desire-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // 名前フィールドの入力監視
        const nameInput = document.getElementById('name');
        if (nameInput) {
            nameInput.addEventListener('input', () => this.updateSubmitState());
        }

        // 初期状態で追加ボタンを無効化
        this.updateSubmitState();

        // 閉じるボタン
        const closeBtn = document.getElementById('close-form-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }

        // 削除ボタン
        const deleteBtn = document.getElementById('delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.handleDeleteClick());
        }

        // 照会モードの「変更」ボタン
        const editBtn = document.getElementById('edit-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => this.handleEditClick());
        }

        // 照会モードの「閉じる」ボタン（×ボタン）
        const closeDisplayBtn = document.getElementById('close-display-btn');
        if (closeDisplayBtn) {
            closeDisplayBtn.addEventListener('click', () => this.hideDisplay());
        }

        // 照会モードの「閉じる」ボタン（下部ボタン）
        const closeDisplayBtnBottom = document.getElementById('close-display-btn-bottom');
        if (closeDisplayBtnBottom) {
            closeDisplayBtnBottom.addEventListener('click', () => this.hideDisplay());
        }
    }

    // フォームを新規追加モードで表示（トグル動作）
    show(): void {
        const formPanel = document.getElementById('form-panel');

        // フォームが既に開いている場合は閉じる
        if (formPanel && !formPanel.classList.contains('hidden')) {
            this.hide();
            return;
        }

        this.hideDisplay();

        this.editingDesireId = null;
        this.updateTitle('物慾を追加');
        this.updateSubmitText('追加');
        this.hideDeleteBtn();

        const addBtn = document.getElementById('add-btn');
        if (formPanel) {
            formPanel.classList.remove('hidden');
        }
        if (addBtn) {
            addBtn.classList.add('disabled');
        }
    }

    // フォームを編集モードで表示
    showWithData(desire: Desire): void {
        this.updateTitle('物慾の詳細');
        this.updateSubmitText('保存');
        this.showDeleteBtn();

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

        this.updateSubmitState();

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
    showDisplay(desire: Desire): void {
        this.editingDesireId = desire.id;

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

    // 照会パネルを非表示
    hideDisplay(): void {
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
    hide(): void {
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
        this.editingDesireId = null;
        this.updateSubmitState();
    }

    // フォーム送信処理
    private async handleSubmit(event: Event): Promise<void> {
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

        if (this.editingDesireId) {
            // 編集モード: 既存データを更新
            await updateDesire(this.editingDesireId, {
                name: name.trim(),
                importance,
                urgency,
                imageUrl: imageUrl.trim() || undefined,
                webUrl: webUrl.trim() || undefined,
                note: note.trim() || undefined
            });
        } else {
            // 新規追加モード
            await addDesire({
                name: name.trim(),
                importance,
                urgency,
                imageUrl: imageUrl.trim() || undefined,
                webUrl: webUrl.trim() || undefined,
                note: note.trim() || undefined
            });
        }

        // コールバックを呼び出し（desires再取得＋再描画）
        await this.onAfterSubmit();

        // フォームをリセットして閉じる
        form.reset();
        this.editingDesireId = null;
        this.updateSubmitState();
        this.hide();
    }

    // 削除ボタンクリック処理
    private async handleDeleteClick(): Promise<void> {
        if (this.editingDesireId && confirm('この物慾を削除しますか？')) {
            await this.onAfterDelete(this.editingDesireId);
            this.hide();
        }
    }

    // 照会→編集切り替え処理
    private async handleEditClick(): Promise<void> {
        if (this.editingDesireId) {
            const desires = await getDesires();
            const desire = desires.find(d => d.id === this.editingDesireId);
            if (desire) {
                this.showWithData(desire);
                this.hideDisplay();
            }
        }
    }

    // フォームタイトルを更新
    private updateTitle(title: string): void {
        const titleElement = document.getElementById('form-title');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }

    // 送信ボタンのテキストを更新
    private updateSubmitText(text: string): void {
        const submitBtn = document.querySelector('#desire-form .btn-submit') as HTMLButtonElement;
        if (submitBtn) {
            submitBtn.textContent = text;
        }
    }

    // 削除ボタンを表示
    private showDeleteBtn(): void {
        const deleteBtn = document.getElementById('delete-btn');
        if (deleteBtn) {
            deleteBtn.style.display = 'block';
        }
    }

    // 削除ボタンを非表示
    private hideDeleteBtn(): void {
        const deleteBtn = document.getElementById('delete-btn');
        if (deleteBtn) {
            deleteBtn.style.display = 'none';
        }
    }

    // 送信ボタンの有効/無効を更新
    private updateSubmitState(): void {
        const nameInput = document.getElementById('name') as HTMLInputElement;
        const submitBtn = document.querySelector('#desire-form .btn-submit') as HTMLButtonElement;
        if (nameInput && submitBtn) {
            submitBtn.disabled = !nameInput.value.trim();
        }
    }
}
