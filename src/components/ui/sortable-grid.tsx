import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
  showHandle?: boolean;
  className?: string;
}

export function SortableItem({ 
  id, 
  children, 
  disabled = false, 
  showHandle = true,
  className 
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative',
        disabled ? 'touch-auto' : 'touch-none',
        isDragging && 'opacity-50 scale-105 shadow-xl',
        className
      )}
    >
      {showHandle && !disabled && (
        <div
          {...attributes}
          {...listeners}
          className={cn(
            'absolute top-2 left-2 z-10 p-1.5 rounded-md cursor-grab active:cursor-grabbing',
            'bg-white/30 backdrop-blur-sm hover:bg-white/50',
            'transition-all duration-200'
          )}
        >
          <GripVertical className="h-4 w-4 text-white drop-shadow-sm" />
        </div>
      )}
      {children}
    </div>
  );
}

interface SortableGridProps {
  items: string[];
  onReorder: (newOrder: string[]) => void;
  children: React.ReactNode;
  disabled?: boolean;
  strategy?: 'grid' | 'vertical';
  className?: string;
}

export function SortableGrid({
  items,
  onReorder,
  children,
  disabled = false,
  strategy = 'grid',
  className,
}: SortableGridProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = items.indexOf(active.id as string);
      const newIndex = items.indexOf(over.id as string);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = [...items];
        const [removed] = newOrder.splice(oldIndex, 1);
        newOrder.splice(newIndex, 0, removed);
        onReorder(newOrder);
      }
    }
  };

  const sortingStrategy = strategy === 'grid' ? rectSortingStrategy : verticalListSortingStrategy;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={sortingStrategy} disabled={disabled}>
        <div className={className}>{children}</div>
      </SortableContext>
    </DndContext>
  );
}

// List-based sortable for bottom nav customization
interface SortableListItemProps {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export function SortableListItem({ id, children, disabled = false }: SortableListItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'touch-none cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-50 scale-[1.02] shadow-lg bg-muted rounded-lg'
      )}
    >
      {children}
    </div>
  );
}
