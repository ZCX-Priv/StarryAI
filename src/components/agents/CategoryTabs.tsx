import { X } from 'lucide-react';
import type { AgentCategory } from '@/types';

type CustomCategory = Omit<AgentCategory, 'icon'> & {
  isCustom: boolean;
  icon?: string;
};

interface CategoryTabsProps {
  categories: CustomCategory[];
  currentCategory: string;
  onSelect: (id: string) => void;
  onAddCategory: () => void;
  onDeleteCategory: (id: string) => void;
}

export default function CategoryTabs({ categories, currentCategory, onSelect, onAddCategory, onDeleteCategory }: CategoryTabsProps) {
  return (
    <div className="agents-tabs">
      <div className="agents-tabs-left">
        {categories.map((cat) => (
          <div className="agent-tab-wrapper" key={cat.id}>
            <button
              className={`agent-tab${currentCategory === cat.id ? ' active' : ''}`}
              data-category={cat.id}
              onClick={() => onSelect(cat.id)}
            >
              {cat.name}
            </button>
            {cat.isCustom && (
              <button
                className="category-delete-btn"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); onDeleteCategory(cat.id); }}
                title="删除分类"
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button className="agent-tab-add" onClick={onAddCategory} title="创建分类">+</button>
      </div>
    </div>
  );
}
