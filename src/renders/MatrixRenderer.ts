import * as d3 from 'd3';
import type { Desire } from '../types';
import { QUADRANTS } from '../types';
import { DesireNode } from './DesireNode';
import type { DeleteCallback, UpdateCallback, ClickCallback } from './DesireNode';

// マトリクスのマージン設定
const MARGIN = { top: 60, right: 40, bottom: 60, left: 80 };

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

        // 各象限を描画（X軸が緊急度（左:高、右:低）、Y軸が重要度）
        QUADRANTS.forEach(q => {
            const x = q.urgency === 'high' ? 0 : this.innerWidth / 2;
            const y = q.importance === 'high' ? 0 : this.innerHeight / 2;

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

            // 象限ごとのラベル色（背景色より少し濃い色 - さらに薄く、パステル調に）
            let labelColor = '#999';
            switch (q.id) {
                case 'top-left': // すぐ買う #EF5350 -> #E57373
                    labelColor = '#E57373';
                    break;
                case 'top-right': // 計画的に #66BB6A -> #81C784
                    labelColor = '#81C784';
                    break;
                case 'bottom-left': // いつか #FFB74D -> #FFB74D
                    labelColor = '#FFB74D';
                    break;
                case 'bottom-right': // 不要かも #78909C -> #90A4AE
                    labelColor = '#90A4AE';
                    break;
            }

            // 象限のラベル
            grid.append('text')
                .attr('class', 'quadrant-label')
                .attr('x', x + this.innerWidth / 4)
                .attr('y', y + this.innerHeight / 4)
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'central')
                .attr('fill', labelColor)
                .attr('font-size', '88px')
                .attr('font-weight', 'bold')
                .style('pointer-events', 'none')
                .style('user-select', 'none')
                .text(q.label);
        });

        // 軸ラベル
        this.drawAxisLabels();
    }

    // 軸ラベルを描画
    private drawAxisLabels(): void {
        this.mainGroup.selectAll('.axis-label').remove();

        // X軸（緊急度）
        this.mainGroup.append('text')
            .attr('class', 'axis-label')
            .attr('x', this.innerWidth / 2)
            .attr('y', this.innerHeight + 40)
            .attr('text-anchor', 'middle')
            .attr('fill', '#1a1a2e')
            .attr('font-size', '14px')
            .text('← 緊急度');

        // 緊急度 低/高
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

        // Y軸（重要度）
        this.mainGroup.append('text')
            .attr('class', 'axis-label')
            .attr('transform', `translate(-50, ${this.innerHeight / 2}) rotate(-90)`)
            .attr('text-anchor', 'middle')
            .attr('fill', '#1a1a2e')
            .attr('font-size', '14px')
            .text('← 重要度');

        // 重要度 低/高
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
        desires.forEach((desire) => {
            const node = new DesireNode(desire);
            const { x, y } = node.calculatePosition(desires, this.innerWidth, this.innerHeight);
            node.render(itemsGroup, x, y, this.innerWidth, this.innerHeight, onDelete, onUpdate, onClick);
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

