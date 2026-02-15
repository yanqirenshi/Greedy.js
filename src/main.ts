import './style.css';
import { MatrixRenderer } from './renders/MatrixRenderer';
import { DesireForm } from './renders/DesireForm';
import { getDesires, deleteDesire, resetDesires } from './storage';
import type { Desire } from './types';

// アプリケーションの状態
let desires: Desire[] = [];
let renderer: MatrixRenderer;
let form: DesireForm;

// 物慾を削除して再描画
async function handleDelete(id: string): Promise<void> {
    await deleteDesire(id);
    desires = await getDesires();
    refreshMatrix();
}

// 物慾の位置を更新
async function handleUpdate(id: string, x: number, y: number): Promise<void> {
    const { updateDesire } = await import('./storage');
    await updateDesire(id, { x, y });
    desires = await getDesires();
}

// 物慾クリック時の処理（照会モード表示）
function handleClick(desire: Desire): void {
    form.showDisplay(desire);
}

// マトリクスを再描画
function refreshMatrix(): void {
    renderer.refresh(desires, handleDelete, handleUpdate, handleClick);
}

// SVG内の画像をBase64に変換して埋め込む
async function embedImages(svgElement: SVGElement): Promise<void> {
    const images = svgElement.querySelectorAll('image');
    for (const img of Array.from(images)) {
        const url = img.getAttribute('href');
        if (url) {
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                const reader = new FileReader();
                await new Promise((resolve, reject) => {
                    reader.onloadend = () => {
                        img.setAttribute('href', reader.result as string);
                        resolve(null);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            } catch (e) {
                console.warn(`Failed to embed image: ${url}`, e);
                // 失敗した場合は元のURLを維持
            }
        }
    }
}

// SVGエクスポート処理
async function handleSvgExport(): Promise<void> {
    const svg = document.getElementById('matrix') as unknown as SVGElement;
    if (!svg) return;

    // SVGをクローン
    const clone = svg.cloneNode(true) as SVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    // 画像を埋め込み
    await embedImages(clone);

    // SVGを文字列に変換
    const svgData = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'matrix.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
async function init(): Promise<void> {
    // 保存済みデータを読み込み
    desires = await getDesires();

    // マトリクスレンダラーを初期化
    renderer = new MatrixRenderer('#matrix');
    refreshMatrix();

    // フォームを初期化
    form = new DesireForm(
        // 送信後コールバック: データ再取得＋再描画
        async () => {
            desires = await getDesires();
            refreshMatrix();
        },
        // 削除後コールバック
        async (id: string) => {
            await handleDelete(id);
        }
    );
    form.init();

    // 追加ボタンのクリックでフォームを表示
    const addBtn = document.getElementById('add-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => form.show());
    }

    // JSON出力ボタンのクリック
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', handleExport);
    }

    // SVG出力ボタンのクリック
    const exportSvgBtn = document.getElementById('export-svg-btn');
    if (exportSvgBtn) {
        exportSvgBtn.addEventListener('click', handleSvgExport);
    }

    // データ初期化ボタンのクリック
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', async () => {
            if (confirm('保存されたデータを削除して初期状態に戻しますか？\n（desires.jsonの内容が再読み込みされます）')) {
                await resetDesires();
                location.reload();
            }
        });
    }

    // ウィンドウリサイズ時に再描画
    window.addEventListener('resize', () => {
        refreshMatrix();
    });
}

// DOMContentLoaded時に初期化
document.addEventListener('DOMContentLoaded', init);

