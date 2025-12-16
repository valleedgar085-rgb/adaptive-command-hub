import { useState, useEffect, useRef } from "react";
import { Table2, Key, ArrowRight, ZoomIn, ZoomOut, Move, RefreshCw } from "lucide-react";
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
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize positions in a grid layout
  const initializePositions = () => {
    const newPositions: Record<string, TablePosition> = {};
    const cols = Math.ceil(Math.sqrt(tables.length));
    const spacing = { x: 280, y: 220 };
    
    tables.forEach((table, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      newPositions[table.name] = {
        x: 50 + col * spacing.x,
        y: 50 + row * spacing.y
      };
    });
    setPositions(newPositions);
  };

  useEffect(() => {
    initializePositions();
  }, [tables.length]);

  // Extract relationships
  const relationships = tables.flatMap(table =>
    table.columns
      .filter(col => col.foreignKey)
      .map(col => {
        const [refTable, refCol] = col.foreignKey!.split(".");
        return {
          from: table.name,
          fromColumn: col.name,
          to: refTable,
          toColumn: refCol || "id"
        };
      })
  );

  const handleMouseDown = (tableName: string, e: React.MouseEvent) => {
    e.preventDefault();
    const pos = positions[tableName];
    if (!pos || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    setDragOffset({
      x: (e.clientX - rect.left) / zoom - pos.x,
      y: (e.clientY - rect.top) / zoom - pos.y
    });
    setDragging(tableName);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom - dragOffset.x;
    const y = (e.clientY - rect.top) / zoom - dragOffset.y;
    
    setPositions(prev => ({
      ...prev,
      [dragging]: { x: Math.max(0, x), y: Math.max(0, y) }
    }));
  };

  const handleMouseUp = () => setDragging(null);

  const getConnectionPath = (from: string, to: string) => {
    const fromPos = positions[from];
    const toPos = positions[to];
    if (!fromPos || !toPos) return null;

    const tableWidth = 200;
    const tableHeight = 120;
    
    const fromCenter = { x: fromPos.x + tableWidth / 2, y: fromPos.y + tableHeight / 2 };
    const toCenter = { x: toPos.x + tableWidth / 2, y: toPos.y + tableHeight / 2 };

    // Calculate curve
    const dx = toCenter.x - fromCenter.x;
    const dy = toCenter.y - fromCenter.y;
    const midX = (fromCenter.x + toCenter.x) / 2;
    const midY = (fromCenter.y + toCenter.y) / 2;
    
    // Perpendicular offset for curve
    const dist = Math.sqrt(dx * dx + dy * dy);
    const curvature = Math.min(50, dist * 0.15);
    const perpX = (-dy / dist) * curvature;
    const perpY = (dx / dist) * curvature;

    return {
      path: `M ${fromCenter.x} ${fromCenter.y} Q ${midX + perpX} ${midY + perpY} ${toCenter.x} ${toCenter.y}`,
      labelPos: { x: midX + perpX, y: midY + perpY - 12 }
    };
  };

  if (tables.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center py-12">
          <Table2 className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium mb-1">No Tables Yet</p>
          <p className="text-sm text-muted-foreground/70">Add tables to see relationships</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Controls */}
      <div className="flex items-center gap-3 p-3 border-b border-border/50 bg-muted/20 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="h-8 w-8">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="h-8 w-8">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground font-medium">{Math.round(zoom * 100)}%</span>
        <Button variant="ghost" size="icon" onClick={initializePositions} className="h-8 w-8" title="Reset Layout">
          <RefreshCw className="h-4 w-4" />
        </Button>
        <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
          <Move className="h-4 w-4" />
          <span>Drag tables to reposition</span>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-auto bg-[repeating-linear-gradient(0deg,transparent,transparent_24px,hsl(var(--border)/0.2)_25px),repeating-linear-gradient(90deg,transparent,transparent_24px,hsl(var(--border)/0.2)_25px)]"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* SVG Connections */}
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="12"
              markerHeight="8"
              refX="10"
              refY="4"
              orient="auto"
            >
              <polygon points="0 0, 12 4, 0 8" fill="hsl(var(--primary))" opacity="0.8" />
            </marker>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
              <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          {relationships.map((rel, i) => {
            const connection = getConnectionPath(rel.from, rel.to);
            if (!connection) return null;

            return (
              <g key={i} className="animate-fade-in">
                <path
                  d={connection.path}
                  fill="none"
                  stroke="url(#lineGradient)"
                  strokeWidth="2.5"
                  strokeDasharray="8,4"
                  markerEnd="url(#arrowhead)"
                />
                <text
                  x={connection.labelPos.x}
                  y={connection.labelPos.y}
                  fontSize="11"
                  fill="hsl(var(--muted-foreground))"
                  textAnchor="middle"
                  className="font-mono"
                >
                  {rel.fromColumn} → {rel.toColumn}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Table Cards */}
        <div style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}>
          {tables.map(table => {
            const pos = positions[table.name] || { x: 0, y: 0 };
            const pkColumns = table.columns.filter(c => c.primaryKey);
            const fkColumns = table.columns.filter(c => c.foreignKey);
            const regularColumns = table.columns.filter(c => !c.primaryKey && !c.foreignKey);

            return (
              <div
                key={table.name}
                className={`absolute bg-card border-2 rounded-xl shadow-xl cursor-move select-none transition-shadow ${
                  dragging === table.name ? "border-primary shadow-2xl shadow-primary/20" : "border-border/50 hover:border-primary/50"
                }`}
                style={{
                  left: pos.x,
                  top: pos.y,
                  width: "200px"
                }}
                onMouseDown={(e) => handleMouseDown(table.name, e)}
              >
                {/* Header */}
                <div className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-primary/15 to-primary/5 rounded-t-xl border-b border-border/50">
                  <Table2 className="h-4 w-4 text-primary" />
                  <span className="font-bold text-sm truncate">{table.name}</span>
                </div>

                {/* Columns */}
                <div className="p-3 space-y-1 max-h-[140px] overflow-y-auto">
                  {pkColumns.map(col => (
                    <div key={col.name} className="flex items-center gap-2 text-xs text-amber-500 py-1">
                      <Key className="h-3 w-3 flex-shrink-0" />
                      <span className="font-medium truncate">{col.name}</span>
                      <span className="text-muted-foreground ml-auto text-[10px]">{col.type}</span>
                    </div>
                  ))}
                  {fkColumns.map(col => (
                    <div key={col.name} className="flex items-center gap-2 text-xs text-primary py-1">
                      <ArrowRight className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{col.name}</span>
                      <span className="text-muted-foreground ml-auto text-[10px]">FK</span>
                    </div>
                  ))}
                  {regularColumns.slice(0, 3).map(col => (
                    <div key={col.name} className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                      <span className="w-3" />
                      <span className="truncate">{col.name}</span>
                      <span className="ml-auto text-[10px]">{col.type}</span>
                    </div>
                  ))}
                  {regularColumns.length > 3 && (
                    <div className="text-xs text-muted-foreground/50 pl-5 py-1">
                      +{regularColumns.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 p-3 border-t border-border/50 bg-muted/20 text-sm">
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-amber-500" />
          <span className="text-muted-foreground">Primary Key</span>
        </div>
        <div className="flex items-center gap-2">
          <ArrowRight className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">Foreign Key</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 border-t-2 border-dashed border-primary/60" />
          <span className="text-muted-foreground">Relationship</span>
        </div>
      </div>
    </div>
  );
};