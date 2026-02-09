import * as d3 from 'd3';
import type { Desire, QuadrantInfo } from './types';
import { QUADRANTS } from './types';

// マトリクスのマージン設定
const MARGIN = { top: 60, right: 40, bottom: 60, left: 80 };

// コールバック型定義
type DeleteCallback = (id: string) => void;
type UpdateCallback = (id: string, x: number, y: number) => void;
type ClickCallback = (desire: Desire) => void;

// マトリクス描画クラス
export class MatrixRenderer {
    private svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>;
    private width: number = 0;
    private height: number = 0;
    private innerWidth: number = 0;
    private innerHeight: number = 0;
    private mainGroup: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>;

    constructor(svgSelector: string) {
        this.svg = d3.select<SVGSVGElement, unknown>(svgSelector);
        this.mainGroup = this.svg.append('g')
            .attr('class', 'matrix-main');

        this.resize();

        // ウィンドウリサイズ時に再描画
        window.addEventListener('resize', () => this.resize());
    }

    // サイズを再計算
    private resize(): void {
        const container = document.getElementById('matrix-container');
        if (!container) return;

        this.width = container.clientWidth;
        this.height = container.clientHeight;
        this.innerWidth = this.width - MARGIN.left - MARGIN.right;
        this.innerHeight = this.height - MARGIN.top - MARGIN.bottom;

        this.svg
            .attr('width', this.width)
            .attr('height', this.height);

        this.mainGroup
            .attr('transform', `translate(${MARGIN.left}, ${MARGIN.top})`);
    }

    // マトリクスグリッドを描画
    public drawGrid(): void {
        // 既存のグリッドをクリア
        this.mainGroup.selectAll('.grid').remove();

        const grid = this.mainGroup.append('g').attr('class', 'grid');

        // 各象限を描画（左が重要度高、右が重要度低）
        QUADRANTS.forEach(q => {
            const x = q.importance === 'high' ? 0 : this.innerWidth / 2;
            const y = q.urgency === 'high' ? 0 : this.innerHeight / 2;

            // 象限の背景
            grid.append('rect')
                .attr('class', `quadrant ${q.id}`)
                .attr('x', x)
                .attr('y', y)
                .attr('width', this.innerWidth / 2)
                .attr('height', this.innerHeight / 2)
                .attr('fill', q.color)
                .attr('fill-opacity', 0.15)
                .attr('stroke', q.color)
                .attr('stroke-opacity', 0.3)
                .attr('stroke-width', 1);

            // 象限のラベル
            grid.append('text')
                .attr('class', 'quadrant-label')
                .attr('x', x + this.innerWidth / 4)
                .attr('y', y + 30)
                .attr('text-anchor', 'middle')
                .attr('fill', q.color)
                .attr('font-size', '18px')
                .attr('font-weight', '700')
                .text(q.label);
        });

        // 軸ラベル
        this.drawAxisLabels();
    }

    // 軸ラベルを描画
    private drawAxisLabels(): void {
        this.mainGroup.selectAll('.axis-label').remove();

        // X軸（重要度）
        this.mainGroup.append('text')
            .attr('class', 'axis-label')
            .attr('x', this.innerWidth / 2)
            .attr('y', this.innerHeight + 40)
            .attr('text-anchor', 'middle')
            .attr('fill', '#1a1a2e')
            .attr('font-size', '14px')
            .text('← 重要度');

        // 重要度 低/高
        this.mainGroup.append('text')
            .attr('class', 'axis-label')
            .attr('x', this.innerWidth / 4)
            .attr('y', this.innerHeight + 40)
            .attr('text-anchor', 'middle')
            .attr('fill', 'rgba(26,26,46,0.6)')
            .attr('font-size', '12px')
            .text('高');

        this.mainGroup.append('text')
            .attr('class', 'axis-label')
            .attr('x', this.innerWidth * 3 / 4)
            .attr('y', this.innerHeight + 40)
            .attr('text-anchor', 'middle')
            .attr('fill', 'rgba(26,26,46,0.6)')
            .attr('font-size', '12px')
            .text('低');

        // Y軸（緊急度）
        this.mainGroup.append('text')
            .attr('class', 'axis-label')
            .attr('transform', `translate(-50, ${this.innerHeight / 2}) rotate(-90)`)
            .attr('text-anchor', 'middle')
            .attr('fill', '#1a1a2e')
            .attr('font-size', '14px')
            .text('緊急度 →');

        // 緊急度 低/高
        this.mainGroup.append('text')
            .attr('class', 'axis-label')
            .attr('transform', `translate(-30, ${this.innerHeight * 3 / 4})`)
            .attr('text-anchor', 'middle')
            .attr('fill', 'rgba(26,26,46,0.6)')
            .attr('font-size', '12px')
            .text('低');

        this.mainGroup.append('text')
            .attr('class', 'axis-label')
            .attr('transform', `translate(-30, ${this.innerHeight / 4})`)
            .attr('text-anchor', 'middle')
            .attr('fill', 'rgba(26,26,46,0.6)')
            .attr('font-size', '12px')
            .text('高');
    }

    // 物慾アイテムを描画
    public drawDesires(
        desires: Desire[],
        onDelete: DeleteCallback,
        onUpdate: UpdateCallback,
        onClick?: ClickCallback
    ): void {
        this.mainGroup.selectAll('.desire-items').remove();

        const itemsGroup = this.mainGroup.append('g').attr('class', 'desire-items');

        // 各アイテムを描画
        desires.forEach((desire, index) => {
            // 位置を計算（保存された座標があればそれを使用）
            const { x, y } = this.calculatePosition(desire, index, desires);
            const quadrant = this.getQuadrantInfo(desire);

            this.drawDesireNode(itemsGroup, desire, x, y, quadrant, onDelete, onUpdate, onClick);
        });
    }

    // 物慾の位置を計算
    private calculatePosition(desire: Desire, index: number, allDesires: Desire[]): { x: number, y: number } {
        // 保存された位置があればそれを使用
        if (desire.x !== undefined && desire.y !== undefined) {
            return {
                x: desire.x * this.innerWidth,
                y: desire.y * this.innerHeight
            };
        }

        // 同じ象限のアイテム数をカウント（自動配置用）
        const quadrantId = this.getQuadrantId(desire);
        const sameQuadrantItems = allDesires.filter(d =>
            this.getQuadrantId(d) === quadrantId &&
            d.x === undefined && d.y === undefined
        );
        const indexInQuadrant = sameQuadrantItems.findIndex(d => d.id === desire.id);

        // 象限の基準位置を計算（左が重要度高、右が重要度低）
        const quadrant = QUADRANTS.find(q => q.id === quadrantId)!;
        const baseX = quadrant.importance === 'high' ? 0 : this.innerWidth / 2;
        const baseY = quadrant.urgency === 'high' ? 0 : this.innerHeight / 2;

        // グリッド配置（3列）
        const cols = 3;
        const col = indexInQuadrant % cols;
        const row = Math.floor(indexInQuadrant / cols);
        const spacing = 80;

        return {
            x: baseX + 50 + col * spacing,
            y: baseY + 60 + row * spacing
        };
    }

    // 物慾の象限情報を取得
    private getQuadrantInfo(desire: Desire): QuadrantInfo {
        const quadrantId = this.getQuadrantId(desire);
        return QUADRANTS.find(q => q.id === quadrantId)!;
    }

    // 物慾の象限IDを取得（左が重要度高、右が重要度低）
    private getQuadrantId(desire: Desire): string {
        if (desire.importance === 'high' && desire.urgency === 'high') return 'top-left';
        if (desire.importance === 'low' && desire.urgency === 'high') return 'top-right';
        if (desire.importance === 'high' && desire.urgency === 'low') return 'bottom-left';
        return 'bottom-right';
    }

    // 個別の物慾ノードを描画
    private drawDesireNode(
        parent: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>,
        desire: Desire,
        x: number,
        y: number,
        quadrant: QuadrantInfo,
        onDelete: DeleteCallback,
        onUpdate: UpdateCallback,
        onClick?: ClickCallback
    ): void {
        const nodeGroup = parent.append('g')
            .attr('class', 'desire-node')
            .attr('data-id', desire.id)
            .attr('transform', `translate(${x}, ${y})`)
            .style('cursor', 'grab');

        const radius = 28;
        const self = this;

        // ドラッグとクリックを区別するための変数
        let startX = 0;
        let startY = 0;
        let isDragging = false;
        const CLICK_THRESHOLD = 5; // ピクセル

        // ドラッグ動作を定義
        const drag = d3.drag<SVGGElement, unknown>()
            .on('start', function (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) {
                startX = event.x;
                startY = event.y;
                isDragging = false;
                d3.select(this).raise().style('cursor', 'grabbing');
            })
            .on('drag', function (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) {
                // 移動距離をチェック
                const dx = Math.abs(event.x - startX);
                const dy = Math.abs(event.y - startY);
                if (dx > CLICK_THRESHOLD || dy > CLICK_THRESHOLD) {
                    isDragging = true;
                }

                // 新しい位置を計算（境界内に制限）
                const newX = Math.max(0, Math.min(self.innerWidth, event.x));
                const newY = Math.max(0, Math.min(self.innerHeight, event.y));
                d3.select(this).attr('transform', `translate(${newX}, ${newY})`);
            })
            .on('end', function (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) {
                d3.select(this).style('cursor', 'grab');

                if (isDragging) {
                    // ドラッグ終了 → 位置を保存
                    const relX = Math.max(0, Math.min(1, event.x / self.innerWidth));
                    const relY = Math.max(0, Math.min(1, event.y / self.innerHeight));
                    onUpdate(desire.id, relX, relY);
                } else {
                    // クリック → 詳細表示
                    if (onClick) {
                        onClick(desire);
                    }
                }
            });

        // ドラッグを適用
        nodeGroup.call(drag);

        // 背景円
        nodeGroup.append('circle')
            .attr('r', radius)
            .attr('fill', quadrant.color)
            .attr('fill-opacity', 0.9)
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .attr('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))')
            .on('mouseover', function () {
                d3.select(this).attr('fill-opacity', 1);
            })
            .on('mouseout', function () {
                d3.select(this).attr('fill-opacity', 0.9);
            });

        // 画像があれば表示、なければ頭文字
        if (desire.imageUrl) {
            // 円形のクリッピングパス
            const clipId = `clip-${desire.id}`;
            nodeGroup.append('clipPath')
                .attr('id', clipId)
                .append('circle')
                .attr('r', radius - 2);

            nodeGroup.append('image')
                .attr('href', desire.imageUrl)
                .attr('x', -(radius - 2))
                .attr('y', -(radius - 2))
                .attr('width', (radius - 2) * 2)
                .attr('height', (radius - 2) * 2)
                .attr('clip-path', `url(#${clipId})`)
                .attr('preserveAspectRatio', 'xMidYMid slice');
        } else {
            // 頭文字
            nodeGroup.append('text')
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'central')
                .attr('fill', '#fff')
                .attr('font-size', '16px')
                .attr('font-weight', '700')
                .style('pointer-events', 'none')
                .text(desire.name.charAt(0));
        }

        // 名前ラベル
        nodeGroup.append('text')
            .attr('class', 'desire-name')
            .attr('y', radius + 16)
            .attr('text-anchor', 'middle')
            .attr('fill', '#1a1a2e')
            .attr('font-size', '11px')
            .style('pointer-events', 'none')
            .text(desire.name.length > 8 ? desire.name.slice(0, 8) + '…' : desire.name);

        // ダブルクリックでWebページを開く
        if (desire.webUrl) {
            nodeGroup.on('dblclick', () => {
                window.open(desire.webUrl, '_blank');
            });
        }

        // 削除ボタン（右上）
        const deleteBtn = nodeGroup.append('g')
            .attr('class', 'delete-btn')
            .attr('transform', `translate(${radius - 5}, ${-radius + 5})`)
            .style('opacity', 0)
            .style('cursor', 'pointer');

        deleteBtn.append('circle')
            .attr('r', 10)
            .attr('fill', '#EF5350');

        deleteBtn.append('text')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('fill', '#fff')
            .attr('font-size', '12px')
            .text('×');

        deleteBtn.on('click', (event: Event) => {
            event.stopPropagation();
            onDelete(desire.id);
        });

        // ホバー時に削除ボタンを表示
        nodeGroup.on('mouseenter', () => {
            deleteBtn.transition().duration(200).style('opacity', 1);
        }).on('mouseleave', () => {
            deleteBtn.transition().duration(200).style('opacity', 0);
        });
    }

    // リサイズと再描画
    public refresh(
        desires: Desire[],
        onDelete: DeleteCallback,
        onUpdate: UpdateCallback,
        onClick?: ClickCallback
    ): void {
        this.resize();
        this.drawGrid();
        this.drawDesires(desires, onDelete, onUpdate, onClick);
    }
}
