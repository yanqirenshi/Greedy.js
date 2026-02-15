import * as d3 from 'd3';
import { QuadrantInfo } from '../types';

export class MatrixQuadrant {
    private quadrant: QuadrantInfo;
    private x: number;
    private y: number;
    private width: number;
    private height: number;

    constructor(quadrant: QuadrantInfo, x: number, y: number, width: number, height: number) {
        this.quadrant = quadrant;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    public render(container: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>): void {
        // 象限の背景
        container.append('rect')
            .attr('class', `quadrant ${this.quadrant.id}`)
            .attr('x', this.x)
            .attr('y', this.y)
            .attr('width', this.width)
            .attr('height', this.height)
            .attr('fill', this.quadrant.color)
            .attr('fill-opacity', 0.15)
            .attr('stroke', this.quadrant.color)
            .attr('stroke-opacity', 0.3)
            .attr('stroke-width', 1);

        // 象限ごとのラベル色を取得
        const labelColor = this.getLabelColor(this.quadrant.id);

        // 象限のラベル
        container.append('text')
            .attr('class', 'quadrant-label')
            .attr('x', this.x + this.width / 2)
            .attr('y', this.y + this.height / 2)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('fill', labelColor)
            .attr('font-size', '88px')
            .attr('font-weight', 'bold')
            .style('pointer-events', 'none')
            .style('user-select', 'none')
            .text(this.quadrant.label);
    }

    private getLabelColor(id: string): string {
        switch (id) {
            case 'top-left': // すぐ買う #EF5350 -> #E57373
                return '#E57373';
            case 'top-right': // 計画的に #66BB6A -> #81C784
                return '#81C784';
            case 'bottom-left': // いつか #FFB74D -> #FFB74D
                return '#FFB74D';
            case 'bottom-right': // 不要かも #78909C -> #90A4AE
                return '#90A4AE';
            default:
                return '#999';
        }
    }
}
