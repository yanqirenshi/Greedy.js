import * as d3 from 'd3';
import type { Desire } from '../types';
import { QUADRANTS } from '../types';
import { DesireNode } from './DesireNode';
import type { DeleteCallback, UpdateCallback, ClickCallback } from './DesireNode';
import { MatrixQuadrant } from './MatrixQuadrant';

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
            const width = this.innerWidth / 2;
            const height = this.innerHeight / 2;

            const quadrant = new MatrixQuadrant(q, x, y, width, height);
            quadrant.render(grid);
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

