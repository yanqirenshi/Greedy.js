import * as d3 from 'd3';
import type { Desire, QuadrantInfo } from '../types';
import { QUADRANTS } from '../types';

// コールバック型定義
export type DeleteCallback = (id: string) => void | Promise<void>;
export type UpdateCallback = (id: string, x: number, y: number) => void | Promise<void>;
export type ClickCallback = (desire: Desire) => void;

// 物慾ノード描画クラス
export class DesireNode {
    private desire: Desire;
    private quadrant: QuadrantInfo;

    constructor(desire: Desire) {
        this.desire = desire;
        this.quadrant = this.getQuadrantInfo();
    }

    // 物慾の象限IDを取得（X軸が緊急度（左:高、右:低）、Y軸が重要度）
    getQuadrantId(): string {
        const d = this.desire;
        if (d.importance === 'high' && d.urgency === 'high') return 'top-left';
        if (d.importance === 'high' && d.urgency === 'low') return 'top-right';
        if (d.importance === 'low' && d.urgency === 'high') return 'bottom-left';
        return 'bottom-right';
    }

    // 物慾の象限情報を取得
    getQuadrantInfo(): QuadrantInfo {
        const quadrantId = this.getQuadrantId();
        return QUADRANTS.find(q => q.id === quadrantId)!;
    }

    // 物慾の位置を計算
    calculatePosition(
        allDesires: Desire[],
        innerWidth: number,
        innerHeight: number
    ): { x: number; y: number } {
        // 保存された位置があればそれを使用
        if (this.desire.x !== undefined && this.desire.y !== undefined) {
            return {
                x: this.desire.x * innerWidth,
                y: this.desire.y * innerHeight
            };
        }

        // 同じ象限のアイテム数をカウント（自動配置用）
        const quadrantId = this.getQuadrantId();
        const sameQuadrantItems = allDesires.filter(d => {
            const node = new DesireNode(d);
            return node.getQuadrantId() === quadrantId &&
                d.x === undefined && d.y === undefined;
        });
        const indexInQuadrant = sameQuadrantItems.findIndex(d => d.id === this.desire.id);

        // 象限の基準位置を計算（X軸が緊急度（左:高、右:低）、Y軸が重要度）
        const quadrant = QUADRANTS.find(q => q.id === quadrantId)!;
        const baseX = quadrant.urgency === 'high' ? 0 : innerWidth / 2;
        const baseY = quadrant.importance === 'high' ? 0 : innerHeight / 2;

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

    // SVG要素を描画
    render(
        parent: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>,
        x: number,
        y: number,
        innerWidth: number,
        innerHeight: number,
        onDelete: DeleteCallback,
        onUpdate: UpdateCallback,
        onClick?: ClickCallback
    ): void {
        const desire = this.desire;
        const quadrant = this.quadrant;

        const nodeGroup = parent.append('g')
            .attr('class', 'desire-node')
            .attr('data-id', desire.id)
            .attr('transform', `translate(${x}, ${y})`)
            .style('cursor', 'grab');

        const radius = 28;

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
                const newX = Math.max(0, Math.min(innerWidth, event.x));
                const newY = Math.max(0, Math.min(innerHeight, event.y));
                d3.select(this).attr('transform', `translate(${newX}, ${newY})`);
            })
            .on('end', function (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) {
                d3.select(this).style('cursor', 'grab');

                if (isDragging) {
                    // ドラッグ終了 → 位置を保存
                    const relX = Math.max(0, Math.min(1, event.x / innerWidth));
                    const relY = Math.max(0, Math.min(1, event.y / innerHeight));
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
        if (desire.webUrl) {
            const link = nodeGroup.append('a')
                .attr('href', desire.webUrl)
                .attr('target', '_blank')
                .attr('class', 'desire-link')
                .on('click', (event: Event) => event.stopPropagation()); // ドラッグ/クリックの伝播防止

            link.append('text')
                .attr('class', 'desire-name')
                .attr('y', radius + 16)
                .attr('text-anchor', 'middle')
                .attr('fill', '#1a1a2e') // 元の色に戻す
                .attr('font-size', '11px')
                .style('text-decoration', 'underline')
                .style('cursor', 'pointer')
                .text(desire.name.length > 8 ? desire.name.slice(0, 8) + '…' : desire.name);
        } else {
            nodeGroup.append('text')
                .attr('class', 'desire-name')
                .attr('y', radius + 16)
                .attr('text-anchor', 'middle')
                .attr('fill', '#1a1a2e')
                .attr('font-size', '11px')
                .style('pointer-events', 'none')
                .text(desire.name.length > 8 ? desire.name.slice(0, 8) + '…' : desire.name);
        }

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
}
