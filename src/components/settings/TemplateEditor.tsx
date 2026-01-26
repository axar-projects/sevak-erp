"use client";

import { useState, useRef, useEffect } from "react";
import { saveTemplateConfig } from "@/actions/settings-actions";
import { IFieldConfig, ITemplateConfig } from "@/models/TemplateConfig";

interface TemplateEditorProps {
  initialConfig: ITemplateConfig;
}

export default function TemplateEditor({ initialConfig }: TemplateEditorProps) {
  const [config, setConfig] = useState<ITemplateConfig>(initialConfig);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [zoom, setZoom] = useState(0.5); // Default zoom 50%
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Drag State
  const [dragging, setDragging] = useState<{ id: string; startX: number; startY: number; initialLeft: number; initialTop: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent, id: string, currentX: number, currentY: number) => {
    e.preventDefault(); 
    e.stopPropagation();
    setSelectedField(id);
    setDragging({
      id,
      startX: e.clientX,
      startY: e.clientY,
      initialLeft: currentX,
      initialTop: currentY,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging || !containerRef.current) return;

      const deltaX = (e.clientX - dragging.startX) / zoom; // Adjust for zoom
      const deltaY = (e.clientY - dragging.startY) / zoom;
      
      const newX = Math.max(0, dragging.initialLeft + deltaX);
      const newY = Math.max(0, dragging.initialTop + deltaY);

      updateField(dragging.id, { x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setDragging(null);
    };

    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging]); // Dependencies on dragging state

  const updateField = (id: string, updates: Partial<IFieldConfig>) => {
    setConfig((prev) => {
      if (id === "imageArea") {
        return { ...prev, imageArea: { ...prev.imageArea, ...updates } };
      }
      return {
        ...prev,
        fields: {
          ...prev.fields,
          [id]: { ...(prev.fields as any)[id], ...updates },
        },
      };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    const res = await saveTemplateConfig(config);
    if (res.success) {
      alert("Settings saved!");
    } else {
      alert("Failed to save.");
    }
    setIsSaving(false);
  };

  // Helper to get field config by ID
  const getField = (id: string): IFieldConfig => {
    if (id === "imageArea") return config.imageArea;
    return (config.fields as any)[id];
  };

  // Fixed Dimensions as per User Request
  const EDITOR_WIDTH = 768;
  const EDITOR_HEIGHT = 1240;

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-100px)]">
        
      {/* Visual Editor Canvas */}
        <div className="flex-1 bg-muted/20 border border-border rounded-xl overflow-hidden relative flex items-start justify-center p-8 overflow-auto">
         {/* Transforming Container */}
         <div style={{ 
             transform: `scale(${zoom})`, 
             transformOrigin: "top center",
             transition: "transform 0.1s ease-out"
         }}>
            <div 
                ref={containerRef}
                className="relative shadow-2xl bg-white select-none shrink-0 overflow-hidden" 
                style={{ 
                    width: `${EDITOR_WIDTH}px`, 
                    height: `${EDITOR_HEIGHT}px` 
                }} 
            >
            <img 
                src="/id-card-vertical-template.jpg" 
                alt="Template" 
                className="absolute inset-0 w-full h-full object-fill pointer-events-none opacity-50" 
            />
            
            {/* 1. Image Area (Draggable Box) */}
            <div
                onMouseDown={(e) => handleMouseDown(e, "imageArea", config.imageArea.x, config.imageArea.y)}
                className={`absolute cursor-move border-2 ${selectedField === "imageArea" ? "border-primary z-20" : "border-dashed border-gray-400 z-10"} bg-gray-200/30 flex items-center justify-center text-xs text-gray-500`}
                style={{
                    left: config.imageArea.x,
                    top: config.imageArea.y,
                    width: config.imageArea.width || 300, // Default larger square
                    height: config.imageArea.height || 300,
                    borderRadius: "50%", 
                }}
            >
                Photo Area
            </div>

            {/* 2. Text Fields */}
            {Object.entries(config.fields).map(([key, field]) => (
                <div
                    key={key}
                    onMouseDown={(e) => handleMouseDown(e, key, field.x, field.y)}
                    className={`absolute cursor-move whitespace-nowrap px-2 py-1 border ${selectedField === key ? "border-primary bg-primary/10 z-20" : "border-transparent hover:border-dashed hover:border-gray-400 z-10"}`}
                    style={{
                        left: field.x,
                        top: field.y,
                        fontSize: field.fontSize,
                        color: field.color,
                        fontFamily: "Arial, sans-serif",
                        fontWeight: key === 'name' ? 'bold' : 'normal',
                    }}
                >
                    {key === 'name' ? "Rameshbhai Patel" : 
                     key === 'seva' ? "Premvati Vibhag" :
                     key === 'mobile' ? "98765 43210" :
                     key === 'gaam' ? "Upleta" :
                     key === 'startDate' ? "01/01" : 
                     key === 'endDate' ? "05/01" : field.label}
                </div>
            ))}
        </div>
        </div>
      </div>

      {/* Sidebar Controls */}
      <div className="w-full lg:w-80 flex-shrink-0 bg-card border border-border rounded-xl p-6 flex flex-col gap-6 overflow-y-auto h-full">
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Properties</h2>
            <button 
                onClick={handleSave} 
                disabled={isSaving}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
                {isSaving ? "Saving..." : "Save Layout"}
            </button>
        </div>

        {/* Zoom Control */}
        <div className="space-y-2 pb-4 border-b border-border">
            <label className="text-xs font-medium text-muted-foreground uppercase flex justify-between">
                <span>View Zoom</span>
                <span>{Math.round(zoom * 100)}%</span>
            </label>
            <input 
                type="range" 
                min="0.2" 
                max="1.5" 
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-primary"
            />
        </div>
        
        <div className="h-px bg-border" />

        {selectedField ? (
            <div className="space-y-4">
                <h3 className="font-semibold capitalize text-lg">{selectedField === "imageArea" ? "Photo Area" : selectedField}</h3>
                
                <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase">Position (X, Y)</label>
                    <div className="grid grid-cols-2 gap-2">
                        <input 
                            type="number" 
                            value={Math.round(getField(selectedField).x)} 
                            onChange={(e) => updateField(selectedField, { x: Number(e.target.value) })}
                            className="bg-background border border-input rounded px-2 py-1 text-sm"
                        />
                         <input 
                            type="number" 
                            value={Math.round(getField(selectedField).y)} 
                            onChange={(e) => updateField(selectedField, { y: Number(e.target.value) })}
                            className="bg-background border border-input rounded px-2 py-1 text-sm"
                        />
                    </div>
                </div>

                {selectedField !== "imageArea" && (
                    <>
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase">Font Size (px)</label>
                        <input 
                            type="number" 
                            value={getField(selectedField).fontSize} 
                            onChange={(e) => updateField(selectedField, { fontSize: Number(e.target.value) })}
                            className="w-full bg-background border border-input rounded px-2 py-1 text-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase">Color</label>
                        <div className="flex gap-2">
                            <input 
                                type="color" 
                                value={getField(selectedField).color} 
                                onChange={(e) => updateField(selectedField, { color: e.target.value })}
                                className="h-8 w-12 cursor-pointer border border-input rounded"
                            />
                            <input 
                                type="text"
                                value={getField(selectedField).color}
                                onChange={(e) => updateField(selectedField, { color: e.target.value })}
                                className="flex-1 bg-background border border-input rounded px-2 py-1 text-sm uppercase"
                            />
                        </div>
                    </div>
                    </>
                )}
                 {selectedField === "imageArea" && (
                    <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase">Size (W x H)</label>
                    <div className="grid grid-cols-2 gap-2">
                        <input 
                            type="number" 
                            value={Math.round(getField(selectedField).width || 0)} 
                            onChange={(e) => updateField(selectedField, { width: Number(e.target.value) })}
                            className="bg-background border border-input rounded px-2 py-1 text-sm"
                        />
                         <input 
                            type="number" 
                            value={Math.round(getField(selectedField).height || 0)} 
                            onChange={(e) => updateField(selectedField, { height: Number(e.target.value) })}
                            className="bg-background border border-input rounded px-2 py-1 text-sm"
                        />
                    </div>
                </div>
                 )}
            </div>
        ) : (
            <div className="text-muted-foreground text-sm text-center py-8">
                Select an element on the canvas to edit its properties.
            </div>
        )}
      </div>
    </div>
  );
}
