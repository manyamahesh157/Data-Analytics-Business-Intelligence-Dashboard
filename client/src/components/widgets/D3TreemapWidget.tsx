import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface D3TreemapWidgetProps {
  data: any[];
  config: {
    categoryField?: string;
    valueField?: string;
    labelField?: string;
  };
}

export const D3TreemapWidget: React.FC<D3TreemapWidgetProps> = ({ data = [], config }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return;

    const width = svgRef.current.clientWidth || 400;
    const height = svgRef.current.clientHeight || 260;

    const categoryKey = config.categoryField || 'category';
    const valueKey = config.valueField || 'revenue';
    const labelKey = config.labelField || 'category';

    // Clear previous renders
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3
      .select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', '100%')
      .attr('height', '100%');

    // Aggregate data into hierarchy
    const hierarchicalData = {
      name: 'Root',
      children: data.map((d) => ({
        name: d[labelKey] || d[categoryKey] || 'Item',
        value: Math.max(1, Number(d[valueKey]) || 10),
        category: d[categoryKey] || 'General',
      })),
    };

    const root = d3
      .hierarchy(hierarchicalData)
      .sum((d: any) => d.value)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    d3.treemap().size([width, height]).padding(3).round(true)(root as any);

    const color = d3.scaleOrdinal(d3.schemeTableau10);

    const nodes = svg
      .selectAll('g')
      .data(root.leaves())
      .enter()
      .append('g')
      .attr('transform', (d: any) => `translate(${d.x0},${d.y0})`);

    // Rectangles
    nodes
      .append('rect')
      .attr('width', (d: any) => Math.max(0, d.x1 - d.x0))
      .attr('height', (d: any) => Math.max(0, d.y1 - d.y0))
      .attr('fill', (d: any) => color(d.data.category || d.data.name))
      .attr('rx', 6)
      .attr('ry', 6)
      .attr('opacity', 0.85)
      .style('cursor', 'pointer')
      .on('mouseover', function () {
        d3.select(this).attr('opacity', 1).attr('stroke', '#ffffff').attr('stroke-width', 2);
      })
      .on('mouseout', function () {
        d3.select(this).attr('opacity', 0.85).attr('stroke', 'none');
      });

    // Node text labels
    nodes
      .append('text')
      .attr('x', 6)
      .attr('y', 16)
      .text((d: any) => {
        const boxWidth = d.x1 - d.x0;
        return boxWidth > 55 ? d.data.name : '';
      })
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('fill', '#ffffff')
      .style('pointer-events', 'none');

    // Node values
    nodes
      .append('text')
      .attr('x', 6)
      .attr('y', 30)
      .text((d: any) => {
        const boxHeight = d.y1 - d.y0;
        const boxWidth = d.x1 - d.x0;
        return boxHeight > 40 && boxWidth > 55 ? `$${d.data.value.toLocaleString()}` : '';
      })
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .attr('fill', 'rgba(255, 255, 255, 0.75)')
      .style('pointer-events', 'none');
  }, [data, config]);

  return (
    <div className="w-full h-full min-h-[200px] flex items-center justify-center relative">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};
