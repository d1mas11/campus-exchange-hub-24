import { CATEGORIES, Category } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface CategoryFilterProps {
  selected: Category | null;
  onChange: (category: Category | null) => void;
}

export function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={selected === null ? 'default' : 'secondary'}
        size="sm"
        onClick={() => onChange(null)}
        className="rounded-full"
      >
        All
      </Button>
      {CATEGORIES.map((category) => (
        <Button
          key={category.value}
          variant={selected === category.value ? 'default' : 'secondary'}
          size="sm"
          onClick={() => onChange(category.value)}
          className="rounded-full"
        >
          <span className="mr-1">{category.icon}</span>
          {category.label}
        </Button>
      ))}
    </div>
  );
}
