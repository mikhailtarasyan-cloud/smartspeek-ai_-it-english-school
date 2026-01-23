
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { SkillNode } from '../types';

interface RadarChartProps {
  data: SkillNode;
}

const SkillTree: React.FC<RadarChartProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 600;
    const height = 450;
    const margin = 50;
    const radius = Math.min(width, height) / 2 - margin;
    
    // Axes labels based on data
    const axes = data.children?.map(d => d.name) || ["Grammar", "Speaking", "Vocabulary", "Listening"];
    const totalAxes = axes.length;
    const angleSlice = (Math.PI * 2) / totalAxes;
    
    // CEFR levels as background rings
    const levels = [
        { label: "A1", val: 20 },
        { label: "A2", val: 40 },
        { label: "B1", val: 60 },
        { label: "B2", val: 80 },
        { label: "C1", val: 100 }
    ];

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height] as any)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    // Draw background grid (Concentric diamonds)
    levels.forEach(level => {
        const points: [number, number][] = [];
        for (let i = 0; i < totalAxes; i++) {
            const r = (level.val / 100) * radius;
            points.push([
                r * Math.cos(angleSlice * i - Math.PI / 2),
                r * Math.sin(angleSlice * i - Math.PI / 2)
            ]);
        }
        
        svg.append("polygon")
            .attr("points", points.map(p => p.join(",")).join(" "))
            .attr("fill", "none")
            .attr("stroke", "#e2e8f0")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "4,4");

        svg.append("text")
            .attr("x", 5)
            .attr("y", -(level.val / 100) * radius)
            .attr("font-size", "10px")
            .attr("font-weight", "bold")
            .attr("fill", "#94a3b8")
            .text(level.label);
    });

    // Draw axes lines
    for (let i = 0; i < totalAxes; i++) {
        svg.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", radius * Math.cos(angleSlice * i - Math.PI / 2))
            .attr("y2", radius * Math.sin(angleSlice * i - Math.PI / 2))
            .attr("stroke", "#cbd5e1")
            .attr("stroke-width", 1);

        // Axis labels
        svg.append("text")
            .attr("x", (radius + 25) * Math.cos(angleSlice * i - Math.PI / 2))
            .attr("y", (radius + 25) * Math.sin(angleSlice * i - Math.PI / 2))
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-weight", "900")
            .attr("fill", "#334155")
            .text(axes[i]);
    }

    // Draw user performance diamond
    const userDataPoints: [number, number][] = data.children?.map((d, i) => {
        const r = (d.value / 100) * radius;
        return [
            r * Math.cos(angleSlice * i - Math.PI / 2),
            r * Math.sin(angleSlice * i - Math.PI / 2)
        ];
    }) || [];

    svg.append("polygon")
        .attr("points", userDataPoints.map(p => p.join(",")).join(" "))
        .attr("fill", "rgba(37, 99, 235, 0.2)")
        .attr("stroke", "#2563eb")
        .attr("stroke-width", 3)
        .attr("stroke-linejoin", "round")
        .attr("class", "animate-in fade-in duration-1000");

    // Add nodes at vertices
    userDataPoints.forEach((p, i) => {
        svg.append("circle")
            .attr("cx", p[0])
            .attr("cy", p[1])
            .attr("r", 5)
            .attr("fill", "#2563eb")
            .attr("stroke", "white")
            .attr("stroke-width", 2)
            .attr("class", "cursor-pointer")
            .append("title")
            .text(`${axes[i]}: ${data.children![i].value}%`);
    });

  }, [data]);

  return (
    <div className="w-full bg-white rounded-[3rem] p-8 border border-slate-100 shadow-xl overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
           <h3 className="text-xl font-black text-slate-900 leading-tight">Карта навыков (Diamond)</h3>
           <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">CEFR Levels: A1 — C1</p>
        </div>
        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">Аналитика ИИ</span>
      </div>
      <svg ref={svgRef} className="w-full h-auto max-h-[450px]"></svg>
    </div>
  );
};

export default SkillTree;
