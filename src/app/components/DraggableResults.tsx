"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Globe, BookOpen, GripVertical } from "lucide-react";

export interface SearchResultItem {
  id: string;
  title: string;
  snippet: string;
  url: string;
  source: "duckduckgo" | "wikipedia" | "github" | "reddit";
}

interface Props {
  items: SearchResultItem[];
}

export default function DraggableResults({ items }: Props) {
  const [results, setResults] = useState<SearchResultItem[]>(items);

  useEffect(() => {
    setResults(items);
  }, [items]);

  const handleOnDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const reordered = Array.from(results);
    const [reorderedItem] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, reorderedItem);

    setResults(reordered);
    // Save state to local device only
    localStorage.setItem("z_search_custom_order", JSON.stringify(reordered.map(r => r.id)));
  };

  return (
    <DragDropContext onDragEnd={handleOnDragEnd}>
      <Droppable droppableId="results-list">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="space-y-4"
          >
            {results.map((item, index) => (
              <Draggable key={item.id} draggableId={item.id} index={index}>
                {(provided, snapshot) => (
                  <article
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`group p-5 rounded-2xl bg-neutral-900/40 border transition-all duration-200 backdrop-blur-md flex items-start gap-3 ${
                      snapshot.isDragging
                        ? "border-cyan-500/80 bg-neutral-900/90 shadow-2xl shadow-cyan-500/10 scale-[1.02]"
                        : "border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-900/80"
                    }`}
                  >
                    <div
                      {...provided.dragHandleProps}
                      className="mt-1 p-1 text-neutral-600 hover:text-cyan-400 cursor-grab active:cursor-grabbing transition-colors"
                      title="Drag to customize layout"
                    >
                      <GripVertical className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs text-cyan-400/80 font-mono truncate max-w-[80%]">
                          {item.url}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                            item.source === "wikipedia"
                              ? "bg-purple-500/10 text-purple-300 border border-purple-500/20"
                              : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                          }`}
                        >
                          {item.source === "wikipedia" ? (
                            <BookOpen className="w-3 h-3" />
                          ) : (
                            <Globe className="w-3 h-3" />
                          )}
                          {item.source}
                        </span>
                      </div>
                      <h2 className="text-lg font-semibold text-neutral-100 group-hover:text-cyan-300 transition-colors mb-1">
                        <a href={item.url} target="_blank" rel="noopener noreferrer">
                          {item.title}
                        </a>
                      </h2>
                      <p className="text-sm text-neutral-400 leading-relaxed">
                        {item.snippet}
                      </p>
                    </div>
                  </article>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}