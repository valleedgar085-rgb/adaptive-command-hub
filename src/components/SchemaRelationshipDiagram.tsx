import { useState, useEffect, useRef } from "react";
import { Table2, Key, ArrowRight, ZoomIn, ZoomOut, Move } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Column {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  defaultValue: string;
  foreignKey?: string;
}

interface Table {
  name: string;
  columns: Column[];
}

interface TablePosition {
  x: number;
  y: number;
}

interface SchemaRelationshipDiagramProps {
  tables: Table[];
}

export const SchemaRelationshipDiagram = ({ tables }: SchemaRelationshipDiagramProps) => {
  const [positions, setPositions] = useState<Record<string, TablePosition>>({});
  const [dragging, setDragging] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize table positions in a grid layout
  useEffect(() => {
    const newPositions: Record<string, TablePosition> = {};
    const cols = Math.ceil(Math.sqrt(tables.length));
    tables.forEach((table, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      newPositions[table.name] = {
        x: 40 + col * 220,
        y: 40 + row * 180
      };
    });
    setPositions(newPositions);
  }, [tables]);

  // Extract relationships from foreign keys
  const relationships = tables.flatMap(table =>
    table.columns
      .filter(col => col.foreignKey)
      .map(col => {
        const [refTable] = col.foreignKey!.split(".");
        return {
          from: table.name,
          fromColumn: col.name,
          to: refTable,
          toColumn: col.foreignKey!.split(".")[1] || "id"
        };
      })
  );

  const handleMouseDown = (tableName: string, e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(tableName);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - offset.x) / zoom;
    const y = (e.clientY - rect.top - offset.y) / zoom;
    setPositions(prev => ({
      ...prev,
      [dragging]: { x: Math.max(0, x - 80), y: Math.max(0, y - 20) }
    }));
  };

  const handleMouseUp = () => setDragging(null);

  const getConnectionPoints = (from: string, to: string) => {
    const fromPos = positions[from];
    const toPos = positions[to];
    if (!fromPos || !toPos) return null;

    const fromCenter = { x: fromPos.x + 90, y: fromPos.y + 60 };
    const toCenter = { x: toPos.x + 90, y: toPos.y + 60 };

    return { fromCenter, toCenter };
  };

  if (tables.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        <div className="text-center">
          <Table2 className="h-12 w-12 mx-auto mb-2 opacity-30" />
          <p>Add tables to see relationships</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Controls */}
      <div className="flex items-center gap-2 p-2 border-b border-border/50 bg-muted/20">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setZoom(z => Math.min(2, z + 0.1))}
          className="h-7 w-7 p-0"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
          className="h-7 w-7 p-0"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <span className="text-xs text-muted-foreground">{Math.round(zoom * 100)}%</span>
        <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
          <Move className="h-3 w-3" />
          Drag tables to reposition
        </div>
      </div>

      {/* Diagram Canvas */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-auto bg-[repeating-linear-gradient(0deg,transparent,transparent_19px,hsl(var(--border)/0.3)_20px),repeating-linear-gradient(90deg,transparent,transparent_19px,hsl(var(--border)/0.3)_20px)]"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="hsl(var(--primary))"
              />
            </marker>
          </defs>
          {relationships.map((rel, i) => {
            const points = getConnectionPoints(rel.from, rel.to);
            if (!points) return null;
            const { fromCenter, toCenter } = points;
            
            // Calculate control points for curved line
            const midX = (fromCenter.x + toCenter.x) / 2;
            const midY = (fromCenter.y + toCenter.y) / 2;
            const dx = toCenter.x - fromCenter.x;
            const dy = toCenter.y - fromCenter.y;
            const perpX = -dy * 0.2;
            const perpY = dx * 0.2;

            return (
              <g key={i}>
                <path
                  d={`M ${fromCenter.x} ${fromCenter.y} Q ${midX + perpX} ${midY + perpY} ${toCenter.x} ${toCenter.y}`}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                  strokeDasharray="5,3"
                  markerEnd="url(#arrowhead)"
                  opacity={0.7}
                />
                <text
                  x={midX + perpX}
                  y={midY + perpY - 5}
                  fontSize="9"
                  fill="hsl(var(--muted-foreground))"
                  textAnchor="middle"
                >
                  {rel.fromColumn} → {rel.toColumn}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tables */}
        <div style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}>
          {tables.map(table => {
            const pos = positions[table.name] || { x: 0, y: 0 };
            const pkColumns = table.columns.filter(c => c.primaryKey);
            const fkColumns = table.columns.filter(c => c.foreignKey);
            const otherColumns = table.columns.filter(c => !c.primaryKey && !c.foreignKey);

            return (
              <div
                key={table.name}
                className="absolute bg-card border border-border rounded-lg shadow-lg cursor-move select-none"
                style={{
                  left: pos.x,
                  top: pos.y,
                  minWidth: "180px",
                  maxWidth: "200px"
                }}
                onMouseDown={(e) => handleMouseDown(table.name, e)}
              >
                {/* Table Header */}
                <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-t-lg border-b border-border/50">
                  <Table2 className="h-3.5 w-3.5 text-primary" />
                  <span className="font-semibold text-xs truncate">{table.name}</span>
                </div>

                {/* Columns */}
                <div className="p-2 space-y-0.5 max-h-[120px] overflow-y-auto text-[10px]">
                  {pkColumns.map(col => (
                    <div key={col.name} className="flex items-center gap-1.5 text-amber-500">
                      <Key className="h-2.5 w-2.5" />
                      <span className="font-medium truncate">{col.name}</span>
                      <span className="text-muted-foreground ml-auto">{col.type}</span>
                    </div>
                  ))}
                  {fkColumns.map(col => (
                    <div key={col.name} className="flex items-center gap-1.5 text-primary">
                      <ArrowRight className="h-2.5 w-2.5" />
                      <span className="truncate">{col.name}</span>
                      <span className="text-muted-foreground ml-auto truncate" title={col.foreignKey}>
                        FK
                      </span>
                    </div>
                  ))}
                  {otherColumns.slice(0, 4).map(col => (
                    <div key={col.name} className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="w-2.5" />
                      <span className="truncate">{col.name}</span>
                      <span className="ml-auto">{col.type}</span>
                    </div>
                  ))}
                  {otherColumns.length > 4 && (
                    <div className="text-muted-foreground/60 pl-4">
                      +{otherColumns.length - 4} more columns
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 p-2 border-t border-border/50 bg-muted/20 text-[10px]">
        <div className="flex items-center gap-1">
          <Key className="h-3 w-3 text-amber-500" />
          <span className="text-muted-foreground">Primary Key</span>
        </div>
        <div className="flex items-center gap-1">
          <ArrowRight className="h-3 w-3 text-primary" />
          <span className="text-muted-foreground">Foreign Key</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-6 h-0.5 border-t-2 border-dashed border-primary" />
          <span className="text-muted-foreground">Relationship</span>
        </div>
      </div>
    </div>
  );
};
